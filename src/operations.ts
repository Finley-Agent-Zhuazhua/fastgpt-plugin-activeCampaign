import { ActiveCampaignClient } from './client.js';
import type {
  AddTagToContactInput,
  AddTagToContactOutput,
  ActiveCampaignSecrets,
  CreateContactInput,
  CreateContactOutput,
  ListCampaignsInput,
  ListCampaignsOutput,
  ListContactsInput,
  ListContactsOutput,
  ListTagsInput,
  ListTagsOutput,
  UpdateContactInput,
  UpdateContactOutput
} from './schemas.js';

type WithSecrets<T> = T & ActiveCampaignSecrets;

function client(input: ActiveCampaignSecrets): ActiveCampaignClient {
  return new ActiveCampaignClient(input.apiUrl, input.apiKey);
}

export async function listContacts(input: WithSecrets<ListContactsInput>): Promise<ListContactsOutput> {
  const result = await client(input).listContacts(input);
  return { success: true, ...result };
}

export async function createContact(input: WithSecrets<CreateContactInput>): Promise<CreateContactOutput> {
  const result = await client(input).createContact(input);
  return { success: true, ...result };
}

export async function updateContact(input: WithSecrets<UpdateContactInput>): Promise<UpdateContactOutput> {
  const result = await client(input).updateContact(input);
  return { success: true, ...result };
}

export async function listCampaigns(input: WithSecrets<ListCampaignsInput>): Promise<ListCampaignsOutput> {
  const result = await client(input).listCampaigns(input);
  return { success: true, ...result };
}

export async function listTags(input: WithSecrets<ListTagsInput>): Promise<ListTagsOutput> {
  const result = await client(input).listTags(input);
  return { success: true, ...result };
}

export async function addTagToContact(input: WithSecrets<AddTagToContactInput>): Promise<AddTagToContactOutput> {
  const contactTag = await client(input).addTagToContact(input);
  return { success: true, contactId: input.contactId, tagId: input.tagId, contactTag };
}
