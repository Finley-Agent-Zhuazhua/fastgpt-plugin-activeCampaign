import {
  createToolHandler,
  defineToolSet,
  type InputSchemaMetaType,
  type SecretSchemaMetaType
} from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

import {
  addTagToContact,
  createContact,
  listCampaigns,
  listContacts,
  listTags,
  updateContact
} from './src/operations.js';
import {
  addTagToContactInputSchema,
  addTagToContactOutputSchema,
  createContactInputSchema,
  createContactOutputSchema,
  listCampaignsInputSchema,
  listCampaignsOutputSchema,
  listContactsInputSchema,
  listContactsOutputSchema,
  listTagsInputSchema,
  listTagsOutputSchema,
  secretSchema,
  updateContactInputSchema,
  updateContactOutputSchema,
  type ActiveCampaignSecrets
} from './src/schemas.js';

function requireSecrets(secrets: ActiveCampaignSecrets | undefined): ActiveCampaignSecrets {
  const parsed = secretSchema.safeParse(secrets);
  if (!parsed.success) throw new Error('ActiveCampaign apiUrl and apiKey secrets are required');
  return parsed.data;
}

const listContactsHandler = createToolHandler({
  inputSchema: listContactsInputSchema,
  outputSchema: listContactsOutputSchema,
  secretSchema,
  handler: async (input, ctx) => listContacts({ ...input, ...requireSecrets(ctx.secrets) })
});

const createContactHandler = createToolHandler({
  inputSchema: createContactInputSchema,
  outputSchema: createContactOutputSchema,
  secretSchema,
  handler: async (input, ctx) => createContact({ ...input, ...requireSecrets(ctx.secrets) })
});

const updateContactHandler = createToolHandler({
  inputSchema: updateContactInputSchema,
  outputSchema: updateContactOutputSchema,
  secretSchema,
  handler: async (input, ctx) => updateContact({ ...input, ...requireSecrets(ctx.secrets) })
});

const listCampaignsHandler = createToolHandler({
  inputSchema: listCampaignsInputSchema,
  outputSchema: listCampaignsOutputSchema,
  secretSchema,
  handler: async (input, ctx) => listCampaigns({ ...input, ...requireSecrets(ctx.secrets) })
});

const listTagsHandler = createToolHandler({
  inputSchema: listTagsInputSchema,
  outputSchema: listTagsOutputSchema,
  secretSchema,
  handler: async (input, ctx) => listTags({ ...input, ...requireSecrets(ctx.secrets) })
});

const addTagToContactHandler = createToolHandler({
  inputSchema: addTagToContactInputSchema,
  outputSchema: addTagToContactOutputSchema,
  secretSchema,
  handler: async (input, ctx) => addTagToContact({ ...input, ...requireSecrets(ctx.secrets) })
});

export default defineToolSet({
  manifest: {
    pluginId: 'activeCampaign',
    name: { en: 'ActiveCampaign', 'zh-CN': 'ActiveCampaign' },
    description: {
      en: 'Manage ActiveCampaign contacts and tags, and inspect campaigns.',
      'zh-CN': '管理 ActiveCampaign 联系人与标签，并查询营销活动。'
    },
    version: '0.1.0',
    versionDescription: {
      en: 'Initial contacts, tags, and campaign tools.',
      'zh-CN': '初始版本，包含联系人、标签和营销活动工具。'
    },
    toolDescription: 'Use an ActiveCampaign API URL and API key to read and manage CRM contacts and tags. The credentials are never returned.',
    tutorialUrl: 'https://developers.activecampaign.com/reference/overview',
    tags: ['tools', 'communication'],
    permission: []
  },
  secretSchema,
  children: [
    {
      id: 'listContacts',
      name: { en: 'List Contacts', 'zh-CN': '列出联系人' },
      description: {
        en: 'List ActiveCampaign contacts with optional email/name search.',
        'zh-CN': '列出 ActiveCampaign 联系人，可按邮箱或姓名搜索。'
      },
      toolDescription: 'Read contacts with pagination. Search is sent to ActiveCampaign as a server-side query.',
      handler: listContactsHandler
    },
    {
      id: 'createContact',
      name: { en: 'Create Contact', 'zh-CN': '创建联系人' },
      description: {
        en: 'Create a contact in ActiveCampaign.',
        'zh-CN': '在 ActiveCampaign 中创建联系人。'
      },
      toolDescription: 'Create one contact. Check for an existing contact first when duplicate prevention matters.',
      handler: createContactHandler
    },
    {
      id: 'updateContact',
      name: { en: 'Update Contact', 'zh-CN': '更新联系人' },
      description: {
        en: 'Update selected fields on an existing ActiveCampaign contact.',
        'zh-CN': '更新已有 ActiveCampaign 联系人的指定字段。'
      },
      toolDescription: 'Update only the fields provided for the contact ID.',
      handler: updateContactHandler
    },
    {
      id: 'listCampaigns',
      name: { en: 'List Campaigns', 'zh-CN': '列出营销活动' },
      description: {
        en: 'List ActiveCampaign campaigns with pagination.',
        'zh-CN': '分页列出 ActiveCampaign 营销活动。'
      },
      toolDescription: 'Read campaign metadata and status without sending or changing a campaign.',
      handler: listCampaignsHandler
    },
    {
      id: 'listTags',
      name: { en: 'List Tags', 'zh-CN': '列出标签' },
      description: {
        en: 'List ActiveCampaign tags with optional search.',
        'zh-CN': '列出 ActiveCampaign 标签，可选按名称搜索。'
      },
      toolDescription: 'Read tags available in the account before assigning one to a contact.',
      handler: listTagsHandler
    },
    {
      id: 'addTagToContact',
      name: { en: 'Add Tag to Contact', 'zh-CN': '给联系人添加标签' },
      description: {
        en: 'Apply an existing ActiveCampaign tag to a contact.',
        'zh-CN': '为联系人添加已有的 ActiveCampaign 标签。'
      },
      toolDescription: 'This changes CRM data. Verify the contact ID and tag ID before calling it.',
      handler: addTagToContactHandler
    }
  ]
});
