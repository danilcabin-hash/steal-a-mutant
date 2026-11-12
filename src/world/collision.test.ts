import { describe, expect, it } from 'vitest';
import { canStand, mapEdge } from './collision';

describe('player collision', () => {
  const walls = [{ x: 0, z: 0, width: 4, depth: 1, height: 3 }];

  it('accounts for the radius at both faces and corners', () => {
    expect(canStand(0, 0.8, 0.43, walls)).toBe(false);
    expect(canStand(2.3, 0.8, 0.43, walls)).toBe(false);
    expect(canStand(2.4, 0.9, 0.43, walls)).toBe(true);
    expect(canStand(0, 1, 0.43, walls)).toBe(true);
  });

  it('keeps the entire collision circle within the map', () => {
    expect(canStand(mapEdge.x, 0, 0.43, walls)).toBe(false);
    expect(canStand(0, -mapEdge.z, 0.43, walls)).toBe(false);
    expect(canStand(mapEdge.x - 1, 0, 0.43, walls)).toBe(true);
  });
});
