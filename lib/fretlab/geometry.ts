/**
 * Polar helpers for the circle-of-fifths wedges.
 *
 * App Template Contract v1 §5: this is domain logic, not presentation. It sits
 * under lib/ so L2 sections and L3 elements can use it without importing from
 * a page, and so the boundary lint has somewhere legal to point.
 */
export function polar(cx: number, cy: number, r: number, degrees: number) {
  const angle = ((degrees - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}
export function wedge(
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  a0: number,
  a1: number,
) {
  const p1 = polar(cx, cy, r1, a0),
    p2 = polar(cx, cy, r1, a1),
    p3 = polar(cx, cy, r0, a1),
    p4 = polar(cx, cy, r0, a0);
  return `M${p1[0]} ${p1[1]}A${r1} ${r1} 0 0 1 ${p2[0]} ${p2[1]}L${p3[0]} ${p3[1]}A${r0} ${r0} 0 0 0 ${p4[0]} ${p4[1]}Z`;
}

