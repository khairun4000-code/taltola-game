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
    this.freeMoveHover = false;
    this.hasLastPos = false;
    this.lastX = 0;
    this.lastY = 0;
    this.sensitivity = 1.0;
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

  setFreeMoveHover(enabled) {
    this.freeMoveHover = Boolean(enabled);
    if (!this.freeMoveHover) {
      this.hasLastPos = false;
    }
  }

  syncRotationFromCamera() {
    this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
  }

  getHorizontalVectors(forward, right) {
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() > 1e-6) {
      forward.normalize();
    } else {
      forward.set(1, 0, 0);
    }
    right.crossVectors(forward, this.camera.up).normalize();
  }

  async lock() {
    // Activate immediately in fallback mode first so WASD & UI start with zero delay,
    // then upgrade to full pointer lock if the browser grants it.
    if (!this.isLocked) {
      this.enableFallback();
    }
    try {
      if (!this.domElement.requestPointerLock) {
        return;
      }
      const request = this.domElement.requestPointerLock();
      if (request?.then) {
        await request;
        if (document.pointerLockElement === this.domElement) {
          this.fallback = false;
          this.hasLastPos = false;
          this.activate(true);
        }
      }
    } catch {
      if (!this.isLocked) this.enableFallback();
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
    this.hasLastPos = false;
    this.activate(false);
    this.dispatchEvent(new Event('fallback'));
  }

  unlock() {
    if (!this.isLocked) return;
    this.isLocked = false;
    this.pointerLocked = false;
    this.dragging = false;
    this.hasLastPos = false;
    if (document.pointerLockElement === this.domElement) document.exitPointerLock();
    this.dispatchEvent(new Event('unlock'));
  }

  onPointerLockChange() {
    this.hasLastPos = false;
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
    this.hasLastPos = true;
    this.domElement.setPointerCapture?.(event.pointerId);
  }

  onPointerUp() {
    this.dragging = false;
  }

  onKeyDown() {
    // Escape is handled cleanly in one place by main.js so pressing [ESC] opens the map on the very first press
    // without an unlock->open->window-keydown->close double-toggle race!
  }

  updateEdgeTurn(delta) {
    if (!this.isLocked || !this.fallback || !this.freeMoveHover || !this.hasLastPos) return;
    const vw = window.innerWidth || 1280;
    const margin = 52;
    let turnRate = 0;
    if (this.lastX <= margin) {
      turnRate = ((margin - this.lastX) / margin) * 1.85;
    } else if (this.lastX >= vw - margin) {
      turnRate = -((this.lastX - (vw - margin)) / margin) * 1.85;
    }
    if (Math.abs(turnRate) > 0.001) {
      this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
      this.euler.y += turnRate * this.sensitivity * delta;
      this.camera.quaternion.setFromEuler(this.euler);
    }
  }

  setSensitivity(val) {
    this.sensitivity = THREE.MathUtils.clamp(Number(val) || 1.0, 0.35, 2.5);
  }

  onMouseMove(event) {
    const hoverLook = this.fallback && this.freeMoveHover;
    if (!this.isLocked || (this.fallback && !this.dragging && !hoverLook)) return;
    if (event.type === 'pointermove' && !this.fallback) return;
    if (event.type === 'mousemove' && this.fallback) return;
    let movementX;
    let movementY;
    if (this.fallback) {
      if (!this.hasLastPos && !this.dragging) {
        this.lastX = event.clientX;
        this.lastY = event.clientY;
        this.hasLastPos = true;
        return;
      }
      movementX = event.clientX - this.lastX;
      movementY = event.clientY - this.lastY;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      this.hasLastPos = true;
    } else {
      movementX = event.movementX;
      movementY = event.movementY;
    }
    if (Math.abs(movementX) > 260 || Math.abs(movementY) > 260) return;
    const scale = 0.0022 * this.sensitivity;
    this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
    this.euler.y -= movementX * scale;
    this.euler.x = THREE.MathUtils.clamp(this.euler.x - movementY * scale, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
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
