import * as T from 'three';
import type { Wall } from './collision';

export const spawn = { x: 0, z: 19 };

export function createWorld(scene: T.Scene) {
  scene.background = new T.Color('#b3e2ff');
  scene.fog = new T.Fog('#b3e2ff', 52, 116);
  scene.add(new T.HemisphereLight('#fff7dc', '#8a71ac', 2.15));
  const sun = new T.DirectionalLight('#fff1ca', 2.65);
  sun.position.set(-18, 28, 12);
  scene.add(sun);

  const walls: Wall[] = [];
  const labels: T.Texture[] = [];
  const materials = new Map<string, T.MeshStandardMaterial>();
  const box = new T.BoxGeometry();
  const sphere = new T.IcosahedronGeometry(1, 0);
  const cylinder = new T.CylinderGeometry(1, 1, 1, 12);
  const group = new T.Group();
  scene.add(group);
  const material = (color: string) => {
    let result = materials.get(color);
    if (!result) {
      result = new T.MeshStandardMaterial({ color, roughness: 0.83 });
      materials.set(color, result);
    }
    return result;
  };

  function shape(geometry: T.BufferGeometry, color: string, x: number, y: number, z: number,
    width: number, height: number, depth: number) {
    const mesh = new T.Mesh(geometry, material(color));
    mesh.position.set(x, y, z);
    mesh.scale.set(width, height, depth);
    group.add(mesh);
    return mesh;
  }

  const block = (color: string, x: number, y: number, z: number, w: number, h: number, d: number) =>
    shape(box, color, x, y, z, w, h, d);

  function barrier(x: number, z: number, width: number, depth: number, height: number, color = '#6453a2') {
    walls.push({ x, z, width, depth, height });
    block(color, x, height / 2, z, width, height, depth);
    block('#c4b3ff', x, height, z, width + 0.12, 0.16, depth + 0.12);
  }

  function sign(text: string, x: number, y: number, z: number, width: number, yaw = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#291e49';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#baf67f';
    ctx.lineWidth = 5;
    ctx.strokeRect(11, 11, 490, 106);
    ctx.font = '900 54px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f9fff2';
    ctx.fillText(text, 256, 64, 455);
    const map = new T.CanvasTexture(canvas);
    map.colorSpace = T.SRGBColorSpace;
    labels.push(map);
    const mesh = new T.Mesh(new T.PlaneGeometry(width, width / 4),
      new T.MeshBasicMaterial({ map }));
    mesh.position.set(x, y, z);
    mesh.rotation.y = yaw;
    group.add(mesh);
  }

  block('#8ac572', 0, -0.48, 0, 60, 0.85, 74);
  block('#79ac66', 0, -0.99, 0, 60, 0.4, 74);
  block('#546682', 0, -0.14, 5, 8, 0.22, 23);
  for (const x of [-4.15, 4.15]) block('#e8e2ca', x, -0.10, 5, 0.35, 0.22, 23);
  for (let z = -5; z < 16; z += 2.7) block('#fcdf83', 0, -0.013, z, 0.19, 0.035, 1.25);
  for (let x = -2.4; x <= 2.5; x += 0.6) block('#fbdfa0', x, 0.019, -5.12, 0.30, 0.035, 0.83);
  for (const x of [-4.7, 4.7]) {
    for (const z of [-4, 5, 14]) {
      block('#494165', x, 0.85, z, 0.19, 1.7, 0.19);
      block('#fff3a0', x, 1.75, z, 0.45, 0.2, 0.45);
    }
  }

  block('#2b7572', 0, -0.22, 22, 20, 0.45, 14);
  block('#8fd9c2', 0, -0.065, 22, 19.5, 0.18, 13.5);
  for (const x of [-6.5, 6.5]) {
    for (const z of [19, 24]) {
      shape(cylinder, '#387d81', x, 0.075, z, 1.58, 0.16, 1.58);
      shape(cylinder, '#aef9dc', x, 0.17, z, 1.4, 0.07, 1.4);
    }
  }
  shape(cylinder, '#4f9b65', 0, 0.062, 23, 2.3, 0.12, 2.3);
  shape(cylinder, '#bef67f', 0, 0.126, 23, 1.91, 0.04, 1.91);
  barrier(-8.8, 27.7, 0.42, 0.45, 2.8, '#347e79');
  barrier(-4.2, 27.7, 0.42, 0.45, 2.8, '#347e79');
  sign('БАЗА', -6.5, 2.3, 27.4, 4.85, Math.PI);

  block('#352c5e', 0, -0.16, -17, 24.9, 0.3, 22.6);
  block('#afa6d4', 0, -0.05, -17, 23.7, 0.12, 21.7);
  block('#d5ccf1', 0, -0.005, -16.7, 5.2, 0.05, 20.7);
  shape(cylinder, '#554583', 0, 0.10, -15, 1.37, 0.20, 1.37);
  shape(cylinder, '#a6ffe6', 0, 0.208, -15, 1.20, 0.026, 1.20);
  for (const x of [-12, 12]) {
    barrier(x, -17, 0.65, 22, 3.6);
    barrier(x / 2 + Math.sign(x) * 1.3, -6, 9.4, 0.7, 4.2);
    block('#554583', x * 0.61, 4.3, -6, 9.6, 0.24, 1.35);
    for (const offset of [0, 2.2, -2.2]) {
      block('#40356b', x * 0.61 + offset, 2.16, -5.58, 1.65, 1.32, 0.18);
      block('#9ce9fa', x * 0.61 + offset, 2.19, -5.46, 1.38, 1.05, 0.11);
      block('#ddfaff', x * 0.61 + offset, 2.58, -5.39, 1.24, 0.12, 0.045);
    }
    barrier(x / 4, -23.6, 0.36, 7.4, 2.55, '#8d77bf');
    barrier(x / 4, -9.3, 0.36, 5.9, 2.55, '#8d77bf');
    barrier(x * 0.62, -17.7, 8.6, 0.36, 2.55, '#8d77bf');
    for (const z of [-10, -23]) {
      barrier(x * 0.71, z, 2.5, 1.25, 0.75, '#4f4577');
      shape(cylinder, '#82e7d2', x * 0.71, 1.2, z, 0.29, 0.78, 0.29);
    }
    barrier(x / 4, -5.85, 0.62, 0.95, 4.8, '#57457f');
    block('#b9f87d', x / 4, 2.12, -5.32, 0.18, 2.55, 0.13);
    block('#3a305a', x / 4, 0.58, -5.28, 0.68, 0.39, 0.22);
    block('#ffcb68', x / 4, 0.62, -5.15, 0.48, 0.09, 0.06);
    block('#3a305a', x * 0.61, 0.64, -5.56, 8.5, 0.44, 0.13);
    block('#b9f87d', x * 0.61, 0.69, -5.48, 8.3, 0.07, 0.05);
    for (const z of [-8.7, -12.4, -16.1, -19.8, -23.5]) {
      block('#8fd9c2', x * 0.184, 0.034, z, 0.13, 0.028, 2.4);
    }
  }
  barrier(0, -28, 24.6, 0.65, 3.6);
  block('#4f3b7c', 0, 4.65, -5.85, 6.65, 0.56, 1.05);
  sign('ЛАБОРАТОРИЯ', 0, 4.55, -5.27, 5.5);

  for (const [x, z] of [[-19, -19], [20, -22], [-15, -1], [14, 2], [-17, 13], [16, 16],
    [-20, 24], [18, 26], [-24, -30], [21, -33], [-10, -32], [9, -33]] as const) {
    const height = 1.5 + Math.abs(x % 4) * 0.25;
    shape(cylinder, '#8f654e', x, height / 2, z, 0.23, height, 0.23);
    shape(sphere, '#548f53', x, height + 0.9, z, 1.72, 1.52, 1.62);
    shape(sphere, '#84c459', x - 0.55, height + 1.6, z + 0.3, 1.35, 1.31, 1.35);
    walls.push({ x, z, width: 0.46, depth: 0.46, height });
  }
  for (const [x, z] of [[-9, 6], [9, 9], [-17, -11], [19, -11], [-15, 23], [15, 29]] as const) {
    shape(sphere, '#6eae69', x, 0.38, z, 1.3, 0.72, 0.95);
    shape(sphere, '#f7b66d', x + 0.25, 0.65, z + 0.3, 0.25, 0.25, 0.25);
    shape(sphere, '#fff0a5', x - 0.45, 0.56, z + 0.48, 0.19, 0.19, 0.19);
  }
  for (const [x, z, size] of [[-33, -33, 13], [34, -34, 17], [-39, 5, 13], [38, 10, 12],
    [-19, -45, 14], [16, -48, 15]] as const) {
    shape(sphere, '#88b882', x, -2, z, size, size * 0.65, size);
  }
  for (const [x, y, z] of [[-25, 15, -39], [4, 20, -43], [26, 14, -35], [-32, 13, 1], [34, 17, -5]] as const) {
    shape(sphere, '#ffffff', x, y, z, 5.7, 1.35, 2.1);
    shape(sphere, '#ffffff', x - 1.1, y + 0.85, z, 3.1, 1.45, 2.05);
  }

  for (const geometry of [box, cylinder, sphere]) {
    const batches = new Map<T.Material, T.Mesh[]>();
    for (const mesh of group.children) {
      if (!(mesh instanceof T.Mesh) || mesh.geometry !== geometry) continue;
      const batch = batches.get(mesh.material);
      if (batch) batch.push(mesh);
      else batches.set(mesh.material, [mesh]);
    }
    for (const [material, meshes] of batches) {
      if (meshes.length < 2) continue;
      const instances = new T.InstancedMesh(geometry, material, meshes.length);
      meshes.forEach((mesh, index) => {
        mesh.updateMatrix();
        instances.setMatrixAt(index, mesh.matrix);
        group.remove(mesh);
      });
      group.add(instances);
    }
  }
  return { walls, labels };
}

export function locationAt(x: number, z: number) {
  if (Math.abs(x) < 12 && z < -6 && z > -28) return 'Лаборатория';
  if (Math.abs(x) <= 10 && z >= 15 && z <= 29) return 'База';
  return 'Территория';
}
