/**
 * Buddy's outfits ("personalities"): small SVG pieces drawn over his head in
 * mask coordinates. Each piece knows how to follow the head as it turns.
 *   tie     a little black top hat and a bow tie
 *   shades  round sunglasses (over his eyes) and headphones
 *   hardhat a yellow hard hat
 */
export type AccessoryName = 'none' | 'tie' | 'shades' | 'hardhat';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function svg<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

/** Head ellipse in mask coordinates. */
export type HeadBox = { cx: number; cy: number; rx: number; ry: number };

export type AccessoryParts = {
  root: SVGGElement;
  /** Pieces that sit on top of the head (hats, headband). */
  top: SVGGElement;
  /** Bow tie under the chin. */
  chin: SVGGElement;
  /** Headphone cups, left and right. */
  cups: [SVGGElement, SVGGElement];
  band: SVGPathElement;
  /** Sunglasses lenses (placed over the eyes each frame). */
  lenses: [SVGGElement, SVGGElement];
  bridge: SVGPathElement;
};

/** Build the pieces for one outfit (all positioned later by the view). */
export function buildAccessory(name: AccessoryName, head: HeadBox, defs: SVGDefsElement, uid: string): AccessoryParts {
  const root = svg('g', { 'data-accessory': name });
  const top = svg('g');
  const chin = svg('g');
  const cups: [SVGGElement, SVGGElement] = [svg('g'), svg('g')];
  const band = svg('path', { fill: 'none', stroke: '#0b0b0d', 'stroke-width': 16, 'stroke-linecap': 'round' });
  const lenses: [SVGGElement, SVGGElement] = [svg('g'), svg('g')];
  const bridge = svg('path', { fill: 'none', stroke: '#0b0b0d', 'stroke-width': 5, 'stroke-linecap': 'round' });
  const { cx, cy, rx, ry } = head;
  const topY = cy - ry;

  if (name === 'tie') {
    // Top hat: a short crown on a curved brim, sitting a touch forward and tilted.
    top.append(
      svg('path', {
        d: `M${cx - 50} ${topY + 6} C${cx - 52} ${topY - 34} ${cx - 46} ${topY - 52} ${cx - 40} ${topY - 54} L${cx + 40} ${topY - 54} C${cx + 46} ${topY - 52} ${cx + 52} ${topY - 34} ${cx + 50} ${topY + 6} Z`,
        fill: '#0b0b0d',
      }),
      svg('ellipse', { cx, cy: topY + 8, rx: 92, ry: 17, fill: '#0b0b0d' }),
      svg('path', { d: `M${cx - 50} ${topY - 6} L${cx + 50} ${topY - 6}`, stroke: '#2a2a2e', 'stroke-width': 7 }),
      svg('ellipse', { cx: cx - 22, cy: topY - 40, rx: 12, ry: 5, fill: 'rgba(255,255,255,0.18)' }),
    );
    // Bow tie under the chin.
    const by = cy + ry + 12;
    chin.append(
      svg('path', { d: `M${cx} ${by} L${cx - 46} ${by - 24} Q${cx - 52} ${by} ${cx - 46} ${by + 24} Z`, fill: '#0b0b0d' }),
      svg('path', { d: `M${cx} ${by} L${cx + 46} ${by - 24} Q${cx + 52} ${by} ${cx + 46} ${by + 24} Z`, fill: '#0b0b0d' }),
      svg('rect', { x: cx - 11, y: by - 13, width: 22, height: 26, rx: 6, fill: '#0b0b0d' }),
    );
  }

  if (name === 'shades') {
    const grad = svg('linearGradient', { id: `cup-${uid}`, x1: 0, y1: 0, x2: 1, y2: 0 });
    grad.append(
      svg('stop', { offset: '0', 'stop-color': '#9a9aa2' }),
      svg('stop', { offset: '0.45', 'stop-color': '#f4f4f6' }),
      svg('stop', { offset: '1', 'stop-color': '#b6b6be' }),
    );
    defs.append(grad);
    for (const cup of cups) {
      cup.append(
        svg('rect', { x: -19, y: -40, width: 38, height: 80, rx: 16, fill: `url(#cup-${uid})`, stroke: '#8c8c94', 'stroke-width': 2 }),
        svg('rect', { x: -10, y: -30, width: 6, height: 60, rx: 3, fill: 'rgba(255,255,255,0.7)' }),
      );
    }
    for (const lens of lenses) {
      lens.append(
        svg('circle', { cx: 0, cy: 0, r: 46, fill: '#060608' }),
        svg('ellipse', { cx: 16, cy: -20, rx: 9, ry: 6, fill: 'rgba(255,255,255,0.85)', transform: 'rotate(-30 16 -20)' }),
      );
    }
  }

  if (name === 'hardhat') {
    // A construction hard hat seen from the front: a rounded dome sitting down
    // on the head, a brim that wraps round it (dipping at the front), a centre
    // rib and a little knob — glossy yellow plastic.
    const dome = svg('linearGradient', { id: `hat-${uid}`, x1: 0, y1: 0, x2: 0, y2: 1 });
    dome.append(
      svg('stop', { offset: '0', 'stop-color': '#ffe27a' }),
      svg('stop', { offset: '0.55', 'stop-color': '#f4c935' }),
      svg('stop', { offset: '1', 'stop-color': '#dfa91a' }),
    );
    const brimGrad = svg('linearGradient', { id: `brim-${uid}`, x1: 0, y1: 0, x2: 0, y2: 1 });
    brimGrad.append(svg('stop', { offset: '0', 'stop-color': '#f2c22c' }), svg('stop', { offset: '1', 'stop-color': '#c9930f' }));
    defs.append(dome, brimGrad);
    const brimY = topY + ry * 0.58;
    const domeTop = topY - ry * 0.16;
    const dw = rx * 0.9;
    // Dome: an arch from brim to brim, its bottom edge following the brim's curve.
    top.append(
      svg('path', {
        d: `M${cx - dw} ${brimY - 8} C${cx - dw} ${domeTop - 6} ${cx + dw} ${domeTop - 6} ${cx + dw} ${brimY - 8} Q${cx} ${brimY + 22} ${cx - dw} ${brimY - 8} Z`,
        fill: `url(#hat-${uid})`,
      }),
      // Centre rib.
      svg('path', {
        d: `M${cx - 20} ${brimY + 10} C${cx - 22} ${domeTop + 40} ${cx - 16} ${domeTop + 14} ${cx} ${domeTop + 12} C${cx + 16} ${domeTop + 14} ${cx + 22} ${domeTop + 40} ${cx + 20} ${brimY + 10} Z`,
        fill: '#f8d64e',
        stroke: 'rgba(180,128,8,0.35)',
        'stroke-width': 3,
      }),
      // Knob on top of the rib.
      svg('rect', { x: cx - 12, y: domeTop - 4, width: 24, height: 30, rx: 11, fill: '#f6cd3c', stroke: 'rgba(180,128,8,0.35)', 'stroke-width': 3 }),
      // Gloss.
      svg('ellipse', { cx: cx - dw * 0.48, cy: domeTop + 46, rx: 38, ry: 16, fill: 'rgba(255,255,255,0.55)', transform: `rotate(-24 ${cx - dw * 0.48} ${domeTop + 46})` }),
      // Brim: a band wrapping round the head, lower at the front.
      svg('path', {
        d: `M${cx - rx * 1.06} ${brimY - 18} Q${cx} ${brimY + 46} ${cx + rx * 1.06} ${brimY - 18} Q${cx + rx * 1.1} ${brimY - 2} ${cx + rx * 0.98} ${brimY + 8} Q${cx} ${brimY + 72} ${cx - rx * 0.98} ${brimY + 8} Q${cx - rx * 1.1} ${brimY - 2} ${cx - rx * 1.06} ${brimY - 18} Z`,
        fill: `url(#brim-${uid})`,
      }),
      svg('path', { d: `M${cx - rx * 0.95} ${brimY - 6} Q${cx} ${brimY + 48} ${cx + rx * 0.95} ${brimY - 6}`, fill: 'none', stroke: 'rgba(255,240,170,0.75)', 'stroke-width': 4, 'stroke-linecap': 'round' }),
    );
  }

  root.append(top, chin, band, cups[0], cups[1], lenses[0], lenses[1], bridge);
  return { root, top, chin, cups, band, lenses, bridge };
}
