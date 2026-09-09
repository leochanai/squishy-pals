import * as THREE from 'three/webgpu';
import type { Character } from '../characters/types';
import type { AccessoryId } from './accessory-options';

type Fit = { center: [number, number, number]; width: number; rise: number; top: number; hatSize: number; side?: boolean };
const fits: Record<string, Fit> = {
  sealmochi: { center: [0, 1.4, 1.1], width: .62, rise: .5, top: 1.92, hatSize: .43 },
  turtlemochi: { center: [0, .88, 1.3], width: .55, rise: .47, top: 1.4, hatSize: .43 },
  crabmochi: { center: [0, 1.03, 0], width: 1.2, rise: .59, top: 1.52, hatSize: .53 },
  octomochi: { center: [0, 1.6, -.12], width: 1.5, rise: 1.34, top: 2.76, hatSize: .85 },
  cuttlemochi: { center: [0, 1.15, -.2], width: 1.08, rise: .75, top: 1.8, hatSize: .65 },
  squidmochi: { center: [0, 1.75, .03], width: .78, rise: 1.7, top: 2.9, hatSize: .6 },
  goldmochi: { center: [0, 1.42, .1], width: 1.05, rise: 1.13, top: 2.35, hatSize: .64 },
  whalemochi: { center: [-.8, 1.5, 0], width: 1.07, rise: 1.03, top: 2.38, hatSize: .67, side: true },
  sharkmochi: { center: [-1.03, 1.42, 0], width: .79, rise: .86, top: 1.94, hatSize: .55, side: true },
};

/** Rest-space accessories share the character's deformation field and heading. */
export function createAccessories(character: Character, characterId: string) {
  const fit = fits[characterId];
  const root = new THREE.Group(); root.name = 'accessories';
  const groups = new Map<AccessoryId, THREE.Group>();
  const parts: { mesh: THREE.Mesh; rest: Float32Array; id: AccessoryId }[] = [];
  const materials = [
    new THREE.MeshStandardNodeMaterial({ color: '#446d70', roughness: .48, metalness: .12 }),
    new THREE.MeshStandardNodeMaterial({ color: '#d4e7d8', roughness: .65 }),
    new THREE.MeshStandardNodeMaterial({ color: '#efb78c', roughness: .85 }),
    new THREE.MeshStandardNodeMaterial({ color: '#fff0d7', roughness: .8 }),
    new THREE.MeshStandardNodeMaterial({ color: '#876036', roughness: .28, metalness: .65 }),
    new THREE.MeshStandardNodeMaterial({ color: '#d980a6', roughness: .52 }),
  ];
  function add(id: AccessoryId, geometry: THREE.BufferGeometry, material: number) {
    let group = groups.get(id);
    if (!group) { group = new THREE.Group(); group.name = id; group.visible = false; root.add(group); groups.set(id, group); }
    const mesh = new THREE.Mesh(geometry, materials[material]);
    mesh.frustumCulled = false;
    const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
    positions.setUsage(THREE.DynamicDrawUsage);
    parts.push({ mesh, rest: new Float32Array(positions.array), id }); group.add(mesh);
  }
  function tube(id: AccessoryId, points: THREE.Vector3[], radius: number, material: number) {
    add(id, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 40, radius, 8, false), material);
  }
  function headPoint(x: number, y: number, z = 0) {
    return new THREE.Vector3(fit.center[0] + (fit.side ? z + .48 : x), fit.center[1] + y, fit.center[2] + (fit.side ? x : z));
  }
  const arc = Array.from({ length: 33 }, (_, i) => { const angle = i / 32 * Math.PI; return headPoint(Math.cos(angle) * fit.width, Math.sin(angle) * fit.rise); });
  tube('headphones', arc, .095, 0);
  for (const sign of [-1, 1]) {
    const center = headPoint(sign * fit.width, .03);
    const cushion = new THREE.SphereGeometry(1, 20, 14).scale(fit.side ? .27 : .14, .32, fit.side ? .14 : .27).translate(center.x, center.y, center.z);
    add('headphones', cushion, 1);
    const shell = new THREE.SphereGeometry(1, 20, 14).scale(fit.side ? .25 : .13, .29, fit.side ? .13 : .25);
    const outer = headPoint(sign * (fit.width + .14), .03); shell.translate(outer.x, outer.y, outer.z); add('headphones', shell, 0);
  }
  const hatCenter = new THREE.Vector3(fit.center[0], fit.top, characterId === 'sealmochi' ? 1.15 : characterId === 'turtlemochi' ? 1.3 : fit.side ? 0 : .12);
  const size = fit.hatSize;
  const crownHeight = characterId === 'squidmochi' ? .7 : .48;
  add('hat', new THREE.CylinderGeometry(size * .67, size * .86, crownHeight, 40).translate(hatCenter.x, hatCenter.y + crownHeight / 2 - .06, hatCenter.z), 2);
  add('hat', new THREE.CylinderGeometry(size * 1.17, size * 1.23, .07, 40).translate(hatCenter.x, hatCenter.y - .045, hatCenter.z), 2);
  add('hat', new THREE.CylinderGeometry(size * .82, size * .86, .085, 40).translate(hatCenter.x, hatCenter.y + .015, hatCenter.z), 3);

  const eyes = characterId === 'cuttlemochi'
    ? [new THREE.Vector3(-.4, 1.14, 1.105), new THREE.Vector3(.4, 1.14, 1.105)]
    : characterId === 'squidmochi'
      ? [new THREE.Vector3(-.3, 1.47, .59), new THREE.Vector3(.3, 1.47, .59)]
      : ['left-eye', 'right-eye'].map(name => character.object.getObjectByName(name)!.position.clone());
  const ringRadius = characterId === 'sealmochi' ? .25 : characterId === 'turtlemochi' ? .21 : characterId === 'squidmochi' ? .225 : characterId === 'cuttlemochi' ? .25 : .3;
  for (const eye of eyes) {
    const sign = fit.side ? Math.sign(eye.z) : 1;
    eye.z += sign * .11;
    add('glasses', new THREE.TorusGeometry(ringRadius, .033, 8, 36).translate(eye.x, eye.y, eye.z), 4);
  }
  if (fit.side) {
    tube('glasses', [eyes[0].clone().add(new THREE.Vector3(-ringRadius, .04, 0)), new THREE.Vector3(-1.98, eyes[0].y + .1, eyes[0].z * .55), new THREE.Vector3(-2.02, eyes[0].y + .1, 0), new THREE.Vector3(-1.98, eyes[1].y + .1, eyes[1].z * .55), eyes[1].clone().add(new THREE.Vector3(-ringRadius, .04, 0))], .029, 4);
  } else {
    tube('glasses', [eyes[0].clone().add(new THREE.Vector3(ringRadius, .04, 0)), eyes[0].clone().lerp(eyes[1], .5).add(new THREE.Vector3(0, .09, .02)), eyes[1].clone().add(new THREE.Vector3(-ringRadius, .04, 0))], .03, 4);
    for (let i = 0; i < eyes.length; i++) {
      const sign = i === 0 ? -1 : 1;
      tube('glasses', [eyes[i].clone().add(new THREE.Vector3(sign * ringRadius, 0, 0)), new THREE.Vector3(sign * fit.width, eyes[i].y + .1, eyes[i].z * .65), headPoint(sign * fit.width, 0)], .027, 4);
    }
  }
  const bowCenter = new THREE.Vector3(hatCenter.x + (fit.side || characterId === 'squidmochi' ? 0 : .3), characterId === 'squidmochi' ? 3.4 : fit.top + .08, hatCenter.z + (fit.side ? .25 : .15));
  for (const sign of [-1, 1]) {
    const loop = new THREE.SphereGeometry(1, 20, 14).scale(.29, .19, .11).rotateZ(sign * -.35).translate(bowCenter.x + sign * .24, bowCenter.y + .045, bowCenter.z);
    add('bow', loop, 5);
  }
  add('bow', new THREE.SphereGeometry(.13, 16, 12).translate(bowCenter.x, bowCenter.y, bowCenter.z + .04), 5);
  character.object.add(root);
  const point = new THREE.Vector3(), out = new THREE.Vector3();
  function update() {
    for (const { mesh, rest, id } of parts) {
      if (!groups.get(id)!.visible) continue;
      const positions = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < positions.count; i++) {
        point.fromArray(rest, i * 3);
        if (character.deformAccessory) character.deformAccessory(point, out); else out.copy(point);
        positions.setXYZ(i, out.x, out.y, out.z);
      }
      positions.needsUpdate = true; mesh.geometry.computeVertexNormals();
    }
  }
  return {
    set(selected: readonly AccessoryId[]) { for (const [id, group] of groups) group.visible = selected.includes(id); update(); },
    update,
    dispose() { root.removeFromParent(); for (const part of parts) part.mesh.geometry.dispose(); for (const material of materials) material.dispose(); },
  };
}
