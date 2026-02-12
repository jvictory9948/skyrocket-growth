

## Fix API Key Management for Edge Functions

### Problem
1. The `get-services`, `place-order`, and `sync-all-orders` edge functions read API keys **only** from environment secrets (`Deno.env.get()`), never from the `admin_settings` database table.
2. The admin settings page only has a field for `reallysimplesocial_api_key` -- there's no field for the ResellerProvider key.
3. The functions don't validate the response content-type before parsing JSON, leading to cryptic errors when an API returns HTML.

### Solution

**1. Update all 3 edge functions to read API keys from `admin_settings` first, falling back to environment secrets**

Each function will query the database for the key before using the secret:
- `get-services/index.ts` -- update `getApiKeyForProvider()` to check `admin_settings` first
- `place-order/index.ts` -- same pattern
- `sync-all-orders/index.ts` -- same pattern

**2. Add response validation before JSON parsing**

In `get-services`, check the response content-type before calling `.json()`. If the API returns HTML, log a clear error message instead of crashing.

**3. Add ResellerProvider API key field to admin settings**

Update `AdminSettings.tsx` to include a field for `resellerprovider_api_key`, so both provider keys can be managed from the admin panel.

### Technical Details

**Edge function key lookup (new pattern for all 3 functions):**

```typescript
async function getApiKeyForProvider(
  supabase: any,
  providerId: string
): Promise<string | undefined> {
  // Map provider_id to admin_settings key and env var name
  const keyMap: Record<string, { dbKey: string; envKey: string }> = {
    reallysimplesocial: {
      dbKey: "reallysimplesocial_api_key",
      envKey: "REALLYSIMPLESOCIAL_API_KEY",
    },
    resellerprovider: {
      dbKey: "resellerprovider_api_key",
      envKey: "RESELLERPROVIDER_API_KEY",
    },
  };

  const mapping = keyMap[providerId];
  if (!mapping) return undefined;

  // Try admin_settings first
  const { data } = await supabase
    .from("admin_settings")
    .select("setting_value")
    .eq("setting_key", mapping.dbKey)
    .maybeSingle();

  if (data?.setting_value) {
    return data.setting_value;
  }

  // Fallback to environment secret
  return Deno.env.get(mapping.envKey);
}
```

**Response validation (in get-services):**

```typescript
const contentType = response.headers.get("content-type");
if (!contentType?.includes("application/json")) {
  const text = await response.text();
  console.error(
    `${provider.name} returned non-JSON (${contentType}):`,
    text.substring(0, 200)
  );
  continue;
}
```

**Admin settings UI update:**
- Add a `resellerProviderApiKey` state variable
- Add an input field for it in the API Keys section
- Include `resellerprovider_api_key` in the save mutation

### Files Changed
- `supabase/functions/get-services/index.ts` -- DB-first key lookup + response validation
- `supabase/functions/place-order/index.ts` -- DB-first key lookup
- `supabase/functions/sync-all-orders/index.ts` -- DB-first key lookup
- `src/pages/admin/AdminSettings.tsx` -- Add ResellerProvider API key field

### RLS Consideration
The `admin_settings` table already has an RLS policy allowing admin access. The edge functions use the service role key, so they bypass RLS and can read all settings. No RLS changes needed.

