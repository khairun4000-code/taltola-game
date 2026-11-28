import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

/**
 * Shared singleton DRACOLoader + MeshoptDecoder configuration for the entire Khulna VI engine.
 * Reusing a single DRACOLoader avoids spawning duplicate WebAssembly worker pools across modules
 * and decodes Draco-compressed geometries back to standard Float32Array attributes off the main thread.
 */
let sharedDracoLoader = null;

export function getSharedDracoLoader() {
  if (!sharedDracoLoader) {
    sharedDracoLoader = new DRACOLoader();
    sharedDracoLoader.setDecoderPath('./draco/gltf/');
    sharedDracoLoader.preload();
  }
  return sharedDracoLoader;
}

export function createConfiguredGLTFLoader(manager) {
  const loader = new GLTFLoader(manager);
  loader.setDRACOLoader(getSharedDracoLoader());
  loader.setMeshoptDecoder(MeshoptDecoder);
  return loader;
}
