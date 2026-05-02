// Loaders STL / OBJ / GLB para three.js.
//
// Em Photino (WebView2), file:// não é acessível via fetch (sandbox de segurança).
// Solução: ler o arquivo via IPC como base64 e usar loader.parse(buffer).
// Em dev (browser), URLs http(s) funcionam normal via loader.load(url).

import * as THREE from 'three';
import { STLLoader }   from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader }   from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader }  from 'three/examples/jsm/loaders/GLTFLoader.js';
import JSZip from 'jszip';
import { api as ipc } from '../api/client.js';

const stlLoader  = new STLLoader();
const objLoader  = new OBJLoader();
const gltfLoader = new GLTFLoader();

const IS_PHOTINO = typeof window !== 'undefined' && typeof window.external?.sendMessage === 'function';

// Centraliza, escala pra unit-bbox e apoia no chão (y = -1).
const fit = (obj, target = 1.6) => {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  obj.position.sub(center);
  const max = Math.max(size.x, size.y, size.z) || 1;
  const k = target / max;
  obj.scale.multiplyScalar(k);
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

// base64 → ArrayBuffer
function base64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// "file:///C:/path/to/x.stl" → "C:/path/to/x.stl" (decode + remove scheme)
function stripFileScheme(url) {
  if (typeof url !== 'string') return url;
  if (url.startsWith('file:///')) return decodeURIComponent(url.substring('file:///'.length));
  return url;
}

// ── STL ─────────────────────────────────────────────────────────────────
function parseSTL(buffer, material) {
  const geometry = stlLoader.parse(buffer);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  const group = new THREE.Group();
  group.add(mesh);
  return fit(group);
}

export async function loadSTL(urlOrPath, material) {
  if (IS_PHOTINO) {
    const b64 = await ipc.readFileAsBase64(stripFileScheme(urlOrPath));
    if (!b64) throw new Error('readFileAsBase64 returned null');
    return parseSTL(base64ToArrayBuffer(b64), material);
  }
  return new Promise((resolve, reject) => {
    stlLoader.load(urlOrPath, (geometry) => resolve(parseSTL(geometry.array ? geometry.array.buffer : geometry, material)), undefined, reject);
  });
}

// ── OBJ ─────────────────────────────────────────────────────────────────
function parseOBJ(text, material) {
  const obj = objLoader.parse(text);
  applyMaterial(obj, material);
  return fit(obj);
}

export async function loadOBJ(urlOrPath, material) {
  if (IS_PHOTINO) {
    const b64 = await ipc.readFileAsBase64(stripFileScheme(urlOrPath));
    if (!b64) throw new Error('readFileAsBase64 returned null');
    const text = new TextDecoder('utf-8').decode(base64ToArrayBuffer(b64));
    return parseOBJ(text, material);
  }
  return new Promise((resolve, reject) => {
    objLoader.load(urlOrPath, (obj) => { applyMaterial(obj, material); resolve(fit(obj)); }, undefined, reject);
  });
}

// ── GLB ─────────────────────────────────────────────────────────────────
function parseGLB(buffer) {
  return new Promise((resolve, reject) => {
    gltfLoader.parse(buffer, '', (gltf) => {
      gltf.scene.traverse((c) => { if (c.isMesh) c.castShadow = true; });
      resolve(fit(gltf.scene));
    }, reject);
  });
}

export async function loadGLB(urlOrPath) {
  if (IS_PHOTINO) {
    const b64 = await ipc.readFileAsBase64(stripFileScheme(urlOrPath));
    if (!b64) throw new Error('readFileAsBase64 returned null');
    return parseGLB(base64ToArrayBuffer(b64));
  }
  return new Promise((resolve, reject) => {
    gltfLoader.load(urlOrPath, (gltf) => {
      gltf.scene.traverse((c) => { if (c.isMesh) c.castShadow = true; });
      resolve(fit(gltf.scene));
    }, undefined, reject);
  });
}

// ── 3MF ─────────────────────────────────────────────────────────────────
//
// O `ThreeMFLoader` oficial do three.js é frágil com 3MFs gerados por
// slicers modernos (Bambu Lab, PrusaSlicer, Cura, OrcaSlicer). Crasha com
// "Cannot read properties of undefined (reading 'mesh')" quando o XML usa
// extensões proprietárias ou estrutura via <components>.
//
// Parser próprio: JSZip extrai o `*.model` (XML) → DOMParser → coleta
// vertices e triangles de TODOS os <mesh> do documento, ignora extensões
// e build matrices. Funciona pra qualquer 3MF padrão básico.
//
async function parse3MFCustom(buffer, material) {
  console.log('[Lumia3D] parse3MFCustom: buffer size=', buffer.byteLength);
  const zip = await JSZip.loadAsync(buffer);

  // Procura QUALQUER arquivo .model no zip (geralmente /3D/3dmodel.model)
  const modelEntry = Object.values(zip.files).find(
    (f) => !f.dir && f.name.toLowerCase().endsWith('.model')
  );
  if (!modelEntry) throw new Error('3MF sem arquivo .model dentro');

  const xml = await modelEntry.async('string');
  console.log('[Lumia3D] parse3MFCustom: xml size=', xml.length);

  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) throw new Error('XML inválido no 3MF: ' + parseError.textContent.slice(0, 100));

  // getElementsByTagName ignora namespaces (mais permissivo que querySelector)
  const meshes = doc.getElementsByTagName('mesh');
  if (meshes.length === 0) throw new Error('Nenhum <mesh> encontrado no 3MF');

  console.log('[Lumia3D] parse3MFCustom: meshes=', meshes.length);
  const group = new THREE.Group();
  let totalVerts = 0, totalTris = 0;

  for (const mesh of meshes) {
    const verticesEls = mesh.getElementsByTagName('vertex');
    const trianglesEls = mesh.getElementsByTagName('triangle');
    if (verticesEls.length === 0 || trianglesEls.length === 0) continue;

    const positions = new Float32Array(verticesEls.length * 3);
    for (let i = 0; i < verticesEls.length; i++) {
      const v = verticesEls[i];
      positions[i * 3 + 0] = parseFloat(v.getAttribute('x')) || 0;
      positions[i * 3 + 1] = parseFloat(v.getAttribute('y')) || 0;
      positions[i * 3 + 2] = parseFloat(v.getAttribute('z')) || 0;
    }

    // Decide tipo de array de índices baseado no numero de vertices
    const Indices = verticesEls.length > 65535 ? Uint32Array : Uint16Array;
    const indices = new Indices(trianglesEls.length * 3);
    for (let i = 0; i < trianglesEls.length; i++) {
      const t = trianglesEls[i];
      indices[i * 3 + 0] = parseInt(t.getAttribute('v1'), 10) || 0;
      indices[i * 3 + 1] = parseInt(t.getAttribute('v2'), 10) || 0;
      indices[i * 3 + 2] = parseInt(t.getAttribute('v3'), 10) || 0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();

    const meshObj = new THREE.Mesh(geometry, material);
    meshObj.castShadow = true;
    group.add(meshObj);

    totalVerts += verticesEls.length;
    totalTris  += trianglesEls.length;
  }

  console.log('[Lumia3D] parse3MFCustom: success, vertices=', totalVerts, 'triangles=', totalTris);
  if (group.children.length === 0) throw new Error('Nenhum mesh válido extraído do 3MF');

  return fit(group);
}

export async function load3MF(urlOrPath, material) {
  console.log('[Lumia3D] load3MF', urlOrPath, 'IS_PHOTINO=', IS_PHOTINO);
  if (IS_PHOTINO) {
    const path = stripFileScheme(urlOrPath);
    const b64 = await ipc.readFileAsBase64(path);
    if (!b64) throw new Error('readFileAsBase64 returned null');
    console.log('[Lumia3D] base64 length=', b64.length);
    return await parse3MFCustom(base64ToArrayBuffer(b64), material);
  }
  // Em dev, fetch direto e parse via JSZip
  const resp = await fetch(urlOrPath);
  const buffer = await resp.arrayBuffer();
  return await parse3MFCustom(buffer, material);
}

// Universal entry — escolhe loader por extensão. Retorna null sem URL
// (caller usa procedural fallback).
export function loadModel({ url, format }, material) {
  if (!url) return Promise.resolve(null);
  const ext = (format || url.split('.').pop()).toLowerCase().replace('.', '');
  if (ext === 'stl') return loadSTL(url, material);
  if (ext === 'obj') return loadOBJ(url, material);
  if (ext === '3mf') return load3MF(url, material);
  if (ext === 'glb' || ext === 'gltf') return loadGLB(url);
  return Promise.resolve(null);
}
