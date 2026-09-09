import { AmbientLight, CanvasTexture, Color, DirectionalLight, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Scene } from 'three/webgpu';

/** Two broad reflection cards keep the toy highlights continuous. */
export function createStudioEnvironment() {
  const scene = new Scene();
  scene.background = new Color().setRGB(.12, .12, .12);
  const geometry = new PlaneGeometry(1, 1);
  const keyMaterial = new MeshBasicMaterial({ color: new Color().setRGB(8, 7.6, 7.2) });
  const fillMaterial = new MeshBasicMaterial({ color: new Color().setRGB(3, 3.1, 3.4) });
  const key = new Mesh(geometry, keyMaterial);
  key.position.set(-5, 7, 6); key.scale.set(12, 8, 1); key.lookAt(0, 0, 0);
  const fill = new Mesh(geometry, fillMaterial);
  fill.position.set(7, 3, -3); fill.scale.set(5, 10, 1); fill.lookAt(0, 0, 0);
  scene.add(key, fill);
  return { scene, dispose() { geometry.dispose(); keyMaterial.dispose(); fillMaterial.dispose(); } };
}

/** A diffuse studio rig and a horizonless, soft contact patch. */
export function createLighting(scene: Scene) {
  // Inverse ACES (exposure .98) for page #f5f4f2: WebGPU tone maps the
  // entire output, including basic materials. Use the same opaque radiance above
  // and below the horizon so raised jelly never refracts a transparent clear color.
  const backdrop = new Color().setRGB(2.520125, 2.319882, 1.979641);
  scene.background = backdrop;
  const floor = new Mesh(new PlaneGeometry(200, 200), new MeshBasicMaterial({ color: backdrop }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.035; scene.add(floor);
  const ambient = new AmbientLight('#ffffff', 0.3);
  const key = new DirectionalLight('#fff4ee', 1.9);
  key.position.set(-3, 7, 5);
  const rim = new DirectionalLight('#e8ddff', 0.85);
  rim.position.set(4, 4, -3);
  const fill = new DirectionalLight('#ffffff', 0.25);
  fill.position.set(1, 2, 6);
  scene.add(ambient, key, rim, fill);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(64, 64, 5, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(89,66,91,0.72)');
  gradient.addColorStop(.24, 'rgba(89,66,91,0.46)');
  gradient.addColorStop(.58, 'rgba(89,66,91,0.12)');
  gradient.addColorStop(1, 'rgba(89,66,91,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new CanvasTexture(canvas);
  const material = new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  const mesh = new Mesh(new PlaneGeometry(7.3, 6), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -.018;
  const shadow = new Group();
  shadow.add(mesh);
  scene.add(shadow);
  return { shadow, material, dispose() { texture.dispose(); mesh.geometry.dispose(); material.dispose(); floor.geometry.dispose(); floor.material.dispose(); } };
}
