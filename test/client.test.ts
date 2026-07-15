import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActiveCampaignClient } from '../src/client.js';

const fetchMock = vi.fn<typeof fetch>();
const apiUrl = 'https://demo.api-us1.com';
const apiKey = 'test-api-key';

function jsonResponse(body: unknown, status = 200, statusText = 'OK'): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { 'Content-Type': 'application/json' }
  });
}

function lastRequest(): { url: URL; init: RequestInit } {
  const [url, init] = fetchMock.mock.calls.at(-1) as [URL, RequestInit];
  return { url: new URL(url), init };
}

describe('ActiveCampaignClient', () => {
  beforeEach(() => fetchMock.mockReset());

  it('constructs a paginated contact request with the API token header', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ contacts: [{ id: '1', email: 'ada@example.com' }], meta: { total: '1' } }));

    const result = await new ActiveCampaignClient(apiUrl, apiKey, fetchMock).listContacts({ limit: 10, offset: 20 });
    const request = lastRequest();

    expect(result).toEqual({ contacts: [{ id: '1', email: 'ada@example.com' }], total: 1 });
    expect(request.url.href).toBe('https://demo.api-us1.com/api/3/contacts?limit=10&offset=20');
    expect(request.init.method).toBe('GET');
    expect(new Headers(request.init.headers).get('Api-Token')).toBe(apiKey);
    expect(new Headers(request.init.headers).get('Content-Type')).toBeNull();
  });

  it('creates a contact with only defined fields', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ contact: { id: '42', email: 'ada@example.com', firstName: 'Ada' } }, 201, 'Created'));

    const result = await new ActiveCampaignClient(apiUrl, apiKey, fetchMock).createContact({
      email: 'ada@example.com',
      firstName: 'Ada'
    });
    const request = lastRequest();

    expect(result.id).toBe('42');
    expect(JSON.parse(String(request.init.body))).toEqual({ contact: { email: 'ada@example.com', firstName: 'Ada' } });
    expect(new Headers(request.init.headers).get('Content-Type')).toBe('application/json');
  });

  it('updates a contact and assigns a tag using the documented resource bodies', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ contact: { id: '42', email: 'new@example.com' } }))
      .mockResolvedValueOnce(jsonResponse({ contactTag: { id: '99', contact: '42', tag: '7' } }, 201, 'Created'));
    const client = new ActiveCampaignClient(apiUrl, apiKey, fetchMock);

    await client.updateContact({ id: '42', email: 'new@example.com' });
    expect(JSON.parse(String(lastRequest().init.body))).toEqual({ contact: { email: 'new@example.com' } });
    await expect(client.addTagToContact({ contactId: '42', tagId: '7' })).resolves.toEqual({ id: '99', contact: '42', tag: '7' });
    expect(JSON.parse(String(lastRequest().init.body))).toEqual({ contactTag: { contact: '42', tag: '7' } });
  });

  it('parses list totals returned as numbers and filters', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ tags: [{ id: '7', tag: 'VIP' }], meta: { total: 3 } }));

    const result = await new ActiveCampaignClient(apiUrl, apiKey, fetchMock).listTags({ limit: 5, offset: 0, search: 'VIP' });
    expect(result).toEqual({ tags: [{ id: '7', tag: 'VIP' }], total: 3 });
    expect(lastRequest().url.searchParams.get('search')).toBe('VIP');
  });

  it('rejects unexpected API hosts before sending credentials', () => {
    expect(() => new ActiveCampaignClient('https://example.com', apiKey, fetchMock)).toThrow(/HTTPS account URL/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports API errors without including the API key', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Unauthorized' }, 401, 'Unauthorized'));

    await expect(new ActiveCampaignClient(apiUrl, apiKey, fetchMock).listCampaigns({ limit: 20, offset: 0 }))
      .rejects.toThrow('ActiveCampaign GET /api/3/campaigns failed: Unauthorized');
    await expect(new ActiveCampaignClient(apiUrl, apiKey, fetchMock).listCampaigns({ limit: 20, offset: 0 }))
      .rejects.not.toThrow(apiKey);
  });

  it('rejects malformed successful responses', async () => {
    fetchMock.mockResolvedValueOnce(new Response('not-json', { status: 200 }));

    await expect(new ActiveCampaignClient(apiUrl, apiKey, fetchMock).listCampaigns({ limit: 20, offset: 0 }))
      .rejects.toThrow('Invalid JSON from ActiveCampaign API');
  });
});
