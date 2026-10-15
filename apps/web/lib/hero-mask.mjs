export function maskGeometry(pointer, position, radius) {
  const dx = pointer.x - position.x,
    dy = pointer.y - position.y,
    distance = Math.hypot(dx, dy),
    stretch = 1 + Math.min(distance / 500, 0.25),
    nx = distance ? dx / distance : 0,
    ny = distance ? dy / distance : 0;
  return {
    x: pointer.x,
    y: pointer.y,
    radius,
    stretch,
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
    // An ellipse has no forward direction: opposite travel uses the same matrix.
    xx: 1 + (stretch - 1) * nx * nx,
    xy: (stretch - 1) * nx * ny,
    yy: 1 + (stretch - 1) * ny * ny,
  };
}
