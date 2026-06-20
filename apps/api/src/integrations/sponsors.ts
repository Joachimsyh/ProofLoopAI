import type { ExtractedSignal } from '../data/demo.js';
import type { AudienceMatch, GtmPlaybookContent, ContentAssetResult, GrowthRecommendationResult } from '../data/demo.js';
import { DEMO_AUDIENCES, DEMO_GTM_PLAYBOOKS, DEMO_CONTENT_ASSETS, DEMO_GROWTH_RECOMMENDATIONS } from '../data/demo.js';
export { syncToZero } from './zero.js';

/** Unify — Proof Expansion Engine (integration point) */
export async function expandAudience(proofQuote: string): Promise<AudienceMatch[]> {
  if (process.env.UNIFY_API_KEY && process.env.UNIFY_API_URL) {
    try {
      const res = await fetch(`${process.env.UNIFY_API_URL}/audiences/expand`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.UNIFY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ proof: proofQuote })
      });
      if (res.ok) return (await res.json()) as AudienceMatch[];
    } catch {
      /* fall through to demo */
    }
  }

  if (/recruit|staffing|talent|hours?\s*per\s*week/i.test(proofQuote)) {
    return DEMO_AUDIENCES.slice(0, 3);
  }
  return DEMO_AUDIENCES;
}

/** GTMengineer.dev — Simulated internal API */
export async function generateGtmSystem(proofSignals: ExtractedSignal[]): Promise<typeof DEMO_GTM_PLAYBOOKS> {
  if (process.env.GTMENGINEER_API_KEY && process.env.GTMENGINEER_API_URL) {
    try {
      const res = await fetch(`${process.env.GTMENGINEER_API_URL}/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GTMENGINEER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ signals: proofSignals })
      });
      if (res.ok) return (await res.json()) as typeof DEMO_GTM_PLAYBOOKS;
    } catch {
      /* fall through */
    }
  }

  const topSignal = proofSignals[0];
  return [
    {
      title: `Proof-Led GTM for ${topSignal?.signalType ?? 'Top Signal'}`,
      type: 'outreach',
      content: {
        icp: `Companies most likely to resonate with: "${topSignal?.quote?.slice(0, 80) ?? 'your top proof'}"`,
        outreachSystem: [
          `Lead with ${topSignal?.signalType ?? 'top'} proof in first touch`,
          'Follow up with case study for economic buyer',
          'Share emotional proof for champion persona',
          'Close with conversion-optimized social proof'
        ],
        growthLoops: DEMO_GTM_PLAYBOOKS[0].content.growthLoops,
        conversionFramework: DEMO_GTM_PLAYBOOKS[0].content.conversionFramework,
        playbook: 'GTMengineer.dev powers our GTM System Generator — deploy ranked proof by buyer persona.'
      } as GtmPlaybookContent
    },
    ...DEMO_GTM_PLAYBOOKS.slice(0, 1)
  ];
}

/** Faxxing — Proof Amplification Engine (integration point) */
export async function amplifyProof(signal: ExtractedSignal): Promise<ContentAssetResult[]> {
  if (process.env.FAXXING_API_KEY && process.env.FAXXING_API_URL) {
    try {
      const res = await fetch(`${process.env.FAXXING_API_URL}/amplify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.FAXXING_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ signal })
      });
      if (res.ok) return (await res.json()) as ContentAssetResult[];
    } catch {
      /* fall through */
    }
  }

  return DEMO_CONTENT_ASSETS.map((asset) => ({
    ...asset,
    content: asset.content.replace('£40,000', signal.quote.match(/[£$€][\d,]+/)?.[0] ?? '£40,000')
  }));
}
/** Scaile — Growth Recommendation Engine (integration point) */
export async function getGrowthRecommendations(signals: ExtractedSignal[]): Promise<GrowthRecommendationResult[]> {
  if (process.env.SCAILE_API_KEY && process.env.SCAILE_API_URL) {
    try {
      const res = await fetch(`${process.env.SCAILE_API_URL}/recommendations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SCAILE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ signals })
      });
      if (res.ok) return (await res.json()) as GrowthRecommendationResult[];
    } catch {
      /* fall through */
    }
  }

  return DEMO_GROWTH_RECOMMENDATIONS.map((rec, i) => ({
    ...rec,
    proofSignalIds: signals.slice(i, i + 1).map((_, j) => `signal-${j + 1}`)
  }));
}

/** Lightfern — Proof Validation (integration point) */
export async function validateProof(signal: ExtractedSignal): Promise<ExtractedSignal> {
  if (process.env.LIGHTFERN_API_KEY && process.env.LIGHTFERN_API_URL) {
    try {
      const res = await fetch(`${process.env.LIGHTFERN_API_URL}/score`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.LIGHTFERN_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quote: signal.quote })
      });
      if (res.ok) {
        const data = (await res.json()) as ExtractedSignal;
        return { ...signal, ...data };
      }
    } catch {
      /* fall through */
    }
  }
  return signal;
}
