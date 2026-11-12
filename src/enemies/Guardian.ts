import * as T from 'three';
import { balance } from '../config/balance';
import { canStand } from '../world/collision';
import type { Wall } from '../world/collision';

const home = { x: 1.55, z: -20 };
const radius = 0.45;

export class Guardian {
  readonly root = new T.Group();
  private readonly eye = new T.MeshStandardMaterial({ color: '#9bfdd5', emissive: '#26706a' });
  private alertTime = 0;

  constructor(scene: T.Scene) {
    const chassis = new T.MeshStandardMaterial({ color: '#342958' });
    const armor = new T.MeshStandardMaterial({ color: '#eeb069' });
    const cube = new T.BoxGeometry();
    const add = (mat: T.Material, x: number, y: number, z: number, w: number, h: number, d: number) => {
      const mesh = new T.Mesh(cube, mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, d);
      this.root.add(mesh);
    };
    add(chassis, 0, 0.61, 0, 1.02, 0.72, 0.78);
    add(armor, 0, 1.08, 0, 0.82, 0.34, 0.63);
    add(this.eye, 0, 1.08, 0.33, 0.57, 0.13, 0.06);
    for (const x of [-0.41, 0.41]) add(chassis, x, 0.19, 0, 0.26, 0.38, 0.92);
    this.root.position.set(home.x, 0, home.z);
    scene.add(this.root);
  }

  update(dt: number, player: T.Vector3, chasing: boolean, level: number, walls: readonly Wall[]) {
    const pos = this.root.position;
    this.alertTime = chasing ? this.alertTime + dt : 0;
    this.eye.color.setHex(chasing ? 0xff5353 : 0x9bfdd5);
    const active = chasing && this.alertTime > 0.55;
    const target = active ? player : home;
    if (chasing && !active) return false;
    const dx = target.x - pos.x;
    const dz = target.z - pos.z;
    const distance = Math.hypot(dx, dz);
    if (active && distance < 0.95) return true;
    if (distance < 0.01) return false;
    const ratio = Math.min(1, dt * (active ? balance.guardSpeed[level] ?? 4.7 : 6) / distance);
    const x = pos.x + dx * ratio;
    const z = pos.z + dz * ratio;
    if (canStand(x, pos.z, radius, walls)) pos.x = x;
    if (canStand(pos.x, z, radius, walls)) pos.z = z;
    this.root.rotation.y = Math.atan2(dx, dz);
    return false;
  }
}
