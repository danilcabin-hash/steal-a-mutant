import { Group, Scene } from 'three';
import { describe, expect, it } from 'vitest';
import { Raid } from './Raid';

describe('first raid', () => {
  it('requires proximity, awards one collectible and unlocks the next target', () => {
    const scene = new Scene();
    const player = new Group();
    scene.add(player);
    const raid = new Raid(scene, player);

    raid.take();
    expect(raid.carrying).toBe(false);
    player.position.z = -15;
    raid.take();
    expect(raid.carrying).toBe(true);
    expect(raid.name).toBe('Тунг-Тунг Сахур');
    player.position.z = 23;
    raid.update(0.05);
    raid.update(0.05);
    expect(raid.count).toBe(1);
    expect(raid.name).toBe('Кот в тапке');
    expect(player.children).toHaveLength(0);
  });

  it('resets an expired raid without advancing the collection', () => {
    const scene = new Scene();
    const player = new Group();
    scene.add(player);
    player.position.z = -15;
    const raid = new Raid(scene, player);

    raid.take();
    raid.update(19);
    expect(raid.count).toBe(0);
    expect(raid.canTake).toBe(true);
    expect(player.children).toHaveLength(0);
  });
});
