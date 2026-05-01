// Procedural geometries — used as fallback when no real model URL is provided.
// Extracted from Detail.jsx so the viewer can mix-and-match real + procedural.

import * as THREE from 'three';

export const matClay = new THREE.MeshStandardMaterial({
  color: 0xc4c8ce,
  roughness: 0.55,
  metalness: 0.1,
});

export const matMetal = new THREE.MeshStandardMaterial({
  color: 0xb0b6be,
  roughness: 0.25,
  metalness: 0.85,
});

export const matGem = new THREE.MeshStandardMaterial({
  color: 0xb8e0ff,
  roughness: 0.05,
  metalness: 0.2,
});

const mkGroup = (build) => {
  const group = new THREE.Group();
  build(group);
  group.traverse((c) => {
    if (c.isMesh) c.castShadow = true;
  });
  return group;
};

const builders = {
  gear: () => mkGroup((g) => {
    const teeth = 16;
    for (let i = 0; i < teeth; i++) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.5), matMetal);
      const a = (i / teeth) * Math.PI * 2;
      t.position.set(Math.cos(a) * 1.0, 0, Math.sin(a) * 1.0);
      t.rotation.y = -a;
      g.add(t);
    }
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.45, 48), matMetal));
    const hole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.5, 24),
      new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 1 })
    );
    g.add(hole);
  }),
  torus: () => mkGroup((g) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.32, 24, 60), matMetal);
    m.rotation.x = Math.PI / 2;
    g.add(m);
  }),
  cube: () => mkGroup((g) => g.add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), matClay))),
  ring: () => mkGroup((g) => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.16, 20, 60), matMetal);
    r.rotation.x = Math.PI / 2;
    g.add(r);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), matGem);
    gem.position.y = 0.25;
    g.add(gem);
  }),
  vase: () => mkGroup((g) => {
    const points = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const r = 0.3 + Math.sin(t * Math.PI) * 0.55 + (1 - t) * 0.1;
      points.push(new THREE.Vector2(r, t * 1.8 - 0.9));
    }
    g.add(new THREE.Mesh(new THREE.LatheGeometry(points, 48), matClay));
  }),
  bust: () => mkGroup((g) => {
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 24), matClay);
    head.position.y = 0.35;
    g.add(head);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 1.0, 24), matClay);
    body.position.y = -0.5;
    g.add(body);
  }),
  box: () => mkGroup((g) => g.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.2), matClay))),
  screw: () => mkGroup((g) => {
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.18, 24), matMetal);
    head.position.y = 0.85;
    g.add(head);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.5, 16), matMetal));
  }),
  hex: () => mkGroup((g) => {
    const positions = [[0, 0], [1.6, 0], [-1.6, 0], [0.8, 1.1], [-0.8, 1.1], [0.8, -1.1], [-0.8, -1.1]];
    positions.forEach(([x, z]) => {
      const hh = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.4, 6), matClay);
      hh.position.set(x, 0, z);
      g.add(hh);
    });
  }),
};

builders.skull = builders.bust;
builders.figure = builders.bust;
builders.bracket = builders.box;
builders.handle = builders.box;
builders.chair = builders.bust;
builders.geodesic = builders.cube;
builders.column = builders.cube;
builders.earring = builders.ring;

export function buildProcedural(shape) {
  return (builders[shape] || builders.cube)();
}
