

# Complete Migration Checklist for Your Supabase Project

This plan provides everything you need to verify your external Supabase project matches this one. Go through each section and check what you already have, then apply anything missing.

---

## 1. Custom Types (Enums)

Make sure these exist:

```text
- app_role: ENUM ('admin', 'user')
- user_status: ENUM ('active', 'suspended', 'paused')
```

---

## 2. Tables Checklist

Verify each table exists with all columns. Tables are listed in dependency order (create top ones first):

| Table | Key Columns |
|---|---|
| **profiles** | id (PK, refs auth.users), username, avatar_url, balance, full_name, phone, country, currency, status (user_status), last_ip, last_location, last_login_at, referred_by, created_at, updated_at |
| **orders** | id, user_id (refs profiles), platform, service, link, quantity, charge, status, external_order_id, created_at, updated_at |
| **transactions** | id, user_id (refs profiles), type, amount, description, reference_id, status, created_at |
| **user_roles** | id, user_id (refs auth.users), role (app_role), created_at. UNIQUE(user_id, role) |
| **blocked_emails** | id, email (UNIQUE), blocked_at, reason |
| **support_tickets** | id, user_id (refs auth.users), subject, message, status, created_at, updated_at |
| **admin_settings** | id, setting_key (UNIQUE), setting_value, created_at, updated_at |
| **social_links** | id, platform (UNIQUE), url, is_enabled, display_order, created_at, updated_at |
| **payment_methods** | id, method_id (UNIQUE), name, icon, is_enabled, display_order, details (jsonb), created_at, updated_at |
| **refund_requests** | id, order_id (refs orders), user_id (refs profiles), amount, status, notes, approved_at, approved_by, created_at, updated_at |
| **newsletter_subscribers** | id, email (UNIQUE), subscribed_at, is_active, source |
| **favorite_services** | id, user_id (refs profiles), service_id, service_name, platform, created_at. UNIQUE(user_id, service_id) |
| **referral_codes** | id, user_id (refs profiles, UNIQUE), code (UNIQUE), created_at |
| **referrals** | id, referrer_id (refs profiles), referred_id (refs profiles, UNIQUE), created_at |
| **referral_earnings** | id, referrer_id (refs profiles), order_id (refs orders), amount, created_at |
| **api_providers** | id, provider_id (UNIQUE), name, api_url, is_enabled, is_primary, display_order, created_at, updated_at |
| **platforms** | id, platform_key (UNIQUE), name, keywords (text[]), is_enabled, display_order, icon_key, created_at, updated_at |
| **password_reset_tokens** | id, email, token, expires_at, used_at, created_at |

---

## 3. Database Functions

Verify these 5 functions exist:

1. **handle_new_user()** -- trigger function, SECURITY DEFINER, inserts into profiles on auth.users insert
2. **update_updated_at_column()** -- trigger function, sets updated_at = now()
3. **has_role(_user_id uuid, _role app_role)** -- SECURITY DEFINER, checks user_roles table
4. **is_admin()** -- SECURITY DEFINER, calls has_role(auth.uid(), 'admin')
5. **assign_admin_role()** -- trigger function, SECURITY DEFINER, auto-assigns admin to jvictory225@gmail.com and user role to everyone

---

## 4. Triggers

Verify these triggers exist:

| Trigger | On Table | Function |
|---|---|---|
| on_auth_user_created | auth.users (AFTER INSERT) | handle_new_user() |
| on_auth_user_created_assign_role | auth.users (AFTER INSERT) | assign_admin_role() |
| update_profiles_updated_at | profiles (BEFORE UPDATE) | update_updated_at_column() |
| update_orders_updated_at | orders (BEFORE UPDATE) | update_updated_at_column() |
| update_support_tickets_updated_at | support_tickets (BEFORE UPDATE) | update_updated_at_column() |
| update_admin_settings_updated_at | admin_settings (BEFORE UPDATE) | update_updated_at_column() |
| update_social_links_updated_at | social_links (BEFORE UPDATE) | update_updated_at_column() |
| update_payment_methods_updated_at | payment_methods (BEFORE UPDATE) | update_updated_at_column() |
| update_refund_requests_updated_at | refund_requests (BEFORE UPDATE) | update_updated_at_column() |
| update_api_providers_updated_at | api_providers (BEFORE UPDATE) | update_updated_at_column() |
| update_platforms_updated_at | platforms (BEFORE UPDATE) | update_updated_at_column() |

---

## 5. RLS Policies

Every table listed above has RLS **enabled**. Here is the complete policy list per table:

**profiles:**
- Users can view their own profile (SELECT, auth.uid() = id, TO authenticated)
- Users can update their own profile (UPDATE, auth.uid() = id)
- Users can insert their own profile (INSERT, auth.uid() = id)
- Admins can view all profiles (SELECT, is_admin(), TO authenticated)
- Admins can update all profiles (UPDATE, is_admin())
- Admins can delete profiles (DELETE, is_admin())

**orders:**
- Users can view their own orders (SELECT, auth.uid() = user_id)
- Users can create their own orders (INSERT, auth.uid() = user_id)
- Users can update their own orders (UPDATE, auth.uid() = user_id)
- Admins can view all orders (SELECT, is_admin())
- Admins can delete orders (DELETE, is_admin())

**transactions:**
- Users can view their own transactions (SELECT, auth.uid() = user_id)
- Users can create their own transactions (INSERT, auth.uid() = user_id)
- Admins can view all transactions (SELECT, is_admin())
- Admins can manage all transactions (ALL, is_admin())
- Admins can delete transactions (DELETE, is_admin())

**user_roles:**
- Users can view their own roles (SELECT, auth.uid() = user_id)
- Admins can view all roles (SELECT, is_admin())
- Admins can manage roles (ALL, is_admin())

**blocked_emails:**
- Admins can manage blocked emails (ALL, is_admin())

**support_tickets:**
- Users can create their own tickets (INSERT, auth.uid() = user_id)
- Users can view their own tickets (SELECT, auth.uid() = user_id)
- Admins can view all tickets (SELECT, is_admin())
- Admins can update all tickets (UPDATE, is_admin())

**admin_settings:**
- Admins can view settings (SELECT, is_admin())
- Admins can insert settings (INSERT, is_admin())
- Admins can update settings (UPDATE, is_admin())
- Admins can delete settings (DELETE, is_admin())
- Anyone can read public settings (SELECT, setting_key IN ('referral_percentage', 'turnstile_site_key', 'usd_to_ngn_rate', 'price_markup_percentage', 'korapay_public_key', 'paystack_public_key'))

**social_links:**
- Anyone can view social links (SELECT, true)
- Admins can manage social links (ALL, is_admin())

**payment_methods:**
- Anyone can view payment methods (SELECT, true)
- Admins can manage payment methods (ALL, is_admin())

**refund_requests:**
- Admins can view all refund requests (SELECT, is_admin())
- Admins can update refund requests (UPDATE, is_admin())
- Admins can insert refund requests (INSERT, is_admin())
- Service role can insert refund requests (INSERT, true)
- Users can view their own refund requests (SELECT, auth.uid() = user_id)

**newsletter_subscribers:**
- Anyone can subscribe to newsletter (INSERT, true)
- Admins can view all subscribers (SELECT, is_admin())
- Admins can update subscribers (UPDATE, is_admin())
- Admins can delete subscribers (DELETE, is_admin())

**favorite_services:**
- Users can view their own favorites (SELECT, auth.uid() = user_id)
- Users can insert their own favorites (INSERT, auth.uid() = user_id)
- Users can delete their own favorites (DELETE, auth.uid() = user_id)

**referral_codes:**
- Users can view their own referral code (SELECT, auth.uid() = user_id)
- Users can create their own referral code (INSERT, auth.uid() = user_id)
- Admins can view all referral codes (SELECT, is_admin())

**referrals:**
- Users can view referrals they made (SELECT, auth.uid() = referrer_id)
- Admins can view all referrals (SELECT, is_admin())
- Service role can insert referrals (INSERT, true)
- Authenticated users can insert referrals (INSERT, auth.uid() = referred_id)

**referral_earnings:**
- Users can view their own earnings (SELECT, auth.uid() = referrer_id)
- Admins can view all earnings (SELECT, is_admin())
- Service role can insert earnings (INSERT, true)

**api_providers:**
- Anyone can view api providers (SELECT, true)
- Admins can manage api providers (ALL, is_admin())

**platforms:**
- Anyone can view platforms (SELECT, true)
- Admins can manage platforms (ALL, is_admin())

**password_reset_tokens:**
- No RLS policies (RLS may or may not be enabled)

---

## 6. Indexes

```text
- idx_transactions_user_id ON transactions(user_id)
- idx_transactions_created_at ON transactions(created_at DESC)
- idx_orders_external_order_id ON orders(external_order_id)
- idx_refund_requests_order_id ON refund_requests(order_id) WHERE status = 'pending'
- idx_newsletter_email ON newsletter_subscribers(email)
- idx_newsletter_active ON newsletter_subscribers(is_active)
```

---

## 7. Realtime

```text
- orders table is added to supabase_realtime publication
```

---

## 8. Extensions

```text
- pg_cron (schema: extensions)
- pg_net (schema: extensions)
```

---

## 9. Seed Data to Verify

These should exist in your target database:

**admin_settings** -- keys that should exist:
- telegram_bot_token, telegram_chat_id, revenue_reset_date
- telegram_signup_bot_token, telegram_signup_chat_id
- telegram_admin_action_bot_token, telegram_admin_action_chat_id
- turnstile_site_key
- korapay_public_key, korapay_secret_key
- referral_percentage (value: '4')
- usd_to_ngn_rate, price_markup_percentage
- paystack_public_key

**api_providers** -- should have:
- reallysimplesocial (enabled, primary)
- resellerprovider (disabled)

**platforms** -- 83+ rows seeded (Facebook, Instagram, Twitter, etc.)
- Twitter keywords should be: ['twitter', 'tweet', 'x/twitter', 'x twitter']

**payment_methods** -- default entries:
- card, crypto, paypal, manual, korapay

**social_links** -- default entries:
- twitter, instagram, discord

---

## 10. Edge Functions to Deploy

All 14 edge functions must be deployed to your external Supabase project. You can copy the code from the `supabase/functions/` directory:

1. **create-user** -- creates users with admin API, email auto-confirmed
2. **delete-user** -- deletes a user account
3. **get-services** -- fetches services from SMM API providers
4. **korapay-webhook** -- handles Korapay payment callbacks
5. **paystack-webhook** -- handles Paystack payment callbacks
6. **place-order** -- places orders with external SMM API
7. **reset-password** -- resets user password
8. **send-deposit-confirmation** -- sends deposit confirmation codes
9. **send-password-reset** -- sends password reset email
10. **send-telegram-notification** -- sends Telegram notifications
11. **sync-all-orders** -- syncs all order statuses
12. **sync-order-status** -- syncs individual order status
13. **track-user-login** -- tracks user IP/location on login
14. **verify-deposit-code** -- verifies deposit confirmation codes

All functions have `verify_jwt = false` in config.

---

## 11. Secrets (Environment Variables)

Set these in your external Supabase project (Dashboard > Edge Functions > Secrets):

- REALLYSIMPLESOCIAL_API_KEY
- RESELLERPROVIDER_API_KEY
- KORAPAY_SECRET_KEY
- PAYSTACK_SECRET_KEY
- RESEND_API_KEY

(SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are auto-provided by Supabase)

---

## 12. Frontend Configuration

Update your `.env` file (or environment variables) on the deployed frontend to point to your external Supabase project:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

---

## How to Use This Checklist

1. Open your external Supabase dashboard
2. Go to **SQL Editor** and run queries to check which tables/functions/policies exist
3. For anything missing, copy the relevant SQL from the migration files listed above
4. Deploy all 14 edge functions using `supabase functions deploy` from the CLI
5. Set all secrets in the Edge Functions settings
6. Update frontend env vars to point to the new project

