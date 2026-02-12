

## Fix API Request Format: FormData to URLSearchParams

### Problem
All three edge functions use `new FormData()` to send requests to the SMM API providers. This sends the data as `multipart/form-data`, but the providers expect `application/x-www-form-urlencoded` (as confirmed by your successful curl test with `-d` flag).

Additionally, `sync-all-orders` is hardcoded to only use the ReallySimpleSocial API URL and key -- it doesn't support ResellerProvider orders at all.

### Solution

Replace `FormData` with `URLSearchParams` in all three edge functions. `URLSearchParams` automatically sets the content type to `application/x-www-form-urlencoded`, matching what the APIs expect.

### Changes

**1. `supabase/functions/get-services/index.ts`**
Replace:
```typescript
const formData = new FormData();
formData.append('key', apiKey);
formData.append('action', 'services');

const response = await fetch(provider.api_url, {
  method: 'POST',
  body: formData,
});
```
With:
```typescript
const params = new URLSearchParams();
params.append('key', apiKey);
params.append('action', 'services');

const response = await fetch(provider.api_url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: params.toString(),
});
```

**2. `supabase/functions/place-order/index.ts`**
Same FormData-to-URLSearchParams change for both the order placement call and the status check call.

**3. `supabase/functions/sync-all-orders/index.ts`**
- Same FormData-to-URLSearchParams change
- Fix hardcoded ReallySimpleSocial URL: look up each order's provider from the `orders` table (or store provider info on orders) so ResellerProvider orders sync correctly too

### Technical Detail

```text
Before (multipart/form-data):
  Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
  ------WebKitFormBoundary...
  Content-Disposition: form-data; name="key"
  <api_key>
  ...

After (x-www-form-urlencoded):
  Content-Type: application/x-www-form-urlencoded
  key=<api_key>&action=services
```

This matches your working curl command exactly.

### Files Changed
- `supabase/functions/get-services/index.ts` -- URLSearchParams instead of FormData
- `supabase/functions/place-order/index.ts` -- URLSearchParams instead of FormData (both add + status calls)
- `supabase/functions/sync-all-orders/index.ts` -- URLSearchParams instead of FormData, plus fix hardcoded provider URL

