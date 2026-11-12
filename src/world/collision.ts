export interface Wall {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
}

export const mapEdge = { x: 29, z: 36 };

export function canStand(x: number, z: number, radius: number, walls: readonly Wall[]) {
  if (Math.abs(x) > mapEdge.x - radius || Math.abs(z) > mapEdge.z - radius) return false;
  return !walls.some(wall => {
    const dx = Math.max(0, Math.abs(x - wall.x) - wall.width / 2);
    const dz = Math.max(0, Math.abs(z - wall.z) - wall.depth / 2);
    return dx * dx + dz * dz < radius * radius;
  });
}
