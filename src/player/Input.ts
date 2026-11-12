const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);

export class Input {
  private readonly events = new AbortController();
  private readonly keys = new Set<string>();
  private stickPointer: number | null = null;
  private lookPointer: number | null = null;
  private lastX = 0;
  private lastY = 0;
  private stickX = 0;
  private stickY = 0;
  lookX = 0;
  lookY = 0;

  constructor(private canvas: HTMLCanvasElement, private stick: HTMLElement, private knob: HTMLElement) {
    const options = { signal: this.events.signal };
    window.addEventListener('keydown', event => {
      if (!movementKeys.has(event.code) || event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();
      this.keys.add(event.code);
    }, options);
    window.addEventListener('keyup', event => this.keys.delete(event.code), options);

    canvas.addEventListener('pointerdown', event => {
      if (this.lookPointer !== null || event.button !== 0) return;
      this.lookPointer = event.pointerId;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    }, options);
    canvas.addEventListener('pointermove', event => {
      if (event.pointerId !== this.lookPointer) return;
      this.lookX += event.clientX - this.lastX;
      this.lookY += event.clientY - this.lastY;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    }, options);
    canvas.addEventListener('lostpointercapture', event => {
      if (event.pointerId === this.lookPointer) this.lookPointer = null;
    }, options);

    const updateStick = (event: PointerEvent) => {
      const rect = stick.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      const radius = rect.width * 0.32;
      const scale = Math.max(radius, Math.hypot(x, y));
      this.stickX = x / scale;
      this.stickY = y / scale;
      knob.style.transform = `translate(${this.stickX * radius}px, ${this.stickY * radius}px)`;
    };
    stick.addEventListener('pointerdown', event => {
      if (this.stickPointer !== null || event.button !== 0) return;
      this.stickPointer = event.pointerId;
      stick.setPointerCapture(event.pointerId);
      updateStick(event);
    }, options);
    stick.addEventListener('pointermove', event => {
      if (event.pointerId === this.stickPointer) updateStick(event);
    }, options);
    stick.addEventListener('lostpointercapture', event => {
      if (event.pointerId === this.stickPointer) this.resetStick();
    }, options);
  }

  get right() {
    return this.axis('KeyD', 'ArrowRight', 'KeyA', 'ArrowLeft') + this.stickX;
  }

  get forward() {
    return this.axis('KeyW', 'ArrowUp', 'KeyS', 'ArrowDown') - this.stickY;
  }

  private axis(a: string, b: string, c: string, d: string) {
    return Number(this.keys.has(a) || this.keys.has(b)) - Number(this.keys.has(c) || this.keys.has(d));
  }

  private resetStick() {
    this.stickPointer = null;
    this.stickX = this.stickY = 0;
    this.knob.style.transform = '';
  }

  reset() {
    this.keys.clear();
    if (this.lookPointer !== null && this.canvas.hasPointerCapture(this.lookPointer)) {
      this.canvas.releasePointerCapture(this.lookPointer);
    }
    if (this.stickPointer !== null && this.stick.hasPointerCapture(this.stickPointer)) {
      this.stick.releasePointerCapture(this.stickPointer);
    }
    this.lookPointer = null;
    this.resetStick();
    this.lookX = this.lookY = 0;
  }

  dispose() {
    this.reset();
    this.events.abort();
  }
}
