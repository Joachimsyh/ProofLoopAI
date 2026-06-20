'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface CrmEntry {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  status: string;
  conversionOutcome?: string;
}

const statusColors: Record<string, string> = {
  deployed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  published: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  active: 'bg-primary/20 text-primary border-primary/30',
  draft: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
};

export default function CrmPage() {
  const [entries, setEntries] = useState<CrmEntry[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.getCrm().then((d) => setEntries(d as CrmEntry[]));
  }, []);

  const types = ['all', ...new Set(entries.map((e) => e.entityType))];
  const filtered = filter === 'all' ? entries : entries.filter((e) => e.entityType === filter);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Proof CRM</h1>
        <p className="text-muted-foreground mt-2">Store proof assets, trust signals, GTM assets, campaigns, and conversion outcomes.</p>
      </div>
      <Card className="border-cyan-500/30 bg-cyan-500/5">
        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 mb-2">Zero Integration Ready</Badge>
        <p className="text-sm text-muted-foreground">Add <code className="text-primary">ZERO_API_KEY</code> and <code className="text-primary">ZERO_API_URL</code> to .env to sync.</p>
      </Card>
      <div className="flex flex-wrap gap-2">
        {types.map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${filter === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'}`}>
            {t === 'all' ? 'All' : t.replace('_', ' ')}
          </button>
        ))}
      </div>
      <div className="grid gap-3">
        {filtered.map((entry) => (
          <Card key={entry.id} hover className="flex flex-wrap items-center gap-4 py-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{entry.title}</p>
              <p className="text-xs text-muted-foreground">{entry.entityType.replace('_', ' ')} · {entry.entityId}</p>
            </div>
            <Badge className={statusColors[entry.status] ?? 'bg-secondary text-secondary-foreground'}>{entry.status}</Badge>
            {entry.conversionOutcome && <Badge className="bg-emerald-500/20 text-emerald-400">{entry.conversionOutcome}</Badge>}
          </Card>
        ))}
      </div>
    </div>
  );
}
