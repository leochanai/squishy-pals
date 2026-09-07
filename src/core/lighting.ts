import { AmbientLight, CanvasTexture, Color, DirectionalLight, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Scene } from 'three/webgpu';

/** A diffuse studio rig and a horizonless, soft contact patch. */
export function createLighting(scene: Scene) {
  scene.background = null;
  // Inverse ACES (exposure .98) for page #f5f4f2: WebGPU tone maps the
  // entire output, including basic materials. This unlit floor supplies refraction
  // backdrop without a visible horizon or transparent black edge samples.
  const floor = new Mesh(new PlaneGeometry(200, 200), new MeshBasicMaterial({ color: new Color().setRGB(2.520125, 2.319882, 1.979641) }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.035; scene.add(floor);
  const ambient = new AmbientLight('#ffffff', 1.15);
  const key = new DirectionalLight('#fff4ee', 2.8);
  key.position.set(-3, 7, 5);
  const rim = new DirectionalLight('#e8ddff', 2.4);
  rim.position.set(4, 4, -3);
  const fill = new DirectionalLight('#ffffff', 1.2);
  fill.position.set(1, 2, 6);
  scene.add(ambient, key, rim, fill);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(64, 64, 5, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(89,66,91,0.62)');
  gradient.addColorStop(.4, 'rgba(89,66,91,0.40)');
  gradient.addColorStop(.75, 'rgba(89,66,91,0.09)');
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
