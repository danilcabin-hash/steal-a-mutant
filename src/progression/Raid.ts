import * as T from 'three';
import { balance } from '../config/balance';
import { Progress } from './Progress';

const lootPoint = balance.loot;
const returnPoint = balance.incubator;
const memes = [
  { name: 'Тунг-Тунг Сахур', color: '#9a502d', accent: '#ffba67' },
  { name: 'Кот в тапке', color: '#7b66de', accent: '#ffd58d' },
  { name: 'Гусь на турбо', color: '#fff2d8', accent: '#77e7cd' },
] as const;

function createMeme(index: number, color: string, accent: string) {
  const group = new T.Group();
  const body = new T.MeshStandardMaterial({ color, roughness: 0.85 });
  const trim = new T.MeshStandardMaterial({ color: accent, roughness: 0.75 });
  const dark = new T.MeshStandardMaterial({ color: '#272040' });
  const white = new T.MeshStandardMaterial({ color: '#fff6e5' });
  const cube = new T.BoxGeometry();
  const cylinder = new T.CylinderGeometry(0.5, 0.55, 1, 10);

  function part(mat: T.Material, x: number, y: number, z: number,
    w: number, h: number, d: number, geometry: T.BufferGeometry = cube) {
    const mesh = new T.Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    group.add(mesh);
    return mesh;
  }

  if (index === 0) {
    part(body, 0, 0.98, 0, 0.83, 1.5, 0.63, cylinder);
    part(trim, 0, 1.73, 0, 0.80, 0.05, 0.62, cylinder);
    for (const x of [-0.53, 0.53]) {
      part(body, x, 0.91, 0, 0.16, 0.58, 0.19);
      part(trim, x / 3, 0.12, 0.08, 0.22, 0.24, 0.37);
    }
    part(trim, -0.23, 1.08, 0.25, 0.08, 0.48, 0.05);
  } else if (index === 1) {
    part(trim, 0, 0.23, 0.11, 1.12, 0.44, 0.91);
    part(body, 0, 0.78, 0, 0.82, 0.81, 0.63);
    for (const x of [-0.26, 0.26]) {
      part(body, x, 1.22, 0, 0.24, 0.28, 0.28).rotation.z = -x;
    }
  } else {
    part(body, 0, 0.45, -0.15, 0.74, 0.62, 0.83);
    part(body, 0, 0.92, 0.16, 0.37, 0.92, 0.40);
    part(body, 0, 1.35, 0.18, 0.53, 0.38, 0.53);
    part(trim, 0, 0.56, -0.55, 0.85, 0.15, 0.19);
    part(trim, 0, 1.25, 0.49, 0.33, 0.13, 0.23);
  }
  const eyeY = index === 1 ? 0.91 : 1.4;
  for (const x of [-0.12, 0.12]) {
    part(white, x, eyeY, index === 2 ? 0.44 : 0.32, 0.15, 0.16, 0.08);
    part(dark, x + 0.025, eyeY - 0.011, index === 2 ? 0.49 : 0.38, 0.062, 0.088, 0.05);
  }
  if (index < 2) part(dark, 0, eyeY - 0.2, 0.34, 0.16, 0.045, 0.065);
  return group;
}

export class Raid {
  private readonly figures = memes.map((meme, index) => createMeme(index, meme.color, meme.accent));
  private remaining = 0;
  private phase = 0;
  private incubation = 0;
  private failure = 0;
  private caught = false;

  constructor(private readonly scene: T.Scene, private readonly player: T.Group,
    readonly progress = new Progress()) {
    // Keep the full set in the scene so the game can dispose all its resources.
    scene.add(...this.figures);
    this.figures.forEach((figure, index) => {
      figure.visible = index < this.count;
      if (figure.visible) this.displayCollected(index);
    });
    if (progress.incubating) this.displayIncubation();
    else this.displayLoot();
  }

  get carrying() { return this.remaining > 0; }
  get count() { return this.progress.count; }
  get hatching() { return Math.ceil(this.incubation); }
  get failed() { return this.failure > 0 ? this.caught ? 'Дрон поймал тебя. Попробуй снова!' : 'Время вышло. Добыча вернулась в лабораторию.' : ''; }
  get total() { return memes.length; }
  get seconds() { return Math.ceil(this.remaining); }
  get name() { return memes[this.count]?.name; }
  get collection() { return memes.slice(0, this.count).map(meme => meme.name); }

  get canTake() {
    return !this.carrying && !this.progress.incubating && !!this.name && this.distanceTo(lootPoint) < 2.1;
  }

  take() {
    if (!this.canTake) return;
    const figure = this.figures[this.count]!;
    this.player.add(figure);
    figure.position.set(0.67, 0.7, 0);
    figure.rotation.set(0, 0, -0.16);
    figure.scale.setScalar(0.53);
    this.remaining = balance.escapeSeconds;
    this.failure = 0;
  }

  update(dt: number) {
    this.failure = Math.max(0, this.failure - dt);
    const figure = this.figures[this.count];
    if (!figure) return;
    if (this.progress.incubating) {
      this.incubation = Math.max(0, this.incubation - dt);
      figure.rotation.y += dt * 1.4;
      if (this.incubation === 0) {
        this.displayCollected(this.count);
        this.progress.hatch();
        this.displayLoot();
      }
      return;
    }
    if (!this.carrying) {
      this.phase += dt;
      figure.position.y = 0.28 + Math.sin(this.phase * 2.5) * 0.10;
      figure.rotation.y += dt * 0.65;
      return;
    }

    if (this.distanceTo(returnPoint) < 2.35) {
      this.remaining = 0;
      this.progress.startIncubation();
      this.displayIncubation();
      return;
    }
    if (dt >= this.remaining) this.lose(false);
    else this.remaining -= dt;
  }

  lose(caught: boolean) {
    if (!this.carrying) return;
    this.remaining = 0;
    this.failure = 3;
    this.caught = caught;
    this.displayLoot();
  }

  private displayIncubation() {
    const figure = this.figures[this.count]!;
    this.incubation = balance.incubation[this.count]!;
    this.scene.add(figure);
    figure.visible = true;
    figure.position.set(returnPoint.x, 0.24, returnPoint.z);
    figure.scale.setScalar(0.76);
  }

  private displayCollected(index: number) {
    const figure = this.figures[index]!;
    figure.position.set(index === 1 ? 6.5 : -6.5, 0.20, index === 2 ? 24 : 19);
    figure.scale.setScalar(1.1);
    figure.rotation.set(0, Math.PI, 0);
  }

  private displayLoot() {
    const figure = this.figures[this.count];
    if (!figure) return;
    this.scene.add(figure);
    figure.visible = true;
    figure.position.set(lootPoint.x, 0.28, lootPoint.z);
    figure.rotation.set(0, 0, 0);
    figure.scale.setScalar(1.1);
  }

  private distanceTo(point: { x: number; z: number }) {
    return Math.hypot(this.player.position.x - point.x, this.player.position.z - point.z);
  }
}
