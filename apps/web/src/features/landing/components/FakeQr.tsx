// QR ilustrativo para la landing (no codifica nada). El QR real se genera en la feature de impresión.
const SIZE = 25;

function isFinder(x: number, y: number): boolean | null {
  const corners = [
    [0, 0],
    [SIZE - 7, 0],
    [0, SIZE - 7],
  ];
  for (const [cx, cy] of corners) {
    const dx = x - cx;
    const dy = y - cy;
    if (dx >= -1 && dx <= 7 && dy >= -1 && dy <= 7) {
      if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return false; // margen blanco
      const ring = Math.min(dx, dy, 6 - dx, 6 - dy);
      return ring !== 1;
    }
  }
  return null;
}

function cells(): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let seed = 7;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const finder = isFinder(x, y);
      seed = (seed * 1103515245 + 12345) % 2147483648;
      const on = finder ?? seed % 100 < 47;
      if (on) out.push([x, y]);
    }
  }
  return out;
}

const CELLS = cells();

export function FakeQr({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox={`-2 -2 ${SIZE + 4} ${SIZE + 4}`} aria-hidden="true" shapeRendering="crispEdges">
      <rect x="-2" y="-2" width={SIZE + 4} height={SIZE + 4} fill="#fff" />
      {CELLS.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#141414" />
      ))}
    </svg>
  );
}
