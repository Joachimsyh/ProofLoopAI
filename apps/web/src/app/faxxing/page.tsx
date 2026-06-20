'use client';

import { useEffect, useState } from 'react';
import { api, type TrustSignal, type FaxxingAmplifyResult } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/ui/ScoreRing';

export default function FaxxingPage() {
  const [signals, setSignals] = useState<TrustSignal[]>([]);
  const [selectedSignal, setSelectedSignal] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FaxxingAmplifyResult | null>(null);

  useEffect(() => {
    api.getTrustSignals().then((s) => {
      setSignals(s);
      if (s.length) setSelectedSignal(s[0].id);
    });
  }, []);

  async function amplify() {
    if (!selectedSignal) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.amplifyProof(selectedSignal);
      setResult(res);
    } finally {
      setLoading(false);
    }
  }

  const platformColor = (p: string) =>
    p === 'linkedin' ? 'bg-blue-500/20 text-blue-400' :
    p === 'twitter' ? 'bg-sky-500/20 text-sky-400' :
    'bg-purple-500/20 text-purple-400';

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold gradient-text">Faxxing Amplifier</h1>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Hackathon</Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            Validate proof against social media signals. The Faxxing engine checks LinkedIn, Twitter/X, and industry
            blogs to predict how your proof will perform when amplified.
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedSignal}
            onChange={(e) => setSelectedSignal(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {signals.map((s) => (
              <option key={s.id} value={s.id}>
                {s.signalType} — {s.proofScore}/100
              </option>
            ))}
          </select>
          <Button onClick={amplify} disabled={loading}>
            {loading ? 'Scanning Social Media...' : 'Amplify Proof'}
          </Button>
        </div>
      </div>

      {!result && !loading && (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4 opacity-30">📠</div>
          <p className="text-muted-foreground text-lg">
            Select a trust signal and click <strong>Amplify Proof</strong> to validate it against social media channels.
          </p>
        </Card>
      )}

      {loading && (
        <Card className="p-12 text-center">
          <div className="animate-spin text-4xl mb-4 inline-block">📠</div>
          <p className="text-muted-foreground">Faxxing engine is analyzing social media alignment...</p>
        </Card>
      )}

      {result && (
        <>
          <div className="grid gap-4 lg:grid-cols-4">
            <Card className="lg:col-span-4 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Badge className="bg-primary/20 text-primary">{result.category}</Badge>
                  <Badge className="bg-secondary text-secondary-foreground ml-2">{result.signalType}</Badge>
                  <Badge className={result.validation === 'validated' ? 'bg-green-500/20 text-green-400 ml-2' : 'bg-yellow-500/20 text-yellow-400 ml-2'}>
                    {result.validation === 'validated' ? '✓ Validated' : '⚠ Needs Improvement'}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold gradient-text">{result.amplificationScore}</div>
                  <div className="text-xs text-muted-foreground">Amplification Score</div>
                </div>
              </div>
              <blockquote className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground">
                &ldquo;{result.quote}&rdquo;
              </blockquote>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {(['linkedin', 'twitter', 'industryBlogs'] as const).map((platform) => {
              const score = result.platformScores[platform];
              const label = platform === 'linkedin' ? 'LinkedIn' : platform === 'twitter' ? 'Twitter / X' : 'Industry Blogs';
              return (
                <Card key={platform} className="space-y-4 text-center">
                  <p className="font-semibold text-sm">{label}</p>
                  <ScoreRing score={score} size="sm" />
                  <div className="flex flex-wrap justify-center gap-1">
                    {result.matchedKeywords.slice(0, 3).map((kw) => (
                      <Badge key={kw} className="bg-secondary text-secondary-foreground text-[10px]">{kw}</Badge>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="space-y-4">
            <h2 className="text-lg font-semibold">Content Recommendations</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {result.contentRecommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-4">
                  <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${platformColor(rec.type)}`}>
                    {rec.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{rec.headline}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Best for <strong>{rec.platform}</strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {result.matchedSocialProof.length > 0 && (
            <Card className="space-y-4">
              <h2 className="text-lg font-semibold">Matched Social Proof</h2>
              <div className="space-y-3">
                {result.matchedSocialProof.map((match, i) => (
                  <div key={i} className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={platformColor(match.platform.toLowerCase().includes('linkedin') ? 'linkedin' : 'industryBlogs')}>
                        {match.platform}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{match.content}</p>
                    <p className="text-xs text-primary mt-1">{match.engagement}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="space-y-4">
            <h2 className="text-lg font-semibold">Amplified Content Preview</h2>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <pre className="text-sm whitespace-pre-wrap font-sans">{result.amplifiedContent}</pre>
            </div>
            <p className="text-xs text-muted-foreground">
              This is how your proof would perform when amplified on social media. Faxxing validated it against
              trending topics and content patterns.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
