import * as THREE from 'three';

export class FirstPersonControls extends EventTarget {
  constructor(camera, domElement) {
    super();
    this.camera = camera;
    this.domElement = domElement;
    this.isLocked = false;
    this.pointerLocked = false;
    this.fallback = false;
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.vector = new THREE.Vector3();
    this.onPointerLockChange = this.onPointerLockChange.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('pointerlockerror', () => this.enableFallback());
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointermove', this.onMouseMove);
    document.addEventListener('pointerup', this.onPointerUp);
    document.addEventListener('keydown', this.onKeyDown);
    domElement.addEventListener('pointerdown', this.onPointerDown);
    domElement.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  async lock() {
    if (this.fallback) {
      this.enableFallback();
      return;
    }
    const fallbackTimer = setTimeout(() => {
      if (!this.isLocked) this.enableFallback();
    }, 500);
    try {
      if (!this.domElement.requestPointerLock) {
        this.enableFallback();
        return;
      }
      const request = this.domElement.requestPointerLock();
      if (request?.then) {
        await request;
        if (document.pointerLockElement === this.domElement) this.activate(true);
        else if (!this.isLocked) this.enableFallback();
      }
    } catch {
      this.enableFallback();
    } finally {
      clearTimeout(fallbackTimer);
    }
  }

  activate(pointerLocked) {
    this.pointerLocked = pointerLocked;
    this.isLocked = true;
    this.dispatchEvent(new Event('lock'));
  }

  enableFallback() {
    this.fallback = true;
    this.pointerLocked = false;
    this.activate(false);
    this.dispatchEvent(new Event('fallback'));
  }

  unlock() {
    if (!this.isLocked) return;
    this.isLocked = false;
    this.pointerLocked = false;
    this.dragging = false;
    if (document.pointerLockElement === this.domElement) document.exitPointerLock();
    this.dispatchEvent(new Event('unlock'));
  }

  onPointerLockChange() {
    if (document.pointerLockElement === this.domElement) {
      this.fallback = false;
      this.activate(true);
    } else if (this.pointerLocked) {
      this.pointerLocked = false;
      this.isLocked = false;
      this.dispatchEvent(new Event('unlock'));
    }
  }

  onPointerDown(event) {
    if (!this.isLocked || !this.fallback) return;
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.domElement.setPointerCapture?.(event.pointerId);
  }

  onPointerUp() {
    this.dragging = false;
  }

  onKeyDown(event) {
    if (event.code === 'Escape' && this.isLocked && this.fallback) this.unlock();
  }

  onMouseMove(event) {
    if (!this.isLocked || (this.fallback && !this.dragging)) return;
    if (event.type === 'pointermove' && !this.fallback) return;
    if (event.type === 'mousemove' && this.fallback) return;
    const movementX = this.fallback ? event.clientX - this.lastX : event.movementX;
    const movementY = this.fallback ? event.clientY - this.lastY : event.movementY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= movementX * 0.002;
    this.euler.x = THREE.MathUtils.clamp(this.euler.x - movementY * 0.002, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02);
    this.camera.quaternion.setFromEuler(this.euler);
  }

  moveForward(distance) {
    if (!this.isLocked) return;
    this.vector.setFromMatrixColumn(this.camera.matrix, 0);
    this.vector.crossVectors(this.camera.up, this.vector);
    this.camera.position.addScaledVector(this.vector, distance);
  }

  moveRight(distance) {
    if (!this.isLocked) return;
    this.vector.setFromMatrixColumn(this.camera.matrix, 0);
    this.camera.position.addScaledVector(this.vector, distance);
  }
}
