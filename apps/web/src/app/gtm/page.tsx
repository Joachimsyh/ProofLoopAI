'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Playbook {
  id?: string;
  title: string;
  type: string;
  content: {
    icp: string;
    outreachSystem: string[];
    growthLoops: string[];
    conversionFramework: string[];
    playbook: string;
  };
}

export default function GtmPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.getGtmPlaybooks().then((d) => setPlaybooks(d as Playbook[]));
  }, []);

  async function generate() {
    setGenerating(true);
    try {
      const res = await api.generateGtm();
      setPlaybooks(res.playbooks as Playbook[]);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">GTM Playbooks</h1>
          <p className="text-muted-foreground mt-2">GTMengineer.dev powers our GTM System Generator — ICPs, outreach, and growth loops.</p>
        </div>
        <Button onClick={generate} disabled={generating}>{generating ? 'Generating...' : 'Generate GTM System'}</Button>
      </div>
      <Card className="border-violet-500/30 bg-violet-500/5">
        <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 mb-2">GTMengineer.dev</Badge>
        <p className="text-sm text-muted-foreground">Simulated internal API at <code className="text-primary">/api/gtmengineer/generate</code></p>
      </Card>
      {playbooks.map((playbook, idx) => (
        <Card key={playbook.id ?? idx} hover className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{playbook.title}</h2>
            <Badge className="bg-primary/20 text-primary">{playbook.type}</Badge>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary mb-2">Ideal Customer Profile</h3>
            <p className="text-sm text-muted-foreground">{playbook.content.icp}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold mb-3">Outreach System</h3>
              <ul className="space-y-2">{playbook.content.outreachSystem.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm"><span className="text-primary font-mono text-xs">{i + 1}.</span>{item}</li>
              ))}</ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Growth Loops</h3>
              <ul className="space-y-2">{playbook.content.growthLoops.map((item) => (
                <li key={item} className="text-sm text-muted-foreground flex gap-2"><span className="text-emerald-400">↻</span>{item}</li>
              ))}</ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Conversion Framework</h3>
              <ul className="space-y-2">{playbook.content.conversionFramework.map((item) => (
                <li key={item} className="text-sm text-muted-foreground flex gap-2"><span className="text-blue-400">→</span>{item}</li>
              ))}</ul>
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-4"><p className="text-sm">{playbook.content.playbook}</p></div>
        </Card>
      ))}
    </div>
  );
}
