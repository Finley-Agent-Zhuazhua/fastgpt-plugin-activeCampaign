# ActiveCampaign for FastGPT

ActiveCampaign tool suite for CRM contacts, tags, and campaign lookup.

## Tools

- **List Contacts**: page through contacts and optionally search by email, name, or phone.
- **Create Contact**: create a contact with email and optional name, phone, and organization.
- **Update Contact**: update selected fields on an existing contact by ID.
- **List Campaigns**: read campaign metadata and status without sending campaigns.
- **List Tags**: page through available tags and optionally search by name.
- **Add Tag to Contact**: assign an existing tag to a contact.

The plugin uses the ActiveCampaign API v3 endpoint under the configured account URL. It accepts only HTTPS account URLs matching `https://<account>.api-<region>.com`; arbitrary hosts are rejected to avoid routing credentials to an unexpected service.

## Secrets

Configure these FastGPT secrets:

- `apiUrl`: ActiveCampaign account API URL, for example `https://your-account.api-us1.com` (Settings > Developer).
- `apiKey`: ActiveCampaign API key (Settings > Developer).

The API key is sent only in the `Api-Token` request header and is never returned in tool output or error messages. Use the least-privileged key available.

## Examples

List contacts:

```json
{ "limit": 20, "offset": 0, "search": "ada@example.com" }
```

Create a contact:

```json
{
  "email": "ada@example.com",
  "firstName": "Ada",
  "lastName": "Lovelace",
  "organization": "Analytical Engines"
}
```

Add a tag to a contact:

```json
{ "contactId": "123", "tagId": "7" }
```

## Local verification

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm type-check
corepack pnpm build
corepack pnpm check
corepack pnpm pack
```

Tests mock `fetch` and cover URL construction, authentication headers, request bodies, pagination, response parsing, malformed responses, and API errors. No live ActiveCampaign credential integration test was performed.
