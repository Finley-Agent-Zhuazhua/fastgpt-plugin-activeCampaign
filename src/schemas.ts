import type { InputSchemaMetaType, OutputSchemaMetaType, SecretSchemaMetaType } from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

const text = (title: string, description: string, max = 256) =>
  z.string().min(1).max(max).meta({ title, description, toolDescription: description } satisfies InputSchemaMetaType);

const optionalText = (title: string, description: string, max = 256) =>
  z.string().max(max).optional().meta({ title, description, toolDescription: description } satisfies InputSchemaMetaType);

const email = z.string().min(3).max(320).email().meta({
  title: 'Email address',
  description: 'Contact email address.',
  toolDescription: 'Contact email address.'
} satisfies InputSchemaMetaType);

export const secretSchema = z.object({
  apiUrl: z.string().url().refine((value) => {
    const url = new URL(value);
    return url.protocol === 'https:' && /^[a-z0-9-]+\.api-[a-z0-9-]+\.com$/i.test(url.hostname) && !url.pathname.replace(/\/$/, '');
  }, 'must be an HTTPS ActiveCampaign account URL such as https://account.api-us1.com').meta({
    title: 'ActiveCampaign API URL',
    description: 'HTTPS account URL, for example https://account.api-us1.com. Custom hosts are not accepted.',
    isSecret: false
  } satisfies SecretSchemaMetaType),
  apiKey: z.string().min(1).max(512).meta({
    title: 'ActiveCampaign API key',
    description: 'ActiveCampaign API key from Settings > Developer.',
    isSecret: true
  } satisfies SecretSchemaMetaType)
});

const pagination = {
  limit: z.number().int().min(1).max(100).default(20).meta({
    title: 'Limit',
    description: 'Maximum number of records to return (1-100).',
    toolDescription: 'Maximum records to return.'
  } satisfies InputSchemaMetaType),
  offset: z.number().int().min(0).max(100000).default(0).meta({
    title: 'Offset',
    description: 'Number of records to skip for pagination.',
    toolDescription: 'Pagination offset.'
  } satisfies InputSchemaMetaType)
};

export const listContactsInputSchema = z.object({
  ...pagination,
  search: optionalText('Search', 'Search by contact name, email, or phone.', 255)
});

export const createContactInputSchema = z.object({
  email,
  firstName: optionalText('First name', 'Contact first name.', 100),
  lastName: optionalText('Last name', 'Contact last name.', 100),
  phone: optionalText('Phone', 'Contact phone number.', 64),
  organization: optionalText('Organization', 'Contact organization name.', 255)
});

export const updateContactInputSchema = z.object({
  id: text('Contact ID', 'ActiveCampaign contact ID.', 64),
  email: email.optional(),
  firstName: optionalText('First name', 'Replacement contact first name.', 100),
  lastName: optionalText('Last name', 'Replacement contact last name.', 100),
  phone: optionalText('Phone', 'Replacement contact phone number.', 64),
  organization: optionalText('Organization', 'Replacement contact organization name.', 255)
}).refine(
  ({ email: address, firstName, lastName, phone, organization }) =>
    address !== undefined || firstName !== undefined || lastName !== undefined || phone !== undefined || organization !== undefined,
  'at least one contact field must be provided'
);

export const listCampaignsInputSchema = z.object(pagination);

export const listTagsInputSchema = z.object({
  ...pagination,
  search: optionalText('Search', 'Search tag names or descriptions.', 255)
});

export const addTagToContactInputSchema = z.object({
  contactId: text('Contact ID', 'ActiveCampaign contact ID.', 64),
  tagId: text('Tag ID', 'Existing ActiveCampaign tag ID.', 64)
});

const success = z.literal(true).meta({ title: 'Success' } satisfies OutputSchemaMetaType);
const objectRecord = z.record(z.string(), z.unknown());

export const listContactsOutputSchema = z.object({
  success,
  contacts: z.array(objectRecord).meta({ title: 'Contacts' } satisfies OutputSchemaMetaType),
  total: z.number().int().nonnegative().meta({ title: 'Total contacts' } satisfies OutputSchemaMetaType)
});

export const createContactOutputSchema = z.object({
  success,
  id: z.string().min(1).meta({ title: 'Contact ID' } satisfies OutputSchemaMetaType),
  contact: objectRecord.meta({ title: 'Contact' } satisfies OutputSchemaMetaType)
});

export const updateContactOutputSchema = z.object({
  success,
  id: z.string().min(1).meta({ title: 'Contact ID' } satisfies OutputSchemaMetaType),
  contact: objectRecord.meta({ title: 'Contact' } satisfies OutputSchemaMetaType)
});

export const listCampaignsOutputSchema = z.object({
  success,
  campaigns: z.array(objectRecord).meta({ title: 'Campaigns' } satisfies OutputSchemaMetaType),
  total: z.number().int().nonnegative().meta({ title: 'Total campaigns' } satisfies OutputSchemaMetaType)
});

export const listTagsOutputSchema = z.object({
  success,
  tags: z.array(objectRecord).meta({ title: 'Tags' } satisfies OutputSchemaMetaType),
  total: z.number().int().nonnegative().meta({ title: 'Total tags' } satisfies OutputSchemaMetaType)
});

export const addTagToContactOutputSchema = z.object({
  success,
  contactId: z.string().min(1).meta({ title: 'Contact ID' } satisfies OutputSchemaMetaType),
  tagId: z.string().min(1).meta({ title: 'Tag ID' } satisfies OutputSchemaMetaType),
  contactTag: objectRecord.meta({ title: 'Contact tag' } satisfies OutputSchemaMetaType)
});

export type ActiveCampaignSecrets = z.output<typeof secretSchema>;
export type ListContactsInput = z.output<typeof listContactsInputSchema>;
export type CreateContactInput = z.output<typeof createContactInputSchema>;
export type UpdateContactInput = z.output<typeof updateContactInputSchema>;
export type ListCampaignsInput = z.output<typeof listCampaignsInputSchema>;
export type ListTagsInput = z.output<typeof listTagsInputSchema>;
export type AddTagToContactInput = z.output<typeof addTagToContactInputSchema>;
export type ListContactsOutput = z.output<typeof listContactsOutputSchema>;
export type CreateContactOutput = z.output<typeof createContactOutputSchema>;
export type UpdateContactOutput = z.output<typeof updateContactOutputSchema>;
export type ListCampaignsOutput = z.output<typeof listCampaignsOutputSchema>;
export type ListTagsOutput = z.output<typeof listTagsOutputSchema>;
export type AddTagToContactOutput = z.output<typeof addTagToContactOutputSchema>;
