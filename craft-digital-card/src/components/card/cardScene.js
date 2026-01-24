import * as THREE from 'three';
import { getMaterialValues } from '../../config/materials';

// ============================================================================
// SCENE INITIALIZATION
// ============================================================================

export function initScene(container) {
  const W = container.clientWidth;
  const H = container.clientHeight;
  const isPortrait = W / H < 1.4;

  const scene = new THREE.Scene();
  const cardGroup = new THREE.Group();
  scene.add(cardGroup);

  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
  camera.position.z = calcCameraZ(W, H, isPortrait);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  container.appendChild(renderer.domElement);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  const point1 = new THREE.PointLight(0xffffff, 1.5, 10);
  point1.position.set(2, 2, 3);
  scene.add(point1);

  const point2 = new THREE.PointLight(0xffffff, 1.0, 10);
  point2.position.set(-2, -1, 2);
  scene.add(point2);

  // Orbs
  const orbs = [];
  const orbGeo = new THREE.SphereGeometry(0.04, 8, 8);
  for (let i = 0; i < 3; i++) {
    const orbMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set(
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 4,
      -2 - Math.random() * 2
    );
    orb.userData = { speed: 0.5 + Math.random(), offset: Math.random() * Math.PI * 2 };
    scene.add(orb);
    orbs.push(orb);
  }

  return {
    scene,
    camera,
    renderer,
    cardGroup,
    lights: { ambient, point1, point2 },
    orbs,
    card: null,
    edges: null,
    textures: { front: null, back: null },
    animationId: null,
    isInitialized: true
  };
}

// ============================================================================
// CAMERA HELPERS
// ============================================================================

function calcCameraZ(w, h, isPortrait) {
  const cardW = isPortrait ? 2.0 : 3.6;
  const cardH = isPortrait ? 3.2 : 2.2;
  const fov = 45 * (Math.PI / 180);
  const aspect = w / h;
  const padding = 1.4;
  const zForHeight = (cardH * padding) / (2 * Math.tan(fov / 2));
  const zForWidth = (cardW * padding) / (2 * Math.tan(fov / 2) * aspect);
  return Math.max(zForHeight, zForWidth, 3.0);
}

// ============================================================================
// CARD CREATION
// ============================================================================

export function createCard(three, textures, theme, matSettings, isPortrait) {
  // Dispose old resources
  three.textures.front?.dispose();
  three.textures.back?.dispose();

  if (three.card) {
    three.cardGroup.remove(three.card);
    three.card.geometry.dispose();
    three.card.material.forEach(m => m.dispose());
  }

  if (three.edges) {
    three.cardGroup.remove(three.edges);
    three.edges.geometry.dispose();
    three.edges.material.dispose();
  }

  // Card dimensions
  const cw = isPortrait ? 2.0 : 3.6;
  const ch = isPortrait ? 3.2 : 2.2;
  const mat = getMaterialValues(matSettings.materialPreset);

  // Store new textures
  three.textures = textures;

  // Create card mesh
  const cardGeo = new THREE.BoxGeometry(cw, ch, 0.08);
  const sideMat = new THREE.MeshStandardMaterial({
    color: theme.cardSide,
    metalness: mat.sideMetalness,
    roughness: mat.sideRoughness
  });

  const materials = [
    sideMat, sideMat, sideMat, sideMat,
    new THREE.MeshStandardMaterial({
      map: textures.front,
      metalness: mat.cardMetalness,
      roughness: mat.cardRoughness
    }),
    new THREE.MeshStandardMaterial({
      map: textures.back,
      metalness: mat.cardMetalness,
      roughness: mat.cardRoughness
    })
  ];

  three.card = new THREE.Mesh(cardGeo, materials);
  three.cardGroup.add(three.card);

  // Create edges
  const edgeGeo = new THREE.EdgesGeometry(cardGeo);
  const edgeMat = new THREE.LineBasicMaterial({
    color: theme.edgeColor,
    transparent: true,
    opacity: 0.6
  });
  three.edges = new THREE.LineSegments(edgeGeo, edgeMat);
  three.cardGroup.add(three.edges);
}

// ============================================================================
// THEME UPDATE
// ============================================================================

export function updateTheme(three, theme) {
  if (!three.isInitialized) return;

  // Update lights
  three.lights.point1.color.setHex(theme.lightColor1);
  three.lights.point2.color.setHex(theme.lightColor2);
  three.lights.ambient.intensity = theme.ambientIntensity ?? 0.35;
  three.lights.point1.intensity = theme.pointLight1Intensity ?? 1.5;
  three.lights.point2.intensity = theme.pointLight2Intensity ?? 1.0;

  // Update orbs
  three.orbs.forEach((orb, i) => {
    orb.material.color.setHex(i % 2 ? theme.orbColor1 : theme.orbColor2);
  });
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

export function setupEventHandlers(container, state, three) {
  const onMouseDown = (e) => {
    state.isDragging = true;
    state.prevX = e.clientX;
    state.prevY = e.clientY;
    state.touchStartTime = Date.now();
  };

  const onMouseMove = (e) => {
    if (!state.isDragging) return;
    state.targetRotY += (e.clientX - state.prevX) * 0.01;
    state.targetRotX += (e.clientY - state.prevY) * 0.01;
    state.targetRotX = Math.max(-0.5, Math.min(0.5, state.targetRotX));
    state.prevX = e.clientX;
    state.prevY = e.clientY;
  };

  const onMouseUp = () => {
    state.isDragging = false;
  };

  let touchHandled = false;

  const onClick = (e) => {
    if (touchHandled) {
      touchHandled = false;
      return;
    }
    const tapDuration = Date.now() - state.touchStartTime;
    if (Math.abs(e.clientX - state.prevX) < 5 && tapDuration < 250) {
      state.targetRotY += Math.PI;
    }
  };

  const onWheel = (e) => {
    e.preventDefault();
    const rect = container.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
    const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    const oldZ = three.camera.position.z;
    const newZ = Math.max(2.0, Math.min(8, oldZ + e.deltaY * 0.005));
    const zoomFactor = (oldZ - newZ) / oldZ;
    state.targetPanX -= mouseX * zoomFactor * 2;
    state.targetPanY += mouseY * zoomFactor * 2;
    three.camera.position.z = newZ;
  };

  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      state.isDragging = true;
      state.prevX = e.touches[0].clientX;
      state.prevY = e.touches[0].clientY;
      state.touchStartTime = Date.now();
    } else if (e.touches.length === 2) {
      state.lastTouchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      state.pinchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      state.pinchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    }
  };

  const onTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && state.isDragging) {
      state.targetRotY += (e.touches[0].clientX - state.prevX) * 0.01;
      state.targetRotX += (e.touches[0].clientY - state.prevY) * 0.01;
      state.targetRotX = Math.max(-0.5, Math.min(0.5, state.targetRotX));
      state.prevX = e.touches[0].clientX;
      state.prevY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const rect = container.getBoundingClientRect();
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const pinchX = (centerX - rect.left) / rect.width - 0.5;
      const pinchY = (centerY - rect.top) / rect.height - 0.5;
      const oldZ = three.camera.position.z;
      const newZ = Math.max(2.0, Math.min(8, oldZ + (state.lastTouchDist - dist) * 0.02));
      const zoomFactor = (oldZ - newZ) / oldZ;
      state.targetPanX -= pinchX * zoomFactor * 2;
      state.targetPanY += pinchY * zoomFactor * 2;
      three.camera.position.z = newZ;
      state.lastTouchDist = dist;
    }
  };

  const onTouchEnd = (e) => {
    if (e.touches.length === 0) {
      const now = Date.now();
      const touch = e.changedTouches[0];
      const tapDuration = now - state.touchStartTime;
      const movedX = Math.abs(touch.clientX - state.prevX);
      const movedY = Math.abs(touch.clientY - state.prevY);
      if (state.isDragging && movedX < 10 && movedY < 10 && tapDuration < 250 && now - state.lastTapTime > 400) {
        state.targetRotY += Math.PI;
        touchHandled = true;
        state.lastTapTime = now;
      }
      state.isDragging = false;
    }
  };

  // Add event listeners
  container.addEventListener('mousedown', onMouseDown);
  container.addEventListener('mousemove', onMouseMove);
  container.addEventListener('mouseup', onMouseUp);
  container.addEventListener('mouseleave', onMouseUp);
  container.addEventListener('click', onClick);
  container.addEventListener('wheel', onWheel, { passive: false });
  container.addEventListener('touchstart', onTouchStart, { passive: true });
  container.addEventListener('touchmove', onTouchMove, { passive: false });
  container.addEventListener('touchend', onTouchEnd, { passive: true });

  // Return cleanup function
  return () => {
    container.removeEventListener('mousedown', onMouseDown);
    container.removeEventListener('mousemove', onMouseMove);
    container.removeEventListener('mouseup', onMouseUp);
    container.removeEventListener('mouseleave', onMouseUp);
    container.removeEventListener('click', onClick);
    container.removeEventListener('wheel', onWheel);
    container.removeEventListener('touchstart', onTouchStart);
    container.removeEventListener('touchmove', onTouchMove);
    container.removeEventListener('touchend', onTouchEnd);
  };
}

// ============================================================================
// RESIZE HANDLER
// ============================================================================

export function setupResizeHandler(container, three, state, onOrientationChange) {
  let resizeTimeout;

  const onResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const W = container.clientWidth;
      const H = container.clientHeight;
      if (W === 0 || H === 0) return;

      const isPortrait = W / H < 1.4;
      three.camera.aspect = W / H;
      three.camera.position.z = calcCameraZ(W, H, isPortrait);
      three.camera.updateProjectionMatrix();
      three.renderer.setSize(W, H);

      if (isPortrait !== state.isPortrait) {
        state.isPortrait = isPortrait;
        onOrientationChange(isPortrait);
      }
    }, 50);
  };

  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(container);
  window.addEventListener('resize', onResize);

  // Return cleanup function
  return () => {
    clearTimeout(resizeTimeout);
    resizeObserver.disconnect();
    window.removeEventListener('resize', onResize);
  };
}

// ============================================================================
// ANIMATION LOOP
// ============================================================================

export function startAnimation(three, state) {
  const animate = () => {
    three.animationId = requestAnimationFrame(animate);
    state.time += 0.016;

    if (three.cardGroup) {
      // Smooth rotation
      three.cardGroup.rotation.x += (state.targetRotX - three.cardGroup.rotation.x) * 0.08;
      three.cardGroup.rotation.y += (state.targetRotY - three.cardGroup.rotation.y) * 0.08;

      // Smooth panning
      state.panX += (state.targetPanX - state.panX) * 0.1;
      state.panY += (state.targetPanY - state.panY) * 0.1;
      three.cardGroup.position.x = state.panX;
      three.cardGroup.position.y = Math.sin(state.time) * 0.05 + state.panY;

      // Reset pan when zoomed out
      if (three.camera.position.z > 4) {
        state.targetPanX *= 0.95;
        state.targetPanY *= 0.95;
      }
    }

    // Animate lights
    if (three.lights.point1) {
      three.lights.point1.position.x = Math.sin(state.time * 0.5) * 3;
      three.lights.point1.position.y = Math.cos(state.time * 0.5) * 2;
    }

    // Animate orbs
    three.orbs.forEach(o => {
      o.position.y += Math.sin(state.time * o.userData.speed + o.userData.offset) * 0.002;
      o.position.x += Math.cos(state.time * o.userData.speed * 0.5 + o.userData.offset) * 0.001;
    });

    three.renderer.render(three.scene, three.camera);
  };

  animate();
}

// ============================================================================
// CLEANUP
// ============================================================================

export function dispose(three) {
  if (three.animationId) {
    cancelAnimationFrame(three.animationId);
  }

  if (three.renderer) {
    three.renderer.dispose();
    if (three.renderer.domElement?.parentNode) {
      three.renderer.domElement.parentNode.removeChild(three.renderer.domElement);
    }
  }

  three.textures.front?.dispose();
  three.textures.back?.dispose();

  if (three.card) {
    three.card.geometry.dispose();
    three.card.material.forEach(m => m.dispose());
  }

  if (three.edges) {
    three.edges.geometry.dispose();
    three.edges.material.dispose();
  }

  three.orbs.forEach(o => {
    o.geometry.dispose();
    o.material.dispose();
  });

  three.isInitialized = false;
}

// ============================================================================
// STATE FACTORY
// ============================================================================

export function createInitialState(isPortrait = true) {
  return {
    isDragging: false,
    prevX: 0,
    prevY: 0,
    targetRotX: 0.1,
    targetRotY: 0,
    time: 0,
    lastTouchDist: 0,
    lastTapTime: 0,
    touchStartTime: 0,
    isPortrait,
    panX: 0,
    panY: 0,
    targetPanX: 0,
    targetPanY: 0,
    pinchCenterX: 0,
    pinchCenterY: 0
  };
}