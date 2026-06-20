'use client';

import { useEffect, useState } from 'react';
import { api, type TrustSignal, type ProofSource } from '@/lib/api';
import { SAMPLE_TEXTS } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/ui/ScoreRing';

export default function DiscoveryPage() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TrustSignal[]>([]);
  const [sources, setSources] = useState<ProofSource[]>([]);
  const [samples, setSamples] = useState<{ id: string; name: string; type: string }[]>([]);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    api.getSources().then(setSources).catch(() => {});
    api.getSampleDatasets().then(setSamples).catch(() => {});
  }, []);

  async function handleSubmit(text?: string, sampleTitle?: string) {
    const body = text ?? content;
    if (!body.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.submitText(body, sampleTitle ?? (title || 'Pasted Content'));
      setResults(res.signals);
      setSources(await api.getSources());
      if (!text) { setContent(''); setTitle(''); }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(file: File) {
    setLoading(true);
    setError('');
    try {
      const res = await api.uploadFile(file);
      setResults(res.signals);
      setSources(await api.getSources());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Proof Discovery</h1>
        <p className="text-muted-foreground mt-2">Upload PDFs, CSVs, TXT files or paste customer proof to extract trust signals.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-semibold text-lg">Upload Files</h2>
          <div
            className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 ${dragOver ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-border hover:border-primary/50'}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
          >
            <p className="text-sm text-muted-foreground mb-4">Drag & drop PDF, CSV, or TXT files</p>
            <label className="cursor-pointer">
              <input type="file" accept=".pdf,.csv,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
              <span className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Choose File</span>
            </label>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold text-lg">Paste Content</h2>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste testimonials, emails, sales transcripts..." rows={6} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <Button onClick={() => handleSubmit()} disabled={loading || !content.trim()}>{loading ? 'Discovering...' : 'Discover Proof'}</Button>
        </Card>
      </div>

      {error && <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400">{error}</div>}

      <section>
        <h2 className="font-semibold text-lg mb-4">Sample Datasets</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {samples.map((sample) => (
            <Card key={sample.id} hover className="cursor-pointer" onClick={() => { const s = SAMPLE_TEXTS[sample.id]; if (s) handleSubmit(s.content, s.title); }}>
              <Badge className="bg-secondary text-secondary-foreground mb-2">{sample.type}</Badge>
              <p className="font-medium text-sm">{sample.name}</p>
              <p className="text-xs text-muted-foreground mt-1">Click to load & analyze</p>
            </Card>
          ))}
        </div>
      </section>

      {results.length > 0 && (
        <section>
          <h2 className="font-semibold text-lg mb-4">Discovered Signals ({results.length})</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {results.map((signal) => (
              <Card key={signal.id} hover className="flex gap-4">
                <ScoreRing score={signal.proofScore} size="sm" label="" />
                <div>
                  <div className="flex gap-2 mb-2">
                    <Badge className="bg-primary/20 text-primary border-primary/30">{signal.signalType}</Badge>
                    <Badge className="bg-secondary text-secondary-foreground">{signal.category}</Badge>
                  </div>
                  <p className="text-sm">&ldquo;{signal.quote}&rdquo;</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {sources.length > 0 && (
        <section>
          <h2 className="font-semibold text-lg mb-4">Recent Sources</h2>
          <div className="space-y-2">
            {sources.slice(0, 8).map((source) => (
              <Card key={source.id} className="flex items-center justify-between py-3 px-4">
                <div>
                  <p className="font-medium text-sm">{source.title}</p>
                  <p className="text-xs text-muted-foreground">{source.type} · {source.status}</p>
                </div>
                <Badge className={source.status === 'processed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}>{source.status}</Badge>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
