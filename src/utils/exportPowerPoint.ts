import pptxgen from 'pptxgenjs';
import { RoadmapData } from '@/components/FileUpload';

export const exportToPowerPoint = (roadmapData: RoadmapData[]) => {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 × 7.5 inches

  // ═══════════════════════════════════════════════════════════════
  //  STEP 1 — TIMELINE BOUNDARIES
  // ═══════════════════════════════════════════════════════════════
  const parsedDates = roadmapData
    .map(d => new Date(d.plannedDeliveryDate))
    .filter(d => !isNaN(d.getTime()));

  // Extend both edges by one month so no marker sits flush at the boundary
  const rawStart = parsedDates.length
    ? new Date(Math.min(...parsedDates.map(d => d.getTime())))
    : new Date('2025-07-01');
  const rawEnd = parsedDates.length
    ? new Date(Math.max(...parsedDates.map(d => d.getTime())))
    : new Date('2026-06-30');

  const tlStart = new Date(rawStart);
  tlStart.setMonth(tlStart.getMonth() - 1, 1);
  const tlEnd = new Date(rawEnd);
  tlEnd.setMonth(tlEnd.getMonth() + 2, 0); // last day of month+1

  const totalMs = tlEnd.getTime() - tlStart.getTime();

  /** Convert a date string → 0..1 fraction across the timeline */
  const frac = (dateStr: string): number => {
    if (!dateStr) return 0.5;
    try {
      const d = new Date(dateStr);
      return Math.max(0.01, Math.min(0.99, (d.getTime() - tlStart.getTime()) / totalMs));
    } catch { return 0.5; }
  };

  // ═══════════════════════════════════════════════════════════════
  //  STEP 2 — FIXED SLIDE GEOMETRY (everything in inches)
  // ═══════════════════════════════════════════════════════════════
  const SW = 13.33;   // slide width
  const SH = 7.5;     // slide height

  const MARGIN_L = 0.25;  // left margin
  const MARGIN_R = 0.25;  // right margin
  const LABEL_W  = 1.55;  // journey label column width
  const TL_X     = MARGIN_L + LABEL_W;          // timeline area left edge (x)
  const TL_W     = SW - MARGIN_L - LABEL_W - MARGIN_R; // timeline area width
  const TL_RIGHT = TL_X + TL_W;                 // timeline area right edge (HARD LIMIT)

  /** fraction → absolute X, clamped to timeline area */
  const toX = (f: number): number =>
    Math.min(TL_RIGHT - 0.01, Math.max(TL_X + 0.01, TL_X + f * TL_W));

  // ═══════════════════════════════════════════════════════════════
  //  STEP 3 — GROUP DATA
  // ═══════════════════════════════════════════════════════════════
  const groupedData: Record<string, Record<string, RoadmapData[]>> = {};
  for (const item of roadmapData) {
    if (!groupedData[item.program]) groupedData[item.program] = {};
    if (!groupedData[item.program][item.journey]) groupedData[item.program][item.journey] = [];
    groupedData[item.program][item.journey].push(item);
  }

  // ═══════════════════════════════════════════════════════════════
  //  STEP 4 — GENERATE QUARTERS FOR HEADER
  // ═══════════════════════════════════════════════════════════════
  const quarters: Array<{ label: string; fStart: number; fEnd: number }> = [];
  const q = new Date(tlStart);
  q.setMonth(Math.floor(q.getMonth() / 3) * 3, 1);
  while (q <= tlEnd) {
    const qStart = new Date(q);
    const qEnd   = new Date(q);
    qEnd.setMonth(qEnd.getMonth() + 3, 0);

    const fS = Math.max(0, (qStart.getTime() - tlStart.getTime()) / totalMs);
    const fE = Math.min(1, (qEnd.getTime()   - tlStart.getTime()) / totalMs);
    if (fS < 1 && fE > 0) {
      quarters.push({
        label : `Q${Math.floor(qStart.getMonth() / 3) + 1} ${qStart.getFullYear()}`,
        fStart: Math.max(0, fS),
        fEnd  : Math.min(1, fE),
      });
    }
    q.setMonth(q.getMonth() + 3);
  }

  // ═══════════════════════════════════════════════════════════════
  //  STEP 5 — COMPUTE ROW HEIGHTS (so we know total content height)
  // ═══════════════════════════════════════════════════════════════
  const ICON_SIZE  = 0.13;   // icon width & height (inches)
  const ICON_VPAD  = 0.06;   // padding above icon from row top
  const TEXT_BELOW = 0.04;   // gap between icon bottom and text top
  const TEXT_H     = 0.26;   // text label height
  const MIN_ROW_H  = ICON_VPAD + ICON_SIZE + TEXT_BELOW + TEXT_H + 0.06; // ~0.55
  const STACK_INC  = 0.30;   // extra height per stacking level
  const CLOSE_FRAC = 0.07;   // fraction threshold for "close" milestones

  /** Compute stacking offsets (verticalOffset per milestone) */
  const computeOffsets = (milestones: RoadmapData[]) => {
    const sorted = milestones
      .map(m => ({ m, f: frac(m.plannedDeliveryDate) }))
      .sort((a, b) => a.f - b.f);

    const result: Array<{ m: RoadmapData; f: number; vo: number }> = [];
    for (let i = 0; i < sorted.length; i++) {
      let vo = 0;
      for (let j = 0; j < i; j++) {
        if (Math.abs(sorted[i].f - result[j].f) < CLOSE_FRAC) {
          vo = Math.max(vo, result[j].vo + 1);
        }
      }
      result.push({ ...sorted[i], vo });
    }
    return result;
  };

  /** Row height for a journey (includes stacking space) */
  const rowHeight = (milestones: RoadmapData[]) => {
    const offsets = computeOffsets(milestones);
    const maxVo   = offsets.length ? Math.max(...offsets.map(o => o.vo)) : 0;
    return MIN_ROW_H + maxVo * STACK_INC;
  };

  // ═══════════════════════════════════════════════════════════════
  //  STEP 6 — DYNAMIC AUTO-SCALING
  //  Enhanced scaling to ensure content fits on ONE page
  //  Measure total content height → compute vertical scale factor
  //  so everything fits in one slide.
  // ═══════════════════════════════════════════════════════════════
  const TITLE_H    = 0.38;
  const LEGEND_H   = 0.18;
  const QHEADER_H  = 0.27;
  const PROG_HDR_H = 0.27;
  const PROG_GAP   = 0.06;
  const JOURNEY_GAP = 0.03;
  const FOOTER_H   = 0.22;
  const FIXED_H    = TITLE_H + LEGEND_H + QHEADER_H + FOOTER_H + 0.15; // Reduced padding for tighter fit

  let totalContentH = 0;
  for (const [, journeys] of Object.entries(groupedData)) {
    totalContentH += PROG_HDR_H + PROG_GAP;
    for (const [, milestones] of Object.entries(journeys)) {
      totalContentH += rowHeight(milestones) + JOURNEY_GAP;
    }
  }

  const availableH = SH - FIXED_H;
  // scale factor to shrink everything to fit (max 1.0 — never upscale)
  // Add 5% safety margin to ensure content doesn't overflow
  const SCALE = Math.min(1.0, (availableH * 0.95) / totalContentH);

  const sc = (v: number) => v * SCALE; // apply scale to vertical measurements

  // ═══════════════════════════════════════════════════════════════
  //  STEP 7 — BUILD THE SLIDE
  // ═══════════════════════════════════════════════════════════════
  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };

  let y = 0.12; // current vertical cursor

  // ── Title ────────────────────────────────────────────────────
  slide.addText('2025 Deliveries - Plan on a Page', {
    x: MARGIN_L, y, w: SW - MARGIN_L - MARGIN_R, h: TITLE_H,
    fontSize: 18, bold: true, color: '1B3A6B', align: 'center', valign: 'middle',
  });
  y += TITLE_H;

  // ── Legend ───────────────────────────────────────────────────
  // Prevent legend overlap by using proper spacing with explicit widths
  const legendItems: Array<{
    type: 'shape' | 'bar' | 'dash';
    shape?: string;
    color: string;
    label: string;
    width: number;  // Add explicit width for each item
  }> = [
    { type: 'shape', shape: 'star6',    color: '9933CC', label: 'Customer Go Live',    width: 2.2 },
    { type: 'shape', shape: 'triangle', color: '0266A6', label: 'Tech Drop',           width: 1.5 },
    { type: 'shape', shape: 'ellipse',  color: '28A745', label: 'Checkpoint',          width: 1.5 },
    { type: 'bar',                      color: 'FF8800', label: 'Build Phase',         width: 2.0 },
    { type: 'dash',                     color: 'EE3333', label: 'Critical Dependency', width: 2.5 },
  ];
  const legendIconW = 0.13;
  let legendX = MARGIN_L;
  legendItems.forEach((item, i) => {
    const lx = legendX;
    const ly = y + 0.02;
    legendX += item.width;  // Increment by item width to prevent overlap

    if (item.type === 'shape' && item.shape) {
      slide.addShape((pptx.ShapeType as any)[item.shape], {
        x: lx, y: ly, w: legendIconW, h: legendIconW,
        fill: { color: item.color }, line: { color: item.color, width: 0 },
      });
      slide.addText(item.label, {
        x: lx + legendIconW + 0.04, y: ly, w: item.width - legendIconW - 0.08, h: legendIconW,
        fontSize: 7, color: '333333', valign: 'middle',
      });
    } else if (item.type === 'bar') {
      const bw = 0.70;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: lx, y: ly, w: bw, h: legendIconW,
        fill: { color: item.color }, line: { color: item.color, width: 0 }, rectRadius: 0.03,
      });
      slide.addText('→ Build Phase →', {
        x: lx, y: ly, w: bw, h: legendIconW,
        fontSize: 5.5, color: 'FFFFFF', bold: true, align: 'center', valign: 'middle',
      });
      slide.addText(item.label, {
        x: lx + bw + 0.05, y: ly, w: item.width - bw - 0.10, h: legendIconW,
        fontSize: 7, color: '333333', valign: 'middle',
      });
    } else if (item.type === 'dash') {
      // Small red triangle + dashed line
      slide.addShape(pptx.ShapeType.triangle, {
        x: lx, y: ly + 0.01, w: 0.10, h: 0.10,
        fill: { color: item.color }, line: { color: item.color, width: 0 },
      });
      for (let s = 0; s < 4; s++) {
        slide.addShape(pptx.ShapeType.line, {
          x: lx + 0.12 + s * 0.09, y: ly + legendIconW / 2, w: 0.07, h: 0,
          line: { color: item.color, width: 1.5 },
        });
      }
      slide.addText(item.label, {
        x: lx + 0.50, y: ly, w: item.width - 0.55, h: legendIconW,
        fontSize: 7, color: '333333', valign: 'middle',
      });
    }
  });
  y += LEGEND_H;

  // ── Quarter headers ───────────────────────────────────────────
  // Left blank cell
  slide.addShape(pptx.ShapeType.rect, {
    x: MARGIN_L, y, w: LABEL_W, h: QHEADER_H,
    fill: { color: 'FFFFFF' }, line: { color: 'DDDDDD', width: 1 },
  });
  for (const q of quarters) {
    const qx = toX(q.fStart);
    const qw = Math.max(0.01, toX(q.fEnd) - qx);
    slide.addShape(pptx.ShapeType.rect, {
      x: qx, y, w: qw, h: QHEADER_H,
      fill: { color: '1B3A6B' }, line: { color: '2A5298', width: 1 },
    });
    slide.addText(q.label, {
      x: qx, y, w: qw, h: QHEADER_H,
      fontSize: 8, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle',
    });
  }
  y += QHEADER_H;

  // ═══════════════════════════════════════════════════════════════
  //  STEP 8 — PROGRAMS & JOURNEYS
  // ═══════════════════════════════════════════════════════════════
  const scaledIconSize  = Math.max(0.09, ICON_SIZE * SCALE);
  const scaledIconVpad  = ICON_VPAD  * SCALE;
  const scaledTextBelow = TEXT_BELOW * SCALE;
  const scaledTextH     = Math.max(0.18, TEXT_H * SCALE);
  const scaledStackInc  = STACK_INC  * SCALE;
  const TEXT_W          = 0.82;  // label width — NOT scaled (text needs readable width)

  for (const [programName, journeys] of Object.entries(groupedData)) {
    const progH = sc(PROG_HDR_H);

    // Program header band — full width
    slide.addShape(pptx.ShapeType.rect, {
      x: MARGIN_L, y, w: SW - MARGIN_L - MARGIN_R, h: progH,
      fill: { color: '1B4F8C' }, line: { color: '1B4F8C', width: 0 },
    });
    slide.addText(programName, {
      x: MARGIN_L + 0.1, y, w: SW - MARGIN_L - MARGIN_R - 0.15, h: progH,
      fontSize: Math.max(7, 10 * SCALE), bold: true, color: 'FFFFFF', valign: 'middle',
    });
    y += progH + sc(PROG_GAP);

    for (const [journey, milestones] of Object.entries(journeys)) {
      const rh      = sc(rowHeight(milestones));
      const offsets = computeOffsets(milestones);

      // Journey label cell
      slide.addShape(pptx.ShapeType.rect, {
        x: MARGIN_L, y, w: LABEL_W, h: rh,
        fill: { color: 'EDF2F9' }, line: { color: 'C5D3E0', width: 0.75 },
      });
      slide.addText(journey, {
        x: MARGIN_L + 0.06, y, w: LABEL_W - 0.12, h: rh,
        fontSize: Math.max(6, 8 * SCALE), color: '222222', valign: 'middle', wrap: true,
      });

      // Swimlane background
      slide.addShape(pptx.ShapeType.rect, {
        x: TL_X, y, w: TL_W, h: rh,
        fill: { color: 'B3F0FF' }, line: { color: 'C5D3E0', width: 0.75 },
      });

      // Draw each milestone
      for (const { m, f, vo } of offsets) {
        const mX    = toX(f);   // milestone centre X — already clamped to TL_RIGHT
        const vOff  = vo * scaledStackInc;
        const iconY = y + scaledIconVpad + vOff;
        const textY = iconY + scaledIconSize + scaledTextBelow;

        // ── BUILD PHASE BAR ─────────────────────────────────────────────────
        // Bar starts 63 days before the milestone and ends AT the milestone X.
        const buildStartDate = new Date(m.plannedDeliveryDate);
        buildStartDate.setDate(buildStartDate.getDate() - 63);
        const bFrac  = frac(buildStartDate.toISOString().slice(0, 10));

        // CRITICAL FIX: both edges clamped inside [TL_X, TL_RIGHT]
        const barLeft  = Math.max(TL_X,     toX(bFrac));
        const barRight = Math.min(TL_RIGHT,  mX);            // ends AT the icon, never beyond
        const barW     = barRight - barLeft;

        const BAR_HEIGHT = Math.max(0.10, 0.16 * SCALE);
        // Bar is vertically centred on the icon's midpoint
        const barY = iconY + scaledIconSize / 2 - BAR_HEIGHT / 2;

        if (barW > 0.04) {
          slide.addShape(pptx.ShapeType.roundRect, {
            x: barLeft,
            y: barY,
            w: barW,
            h: BAR_HEIGHT,
            fill: { color: 'FF8800' },
            line: { color: 'FF8800', width: 0 },
            rectRadius: 0.03,
          });
          // Only add text when the bar is wide enough to read
          if (barW > 0.50) {
            slide.addText('→  Build Phase  →', {
              x: barLeft + 0.02,
              y: barY,
              w: barW - 0.04,
              h: BAR_HEIGHT,
              fontSize: Math.max(4.5, 5.5 * SCALE),
              color: 'FFFFFF',
              bold: true,
              align: 'center',
              valign: 'middle',
            });
          }
        }

// ── CRITICAL DEPENDENCY (red dashed line) ─────────────────────────
        // Position ABOVE the icon to avoid overlap with Build Phase bar
        const lt = m.milestoneType.toLowerCase();
        const isCritical = lt.includes('critical') || lt.includes('dependan');
        if (isCritical) {
          const impactOn   = (m as any).impactOn ?? '';
          const target     = roadmapData.find(r =>
            r.deliveryMilestone === impactOn || r.journey === impactOn
          );
          const tFrac     = target ? frac(target.plannedDeliveryDate) : Math.min(f + 0.15, 0.97);
          const lineStart = mX + scaledIconSize / 2 + 0.02;
          const lineEnd   = Math.min(TL_RIGHT - 0.02, toX(tFrac) - scaledIconSize / 2);
          // Position critical dependency line ABOVE the icon to separate from Build Phase bar
          const lineY     = iconY - 0.08;

          if (lineEnd > lineStart + 0.12) {
            const SEG = 0.09, GAP = 0.05;
            let sx = lineStart;
            while (sx + SEG < lineEnd - 0.10) {
              slide.addShape(pptx.ShapeType.line, {
                x: sx, y: lineY, w: SEG, h: 0,
                line: { color: 'EE3333', width: 1.8 },
              });
              sx += SEG + GAP;
            }
            slide.addShape(pptx.ShapeType.triangle, {
              x: lineEnd - 0.09, y: lineY - 0.045, w: 0.09, h: 0.09,
              fill: { color: 'EE3333' }, line: { color: 'EE3333', width: 0 },
              rotate: 90,
            });
          }
        }

        // ── MILESTONE ICON (drawn ON TOP of bar) ──────────────────────────
        const iconX = mX - scaledIconSize / 2;

        if (
          (lt.includes('customer') && lt.includes('go') && lt.includes('live')) ||
          lt === 'key' || lt === 'star'
        ) {
          slide.addShape(pptx.ShapeType.star6, {
            x: iconX, y: iconY, w: scaledIconSize, h: scaledIconSize,
            fill: { color: '9933CC' }, line: { color: '9933CC', width: 0 },
          });
        } else if (
          (lt.includes('tech') && lt.includes('drop')) ||
          lt === 'milestone' || lt === 'triangle' || lt === 'techdrop'
        ) {
          slide.addShape(pptx.ShapeType.triangle, {
            x: iconX, y: iconY, w: scaledIconSize, h: scaledIconSize,
            fill: { color: '0266A6' }, line: { color: '0266A6', width: 0 },
          });
        } else if (isCritical) {
          slide.addShape(pptx.ShapeType.triangle, {
            x: iconX, y: iconY, w: scaledIconSize, h: scaledIconSize,
            fill: { color: 'EE3333' }, line: { color: 'EE3333', width: 0 },
          });
        } else {
          slide.addShape(pptx.ShapeType.ellipse, {
            x: iconX, y: iconY, w: scaledIconSize, h: scaledIconSize,
            fill: { color: '28A745' }, line: { color: '28A745', width: 0 },
          });
        }

        // ── TEXT LABEL (below icon, clamped horizontally) ─────────────────
        const label = m.deliveryMilestone.length > 30
          ? m.deliveryMilestone.substring(0, 28) + '…'
          : m.deliveryMilestone;

        // Centre the text under the icon, clamp so it stays inside swimlane
        const rawTx = mX - TEXT_W / 2;
        const textX = Math.max(
          TL_X + 0.02,
          Math.min(rawTx, TL_RIGHT - TEXT_W - 0.02)
        );

        slide.addText(label, {
          x: textX, y: textY, w: TEXT_W, h: scaledTextH,
          fontSize: Math.max(5.5, 6.5 * SCALE),
          color: '1a1a1a', align: 'center', valign: 'top', wrap: true,
        });
      }

      y += rh + sc(JOURNEY_GAP);
    }

    y += sc(PROG_GAP); // extra gap after each program
  }

  // ── Footer ────────────────────────────────────────────────────
  slide.addText(
    `Total: ${Object.keys(groupedData).length} Programs  |  ${roadmapData.length} Milestones`,
    {
      x: MARGIN_L, y: SH - FOOTER_H - 0.08,
      w: SW - MARGIN_L - MARGIN_R, h: FOOTER_H,
      fontSize: 8, color: '888888', align: 'center', valign: 'middle',
    }
  );

  pptx.writeFile({ fileName: '2025-Deliveries-Plan-on-a-Page.pptx' });
};
