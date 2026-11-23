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
    this.mouseLookEnabled = true;
    this.ignoreNextMove = false;
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
    this.onWindowBlur = this.onWindowBlur.bind(this);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('pointerlockerror', () => {
      if (!this.isLocked) this.enableFallback();
    });
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointermove', this.onMouseMove);
    document.addEventListener('pointerup', this.onPointerUp);
    document.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('blur', this.onWindowBlur);
    domElement.addEventListener('pointerdown', this.onPointerDown);
    domElement.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  onWindowBlur() {
    this.dragging = false;
    this.hasLastPos = false;
    this.ignoreNextMove = true;
  }

  setFreeMoveHover(enabled) {
    const next = Boolean(enabled);
    if (this.freeMoveHover !== next) {
      this.freeMoveHover = next;
      this.hasLastPos = false;
      this.ignoreNextMove = true;
    }
  }

  setMouseLookEnabled(enabled) {
    const next = Boolean(enabled);
    if (this.mouseLookEnabled !== next) {
      this.mouseLookEnabled = next;
      this.hasLastPos = false;
      this.ignoreNextMove = true;
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
    this.ignoreNextMove = true;
    this.dispatchEvent(new Event('lock'));
  }

  enableFallback() {
    this.fallback = true;
    this.pointerLocked = false;
    this.hasLastPos = false;
    this.ignoreNextMove = true;
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
    this.ignoreNextMove = true;
    if (document.pointerLockElement === this.domElement) {
      try {
        document.exitPointerLock();
      } catch {}
    }
    this.dispatchEvent(new Event('unlock'));
  }

  onPointerLockChange() {
    this.hasLastPos = false;
    this.ignoreNextMove = true;
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
    if (!this.isLocked || !this.fallback || !this.freeMoveHover) return;
    if (this.wantPointerLock && event.button === 0 && document.pointerLockElement !== this.domElement) {
      this.lock();
    }
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.hasLastPos = true;
    try {
      this.domElement.setPointerCapture?.(event.pointerId);
    } catch {}
  }

  onPointerUp() {
    this.dragging = false;
  }

  onKeyDown() {
    // Escape is handled cleanly in one place by main.js so pressing [ESC] opens the map on the very first press
    // without an unlock->open->window-keydown->close double-toggle race!
  }

  updateEdgeTurn() {
    // Disabled intentionally: hovering near screen edges must NEVER auto-spin the camera!
  }

  setSensitivity(val) {
    this.sensitivity = THREE.MathUtils.clamp(Number(val) || 1.0, 0.35, 2.5);
  }

  onMouseMove(event) {
    if (!this.mouseLookEnabled) return;
    const hoverLook = this.fallback && this.freeMoveHover;
    if (!this.isLocked || (this.fallback && !this.dragging && !hoverLook)) return;
    if (event.type === 'pointermove' && !this.fallback) return;
    if (event.type === 'mousemove' && this.fallback) return;
    if (this.ignoreNextMove) {
      this.ignoreNextMove = false;
      if (this.fallback) {
        this.lastX = event.clientX;
        this.lastY = event.clientY;
        this.hasLastPos = true;
      }
      return;
    }
    let movementX;
    let movementY;
    if (this.fallback) {
      if (!this.hasLastPos) {
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
      if (movementX === 0 && movementY === 0) return;
    } else {
      movementX = event.movementX || 0;
      movementY = event.movementY || 0;
    }
    if (Math.abs(movementX) > 120 || Math.abs(movementY) > 120) return;
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
