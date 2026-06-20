'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ChartData {
  label: string;
  value: number;
  extra?: number;
}

export function AnalyticsChart({ type, data }: { type: 'bar' | 'line' | 'radial'; data: ChartData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data.length) return;
    const container = containerRef.current;
    container.innerHTML = '';

    const width = container.clientWidth || 400;
    const height = 220;
    const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);

    if (type === 'bar') {
      const margin = { top: 10, right: 10, bottom: 40, left: 10 };
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;
      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
      const x = d3.scaleBand().domain(data.map((d) => d.label)).range([0, innerW]).padding(0.3);
      const y = d3.scaleLinear().domain([0, d3.max(data, (d) => d.value) ?? 0]).nice().range([innerH, 0]);

      const defs = svg.append('defs');
      const grad = defs.append('linearGradient').attr('id', 'barGrad').attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
      grad.append('stop').attr('offset', '0%').attr('stop-color', '#a78bfa');
      grad.append('stop').attr('offset', '100%').attr('stop-color', '#6366f1');

      g.selectAll('rect')
        .data(data)
        .join('rect')
        .attr('x', (d) => x(d.label) ?? 0)
        .attr('y', innerH)
        .attr('width', x.bandwidth())
        .attr('height', 0)
        .attr('fill', 'url(#barGrad)')
        .attr('rx', 4)
        .transition()
        .duration(800)
        .attr('y', (d) => y(d.value))
        .attr('height', (d) => innerH - y(d.value));
    }

    if (type === 'line') {
      const margin = { top: 20, right: 20, bottom: 30, left: 30 };
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;
      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
      const x = d3.scalePoint().domain(data.map((d) => d.label)).range([0, innerW]);
      const y = d3.scaleLinear().domain([0, d3.max(data, (d) => d.value) ?? 0]).nice().range([innerH, 0]);
      const line = d3.line<ChartData>().x((d) => x(d.label) ?? 0).y((d) => y(d.value)).curve(d3.curveMonotoneX);
      const path = g.append('path').datum(data).attr('fill', 'none').attr('stroke', '#a78bfa').attr('stroke-width', 2.5).attr('d', line);
      const totalLength = (path.node() as SVGPathElement)?.getTotalLength() ?? 0;
      path.attr('stroke-dasharray', `${totalLength} ${totalLength}`).attr('stroke-dashoffset', totalLength).transition().duration(1200).attr('stroke-dashoffset', 0);
      g.selectAll('circle').data(data).join('circle').attr('cx', (d) => x(d.label) ?? 0).attr('cy', (d) => y(d.value)).attr('r', 0).attr('fill', '#38bdf8').transition().delay(800).duration(400).attr('r', 5);
    }

    if (type === 'radial') {
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) / 2 - 20;
      const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);
      const angle = d3.scaleBand().domain(data.map((d) => d.label)).range([0, 2 * Math.PI]).padding(0.05);
      const r = d3.scaleLinear().domain([0, 100]).range([0, radius]);
      g.selectAll('path').data(data).join('path').attr('fill', '#a78bfa').attr('opacity', 0.7).attr('d', (d) => {
        const start = angle(d.label) ?? 0;
        const end = start + angle.bandwidth();
        const arc = d3.arc().innerRadius(20).outerRadius(r(d.value)).startAngle(start).endAngle(end);
        return arc({} as d3.DefaultArcObject) ?? '';
      });
    }
  }, [type, data]);

  return <div ref={containerRef} className="w-full" />;
}
