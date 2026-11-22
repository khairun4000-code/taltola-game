import * as THREE from 'three';

export class FirstPersonControls extends EventTarget {
  constructor(camera, domElement) {
    super();
    this.camera = camera;
    this.domElement = domElement;
    this.isLocked = false;
    this.pointerLocked = false;
    this.wantPointerLock = false;
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
    document.addEventListener('pointerlockerror', () => {
      if (!this.isLocked) this.enableFallback();
    });
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
    this.wantPointerLock = true;
    // Activate immediately in fallback mode first so WASD & UI start with zero delay,
    // then upgrade to full hardware 360° pointer lock if the browser grants it.
    if (!this.isLocked) {
      this.enableFallback();
    }
    if (document.pointerLockElement === this.domElement) {
      this.fallback = false;
      this.wantPointerLock = false;
      this.hasLastPos = false;
      this.activate(true);
      return;
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
          this.wantPointerLock = false;
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
    this.wantPointerLock = false;
    if (!this.isLocked && document.pointerLockElement !== this.domElement) return;
    this.isLocked = false;
    this.pointerLocked = false;
    this.dragging = false;
    this.hasLastPos = false;
    if (document.pointerLockElement === this.domElement) {
      try {
        document.exitPointerLock();
      } catch {}
    }
    this.dispatchEvent(new Event('unlock'));
  }

  onPointerLockChange() {
    this.hasLastPos = false;
    if (document.pointerLockElement === this.domElement) {
      this.fallback = false;
      this.wantPointerLock = false;
      this.activate(true);
    } else if (this.pointerLocked) {
      this.pointerLocked = false;
      this.isLocked = false;
      this.dispatchEvent(new Event('unlock'));
    }
  }

  onPointerDown(event) {
    if (!this.isLocked || !this.fallback) return;
    if (this.wantPointerLock && event.button === 0 && document.pointerLockElement !== this.domElement) {
      this.lock();
    }
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
    const vh = window.innerHeight || 720;
    const marginX = 96;
    const marginY = 48;
    let turnYaw = 0;
    let turnPitch = 0;
    if (this.lastX <= marginX) {
      turnYaw = ((marginX - this.lastX) / marginX) * 2.25;
    } else if (this.lastX >= vw - marginX) {
      turnYaw = -((this.lastX - (vw - marginX)) / marginX) * 2.25;
    }
    if (this.lastY <= marginY) {
      turnPitch = ((marginY - this.lastY) / marginY) * 1.15;
    } else if (this.lastY >= vh - marginY) {
      turnPitch = -((this.lastY - (vh - marginY)) / marginY) * 1.15;
    }
    if (Math.abs(turnYaw) > 0.001 || Math.abs(turnPitch) > 0.001) {
      this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
      this.euler.y += turnYaw * this.sensitivity * delta;
      this.euler.x = THREE.MathUtils.clamp(
        this.euler.x + turnPitch * this.sensitivity * delta,
        -Math.PI / 2 + 0.05,
        Math.PI / 2 - 0.05,
      );
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
      const dxClient = event.clientX - this.lastX;
      const dyClient = event.clientY - this.lastY;
      movementX = (dxClient !== 0 || dyClient !== 0) ? dxClient : (event.movementX || 0);
      movementY = (dxClient !== 0 || dyClient !== 0) ? dyClient : (event.movementY || 0);
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      this.hasLastPos = true;
    } else {
      movementX = event.movementX || 0;
      movementY = event.movementY || 0;
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
