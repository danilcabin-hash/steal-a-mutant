import * as T from 'three';
import { FollowCamera } from '../camera/FollowCamera';
import { Input } from '../player/Input';
import { Player } from '../player/Player';
import { Raid } from '../progression/Raid';
import { Progress } from '../progression/Progress';
import { Guardian } from '../enemies/Guardian';
import { balance } from '../config/balance';
import { Hud, element } from '../ui/Hud';
import { createWorld, locationAt } from '../world/World';

export class Game {
  private readonly events = new AbortController();
  private readonly canvas = element<HTMLCanvasElement>('scene');
  private readonly hud = new Hud();
  private readonly graphics = element<HTMLButtonElement>('graphics');
  private readonly scene = new T.Scene();
  private readonly follow = new FollowCamera();
  private renderer?: T.WebGLRenderer;
  private input?: Input;
  private textures: T.Texture[] = [];
  private paused = false;
  private contextLost = false;
  private last = 0;
  private lightweight = true;

  constructor() {
    const context = this.canvas.getContext('webgl2', { alpha: false, antialias: false });
    if (!context) {
      this.graphics.disabled = true;
      this.hud.show('Нужен WebGL 2', 'Открой игру в браузере с поддержкой WebGL 2 и аппаратного ускорения.');
      return;
    }

    const renderer = new T.WebGLRenderer({ canvas: this.canvas, context });
    this.renderer = renderer;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    const { walls, labels } = createWorld(this.scene);
    this.textures = labels;
    const player = new Player(this.scene);
    let storage: Storage | undefined;
    try { storage = window.localStorage; } catch { /* Persistence is optional. */ }
    const progress = new Progress(storage);
    const raid = new Raid(this.scene, player.root, progress);
    const guardian = new Guardian(this.scene);
    let saveIn = 3;
    this.hud.upgrade.addEventListener('click', () => {
      if (!this.paused && locationAt(player.root.position.x, player.root.position.z) === 'База') progress.upgrade();
    }, { signal: this.events.signal });
    const input = new Input(this.canvas, element('stick'), element('knob'));
    this.input = input;
    const options = { signal: this.events.signal };
    const resize = () => {
      const width = Math.max(1, this.canvas.clientWidth);
      const height = Math.max(1, this.canvas.clientHeight);
      const viewportCap = Math.sqrt((this.lightweight ? 750_000 : 2_400_000) / (width * height));
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.lightweight ? 0.8 : 1.5, viewportCap));
      renderer.setSize(width, height, false);
      this.follow.resize(width, height);
      if (!this.contextLost) renderer.render(this.scene, this.follow.camera);
    };
    this.follow.update(0, player.root.position, walls);
    resize();
    window.addEventListener('resize', resize, options);
    const take = () => {
      if (!this.paused) raid.take();
    };
    this.hud.take.addEventListener('click', take, options);
    window.addEventListener('keydown', event => {
      if (event.code === 'KeyE' && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey) take();
    }, options);
    this.graphics.addEventListener('click', () => {
      this.lightweight = !this.lightweight;
      this.graphics.textContent = this.lightweight ? 'Графика · Лёгкая' : 'Графика · Чёткая';
      this.graphics.setAttribute('aria-pressed', String(this.lightweight));
      resize();
    }, options);

    const pause = () => {
      progress.save();
      input.reset();
      this.paused = true;
      this.last = 0;
      if (!this.contextLost) this.hud.show('Пауза', 'Продолжи, чтобы вернуться на карту.', true);
    };
    window.addEventListener('blur', pause, options);
    window.addEventListener('pagehide', () => progress.save(), options);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pause();
    }, options);
    this.hud.resume.addEventListener('click', () => {
      input.reset();
      this.paused = false;
      this.last = 0;
      this.hud.hide();
    }, options);
    this.canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      this.contextLost = true;
      pause();
      this.hud.show('Графика временно недоступна', 'Ожидаем восстановления WebGL.');
    }, options);
    this.canvas.addEventListener('webglcontextrestored', () => {
      this.contextLost = false;
      resize();
      pause();
    }, options);

    renderer.setAnimationLoop(time => {
      if (this.paused) return;
      if (this.lightweight && this.last && time - this.last < 32) return;
      const dt = this.last ? Math.min((time - this.last) / 1000, 0.10) : 0;
      this.last = time;
      this.follow.turn(input.lookX, input.lookY);
      input.lookX = input.lookY = 0;
      const { x: oldX, z: oldZ } = player.root.position;
      player.update(dt, input.right, input.forward, this.follow.yaw, walls, progress.speed);
      const { x, z } = player.root.position;
      const pad = balance.trainingPad;
      const onPad = Math.abs(x - pad.x) < pad.halfWidth && Math.abs(z - pad.z) < pad.halfDepth;
      progress.update(dt, onPad && Math.hypot(x - oldX, z - oldZ) > dt * 0.5);
      this.follow.update(dt, player.root.position, walls);
      raid.update(dt);
      if (guardian.update(dt, player.root.position, raid.carrying && z < 15, raid.count, walls)) raid.lose(true);
      this.hud.update(locationAt(x, z), raid, onPad);
      saveIn -= dt;
      if (saveIn <= 0) {
        saveIn = 3;
        progress.save();
      }
      renderer.render(this.scene, this.follow.camera);
    });
  }

  dispose() {
    this.events.abort();
    this.input?.dispose();
    this.renderer?.setAnimationLoop(null);
    const resources = new Set<T.BufferGeometry | T.Material | T.Texture>(this.textures);
    this.scene.traverse(node => {
      if (!(node instanceof T.Mesh)) return;
      if (node instanceof T.InstancedMesh) node.dispose();
      resources.add(node.geometry);
      for (const mat of Array.isArray(node.material) ? node.material : [node.material]) resources.add(mat);
    });
    resources.forEach(resource => resource.dispose());
    this.renderer?.dispose();
  }
}
