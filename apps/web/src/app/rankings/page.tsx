'use client';

import { useEffect, useState } from 'react';
import { api, type TrustSignal } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getScoreColor } from '@/lib/utils';

const medals = ['🥇', '🥈', '🥉'];

export default function RankingsPage() {
  const [rankings, setRankings] = useState<(TrustSignal & { rank: number })[]>([]);

  useEffect(() => {
    api.getRankings().then(setRankings);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Proof Rankings</h1>
        <p className="text-muted-foreground mt-2">Trust signals ranked by Proof Score — your strongest proof first.</p>
      </div>
      <div className="space-y-3">
        {rankings.map((item, i) => (
          <Card key={item.id} hover className="flex items-center gap-4 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold shrink-0">
              {i < 3 ? medals[i] : <span className="text-primary">#{item.rank}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge className="bg-primary/20 text-primary border-primary/30">{item.signalType}</Badge>
                <span className="text-xs text-muted-foreground">{item.category}</span>
              </div>
              <p className="text-sm truncate">&ldquo;{item.quote}&rdquo;</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-2xl font-bold ${getScoreColor(item.proofScore)}`}>{item.proofScore}</p>
              <p className="text-[10px] text-muted-foreground">Proof Score</p>
            </div>
            <div className="hidden lg:block w-32">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-1000" style={{ width: `${item.proofScore}%` }} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
