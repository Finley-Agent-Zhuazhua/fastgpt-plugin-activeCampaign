import type {
  AddTagToContactInput,
  ActiveCampaignSecrets,
  CreateContactInput,
  ListCampaignsInput,
  ListContactsInput,
  ListTagsInput,
  UpdateContactInput
} from './schemas.js';

type JsonObject = Record<string, unknown>;
type FetchFunction = typeof fetch;

export class ActiveCampaignClient {
  private readonly apiOrigin: string;

  constructor(
    private readonly apiUrl: ActiveCampaignSecrets['apiUrl'],
    private readonly apiKey: ActiveCampaignSecrets['apiKey'],
    private readonly fetchFn: FetchFunction = fetch
  ) {
    const parsed = new URL(apiUrl);
    if (parsed.protocol !== 'https:' || !/^[a-z0-9-]+\.api-[a-z0-9-]+\.com$/i.test(parsed.hostname) || parsed.pathname.replace(/\/$/, '')) {
      throw new Error('ActiveCampaign apiUrl must be an HTTPS account URL such as https://account.api-us1.com');
    }
    if (!apiKey.trim()) throw new Error('ActiveCampaign apiKey is required');
    this.apiOrigin = parsed.origin;
  }

  async listContacts(input: ListContactsInput): Promise<{ contacts: JsonObject[]; total: number }> {
    const url = this.apiEndpoint('/contacts');
    addPagination(url, input);
    if (input.search) url.searchParams.set('search', input.search);
    const payload = await this.request(url, { method: 'GET' });
    return { contacts: asObjectArray(asObject(payload, 'contacts response').contacts, 'contacts response contacts'), total: readTotal(payload, 'contacts response') };
  }

  async createContact(input: CreateContactInput): Promise<{ id: string; contact: JsonObject }> {
    const contact: JsonObject = { email: input.email };
    addDefined(contact, 'firstName', input.firstName);
    addDefined(contact, 'lastName', input.lastName);
    addDefined(contact, 'phone', input.phone);
    addDefined(contact, 'orgname', input.organization);
    const payload = await this.request(this.apiEndpoint('/contacts'), {
      method: 'POST',
      body: JSON.stringify({ contact })
    });
    const resource = asObject(asObject(payload, 'create contact response').contact, 'create contact response contact');
    return { id: asString(resource.id, 'create contact response contact.id'), contact: resource };
  }

  async updateContact(input: UpdateContactInput): Promise<{ id: string; contact: JsonObject }> {
    const contact: JsonObject = {};
    addDefined(contact, 'email', input.email);
    addDefined(contact, 'firstName', input.firstName);
    addDefined(contact, 'lastName', input.lastName);
    addDefined(contact, 'phone', input.phone);
    addDefined(contact, 'orgname', input.organization);
    const payload = await this.request(this.apiEndpoint(`/contacts/${encodeURIComponent(input.id)}`), {
      method: 'PUT',
      body: JSON.stringify({ contact })
    });
    const resource = asObject(asObject(payload, 'update contact response').contact, 'update contact response contact');
    return { id: asString(resource.id, 'update contact response contact.id'), contact: resource };
  }

  async listCampaigns(input: ListCampaignsInput): Promise<{ campaigns: JsonObject[]; total: number }> {
    const url = this.apiEndpoint('/campaigns');
    addPagination(url, input);
    const payload = await this.request(url, { method: 'GET' });
    return { campaigns: asObjectArray(asObject(payload, 'campaigns response').campaigns, 'campaigns response campaigns'), total: readTotal(payload, 'campaigns response') };
  }

  async listTags(input: ListTagsInput): Promise<{ tags: JsonObject[]; total: number }> {
    const url = this.apiEndpoint('/tags');
    addPagination(url, input);
    if (input.search) url.searchParams.set('search', input.search);
    const payload = await this.request(url, { method: 'GET' });
    return { tags: asObjectArray(asObject(payload, 'tags response').tags, 'tags response tags'), total: readTotal(payload, 'tags response') };
  }

  async addTagToContact(input: AddTagToContactInput): Promise<JsonObject> {
    const payload = await this.request(this.apiEndpoint('/contactTags'), {
      method: 'POST',
      body: JSON.stringify({ contactTag: { contact: input.contactId, tag: input.tagId } })
    });
    return asObject(asObject(payload, 'contact tag response').contactTag, 'contact tag response contactTag');
  }

  private apiEndpoint(path: string): URL {
    return new URL(`/api/3${path}`, this.apiOrigin);
  }

  private async request(url: URL, init: { method: string; body?: string }): Promise<unknown> {
    const requestInit: RequestInit = {
      method: init.method,
      headers: {
        Accept: 'application/json',
        'Api-Token': this.apiKey,
        ...(init.body ? { 'Content-Type': 'application/json' } : {})
      }
    };
    if (init.body !== undefined) requestInit.body = init.body;
    const response = await this.fetchFn(url, requestInit);
    const text = await response.text();
    let payload: unknown = {};
    if (text) {
      try {
        payload = JSON.parse(text) as unknown;
      } catch {
        if (response.ok) throw new Error('Invalid JSON from ActiveCampaign API');
      }
    }
    if (!response.ok) {
      throw new Error(`ActiveCampaign ${init.method} ${url.pathname} failed: ${errorMessage(payload, response.statusText)}`);
    }
    return payload;
  }
}

function addPagination(url: URL, input: { limit: number; offset: number }): void {
  url.searchParams.set('limit', String(input.limit));
  url.searchParams.set('offset', String(input.offset));
}

function addDefined(target: JsonObject, key: string, value: string | undefined): void {
  if (value !== undefined) target[key] = value;
}

function asObject(value: unknown, kind: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`ActiveCampaign ${kind} must be an object`);
  return value as JsonObject;
}

function asObjectArray(value: unknown, kind: string): JsonObject[] {
  if (!Array.isArray(value)) throw new Error(`ActiveCampaign ${kind} must be an array`);
  return value.map((item) => asObject(item, kind));
}

function asString(value: unknown, kind: string): string {
  if (typeof value !== 'string' || !value) throw new Error(`ActiveCampaign ${kind} must be a non-empty string`);
  return value;
}

function readTotal(value: unknown, kind: string): number {
  const body = asObject(value, kind);
  const meta = asObject(body.meta, `${kind} meta`);
  const raw = meta.total;
  const total = typeof raw === 'number' ? raw : typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isSafeInteger(total) || total < 0) throw new Error(`ActiveCampaign ${kind} meta.total must be a non-negative integer`);
  return total;
}

function errorMessage(value: unknown, fallback: string): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback || 'request failed';
  const body = value as JsonObject;
  if (typeof body.message === 'string') return body.message.slice(0, 500);
  if (typeof body.errors === 'string') return body.errors.slice(0, 500);
  return fallback || 'request failed';
}
