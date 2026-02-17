import pptxgen from 'pptxgenjs';
import { RoadmapData } from '@/components/FileUpload';

export const exportToPowerPoint = (roadmapData: RoadmapData[]) => {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';

  // ─── Timeline range ──────────────────────────────────────────────────────────
  const parsedDates = roadmapData
    .map(d => new Date(d.plannedDeliveryDate))
    .filter(d => !isNaN(d.getTime()));

  const timelineStart = parsedDates.length
    ? new Date(Math.min(...parsedDates.map(d => d.getTime())))
    : new Date('2025-07-01');

  const timelineEnd = parsedDates.length
    ? new Date(Math.max(...parsedDates.map(d => d.getTime())))
    : new Date('2026-06-30');

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  /** Returns 0–100 (%) position on the timeline */
  const pct = (dateStr: string) => {
    if (!dateStr) return 50;
    try {
      const d     = new Date(dateStr);
      const total = timelineEnd.getTime() - timelineStart.getTime();
      const elapsed = d.getTime() - timelineStart.getTime();
      return Math.max(0, Math.min(100, (elapsed / total) * 100));
    } catch {
      return 50;
    }
  };

  // ─── Layout constants ─────────────────────────────────────────────────────────
  const SLIDE_W       = 13.33;
  const SLIDE_H       = 7.5;
  const timelineX     = 1.85;
  const timelineWidth = 11.1;
  const timelineEndX  = timelineX + timelineWidth;   // hard right boundary
  const labelX        = 0.3;
  const labelWidth    = 1.5;

  const toX = (p: number) => timelineX + (p / 100) * timelineWidth;

  // Sizes
  const ICON_SIZE  = 0.14;
  const BAR_H      = 0.17;
  const TEXT_H     = 0.28;
  const TEXT_W     = 0.85;
  const BASE_ROW_H = 0.72;
  const STACK_STEP = 0.30;
  const OVERLAP_PCT = 7;
  const HEADER_H   = 0.28;
  const PROG_H     = 0.30;

  // ─── Group data ───────────────────────────────────────────────────────────────
  const groupedData = roadmapData.reduce((acc, item) => {
    if (!acc[item.program]) acc[item.program] = [];
    acc[item.program].push(item);
    return acc;
  }, {} as Record<string, RoadmapData[]>);

  // ─── Generate quarters ────────────────────────────────────────────────────────
  const quarters: string[] = [];
  const cur = new Date(timelineStart);
  cur.setMonth(Math.floor(cur.getMonth() / 3) * 3, 1);
  while (cur <= timelineEnd) {
    quarters.push(`Q${Math.floor(cur.getMonth() / 3) + 1} ${cur.getFullYear()}`);
    cur.setMonth(cur.getMonth() + 3);
  }

  // ─── Row height calculator ────────────────────────────────────────────────────
  const getRowHeight = (milestones: RoadmapData[]) => {
    const positions = milestones.map(m => pct(m.plannedDeliveryDate)).sort((a, b) => a - b);
    let maxOffset = 0;
    const offsets: number[] = [];
    for (let i = 0; i < positions.length; i++) {
      let offset = 0;
      for (let j = 0; j < i; j++) {
        if (Math.abs(positions[i] - positions[j]) < OVERLAP_PCT) {
          offset = Math.max(offset, offsets[j] + 1);
        }
      }
      offsets.push(offset);
      maxOffset = Math.max(maxOffset, offset);
    }
    return Math.max(BASE_ROW_H, BASE_ROW_H + maxOffset * STACK_STEP);
  };

  // ─── Slide management ────────────────────────────────────────────────────────
  let slide  = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };

  const addQuarterHeaders = (s: pptxgen.Slide, y: number) => {
    // Left blank cell
    s.addShape(pptx.ShapeType.rect, {
      x: labelX, y, w: labelWidth, h: HEADER_H,
      fill: { color: 'FFFFFF' }, line: { color: 'FFFFFF', width: 0 },
    });
    const qW = timelineWidth / quarters.length;
    quarters.forEach((label, i) => {
      const qX = timelineX + i * qW;
      s.addShape(pptx.ShapeType.rect, {
        x: qX, y, w: qW, h: HEADER_H,
        fill: { color: '1B3A6B' }, line: { color: '2A5298', width: 1 },
      });
      s.addText(label, {
        x: qX, y, w: qW, h: HEADER_H,
        fontSize: 9, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle',
      });
    });
  };

  // Title
  slide.addText('2025 Deliveries - Plan on a Page', {
    x: labelX, y: 0.08, w: SLIDE_W - 0.6, h: 0.36,
    fontSize: 20, bold: true, color: '1a1a1a', align: 'center',
  });

  // ── Legend ────────────────────────────────────────────────────────────────────
  const LY = 0.47;
  const addLegendItem = (
    s: pptxgen.Slide,
    lx: number,
    shape: keyof typeof pptx.ShapeType | null,
    color: string,
    label: string,
    isBuildBar = false,
    isDash = false
  ) => {
    if (isBuildBar) {
      s.addShape(pptx.ShapeType.roundRect, {
        x: lx, y: LY + 0.01, w: 0.65, h: 0.13,
        fill: { color: 'FF8800' }, line: { color: 'FF8800', width: 0 }, rectRadius: 0.03,
      });
      s.addText('→ Build Phase →', {
        x: lx, y: LY + 0.01, w: 0.65, h: 0.13,
        fontSize: 5.5, color: 'FFFFFF', bold: true, align: 'center', valign: 'middle',
      });
    } else if (isDash) {
      // Red dashed line with arrowhead
      s.addShape(pptx.ShapeType.triangle, {
        x: lx, y: LY + 0.02, w: 0.09, h: 0.09,
        fill: { color: 'FF3333' }, line: { color: 'FF3333', width: 0 },
      });
      for (let seg = 0; seg < 3; seg++) {
        s.addShape(pptx.ShapeType.line, {
          x: lx + 0.11 + seg * 0.09, y: LY + 0.065, w: 0.06, h: 0,
          line: { color: 'FF3333', width: 1.5 },
        });
      }
      s.addShape(pptx.ShapeType.rightArrow, {
        x: lx + 0.39, y: LY + 0.02, w: 0.09, h: 0.09,
        fill: { color: 'FF3333' }, line: { color: 'FF3333', width: 0 },
      });
    } else if (shape) {
      s.addShape(pptx.ShapeType[shape] as any, {
        x: lx, y: LY + 0.01, w: 0.12, h: 0.12,
        fill: { color }, line: { color, width: 0 },
      });
    }
    const textOffset = isBuildBar ? 0.68 : isDash ? 0.52 : 0.15;
    s.addText(label, {
      x: lx + textOffset, y: LY, w: 1.2, h: 0.14,
      fontSize: 7, color: '333333', valign: 'middle',
    });
  };

  addLegendItem(slide, 0.4,   'star6',    '9933CC', 'Customer Go Live');
  addLegendItem(slide, 1.95,  'triangle', '0266A6', 'Tech Drop');
  addLegendItem(slide, 3.2,   'ellipse',  '28A745', 'Checkpoint');
  addLegendItem(slide, 4.45,  null,       'FF8800', 'Build Phase', true);
  addLegendItem(slide, 6.0,   null,       'FF3333', 'Critical Dependency', false, true);

  // Quarter headers
  const quarterY = 0.62;
  addQuarterHeaders(slide, quarterY);

  let currentY = quarterY + HEADER_H + 0.05;
  const maxY   = SLIDE_H - 0.32;

  const ensureSpace = (needed: number) => {
    if (currentY + needed > maxY) {
      slide = pptx.addSlide();
      slide.background = { color: 'FFFFFF' };
      addQuarterHeaders(slide, 0.08);
      currentY = 0.08 + HEADER_H + 0.05;
    }
  };

  // ─── Draw programs ────────────────────────────────────────────────────────────
  Object.entries(groupedData).forEach(([programName, items]) => {
    ensureSpace(PROG_H + 0.08);

    // Program header — full width dark blue band
    slide.addShape(pptx.ShapeType.rect, {
      x: labelX, y: currentY, w: SLIDE_W - 0.6, h: PROG_H,
      fill: { color: '1B4F8C' }, line: { color: '1B4F8C', width: 0 },
    });
    slide.addText(programName, {
      x: labelX + 0.12, y: currentY, w: SLIDE_W - 0.85, h: PROG_H,
      fontSize: 11, bold: true, color: 'FFFFFF', valign: 'middle',
    });
    currentY += PROG_H + 0.04;

    // ── Journey rows ────────────────────────────────────────────────────────────
    const journeyGroups = items.reduce((acc, item) => {
      if (!acc[item.journey]) acc[item.journey] = [];
      acc[item.journey].push(item);
      return acc;
    }, {} as Record<string, RoadmapData[]>);

    Object.entries(journeyGroups).forEach(([journey, milestones]) => {
      const rowH = getRowHeight(milestones);
      ensureSpace(rowH + 0.04);

      // Journey label cell
      slide.addShape(pptx.ShapeType.rect, {
        x: labelX, y: currentY, w: labelWidth, h: rowH,
        fill: { color: 'EEF4FA' }, line: { color: 'C8D8E8', width: 1 },
      });
      slide.addText(journey, {
        x: labelX + 0.07, y: currentY, w: labelWidth - 0.14, h: rowH,
        fontSize: 8, color: '222222', valign: 'middle', wrap: true,
      });

      // Swimlane
      slide.addShape(pptx.ShapeType.rect, {
        x: timelineX, y: currentY, w: timelineWidth, h: rowH,
        fill: { color: 'B3F0FF' }, line: { color: 'C8D8E8', width: 1 },
      });

      // Stacking offsets
      const sorted = milestones
        .map(m => ({ ...m, pos: pct(m.plannedDeliveryDate) }))
        .sort((a, b) => a.pos - b.pos);

      const withOffset: Array<typeof sorted[0] & { vOffset: number }> = [];
      for (let i = 0; i < sorted.length; i++) {
        let vo = 0;
        for (let j = 0; j < i; j++) {
          if (Math.abs(sorted[i].pos - withOffset[j].pos) < OVERLAP_PCT) {
            vo = Math.max(vo, withOffset[j].vOffset + 1);
          }
        }
        withOffset.push({ ...sorted[i], vOffset: vo });
      }

      // Draw each milestone
      withOffset.forEach(m => {
        const mX        = toX(m.pos);
        const vOff      = m.vOffset * STACK_STEP;
        const iconY     = currentY + 0.07 + vOff;
        const textY     = iconY + ICON_SIZE + 0.04;
        const lowerType = m.milestoneType.toLowerCase();
        const isCritical = lowerType.includes('critical') || lowerType.includes('dependan');

        // ── BUILD PHASE BAR ─────────────────────────────────────────────────────
        // Starts 63 days before delivery date, ends exactly at milestone X
        const buildEndDate   = new Date(m.plannedDeliveryDate);
        const buildStartDate = new Date(buildEndDate);
        buildStartDate.setDate(buildStartDate.getDate() - 63);

        const barStartX = Math.max(timelineX, toX(pct(buildStartDate.toISOString().slice(0, 10))));
        // FIX: bar must end AT the milestone icon centre, clamped to timeline boundary
        const barEndX   = Math.min(timelineEndX, mX);
        const barW      = barEndX - barStartX;
        const barY      = iconY + ICON_SIZE / 2 - BAR_H / 2;

        if (barW > 0.05) {
          // Orange rounded rectangle (matching UI exactly)
          slide.addShape(pptx.ShapeType.roundRect, {
            x: barStartX, y: barY, w: barW, h: BAR_H,
            fill: { color: 'FF8800' },
            line: { color: 'FF8800', width: 0 },
            rectRadius: 0.04,
          });
          // "→ Build Phase →" label inside bar when wide enough
          if (barW > 0.55) {
            slide.addText('→  Build Phase  →', {
              x: barStartX + 0.03, y: barY, w: barW - 0.06, h: BAR_H,
              fontSize: 6, color: 'FFFFFF', bold: true, align: 'center', valign: 'middle',
            });
          }
        }

        // ── CRITICAL DEPENDENCY dashed red line ─────────────────────────────────
        if (isCritical) {
          const impactTarget = roadmapData.find(
            r => r.deliveryMilestone === (m as any).impactOn || r.journey === (m as any).impactOn
          );
          const targetPct  = impactTarget ? pct(impactTarget.plannedDeliveryDate) : Math.min(m.pos + 18, 96);
          const lineStartX = mX + ICON_SIZE / 2 + 0.02;
          const lineEndX   = Math.min(timelineEndX - 0.12, toX(targetPct) - ICON_SIZE / 2);
          const lineY      = iconY + ICON_SIZE / 2;

          if (lineEndX > lineStartX + 0.15) {
            // Dashed segments (tiled because pptxgenjs dashType isn't reliable)
            const SEG = 0.09, GAP = 0.05;
            let sx = lineStartX;
            while (sx + SEG < lineEndX - 0.12) {
              slide.addShape(pptx.ShapeType.line, {
                x: sx, y: lineY, w: SEG, h: 0,
                line: { color: 'FF3333', width: 2 },
              });
              sx += SEG + GAP;
            }
            // Arrow tip
            slide.addShape(pptx.ShapeType.triangle, {
              x: lineEndX - 0.09, y: lineY - 0.045,
              w: 0.09, h: 0.09,
              fill: { color: 'FF3333' }, line: { color: 'FF3333', width: 0 },
              rotate: 90,
            });
          }
        }

        // ── MILESTONE ICON ──────────────────────────────────────────────────────
        const iconX = mX - ICON_SIZE / 2;

        if (
          (lowerType.includes('customer') && lowerType.includes('go') && lowerType.includes('live')) ||
          lowerType === 'key' || lowerType === 'star'
        ) {
          slide.addShape(pptx.ShapeType.star6, {
            x: iconX, y: iconY, w: ICON_SIZE, h: ICON_SIZE,
            fill: { color: '9933CC' }, line: { color: '9933CC', width: 0 },
          });
        } else if (
          (lowerType.includes('tech') && lowerType.includes('drop')) ||
          lowerType === 'milestone' || lowerType === 'triangle' || lowerType === 'techdrop'
        ) {
          slide.addShape(pptx.ShapeType.triangle, {
            x: iconX, y: iconY, w: ICON_SIZE, h: ICON_SIZE,
            fill: { color: '0266A6' }, line: { color: '0266A6', width: 0 },
          });
        } else if (isCritical) {
          slide.addShape(pptx.ShapeType.triangle, {
            x: iconX, y: iconY, w: ICON_SIZE, h: ICON_SIZE,
            fill: { color: 'FF3333' }, line: { color: 'FF3333', width: 0 },
          });
        } else {
          // Checkpoint / green circle
          slide.addShape(pptx.ShapeType.ellipse, {
            x: iconX, y: iconY, w: ICON_SIZE, h: ICON_SIZE,
            fill: { color: '28A745' }, line: { color: '28A745', width: 0 },
          });
        }

        // ── TEXT LABEL (below icon, clamped inside slide) ────────────────────
        const label = m.deliveryMilestone.length > 32
          ? m.deliveryMilestone.substring(0, 30) + '…'
          : m.deliveryMilestone;

        // Clamp text box so it never goes past the right edge
        const rawTextX   = mX - TEXT_W / 2;
        const clampedTX  = Math.max(
          timelineX + 0.02,
          Math.min(rawTextX, timelineEndX - TEXT_W - 0.02)
        );

        slide.addText(label, {
          x: clampedTX, y: textY, w: TEXT_W, h: TEXT_H,
          fontSize: 6.5, color: '1a1a1a',
          align: 'center', valign: 'top', wrap: true,
        });
      });

      currentY += rowH + 0.04;
    });

    currentY += 0.1;
  });

  // ── Footer ───────────────────────────────────────────────────────────────────
  slide.addText(
    `Total: ${Object.keys(groupedData).length} Programs  |  ${roadmapData.length} Milestones`,
    {
      x: labelX,
      y: Math.min(currentY + 0.05, SLIDE_H - 0.26),
      w: SLIDE_W - 0.6,
      h: 0.22,
      fontSize: 8, color: '777777', align: 'center', valign: 'middle',
    }
  );

  pptx.writeFile({ fileName: '2025-Deliveries-Plan-on-a-Page.pptx' });
};
