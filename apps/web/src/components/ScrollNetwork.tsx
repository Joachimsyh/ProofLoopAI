'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Dot {
  id: number;
  x: number;
  y: number;
  baseY: number;
  radius: number;
  opacity: number;
  pulse: number;
}

export function ScrollNetwork({ dotCount = 18 }: { dotCount?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dots, setDots] = useState<Dot[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [connections, setConnections] = useState<[number, number][]>([]);

  const initDots = useCallback(() => {
    return Array.from({ length: dotCount }, (_, i) => ({
      id: i,
      x: 8 + Math.random() * 84,
      baseY: (i / dotCount) * 100,
      y: (i / dotCount) * 100,
      radius: 3 + Math.random() * 3,
      opacity: 0.3 + Math.random() * 0.5,
      pulse: 0.7
    }));
  }, [dotCount]);

  useEffect(() => {
    setDots(initDots());

    const onScroll = () => {
      const el = containerRef.current?.parentElement;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress = total > 0 ? Math.max(0, Math.min(1, -rect.top / total)) : 0;
      setScrollProgress(progress);

      setDots((prev) =>
        prev.map((d) => ({
          ...d,
          y: d.baseY + Math.sin(progress * Math.PI * 2 + d.id) * 3,
          opacity: 0.2 + progress * 0.6 + d.pulse * 0.2
        }))
      );

      const conns: [number, number][] = [];
      for (let i = 0; i < dotCount - 1; i++) {
        const threshold = i / dotCount;
        if (progress >= threshold - 0.05) conns.push([i, i + 1]);
        if (i < dotCount - 2 && progress >= threshold + 0.1) conns.push([i, i + 2]);
      }
      setConnections(conns);
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove);
    onScroll();

    const interval = setInterval(() => {
      setDots((prev) =>
        prev.map((d) => ({
          ...d,
          pulse: Math.sin(Date.now() / 1000 + d.id) * 0.3 + 0.7
        }))
      );
    }, 50);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
      clearInterval(interval);
    };
  }, [dotCount, initDots]);

  const distToMouse = (dot: Dot) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return 999;
    const dx = mouse.x - (dot.x / 100) * rect.width;
    const dy = mouse.y - dot.y * (rect.height / 100);
    return Math.sqrt(dx * dx + dy * dy);
  };

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <svg className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {connections.map(([a, b], i) => {
          const dotA = dots[a];
          const dotB = dots[b];
          if (!dotA || !dotB) return null;
          const opacity = Math.max(0, Math.min(1, (scrollProgress - i / dots.length + 0.15) * 4));
          return (
            <line
              key={`${a}-${b}`}
              x1={`${dotA.x}%`}
              y1={`${dotA.y}%`}
              x2={`${dotB.x}%`}
              y2={`${dotB.y}%`}
              stroke="url(#lineGrad)"
              strokeWidth="1.5"
              opacity={opacity}
              className="transition-opacity duration-500"
            />
          );
        })}

        {dots.map((dot) => {
          const isHovered = distToMouse(dot) < 120;
          return (
            <g key={dot.id}>
              <circle
                cx={`${dot.x}%`}
                cy={`${dot.y}%`}
                r={isHovered ? dot.radius * 2 : dot.radius * dot.pulse}
                fill={isHovered ? '#a78bfa' : '#818cf8'}
                opacity={isHovered ? 1 : dot.opacity}
                className="transition-all duration-300"
              />
              {isHovered && (
                <circle
                  cx={`${dot.x}%`}
                  cy={`${dot.y}%`}
                  r={dot.radius * 4}
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="0.5"
                  opacity="0.4"
                  className="animate-pulse"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
