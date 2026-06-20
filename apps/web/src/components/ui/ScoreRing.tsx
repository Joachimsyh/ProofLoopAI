import { cn, getScoreColor } from '@/lib/utils';

export function ScoreRing({ score, label = 'Proof Score', size = 'md' }: { score: number; label?: string; size?: 'sm' | 'md' | 'lg' }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const sizes = {
    sm: 'w-20 h-20 text-lg',
    md: 'w-28 h-28 text-2xl',
    lg: 'w-36 h-36 text-3xl'
  };

  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className={cn('relative', sizes[size])}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', getScoreColor(score))}>{score}</span>
        </div>
      </div>
      {label && <span className="text-xs text-muted-foreground font-medium">{label}</span>}
    </div>
  );
}
