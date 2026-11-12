import * as T from 'three';
import { canStand } from '../world/collision';
import type { Wall } from '../world/collision';
import { spawn } from '../world/World';

export class Player {
  readonly root = new T.Group();
  private readonly model = new T.Group();
  private readonly arms: T.Group[] = [];
  private readonly legs: T.Group[] = [];
  private readonly velocity = new T.Vector2();
  private phase = 0;

  constructor(scene: T.Scene) {
    this.root.position.set(spawn.x, 0, spawn.z);
    this.root.add(this.model);
    scene.add(this.root);

    const cube = new T.BoxGeometry();
    const round = new T.SphereGeometry(1, 12, 8);
    const suit = new T.MeshStandardMaterial({ color: '#6745be' });
    const lime = new T.MeshStandardMaterial({ color: '#b7ef6d' });
    const dark = new T.MeshStandardMaterial({ color: '#312551' });
    const glass = new T.MeshStandardMaterial({ color: '#83dded', roughness: 0.29 });
    const highlight = new T.MeshStandardMaterial({ color: '#d2faff' });

    function piece(parent: T.Group, geometry: T.BufferGeometry, mat: T.Material,
      x: number, y: number, z: number, w: number, h: number, d: number) {
      const mesh = new T.Mesh(geometry, mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, d);
      parent.add(mesh);
    }

    piece(this.model, cube, suit, 0, 0.92, 0, 0.69, 0.63, 0.45);
    piece(this.model, cube, lime, 0, 0.96, 0.27, 0.43, 0.49, 0.24);
    piece(this.model, cube, dark, 0, 0.85, 0.41, 0.29, 0.11, 0.05);
    piece(this.model, round, lime, 0, 1.54, 0, 0.46, 0.40, 0.39);
    piece(this.model, round, glass, 0, 1.53, -0.30, 0.37, 0.24, 0.19);
    piece(this.model, round, highlight, -0.13, 1.63, -0.44, 0.12, 0.043, 0.03);
    for (const side of [-1, 1]) {
      const arm = new T.Group();
      arm.position.set(side * 0.45, 1.14, 0);
      this.model.add(arm);
      piece(arm, cube, suit, 0, -0.17, 0, 0.20, 0.39, 0.24);
      piece(arm, cube, lime, 0, -0.36, 0, 0.23, 0.17, 0.26);
      this.arms.push(arm);

      const leg = new T.Group();
      leg.position.set(side * 0.20, 0.65, 0);
      this.model.add(leg);
      piece(leg, cube, suit, 0, -0.23, 0, 0.26, 0.48, 0.26);
      piece(leg, cube, dark, 0, -0.54, -0.07, 0.31, 0.22, 0.40);
      this.legs.push(leg);
    }
    const shadow = new T.Mesh(new T.CircleGeometry(1, 24),
      new T.MeshBasicMaterial({ color: '#24194e', opacity: 0.23, transparent: true, depthWrite: false }));
    shadow.position.y = 0.048;
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(0.61, 0.41, 1);
    this.root.add(shadow);
  }

  update(dt: number, right: number, forward: number, yaw: number, walls: readonly Wall[]) {
    const norm = Math.max(1, Math.hypot(right, forward));
    const speed = 5.8 / norm;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const easing = 1 - Math.exp(-dt * 16);
    const targetX = (right * cos - forward * sin) * speed;
    const targetZ = (-right * sin - forward * cos) * speed;
    this.velocity.x += (targetX - this.velocity.x) * easing;
    this.velocity.y += (targetZ - this.velocity.y) * easing;

    const pos = this.root.position;
    const x = pos.x + this.velocity.x * dt;
    if (canStand(x, pos.z, 0.43, walls)) pos.x = x;
    else this.velocity.x = 0;
    const z = pos.z + this.velocity.y * dt;
    if (canStand(pos.x, z, 0.43, walls)) pos.z = z;
    else this.velocity.y = 0;

    const moving = Math.min(this.velocity.length() / 5.8, 1);
    if (moving > 0.02) {
      const angle = Math.atan2(-this.velocity.x, -this.velocity.y) - this.model.rotation.y;
      this.model.rotation.y += Math.atan2(Math.sin(angle), Math.cos(angle)) * easing;
    }
    this.phase += dt * 13 * moving;
    const stride = Math.sin(this.phase) * moving;
    this.model.position.y = Math.abs(stride) * 0.08 + 0.031;
    this.arms.forEach((arm, i) => { arm.rotation.x = stride * (i ? 0.54 : -0.54); });
    this.legs.forEach((leg, i) => { leg.rotation.x = stride * (i ? -0.55 : 0.55); });
  }
}
