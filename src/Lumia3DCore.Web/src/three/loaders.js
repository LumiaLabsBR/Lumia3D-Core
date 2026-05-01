// Real STL / GLB / OBJ loader wrappers around three.js examples loaders.
// Falls back to procedural geometry for shapes without a real file.

import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const stlLoader = new STLLoader();
const objLoader = new OBJLoader();
const gltfLoader = new GLTFLoader();

// Center + scale a loaded object so it fits a unit-ish bounding box.
const fit = (obj, target = 1.6) => {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  obj.position.sub(center);
  const max = Math.max(size.x, size.y, size.z) || 1;
  const k = target / max;
  obj.scale.multiplyScalar(k);
  // Drop the object onto the floor (y = -1 in our scene).
  const newBox = new THREE.Box3().setFromObject(obj);
  obj.position.y -= newBox.min.y + 1;
  return obj;
};

const applyMaterial = (obj, material) => {
  obj.traverse((child) => {
    if (child.isMesh) {
      child.material = material;
      child.castShadow = true;
      child.receiveShadow = false;
    }
  });
};

// Loaders return a Promise<THREE.Object3D>.
export function loadSTL(url, material) {
  return new Promise((resolve, reject) => {
    stlLoader.load(
      url,
      (geometry) => {
        geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        const group = new THREE.Group();
        group.add(mesh);
        resolve(fit(group));
      },
      undefined,
      reject
    );
  });
}

export function loadOBJ(url, material) {
  return new Promise((resolve, reject) => {
    objLoader.load(
      url,
      (obj) => {
        applyMaterial(obj, material);
        resolve(fit(obj));
      },
      undefined,
      reject
    );
  });
}

export function loadGLB(url) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => {
        gltf.scene.traverse((c) => {
          if (c.isMesh) c.castShadow = true;
        });
        resolve(fit(gltf.scene));
      },
      undefined,
      reject
    );
  });
}

// Universal entry — pick a loader by file extension.
// Returns null if there's no URL (caller should build a procedural fallback).
export function loadModel({ url, format }, material) {
  if (!url) return Promise.resolve(null);
  const ext = (format || url.split('.').pop()).toLowerCase();
  if (ext === 'stl') return loadSTL(url, material);
  if (ext === 'obj') return loadOBJ(url, material);
  if (ext === 'glb' || ext === 'gltf') return loadGLB(url);
  if (ext === '3mf') {
    // 3MF support would need an extra dependency; for now treat as missing.
    return Promise.resolve(null);
  }
  return Promise.resolve(null);
}
