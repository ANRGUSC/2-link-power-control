import { useRef, useEffect, useCallback } from 'react';
import type { Theme } from '../hooks/useTheme';
import type { DerivedParams, FeasibilityResult, PowerPoint, IterationState } from '../types';

interface Props {
  theme: Theme;
  derived: DerivedParams;
  feasibility: FeasibilityResult;
  userPoint: PowerPoint;
  setUserPoint: (p: PowerPoint) => void;
  iteration: IterationState;
  powerCapEnabled: boolean;
  powerCap: number;
}

const THEME_COLORS = {
  dark: {
    bg: '#1e293b',
    grid: '#334155',
    axis: '#64748b',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    line1: '#fb923c', // orange — L1
    line2: '#60a5fa', // blue — L2
    feasibleFill: 'rgba(34, 211, 238, 0.12)',
    feasibleStroke: 'rgba(34, 211, 238, 0.3)',
    intersectionFill: '#22d3ee',
    userPointFill: '#fbbf24',
    userPointFeasible: '#4ade80',
    userPointInfeasible: '#f87171',
    trajectoryLine: '#4ade80',
    trajectoryDot: '#22c55e',
    powerCapLine: '#a78bfa',
  },
  light: {
    bg: '#ffffff',
    grid: '#e2e8f0',
    axis: '#94a3b8',
    text: '#0f172a',
    textMuted: '#475569',
    line1: '#ea580c',
    line2: '#2563eb',
    feasibleFill: 'rgba(8, 145, 178, 0.1)',
    feasibleStroke: 'rgba(8, 145, 178, 0.3)',
    intersectionFill: '#0891b2',
    userPointFill: '#d97706',
    userPointFeasible: '#16a34a',
    userPointInfeasible: '#dc2626',
    trajectoryLine: '#16a34a',
    trajectoryDot: '#15803d',
    powerCapLine: '#7c3aed',
  },
};

export function FeasibilityPlane({
  theme, derived, feasibility, userPoint, setUserPoint, iteration,
  powerCapEnabled, powerCap,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  // Fixed axis range — stays constant so axes don't jump around
  const FIXED_MAX_P = 5;

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const colors = THEME_COLORS[theme];
    const width = container.clientWidth;
    const height = container.clientHeight;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    const maxP = FIXED_MAX_P;

    const toX = (p1: number) => margin.left + (p1 / maxP) * plotW;
    const toY = (p2: number) => margin.top + plotH - (p2 / maxP) * plotH;
    const fromX = (x: number) => ((x - margin.left) / plotW) * maxP;
    const fromY = (y: number) => ((margin.top + plotH - y) / plotH) * maxP;

    // Store transform for mouse handler
    (canvas as unknown as Record<string, unknown>)._transform = { toX, toY, fromX, fromY, margin, plotW, plotH };

    // Grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.5;
    const numGridLines = 5;
    for (let i = 0; i <= numGridLines; i++) {
      const val = (maxP * i) / numGridLines;
      const x = toX(val);
      const y = toY(val);
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + plotH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + plotW, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = colors.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotH);
    ctx.lineTo(margin.left + plotW, margin.top + plotH);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = colors.textMuted;
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('P₁', margin.left + plotW / 2, margin.top + plotH + 30);

    ctx.save();
    ctx.translate(16, margin.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'middle';
    ctx.fillText('P₂', 0, 0);
    ctx.restore();

    // Tick labels
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px system-ui, sans-serif';
    for (let i = 0; i <= numGridLines; i++) {
      const val = (maxP * i) / numGridLines;
      // X axis
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(val.toFixed(1), toX(val), margin.top + plotH + 4);
      // Y axis
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(val.toFixed(1), margin.left - 6, toY(val));
    }

    const { a, b, c, d } = derived;

    // Clip to plot area for drawing lines and fills
    ctx.save();
    ctx.beginPath();
    ctx.rect(margin.left, margin.top, plotW, plotH);
    ctx.clip();

    // Feasible region shading
    if (feasibility.feasible) {
      // The feasible region is the intersection of:
      //   P1 >= a*P2 + b  (right of line L1)
      //   P2 >= c*P1 + d  (above line L2)
      // clipped to [0, maxP]²
      // We'll compute the polygon vertices

      const pts: [number, number][] = [];
      const { P1star, P2star } = feasibility;

      // Start at intersection
      pts.push([P1star, P2star]);

      // Follow L1 upward (P1 = a*P2 + b): P2 increases → P1 increases
      // At P2 = maxP: P1 = a*maxP + b
      const p1AtL1Top = a * maxP + b;
      // At P1 = maxP: P2 = (maxP - b) / a (if a > 0)
      const p2AtL1Right = a > 0 ? (maxP - b) / a : Infinity;

      if (p1AtL1Top <= maxP) {
        pts.push([p1AtL1Top, maxP]);
        pts.push([maxP, maxP]);
      } else {
        pts.push([maxP, Math.min(p2AtL1Right, maxP)]);
        if (p2AtL1Right < maxP) {
          pts.push([maxP, maxP]);
        }
      }

      // Follow right/top edge to L2
      // L2 at P1 = maxP: P2 = c*maxP + d
      const p2AtL2Right = c * maxP + d;
      // L2 at P2 = maxP: P1 = (maxP - d) / c (if c > 0)

      if (p2AtL2Right <= maxP) {
        pts.push([maxP, p2AtL2Right]);
      }

      // Draw polygon
      if (pts.length >= 3) {
        ctx.fillStyle = colors.feasibleFill;
        ctx.strokeStyle = colors.feasibleStroke;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(toX(pts[0][0]), toY(pts[0][1]));
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(toX(pts[i][0]), toY(pts[i][1]));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // Power cap rectangle
    if (powerCapEnabled) {
      ctx.strokeStyle = colors.powerCapLine;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(toX(0), toY(powerCap), toX(powerCap) - toX(0), toY(0) - toY(powerCap));
      ctx.setLineDash([]);
      ctx.fillStyle = colors.powerCapLine;
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`Pmax=${powerCap}`, toX(powerCap) + 3, toY(powerCap) - 2);
    }

    // Line L1: P1 = a*P2 + b  (boundary where SINR1 = θ)
    // Endpoints: P2=0 → P1=b; P2=maxP → P1=a*maxP+b
    ctx.strokeStyle = colors.line1;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const l1_p2_start = 0;
    const l1_p1_start = a * l1_p2_start + b;
    const l1_p2_end = maxP;
    const l1_p1_end = a * l1_p2_end + b;
    ctx.moveTo(toX(l1_p1_start), toY(l1_p2_start));
    ctx.lineTo(toX(l1_p1_end), toY(l1_p2_end));
    ctx.stroke();

    // Label L1
    ctx.fillStyle = colors.line1;
    ctx.font = 'bold 11px system-ui, sans-serif';
    const l1LabelP2 = maxP * 0.15;
    const l1LabelP1 = a * l1LabelP2 + b;
    if (l1LabelP1 >= 0 && l1LabelP1 <= maxP) {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('L₁: P₁=aP₂+b', toX(l1LabelP1) + 4, toY(l1LabelP2) - 4);
    }

    // Line L2: P2 = c*P1 + d  (boundary where SINR2 = θ)
    // Endpoints: P1=0 → P2=d; P1=maxP → P2=c*maxP+d
    ctx.strokeStyle = colors.line2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const l2_p1_start = 0;
    const l2_p2_start = c * l2_p1_start + d;
    const l2_p1_end = maxP;
    const l2_p2_end = c * l2_p1_end + d;
    ctx.moveTo(toX(l2_p1_start), toY(l2_p2_start));
    ctx.lineTo(toX(l2_p1_end), toY(l2_p2_end));
    ctx.stroke();

    // Label L2
    ctx.fillStyle = colors.line2;
    ctx.font = 'bold 11px system-ui, sans-serif';
    const l2LabelP1 = maxP * 0.6;
    const l2LabelP2 = c * l2LabelP1 + d;
    if (l2LabelP2 >= 0 && l2LabelP2 <= maxP) {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('L₂: P₂=cP₁+d', toX(l2LabelP1) + 4, toY(l2LabelP2) + 4);
    }

    // Intersection point
    if (feasibility.feasible && isFinite(feasibility.P1star) && isFinite(feasibility.P2star)) {
      const ix = toX(feasibility.P1star);
      const iy = toY(feasibility.P2star);

      ctx.fillStyle = colors.intersectionFill;
      ctx.beginPath();
      ctx.arc(ix, iy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.intersectionFill;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = colors.intersectionFill;
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`P*=(${feasibility.P1star.toFixed(2)}, ${feasibility.P2star.toFixed(2)})`, ix + 8, iy - 4);
    }

    // Iteration trajectory (alternating horizontal/vertical staircase)
    if (iteration.trajectory.length > 1) {
      // Draw connecting lines (light, semi-transparent)
      ctx.strokeStyle = colors.trajectoryLine;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      const first = iteration.trajectory[0];
      ctx.moveTo(toX(Math.min(first.P1, maxP)), toY(Math.min(first.P2, maxP)));
      for (let i = 1; i < iteration.trajectory.length; i++) {
        const pt = iteration.trajectory[i];
        const cx = toX(Math.min(pt.P1, maxP));
        const cy = toY(Math.min(pt.P2, maxP));
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // Dots and labels at each iterate
      // Index 0 = start, odd indices = Tx1 updated (horizontal), even indices = Tx2 updated (vertical)
      for (let i = 0; i < iteration.trajectory.length; i++) {
        const pt = iteration.trajectory[i];
        if (pt.P1 > maxP || pt.P2 > maxP) continue;
        const px = toX(pt.P1);
        const py = toY(pt.P2);
        const isLast = i === iteration.trajectory.length - 1;
        const isStart = i === 0;
        const radius = (isLast || isStart) ? 5 : 3;

        // Color: orange for Tx1-updated (odd), blue for Tx2-updated (even), yellow for start
        const dotColor = isStart
          ? colors.userPointFill
          : (i % 2 === 1) ? colors.line1 : colors.line2;

        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
        if (isLast) {
          ctx.strokeStyle = colors.trajectoryLine;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Label: round number and which Tx updated
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 9px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        if (isStart) {
          ctx.fillText('start', px + radius + 2, py - 2);
        } else {
          const round = Math.ceil(i / 2);
          const who = (i % 2 === 1) ? 'P₁' : 'P₂';
          ctx.fillText(`${round}${who}`, px + radius + 2, py - 2);
        }
      }
    }

    // User point (draggable)
    const ux = toX(userPoint.P1);
    const uy = toY(userPoint.P2);
    const isFeasiblePoint = userPoint.P1 >= a * userPoint.P2 + b - 1e-9 && userPoint.P2 >= c * userPoint.P1 + d - 1e-9;
    const borderColor = isFeasiblePoint ? colors.userPointFeasible : colors.userPointInfeasible;

    ctx.beginPath();
    ctx.arc(ux, uy, 8, 0, Math.PI * 2);
    ctx.fillStyle = colors.userPointFill;
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Label
    ctx.fillStyle = colors.text;
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`(${userPoint.P1.toFixed(2)}, ${userPoint.P2.toFixed(2)})`, ux + 10, uy + 2);

    ctx.restore(); // remove clip
  }, [theme, derived, feasibility, userPoint, iteration, powerCapEnabled, powerCap]);

  // Mouse handlers for dragging
  const getPointFromEvent = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const transform = (canvas as unknown as Record<string, unknown>)._transform as
      { fromX: (x: number) => number; fromY: (y: number) => number; margin: { left: number; top: number }; plotW: number; plotH: number } | undefined;

    if (!transform) return null;

    const P1 = transform.fromX(x);
    const P2 = transform.fromY(y);

    return { P1: Math.max(0.01, P1), P2: Math.max(0.01, P2) };
  }, []);

  const isNearUserPoint = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const transform = (canvas as unknown as Record<string, unknown>)._transform as
      { toX: (v: number) => number; toY: (v: number) => number } | undefined;
    if (!transform) return false;

    const ux = transform.toX(userPoint.P1);
    const uy = transform.toY(userPoint.P2);

    const dist = Math.sqrt((x - ux) ** 2 + (y - uy) ** 2);
    return dist < 15;
  }, [userPoint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (isNearUserPoint(e)) {
        draggingRef.current = true;
        canvas.style.cursor = 'grabbing';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (draggingRef.current) {
        const pt = getPointFromEvent(e);
        if (pt) setUserPoint(pt);
      } else {
        canvas.style.cursor = isNearUserPoint(e) ? 'grab' : 'crosshair';
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (draggingRef.current) {
        draggingRef.current = false;
        canvas.style.cursor = isNearUserPoint(e) ? 'grab' : 'crosshair';
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!draggingRef.current) {
        const pt = getPointFromEvent(e);
        if (pt) setUserPoint(pt);
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('click', handleClick);
    };
  }, [getPointFromEvent, isNearUserPoint, setUserPoint]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px]">
      <canvas ref={canvasRef} />
    </div>
  );
}
