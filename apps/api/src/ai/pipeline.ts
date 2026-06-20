import type { ExtractedSignal } from '../data/demo.js';

const FINANCIAL_PATTERNS = [
  /saved?\s*[£$€]?\s*[\d,]+/i,
  /[\d,]+\s*(hours?|hrs?)\s*(per|\/)\s*week/i,
  /(\d+)%\s*(increase|improvement|lift|jump|reduction|faster)/i,
  /[\£$€][\d,]+(?:\.\d+)?\s*(million|m|k|thousand)?/i
];

const EMOTIONAL_PATTERNS = [
  /love|amazing|incredible|game.?changer|burnout|struggled|seamless|finally/i
];

function scoreSpecificity(text: string): number {
  const hasNumber = /\d/.test(text);
  const hasCurrency = /[£$€]/.test(text);
  const hasPercent = /%/.test(text);
  const wordCount = text.split(/\s+/).length;
  let score = 0.5;
  if (hasNumber) score += 0.15;
  if (hasCurrency) score += 0.15;
  if (hasPercent) score += 0.1;
  if (wordCount > 15) score += 0.1;
  return Math.min(score, 1);
}

function detectCategory(text: string): { category: string; signalType: string } {
  if (/saved?\s*[£$€]|cost|revenue|roi|£[\d,]+|\$[\d,]+/i.test(text)) {
    return { category: 'Financial Impact', signalType: 'Revenue Savings' };
  }
  if (/hours?\s*(per|\/)\s*week|time\s*sav/i.test(text)) {
    return { category: 'Efficiency', signalType: 'Time Savings' };
  }
  if (/conversion|growth|adoption|deals?|sales\s*cycle/i.test(text)) {
    return { category: 'Growth', signalType: 'Growth Improvement' };
  }
  if (/burnout|emotional|love|satisfaction|trust/i.test(text)) {
    return { category: 'Emotional Impact', signalType: 'Customer Satisfaction' };
  }
  if (/risk|competitor|switch|before/i.test(text)) {
    return { category: 'Sales Enablement', signalType: 'Risk Reduction' };
  }
  return { category: 'Product Value', signalType: 'Differentiator' };
}

function extractQuotes(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30);

  const quoted = text.match(/"([^"]{20,})"/g)?.map((q) => q.replace(/"/g, '')) ?? [];
  const candidates = [...new Set([...quoted, ...sentences])];
  return candidates.filter((s) => FINANCIAL_PATTERNS.some((p) => p.test(s)) || EMOTIONAL_PATTERNS.some((p) => p.test(s))).slice(0, 8);
}

function computeProofScore(specificity: number, credibility: number, revenue: number, emotional: number, conversion: number): number {
  return Math.round((specificity * 0.25 + credibility * 0.2 + revenue * 0.25 + emotional * 0.15 + conversion * 0.15) * 100);
}

function recommendedUses(category: string, signalType: string): string[] {
  const uses = ['Case Study'];
  if (category === 'Financial Impact') uses.unshift('Landing Page Hero', 'Sales Deck');
  if (signalType === 'Time Savings') uses.push('LinkedIn Post', 'Email Campaign');
  if (category === 'Emotional Impact') uses.push('Founder Content', 'Brand Story');
  if (category === 'Growth') uses.push('GTM Playbook');
  return [...new Set(uses)];
}

/** LangGraph-style multi-step proof discovery pipeline (demo implementation) */
export async function runProofDiscoveryPipeline(content: string): Promise<ExtractedSignal[]> {
  const quotes = extractQuotes(content);
  if (quotes.length === 0) {
    const trimmed = content.trim().slice(0, 200);
    if (trimmed.length > 20) quotes.push(trimmed);
  }

  return quotes.map((quote) => {
    const { category, signalType } = detectCategory(quote);
    const specificity = scoreSpecificity(quote);
    const credibility = Math.min(0.7 + specificity * 0.3, 0.98);
    const revenueImpact = category === 'Financial Impact' ? 0.85 + specificity * 0.1 : 0.5 + specificity * 0.3;
    const emotionalImpact = EMOTIONAL_PATTERNS.some((p) => p.test(quote)) ? 0.8 + specificity * 0.15 : 0.4 + specificity * 0.2;
    const conversionPotential = (specificity + revenueImpact + emotionalImpact) / 3;
    const proofScore = computeProofScore(specificity, credibility, revenueImpact, emotionalImpact, conversionPotential);

    return {
      quote,
      category,
      signalType,
      strength: proofScore,
      proofScore,
      credibility,
      specificity,
      revenueImpact,
      emotionalImpact,
      conversionPotential,
      recommendedUses: recommendedUses(category, signalType)
    };
  });
}

/** DSPy-style proof scoring refinement (Lightfern integration point) */
export async function scoreProofSignal(signal: ExtractedSignal): Promise<ExtractedSignal> {
  if (process.env.LIGHTFERN_API_KEY && process.env.LIGHTFERN_API_URL) {
    // Integration point — call Lightfern API when key provided
  }
  return signal;
}

/** Voyage AI embedding integration point */
export async function embedText(text: string): Promise<number[] | null> {
  if (!process.env.VOYAGE_API_KEY) return null;
  try {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input: text, model: 'voyage-3' })
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { data: { embedding: number[] }[] };
    return data.data[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

export async function parseFileContent(buffer: Buffer, fileName: string): Promise<string> {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') {
    const pdfParse = (await import('pdf-parse')).default;
    const parsed = await pdfParse(buffer);
    return parsed.text;
  }
  if (ext === 'csv' || ext === 'txt') {
    return buffer.toString('utf-8');
  }
  return buffer.toString('utf-8');
}
