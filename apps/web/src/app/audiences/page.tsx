'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Audience {
  id: string;
  name: string;
  description: string;
  icpMatch: number;
  industry: string;
  companySize: string;
  resonanceScore: number;
}

const proofQuote = 'Our recruiters now save 12 hours per week on manual screening.';

export default function AudiencesPage() {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [expanding, setExpanding] = useState(false);
  const [poweredBy, setPoweredBy] = useState('demo');

  useEffect(() => {
    api.getAudiences().then((d) => setAudiences(d as Audience[]));
  }, []);

  async function expand() {
    setExpanding(true);
    try {
      const res = await api.expandAudience(proofQuote);
      setAudiences(res.audiences as Audience[]);
      setPoweredBy(res.poweredBy);
    } finally {
      setExpanding(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Audience Expansion</h1>
          <p className="text-muted-foreground mt-2">Find lookalike ICPs most likely to resonate with your strongest proof.</p>
        </div>
        <Button onClick={expand} disabled={expanding}>{expanding ? 'Expanding...' : 'Expand Audiences'}</Button>
      </div>
      <Card className="border-primary/30 bg-primary/5">
        <p className="text-xs text-primary font-medium mb-2">Source Proof Signal</p>
        <p className="text-sm italic">&ldquo;{proofQuote}&rdquo;</p>
        <Badge className="mt-3 bg-secondary text-muted-foreground">Powered by: {poweredBy === 'unify' ? 'Unify' : 'Demo Mode'}</Badge>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {audiences.map((audience) => (
          <Card key={audience.id} hover className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold">{audience.name}</h3>
              <span className="text-lg font-bold text-primary">{audience.resonanceScore}%</span>
            </div>
            <p className="text-sm text-muted-foreground">{audience.description}</p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-secondary text-secondary-foreground">{audience.industry}</Badge>
              <Badge className="bg-accent text-accent-foreground">{audience.companySize}</Badge>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">ICP Match</span>
                <span>{audience.icpMatch}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 transition-all duration-700" style={{ width: `${audience.icpMatch}%` }} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
