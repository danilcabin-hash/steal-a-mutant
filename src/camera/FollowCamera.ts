import * as T from 'three';
import type { Wall } from '../world/collision';

export class FollowCamera {
  readonly camera = new T.PerspectiveCamera(49, 1, 0.09, 135);
  yaw = 0;
  private pitch = 0.29;
  private distance = 8.6;
  private readonly target = new T.Vector3();
  private readonly offset = new T.Vector3();
  private readonly testPoint = new T.Vector3();

  turn(x: number, y: number) {
    this.yaw = (this.yaw - x * 0.007) % (Math.PI * 2);
    this.pitch = T.MathUtils.clamp(this.pitch + y * 0.005, 0.10, 1.16);
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.fov = width < height ? 64 : 49;
    this.camera.updateProjectionMatrix();
  }

  update(dt: number, position: T.Vector3, walls: readonly Wall[]) {
    this.target.set(position.x, 1.24, position.z);
    const horizontal = Math.cos(this.pitch);
    this.offset.set(Math.sin(this.yaw) * horizontal, Math.sin(this.pitch), Math.cos(this.yaw) * horizontal);

    let clear = 8.6;
    for (let distance = 0.2; distance <= 8.6; distance += 0.17) {
      this.testPoint.copy(this.target).addScaledVector(this.offset, distance);
      const { x, y, z } = this.testPoint;
      if (walls.some(wall => y < wall.height + 0.25
        && Math.abs(x - wall.x) < wall.width / 2 + 0.23
        && Math.abs(z - wall.z) < wall.depth / 2 + 0.23)) {
        clear = Math.max(0.16, distance - 0.18);
        break;
      }
    }
    this.distance = Math.min(clear, T.MathUtils.damp(this.distance, clear, 8, dt));
    this.camera.position.copy(this.target).addScaledVector(this.offset, this.distance);
    this.camera.lookAt(this.target);
  }
}
