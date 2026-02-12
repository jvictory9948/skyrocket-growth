

## Fix ResellerProvider Returning 0 Services

### Problem
The `get-services` edge function currently:
1. Rejects any response with a non-2xx HTTP status (`response.ok` check on line 124) -- ResellerProvider returns 401 but may still include valid service data
2. Rejects responses without `application/json` content-type header (line 131) -- some providers return valid JSON with a different content-type

These two strict checks cause all ResellerProvider services to be silently skipped.

### Solution
Update `supabase/functions/get-services/index.ts` to be more resilient:
- Remove the `response.ok` gate -- always read the response body
- Remove the `content-type` gate -- try to parse as JSON regardless
- Add verbose logging of response status and body preview for debugging
- Only skip if the parsed JSON contains an explicit `error` field

### What Changes

**File: `supabase/functions/get-services/index.ts`**

Replace lines 118-148 (the fetch + response handling block) with:

```typescript
const response = await fetch(provider.api_url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: params.toString(),
});

console.log(`${provider.name} responded with status: ${response.status}`);

const responseText = await response.text();
console.log(`${provider.name} response preview: ${responseText.substring(0, 500)}`);

let services;
try {
  services = JSON.parse(responseText);
} catch {
  console.error(`${provider.name} returned non-JSON response`);
  continue;
}

if (services && !Array.isArray(services) && services.error) {
  console.error(`${provider.name} API error: ${services.error}`);
  continue;
}

if (Array.isArray(services)) {
  const taggedServices = services.map((service: Service) => ({
    ...service,
    provider_id: provider.provider_id,
    provider_name: provider.name,
  }));
  allServices.push(...taggedServices);
  console.log(`Fetched ${services.length} services from ${provider.name}`);
}
```

### No Database Changes
No schema or data changes required. Your `.env` is already pointing to the correct project (`zmfhnwlmtmucdogtixxm`).

### Files Changed
- `supabase/functions/get-services/index.ts` -- resilient response handling, verbose logging

