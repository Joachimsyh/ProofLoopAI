import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getStore, addSource, addSignals, DEMO_ANALYTICS, resetStore, WORKSPACE_ID } from '../store/memory.js';
import { runProofDiscoveryPipeline, parseFileContent } from '../ai/pipeline.js';
import {
  expandAudience,
  generateGtmSystem,
  amplifyProof,
  syncToZero,
  getGrowthRecommendations,
  validateProof
} from '../integrations/sponsors.js';

const app = new Hono();

app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }));

app.get('/health', (c) => c.json({ status: 'ok', service: 'proofloop-api', demo: true }));

app.get('/api/dashboard', (c) => {
  const store = getStore();
  const topSignals = [...store.signals].sort((a, b) => b.proofScore - a.proofScore).slice(0, 5);
  return c.json({
    workspaceId: store.workspaceId,
    stats: DEMO_ANALYTICS.overview,
    topSignals,
    recentSources: store.sources.slice(0, 5),
    integrationStatus: store.settings.integrations
  });
});

app.get('/api/sources', (c) => c.json(getStore().sources));

app.post('/api/sources/text', async (c) => {
  const body = await c.req.json<{ content: string; title?: string; type?: string }>();
  if (!body.content?.trim()) return c.json({ error: 'Content is required' }, 400);

  const source = addSource({
    workspaceId: WORKSPACE_ID,
    type: body.type ?? 'paste',
    title: body.title ?? 'Pasted Content',
    content: body.content,
    status: 'processing'
  });

  const extracted = await runProofDiscoveryPipeline(body.content);
  const validated = await Promise.all(extracted.map((s) => validateProof(s)));
  const signals = addSignals(
    validated.map((s) => ({ workspaceId: WORKSPACE_ID, sourceId: source.id, ...s }))
  );

  source.status = 'processed';
  await syncToZero({ type: 'source', source, signals });

  return c.json({ source, signals, count: signals.length });
});

app.post('/api/sources/upload', async (c) => {
  const form = await c.req.parseBody();
  const file = form['file'];
  if (!file || !(file instanceof File)) return c.json({ error: 'File is required' }, 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const content = await parseFileContent(buffer, file.name);

  const source = addSource({
    workspaceId: WORKSPACE_ID,
    type: file.name.split('.').pop() ?? 'file',
    title: file.name,
    content,
    fileName: file.name,
    status: 'processing'
  });

  const extracted = await runProofDiscoveryPipeline(content);
  const validated = await Promise.all(extracted.map((s) => validateProof(s)));
  const signals = addSignals(
    validated.map((s) => ({ workspaceId: WORKSPACE_ID, sourceId: source.id, ...s }))
  );

  source.status = 'processed';
  return c.json({ source, signals, count: signals.length });
});

app.post('/api/discovery/run', async (c) => {
  const body = await c.req.json<{ content: string }>();
  const extracted = await runProofDiscoveryPipeline(body.content ?? '');
  const validated = await Promise.all(extracted.map((s) => validateProof(s)));
  return c.json({ signals: validated });
});

app.get('/api/trust-signals', (c) => {
  const store = getStore();
  const sorted = [...store.signals].sort((a, b) => b.proofScore - a.proofScore);
  return c.json(sorted);
});

app.get('/api/trust-signals/:id', (c) => {
  const signal = getStore().signals.find((s) => s.id === c.req.param('id'));
  if (!signal) return c.json({ error: 'Not found' }, 404);
  return c.json(signal);
});

app.get('/api/rankings', (c) => {
  const store = getStore();
  const ranked = [...store.signals]
    .sort((a, b) => b.proofScore - a.proofScore)
    .map((s, i) => ({ rank: i + 1, ...s }));
  return c.json(ranked);
});

app.get('/api/audiences', (c) => c.json(getStore().audiences));

app.post('/api/audiences/expand', async (c) => {
  const body = await c.req.json<{ proofQuote: string; signalId?: string }>();
  const audiences = await expandAudience(body.proofQuote);
  return c.json({ audiences, poweredBy: process.env.UNIFY_API_KEY ? 'unify' : 'demo' });
});

app.get('/api/gtm-playbooks', (c) => c.json(getStore().playbooks));

app.post('/api/gtmengineer/generate', async (c) => {
  const store = getStore();
  const playbooks = await generateGtmSystem(store.signals.slice(0, 5));
  return c.json({
    playbooks,
    poweredBy: 'gtmengineer.dev',
    message: 'GTMengineer.dev powers our GTM System Generator'
  });
});

app.get('/api/content', (c) => c.json(getStore().contentAssets));

app.post('/api/content/generate', async (c) => {
  const body = await c.req.json<{ signalId: string }>();
  const signal = getStore().signals.find((s) => s.id === body.signalId);
  if (!signal) return c.json({ error: 'Signal not found' }, 404);

  const assets = await amplifyProof(signal);
  return c.json({
    assets,
    poweredBy: process.env.FAXXING_API_KEY ? 'faxxing' : 'demo'
  });
});

/** Faxxing — Proof Amplification Engine (fake social media validation endpoint) */
app.post('/api/faxxing/amplify', async (c) => {
  const body = await c.req.json<{ signalId: string }>();
  const signal = getStore().signals.find((s) => s.id === body.signalId);
  if (!signal) return c.json({ error: 'Signal not found' }, 404);

  const quote = signal.quote.toLowerCase();
  const hasNumbers = /\d+/.test(quote);
  const hasCurrency = /[£$€]/.test(quote);
  const hasPercent = /%/.test(quote);
  const hasTime = /hours?|weeks?|months?|days?/.test(quote);
  const hasEmotion = /love|amazing|burnout|incredible|struggled|saved|reduced|jumped/i.test(quote);

  const linkedinScore = Math.min(100, Math.round(
    40 + (hasNumbers ? 20 : 0) + (hasCurrency ? 15 : 0) + (hasEmotion ? 15 : 0) + (hasPercent ? 10 : 0)
  ));
  const twitterScore = Math.min(100, Math.round(
    30 + (hasNumbers ? 15 : 0) + (hasCurrency ? 10 : 0) + (hasEmotion ? 20 : 0) + (hasTime ? 15 : 0)
  ));
  const blogsScore = Math.min(100, Math.round(
    35 + (hasNumbers ? 25 : 0) + (hasCurrency ? 15 : 0) + (hasPercent ? 15 : 0) + (hasTime ? 10 : 0)
  ));

  const amplificationScore = Math.round((linkedinScore + twitterScore + blogsScore) / 3);

  const platformScores = { linkedin: linkedinScore, twitter: twitterScore, industryBlogs: blogsScore };

  const matchedKeywords: string[] = [];
  if (hasCurrency) matchedKeywords.push('ROI');
  if (hasNumbers) matchedKeywords.push('quantifiable results');
  if (hasPercent) matchedKeywords.push('growth metrics');
  if (hasTime) matchedKeywords.push('time savings');
  if (hasEmotion) matchedKeywords.push('customer impact');
  if (/save|saving|saved|reduce|reduced|reduction/i.test(quote)) matchedKeywords.push('cost reduction');
  if (/convert|conversion|increase|jump|up\s*\d+/i.test(quote)) matchedKeywords.push('conversion optimization');

  const recommendations: { type: string; platform: string; score: number; headline: string }[] = [];
  if (linkedinScore >= 70) {
    recommendations.push({
      type: 'linkedin', platform: 'LinkedIn', score: linkedinScore,
      headline: `${hasCurrency ? 'ROI' : 'Customer'} Proof That Gets Engagement on LinkedIn`
    });
  }
  if (blogsScore >= 70) {
    recommendations.push({
      type: 'thought_leadership', platform: 'LinkedIn Article', score: blogsScore,
      headline: 'The Data Behind Our Growth — A Proof-Led Case Study'
    });
  }
  if (twitterScore >= 60) {
    recommendations.push({
      type: 'social', platform: 'Twitter/X', score: twitterScore,
      headline: `${hasNumbers ? '£' : ''}Real numbers, real impact — a quick thread`
    });
  }
  recommendations.push({
    type: 'email', platform: 'Email Campaign', score: Math.round((linkedinScore + blogsScore) / 2),
    headline: `Subject: How we ${hasCurrency ? 'saved £X,XXX' : 'delivered results'} — real customer data`
  });

  const matchedSocial: { platform: string; content: string; engagement: string }[] = [];
  if (linkedinScore > 70) {
    matchedSocial.push({
      platform: 'LinkedIn',
      content: `Founder post on similar ${signal.category.toLowerCase()} proof gaining traction in B2B SaaS circles`,
      engagement: `${Math.round(1200 + amplificationScore * 30)}+ impressions`
    });
  }
  if (blogsScore > 70) {
    matchedSocial.push({
      platform: 'Industry Blogs',
      content: `Case study featuring ${signal.signalType.toLowerCase()} metrics trending in ${signal.category === 'Financial Impact' ? 'finance' : 'operations'} publications`,
      engagement: 'Featured in 3+ industry newsletters'
    });
  }

  return c.json({
    signalId: signal.id,
    quote: signal.quote,
    category: signal.category,
    signalType: signal.signalType,
    amplificationScore,
    platformScores,
    contentRecommendations: recommendations,
    matchedKeywords,
    matchedSocialProof: matchedSocial,
    validation: amplificationScore >= 60 ? 'validated' : 'needs_improvement',
    amplifiedContent: hasCurrency
      ? `💰 ${signal.quote}\n\nThis isn't a hypothetical. This is real data from a real customer.\n\nProof-led GTM means leading with evidence, not adjectives.\n\n#SaaS #GTM #CustomerProof`
      : `📊 ${signal.quote}\n\nCustomer proof like this is hiding in your inbox, support tickets, and sales calls.\n\nDiscover yours. →`
  });
});

app.get('/api/crm', (c) => c.json(getStore().crmEntries));

app.post('/api/crm/sync', async (c) => {
  const body = await c.req.json();
  const result = await syncToZero(body);
  return c.json(result);
});

app.get('/api/growth', (c) => c.json(getStore().recommendations));

app.post('/api/growth/analyze', async (c) => {
  const store = getStore();
  const recommendations = await getGrowthRecommendations(store.signals);
  return c.json({
    recommendations,
    poweredBy: process.env.SCAILE_API_KEY ? 'scaile' : 'demo'
  });
});

app.get('/api/analytics', (c) => c.json(DEMO_ANALYTICS));

app.get('/api/settings', (c) => c.json(getStore().settings));

app.patch('/api/settings', async (c) => {
  const body = await c.req.json<{ demoMode?: boolean; aiProvider?: string; integrations?: Record<string, boolean> }>();
  const store = getStore();
  Object.assign(store.settings, body);
  return c.json(store.settings);
});

app.post('/api/demo/reset', (c) => {
  resetStore();
  return c.json({ message: 'Demo data reset' });
});

app.get('/api/demo/sample-datasets', (c) => {
  return c.json([
    { id: 'enterprise-email', name: 'Enterprise Customer Email', type: 'email' },
    { id: 'g2-review', name: 'G2 Review Bundle', type: 'review' },
    { id: 'sales-transcript', name: 'Sales Call Transcript', type: 'transcript' },
    { id: 'nps-survey', name: 'NPS Survey Responses', type: 'survey' },
    { id: 'support-tickets', name: 'Support Ticket Archive', type: 'support' }
  ]);
});

export default app;
