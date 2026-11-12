import { describe, expect, it } from 'vitest';
import { Progress } from './Progress';

describe('base progress', () => {
  it('resumes a pending hatch and prevents paying out twice', () => {
    let value: string | null = null;
    const storage = { getItem: () => value, setItem: (_key: string, next: string) => { value = next; } };
    new Progress(storage).startIncubation();
    const resumed = new Progress(storage);
    expect(resumed.incubating).toBe(true);
    resumed.hatch();
    resumed.hatch();
    expect(resumed.count).toBe(1);
    expect(resumed.income).toBe(4);
    resumed.upgrade();
    expect(resumed.money).toBe(0);
    resumed.update(6, false);
    const speed = resumed.speed;
    resumed.upgrade();
    const reloaded = new Progress(storage);
    expect(reloaded.money).toBe(0);
    expect(reloaded.speed).toBeGreaterThan(speed);
    expect(reloaded.count).toBe(1);
  });

  it('limits training to the configured maximum', () => {
    const progress = new Progress();
    progress.update(60, true);
    expect(progress.training).toBe(10);
    expect(progress.speed).toBe(6.8);
  });
});
