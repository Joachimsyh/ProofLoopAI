import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  uuid,
  boolean,
  real
} from 'drizzle-orm/pg-core';

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const proofSources = pgTable('proof_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id)
    .notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  fileName: text('file_name'),
  status: text('status').default('processed').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const trustSignals = pgTable('trust_signals', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id)
    .notNull(),
  sourceId: uuid('source_id').references(() => proofSources.id),
  quote: text('quote').notNull(),
  category: text('category').notNull(),
  signalType: text('signal_type').notNull(),
  strength: integer('strength').notNull(),
  proofScore: integer('proof_score').notNull(),
  credibility: real('credibility').notNull(),
  specificity: real('specificity').notNull(),
  revenueImpact: real('revenue_impact').notNull(),
  emotionalImpact: real('emotional_impact').notNull(),
  conversionPotential: real('conversion_potential').notNull(),
  recommendedUses: jsonb('recommended_uses').$type<string[]>().notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const audiences = pgTable('audiences', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id)
    .notNull(),
  trustSignalId: uuid('trust_signal_id').references(() => trustSignals.id),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icpMatch: integer('icp_match').notNull(),
  industry: text('industry').notNull(),
  companySize: text('company_size').notNull(),
  resonanceScore: integer('resonance_score').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const gtmPlaybooks = pgTable('gtm_playbooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id)
    .notNull(),
  title: text('title').notNull(),
  type: text('type').notNull(),
  content: jsonb('content').$type<Record<string, unknown>>().notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const contentAssets = pgTable('content_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id)
    .notNull(),
  trustSignalId: uuid('trust_signal_id').references(() => trustSignals.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  platform: text('platform'),
  status: text('status').default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const crmEntries = pgTable('crm_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id)
    .notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  title: text('title').notNull(),
  status: text('status').default('active').notNull(),
  conversionOutcome: text('conversion_outcome'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const growthRecommendations = pgTable('growth_recommendations', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id)
    .notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  priority: text('priority').notNull(),
  impact: integer('impact').notNull(),
  effort: integer('effort').notNull(),
  category: text('category').notNull(),
  proofSignalIds: jsonb('proof_signal_ids').$type<string[]>().notNull(),
  actionItems: jsonb('action_items').$type<string[]>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id)
    .notNull(),
  eventType: text('event_type').notNull(),
  entityType: text('entity_type'),
  entityId: uuid('entity_id'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id)
    .notNull()
    .unique(),
  demoMode: boolean('demo_mode').default(true).notNull(),
  aiProvider: text('ai_provider').default('demo').notNull(),
  integrations: jsonb('integrations').$type<Record<string, boolean>>().default({}),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().default({}),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
