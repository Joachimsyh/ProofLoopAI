'use client';

import { useEffect, useState } from 'react';
import { api, type TrustSignal } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { getScoreColor } from '@/lib/utils';

const metrics = [
  { key: 'credibility' as const, label: 'Credibility' },
  { key: 'specificity' as const, label: 'Specificity' },
  { key: 'revenueImpact' as const, label: 'Revenue Impact' },
  { key: 'emotionalImpact' as const, label: 'Emotional Impact' },
  { key: 'conversionPotential' as const, label: 'Conversion Potential' }
];

export default function TrustSignalsPage() {
  const [signals, setSignals] = useState<TrustSignal[]>([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<TrustSignal | null>(null);

  useEffect(() => {
    api.getTrustSignals().then(setSignals);
  }, []);

  const categories = ['all', ...new Set(signals.map((s) => s.category))];
  const filtered = filter === 'all' ? signals : signals.filter((s) => s.category === filter);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Trust Signals</h1>
        <p className="text-muted-foreground mt-2">Validated proof signals ranked by Lightfern Proof Scores.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${filter === cat ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'bg-secondary text-muted-foreground hover:bg-accent'}`}>
            {cat === 'all' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {filtered.map((signal) => (
            <Card key={signal.id} hover className={`cursor-pointer ${selected?.id === signal.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelected(signal)}>
              <div className="flex gap-4">
                <ScoreRing score={signal.proofScore} size="sm" label="" />
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge className="bg-primary/20 text-primary border-primary/30">{signal.signalType}</Badge>
                    <Badge className="bg-secondary text-secondary-foreground">{signal.category}</Badge>
                    <span className={`text-xs ml-auto ${getScoreColor(signal.strength)}`}>Strength: {signal.strength}</span>
                  </div>
                  <p className="text-sm leading-relaxed">&ldquo;{signal.quote}&rdquo;</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {signal.recommendedUses.map((use) => (
                      <Badge key={use} className="bg-accent text-accent-foreground text-[10px]">{use}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {selected && (
          <div className="lg:sticky lg:top-24 h-fit">
            <Card glow className="space-y-4">
              <h3 className="font-semibold">Signal Analysis</h3>
              <ScoreRing score={selected.proofScore} size="lg" />
              <p className="text-sm italic">&ldquo;{selected.quote}&rdquo;</p>
              <div className="space-y-3">
                {metrics.map((m) => (
                  <div key={m.key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span>{Math.round(selected[m.key] * 100)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-700" style={{ width: `${selected[m.key] * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
