import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
  glow?: boolean;
};

export function Card({ className, hover = false, glow = false, children, ...props }: Props) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card p-6',
        hover && 'card-hover',
        glow && 'shadow-lg shadow-primary/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
