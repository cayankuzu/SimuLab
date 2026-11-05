"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  ModuleId,
  OscillatorParams,
  OscillatorState,
  PendulumParams,
  PendulumState,
  getNPendulumKinematics,
  computePendulumAngularDifferenceDeg,
  PENDULUM_BOB_COLORS,
} from "@/engine/physicsModules";
import { Language, translations } from "@/i18n/translations";
import {
  Hand,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
} from "lucide-react";

export interface ViewOverlays {
  velocityVec: boolean;
  forceVec: boolean;
  trail: boolean;
  grid: boolean;
  axes3D: boolean;
}

interface PhysicsViewportProps {
  moduleId: ModuleId;
  lang: Language;
  overlays: ViewOverlays;
  onToggleOverlay: (key: keyof ViewOverlays) => void;
  isRunning: boolean;
  fps: number;
  oscParams: OscillatorParams;
  oscState: OscillatorState;
  onOscDrag: (x0: number) => void;
  pendParams: PendulumParams;
  pendState: PendulumState;
  onPendDragBob: (bobIndex: number, newTheta: number) => void;
  onChangePendCount: (newCount: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

// ==========================================
// PARAMETRIC 3D HELICAL SPRING CURVE
// ==========================================
class HelixCurve extends THREE.Curve<THREE.Vector3> {
  startX: number;
  endX: number;
  radius: number;
  turns: number;

  constructor(startX: number, endX: number, radius = 0.42, turns = 13) {
    super();
    this.startX = startX;
    this.endX = endX;
    this.radius = radius;
    this.turns = turns;
  }

  getPoint(t: number, optionalTarget = new THREE.Vector3()) {
    const x = this.startX + (this.endX - this.startX) * t;
    let y = 0;
    let z = 0;

    // Straight ends for realistic industrial hooks
    if (t > 0.04 && t < 0.96) {
      const u = (t - 0.04) / 0.92;
      const angle = u * Math.PI * 2 * this.turns;
      y = Math.cos(angle) * this.radius;
      z = Math.sin(angle) * this.radius;
    }
    return optionalTarget.set(x, y, z);
  }
}

// ==========================================
// TEXT SPRITE CREATOR
// ==========================================
function createTextSprite(
  text: string,
  color: string,
  bgColor?: string,
  fontSize = 48
): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bgColor) {
      ctx.fillStyle = bgColor;
      ctx.roundRect
        ? ctx.roundRect(16, 20, 224, 88, 16)
        : ctx.rect(16, 20, 224, 88);
      ctx.fill();
    }
    ctx.font = `bold ${fontSize}px "SF Mono", monospace, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.2, 0.6, 1.0);
  return sprite;
}

export const PhysicsViewport: React.FC<PhysicsViewportProps> = ({
  moduleId,
  lang,
  overlays,
  onToggleOverlay,
  oscParams,
  oscState,
  onOscDrag,
  pendParams,
  pendState,
  onPendDragBob,
  onChangePendCount,
  onDragStart,
  onDragEnd,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Three.js Core Refs
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Scene Group Refs
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const axesGroupRef = useRef<THREE.Group | null>(null);
  const oscillatorGroupRef = useRef<THREE.Group | null>(null);
  const pendulumGroupRef = useRef<THREE.Group | null>(null);

  // Dynamic Oscillator 3D Meshes
  const springMeshRef = useRef<THREE.Mesh | null>(null);
  const massMeshRef = useRef<THREE.Mesh | null>(null);
  const oscVelArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const oscForceArrowRef = useRef<THREE.ArrowHelper | null>(null);

  // Dynamic Pendulum 3D Meshes
  const pendRodsRef = useRef<THREE.Mesh[]>([]);
  const pendBobsRef = useRef<THREE.Mesh[]>([]);
  const pendGhostRodsRef = useRef<THREE.Mesh[]>([]);
  const pendGhostBobsRef = useRef<THREE.Mesh[]>([]);
  const pendTrailLineRef = useRef<THREE.Line | null>(null);
  const pendGhostTrailLineRef = useRef<THREE.Line | null>(null);
  const pendVelArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const pendForceArrowRef = useRef<THREE.ArrowHelper | null>(null);

  // Trail Histories (3D points)
  const trailPointsRef = useRef<THREE.Vector3[]>([]);
  const ghostTrailPointsRef = useRef<THREE.Vector3[]>([]);

  // Dragging & Interaction State
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [hoverTarget, setHoverTarget] = useState<string | null>(null);
  const dragTargetRef = useRef<string | null>(null);
  dragTargetRef.current = dragTarget;

  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Camera preset animation
  const targetCamPosRef = useRef<THREE.Vector3 | null>(null);
  const targetCamLookRef = useRef<THREE.Vector3 | null>(null);

  const t = translations[lang];

  // Callback refs to stay in sync with closures
  const onOscDragRef = useRef(onOscDrag);
  onOscDragRef.current = onOscDrag;
  const onPendDragBobRef = useRef(onPendDragBob);
  onPendDragBobRef.current = onPendDragBob;
  const oscStateRef = useRef(oscState);
  oscStateRef.current = oscState;
  const oscParamsRef = useRef(oscParams);
  oscParamsRef.current = oscParams;
  const pendStateRef = useRef(pendState);
  pendStateRef.current = pendState;
  const pendParamsRef = useRef(pendParams);
  pendParamsRef.current = pendParams;
  const moduleIdRef = useRef(moduleId);
  moduleIdRef.current = moduleId;
  const onDragStartRef = useRef(onDragStart);
  onDragStartRef.current = onDragStart;
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;

  // ==========================================
  // INITIALIZE THREE.JS SCENE ON MOUNT
  // ==========================================
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Remove any previous canvas to support hot-reloads cleanly
    const oldCanvases = container.querySelectorAll("canvas");
    oldCanvases.forEach((c) => c.remove());

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0a0b0f");
    scene.fog = new THREE.FogExp2("#0a0b0f", 0.015);
    sceneRef.current = scene;

    // 2. Camera - Default Angled 3D Isometric View
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    const isPend = moduleIdRef.current === "pendulum";
    camera.position.set(isPend ? 5.5 : 8.2, isPend ? 3.2 : 5.6, isPend ? 14.5 : 14.8);
    cameraRef.current = camera;

    // 3. Renderer (appended dynamically)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.className = "w-full h-full block";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.85;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.85;
    controls.minDistance = 3.0;
    controls.maxDistance = 45.0;
    controls.target.set(0, isPend ? 0.6 : 0, 0);
    controls.update();
    controlsRef.current = controls;

    // 5. Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambLight);

    const dirLight1 = new THREE.DirectionalLight(0xfffaed, 2.5);
    dirLight1.position.set(8, 12, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight2.position.set(-10, -6, -8);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xf59e0b, 1.6, 25);
    pointLight.position.set(0, 2, 4);
    scene.add(pointLight);

    // 6. Ground 3D Grid (XZ Plane)
    const gridHelper = new THREE.GridHelper(32, 32, 0x334155, 0x171922);
    gridHelper.position.y = -4.5;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // 7. 3D XYZ Eksenleri (Red X, Green Y, Blue Z)
    const axesGroup = new THREE.Group();
    const axisRadius = 0.042;
    const axisLength = 3.0;
    const coneRadius = 0.12;
    const coneHeight = 0.35;

    // +X (Red)
    const xMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.15,
      metalness: 0.85,
    });
    const xGeom = new THREE.CylinderGeometry(
      axisRadius,
      axisRadius,
      axisLength,
      16
    );
    const xMesh = new THREE.Mesh(xGeom, xMat);
    xMesh.rotation.z = -Math.PI / 2;
    xMesh.position.x = axisLength / 2;
    axesGroup.add(xMesh);

    const xConeGeom = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
    const xCone = new THREE.Mesh(xConeGeom, xMat);
    xCone.rotation.z = -Math.PI / 2;
    xCone.position.x = axisLength + coneHeight / 2;
    axesGroup.add(xCone);

    const xLabel = createTextSprite("X", "#f43f5e", undefined, 56);
    xLabel.position.set(axisLength + 0.7, 0, 0);
    xLabel.scale.set(0.7, 0.38, 1);
    axesGroup.add(xLabel);

    // +Y (Green)
    const yMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.15,
      metalness: 0.85,
    });
    const yGeom = new THREE.CylinderGeometry(
      axisRadius,
      axisRadius,
      axisLength,
      16
    );
    const yMesh = new THREE.Mesh(yGeom, yMat);
    yMesh.position.y = axisLength / 2;
    axesGroup.add(yMesh);

    const yConeGeom = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
    const yCone = new THREE.Mesh(yConeGeom, yMat);
    yCone.position.y = axisLength + coneHeight / 2;
    axesGroup.add(yCone);

    const yLabel = createTextSprite("Y", "#10b981", undefined, 56);
    yLabel.position.set(0, axisLength + 0.7, 0);
    yLabel.scale.set(0.7, 0.38, 1);
    axesGroup.add(yLabel);

    // +Z (Blue)
    const zMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      roughness: 0.15,
      metalness: 0.85,
    });
    const zGeom = new THREE.CylinderGeometry(
      axisRadius,
      axisRadius,
      axisLength,
      16
    );
    const zMesh = new THREE.Mesh(zGeom, zMat);
    zMesh.rotation.x = Math.PI / 2;
    zMesh.position.z = axisLength / 2;
    axesGroup.add(zMesh);

    const zConeGeom = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
    const zCone = new THREE.Mesh(zConeGeom, zMat);
    zCone.rotation.x = Math.PI / 2;
    zCone.position.z = axisLength + coneHeight / 2;
    axesGroup.add(zCone);

    const zLabel = createTextSprite("Z", "#0ea5e9", undefined, 56);
    zLabel.position.set(0, 0, axisLength + 0.7);
    zLabel.scale.set(0.7, 0.38, 1);
    axesGroup.add(zLabel);

    // Negative axis reference lines
    const negMat = new THREE.LineDashedMaterial({
      color: 0x64748b,
      dashSize: 0.25,
      gapSize: 0.18,
      transparent: true,
      opacity: 0.5,
    });
    const negPoints = [
      new THREE.Vector3(-3.0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -3.0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -3.0),
    ];
    const negGeom = new THREE.BufferGeometry().setFromPoints(negPoints);
    const negLine = new THREE.Line(negGeom, negMat);
    negLine.computeLineDistances();
    axesGroup.add(negLine);

    // Origin sphere
    const originMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.95,
        roughness: 0.15,
      })
    );
    axesGroup.add(originMesh);

    scene.add(axesGroup);
    axesGroupRef.current = axesGroup;

    // 8. Oscillator 3D Group
    const oscGroup = new THREE.Group();
    scene.add(oscGroup);
    oscillatorGroupRef.current = oscGroup;

    // Wall Mount at x = -7.5
    const wallBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 3.8, 3.8),
      new THREE.MeshStandardMaterial({
        color: 0x1e242d,
        metalness: 0.7,
        roughness: 0.35,
      })
    );
    wallBase.position.set(-7.5, 0, 0);
    oscGroup.add(wallBase);

    // Wall mounting flange plate
    const wallFlange = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.85, 0.12, 24),
      new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.85,
        roughness: 0.25,
      })
    );
    wallFlange.rotation.z = Math.PI / 2;
    wallFlange.position.set(-7.22, 0, 0);
    oscGroup.add(wallFlange);

    // Industrial Rubber Bumper Pad (Prevents mass block from contacting the wall)
    const rubberBumper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.22, 24),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.1,
        roughness: 0.85,
      })
    );
    rubberBumper.rotation.z = Math.PI / 2;
    rubberBumper.position.set(-7.08, 0, 0);
    oscGroup.add(rubberBumper);

    // Heavy-duty spring mounting shackle ring on wall
    const shackleRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.05, 12, 24),
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.9,
        roughness: 0.2,
      })
    );
    shackleRing.rotation.y = Math.PI / 2;
    shackleRing.position.set(-6.96, 0, 0);
    oscGroup.add(shackleRing);

    // 4 Hex Bolts on Wall
    const boltMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.2,
    });
    [
      [-1.3, -1.3],
      [-1.3, 1.3],
      [1.3, -1.3],
      [1.3, 1.3],
    ].forEach(([by, bz]) => {
      const bolt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.13, 0.18, 6),
        boltMat
      );
      bolt.rotation.z = Math.PI / 2;
      bolt.position.set(-7.22, by, bz);
      oscGroup.add(bolt);
    });

    // Horizontal Guide Rail (Chrome rod along X)
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 17.5, 16),
      new THREE.MeshStandardMaterial({
        color: 0xcfd8dc,
        metalness: 0.95,
        roughness: 0.12,
      })
    );
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0.5, 0, 0);
    oscGroup.add(rail);

    // Right End Rail Cap / Stopper at x = 8.5
    const railCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.25, 16),
      new THREE.MeshStandardMaterial({
        color: 0x475569,
        metalness: 0.8,
        roughness: 0.3,
      })
    );
    railCap.rotation.z = Math.PI / 2;
    railCap.position.set(8.5, 0, 0);
    oscGroup.add(railCap);

    // Equilibrium marker ring at x = 0
    const eqRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.8, 0.02, 12, 36),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.45,
      })
    );
    eqRing.rotation.y = Math.PI / 2;
    eqRing.position.set(0, 0, 0);
    oscGroup.add(eqRing);

    const eqLabel = createTextSprite("x = 0 (Denge)", "#38bdf8", undefined, 38);
    eqLabel.position.set(0, 1.2, 0);
    eqLabel.scale.set(1.4, 0.7, 1);
    oscGroup.add(eqLabel);

    // 3D Mass Block
    const massGeom = new THREE.BoxGeometry(1.65, 1.35, 1.35);
    const massMat = new THREE.MeshStandardMaterial({
      color: 0x1e2630,
      metalness: 0.8,
      roughness: 0.22,
    });
    const massMesh = new THREE.Mesh(massGeom, massMat);
    massMesh.castShadow = true;
    massMesh.receiveShadow = true;
    massMesh.userData = { isOscMass: true };
    oscGroup.add(massMesh);
    massMeshRef.current = massMesh;

    // Bearing ring sleeve on mass
    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 1.7, 16),
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.85,
        roughness: 0.2,
      })
    );
    sleeve.rotation.z = Math.PI / 2;
    massMesh.add(sleeve);

    // Spring connector eyelet bracket on left face of mass block
    const massBracket = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.045, 12, 24),
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.9,
        roughness: 0.2,
      })
    );
    massBracket.rotation.y = Math.PI / 2;
    massBracket.position.set(-0.83, 0, 0);
    massMesh.add(massBracket);

    // Mass Label Sprite on Block
    const massSprite = createTextSprite("2.0 kg", "#fbbf24", "#0f172a", 44);
    massSprite.position.set(0, 0, 0.72);
    massMesh.add(massSprite);

    // 3D Spring Tube
    const initialCurve = new HelixCurve(-7.05, 1.2, 0.42, 15);
    const springGeom = new THREE.TubeGeometry(initialCurve, 160, 0.055, 10, false);
    const springMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      metalness: 0.9,
      roughness: 0.18,
    });
    const springMesh = new THREE.Mesh(springGeom, springMat);
    oscGroup.add(springMesh);
    springMeshRef.current = springMesh;

    // Velocity & Force 3D Arrows
    const oscVelArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      1,
      0x10b981,
      0.35,
      0.18
    );
    oscGroup.add(oscVelArrow);
    oscVelArrowRef.current = oscVelArrow;

    const oscForceArrow = new THREE.ArrowHelper(
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      1,
      0xf59e0b,
      0.35,
      0.18
    );
    oscGroup.add(oscForceArrow);
    oscForceArrowRef.current = oscForceArrow;

    // 9. Pendulum 3D Group
    const pendGroup = new THREE.Group();
    scene.add(pendGroup);
    pendulumGroupRef.current = pendGroup;

    // Top Ceiling Bracket at y = 2.4
    const ceilingBase = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.35, 1.3),
      new THREE.MeshStandardMaterial({
        color: 0x242d38,
        metalness: 0.7,
        roughness: 0.3,
      })
    );
    ceilingBase.position.set(0, 2.4, 0);
    pendGroup.add(ceilingBase);

    const pivotBearing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.9, 20),
      boltMat
    );
    pivotBearing.rotation.x = Math.PI / 2;
    pivotBearing.position.set(0, 2.2, 0);
    pendGroup.add(pivotBearing);

    // Pendulum Trail Line (3D Neon ribbon)
    const maxTrailPts = 200;
    const trailPositions = new Float32Array(maxTrailPts * 3);
    const trailGeom = new THREE.BufferGeometry();
    trailGeom.setAttribute(
      "position",
      new THREE.BufferAttribute(trailPositions, 3)
    );
    const trailMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 2,
      transparent: true,
      opacity: 0.85,
    });
    const trailLine = new THREE.Line(trailGeom, trailMat);
    pendGroup.add(trailLine);
    pendTrailLineRef.current = trailLine;

    // Ghost Pendulum Trail Line
    const ghostTrailPositions = new Float32Array(maxTrailPts * 3);
    const ghostTrailGeom = new THREE.BufferGeometry();
    ghostTrailGeom.setAttribute(
      "position",
      new THREE.BufferAttribute(ghostTrailPositions, 3)
    );
    const ghostTrailMat = new THREE.LineBasicMaterial({
      color: 0x2dd4bf,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.55,
    });
    const ghostTrailLine = new THREE.Line(ghostTrailGeom, ghostTrailMat);
    pendGroup.add(ghostTrailLine);
    pendGhostTrailLineRef.current = ghostTrailLine;

    // Velocity & Force arrows for pendulum tip
    const pendVelArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      1,
      0x10b981,
      0.32,
      0.15
    );
    pendGroup.add(pendVelArrow);
    pendVelArrowRef.current = pendVelArrow;

    const pendForceArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 0),
      1,
      0xf59e0b,
      0.32,
      0.15
    );
    pendGroup.add(pendForceArrow);
    pendForceArrowRef.current = pendForceArrow;

    // 10. Pointer Events directly on renderer.domElement
    const dom = renderer.domElement;

    const onPointerDown = (e: PointerEvent) => {
      const rect = dom.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      if (moduleIdRef.current === "oscillator" && massMeshRef.current) {
        const hits = raycasterRef.current.intersectObject(massMeshRef.current);
        if (hits.length > 0) {
          controls.enabled = false;
          setDragTarget("osc-mass");
          dom.setPointerCapture(e.pointerId);
          onDragStartRef.current?.();
          return;
        }
      } else if (moduleIdRef.current === "pendulum") {
        const bobs = pendBobsRef.current.filter((b) => b.visible);
        const hits = raycasterRef.current.intersectObjects(bobs);
        if (hits.length > 0) {
          const hitBob = hits[0].object;
          const bIdx = hitBob.userData.bobIndex ?? 0;
          controls.enabled = false;
          setDragTarget(`pend-bob:${bIdx}`);
          dom.setPointerCapture(e.pointerId);
          onDragStartRef.current?.();
          return;
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = dom.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const ray = raycasterRef.current.ray;

      const activeDrag = dragTargetRef.current;
      if (activeDrag) {
        if (activeDrag === "osc-mass") {
          const denom = ray.direction.y * ray.direction.y + ray.direction.z * ray.direction.z;
          let xProj = oscStateRef.current.x;
          if (denom > 1e-4) {
            const sStar =
              -(ray.origin.y * ray.direction.y + ray.origin.z * ray.direction.z) /
              denom;
            xProj = ray.origin.x + sStar * ray.direction.x;
          }
          const mScale = Math.max(0.7, Math.min(1.4, Math.cbrt((oscParamsRef.current.mass || 2.0) / 2.0)));
          const hWidth = 0.825 * mScale;
          // Wall bumper is at -7.05, solid spring height is 1.45m.
          // Mass center cannot go further left than:
          const minMassX = -7.05 + 1.45 + hWidth;
          const clampedX = Math.max(minMassX, Math.min(6.5, xProj));
          onOscDragRef.current(clampedX);
        } else if (activeDrag.startsWith("pend-bob:")) {
          const bobIndex = parseInt(activeDrag.split(":")[1], 10);
          let interX = 0;
          let interY = 0;
          if (Math.abs(ray.direction.z) > 1e-4) {
            const sPlane = -ray.origin.z / ray.direction.z;
            interX = ray.origin.x + sPlane * ray.direction.x;
            interY = ray.origin.y + sPlane * ray.direction.y;
          }

          const pivot = { x: 0, y: 2.2 };
          const pParams = pendParamsRef.current;
          const pState = pendStateRef.current;
          const n = Math.max(1, Math.min(6, Math.floor(pParams.count || 2)));
          const pScale = n <= 2 ? 1.6 : n <= 4 ? 1.3 : 1.0;
          const { positions } = getNPendulumKinematics(
            pState.thetas,
            pState.omegas,
            pParams.lengths,
            n
          );

          let parentX = pivot.x;
          let parentY = pivot.y;
          if (bobIndex > 0) {
            parentX = pivot.x + positions[bobIndex - 1].x * pScale;
            parentY = pivot.y - positions[bobIndex - 1].y * pScale;
          }

          const dx = interX - parentX;
          const dy = parentY - interY;
          let angle = Math.atan2(dx, dy);
          onPendDragBobRef.current(bobIndex, angle);
        }
        return;
      }

      // Hover check
      if (moduleIdRef.current === "oscillator" && massMeshRef.current) {
        const hits = raycasterRef.current.intersectObject(massMeshRef.current);
        const hovering = hits.length > 0;
        setHoverTarget(hovering ? "osc-mass" : null);
        dom.style.cursor = hovering ? "grab" : "default";
      } else if (moduleIdRef.current === "pendulum") {
        const bobs = pendBobsRef.current.filter((b) => b.visible);
        const hits = raycasterRef.current.intersectObjects(bobs);
        const hovering = hits.length > 0;
        setHoverTarget(hovering ? "pend-bob" : null);
        dom.style.cursor = hovering ? "grab" : "default";
      } else {
        dom.style.cursor = "default";
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      controls.enabled = true;
      if (dragTargetRef.current) {
        if (dom.hasPointerCapture(e.pointerId)) {
          dom.releasePointerCapture(e.pointerId);
        }
        setDragTarget(null);
        dom.style.cursor = "default";
        onDragEndRef.current?.();
      }
    };

    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("pointercancel", onPointerUp);

    // 11. Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // 12. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera preset interpolation
      if (targetCamPosRef.current && camera) {
        camera.position.lerp(targetCamPosRef.current, 0.08);
        if (targetCamLookRef.current && controls) {
          controls.target.lerp(targetCamLookRef.current, 0.08);
        }
        if (camera.position.distanceTo(targetCamPosRef.current) < 0.04) {
          targetCamPosRef.current = null;
          targetCamLookRef.current = null;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("pointercancel", onPointerUp);
      renderer.dispose();
      if (dom.parentElement === container) {
        container.removeChild(dom);
      }
    };
  }, []);

  // ==========================================
  // SYNC VISIBILITY & MODULE PROPS WITH THREE.JS
  // ==========================================
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = overlays.grid;
    }
    if (axesGroupRef.current) {
      axesGroupRef.current.visible = overlays.axes3D;
    }
    if (oscillatorGroupRef.current) {
      oscillatorGroupRef.current.visible = moduleId === "oscillator";
    }
    if (pendulumGroupRef.current) {
      pendulumGroupRef.current.visible = moduleId === "pendulum";
    }

    // Glide camera to the framing appropriate for the active module
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (camera && controls) {
      if (moduleId === "oscillator") {
        targetCamPosRef.current = new THREE.Vector3(8.2, 5.6, 14.8);
        targetCamLookRef.current = new THREE.Vector3(0, 0, 0);
      } else {
        targetCamPosRef.current = new THREE.Vector3(5.5, 3.2, 14.5);
        targetCamLookRef.current = new THREE.Vector3(0, 0.6, 0);
      }
    }
  }, [moduleId, overlays.grid, overlays.axes3D]);

  // ==========================================
  // UPDATE OSCILLATOR 3D ON EVERY TICK
  // ==========================================
  useEffect(() => {
    if (moduleId !== "oscillator") return;

    const blockX = oscState.x;
    const massMesh = massMeshRef.current;
    const springMesh = springMeshRef.current;
    const velArrow = oscVelArrowRef.current;
    const forceArrow = oscForceArrowRef.current;

    if (massMesh) {
      massMesh.position.set(blockX, 0, 0);
      const s = Math.max(0.7, Math.min(1.4, Math.cbrt(oscParams.mass / 2.0)));
      massMesh.scale.set(s, s, s);
    }

    if (springMesh) {
      // Re-generate tube geometry along dynamic helix
      const startX = -7.05;
      const s = massMesh?.scale.x || 1.0;
      const halfW = 0.825 * s;
      // Physical minimum spring length is 1.40m (solid tightly compressed coils)
      const endX = Math.max(startX + 1.40, blockX - halfW);
      springMesh.geometry.dispose();
      springMesh.geometry = new THREE.TubeGeometry(
        new HelixCurve(startX, endX, 0.42, 15),
        160,
        0.055,
        10,
        false
      );
    }

    // Velocity Arrow (Emerald)
    if (velArrow) {
      velArrow.visible = overlays.velocityVec && Math.abs(oscState.v) > 0.04;
      const dir = oscState.v >= 0 ? 1 : -1;
      velArrow.setDirection(new THREE.Vector3(dir, 0, 0));
      velArrow.position.set(blockX, 1.1, 0);
      velArrow.setLength(
        Math.min(4.0, Math.max(0.4, Math.abs(oscState.v) * 0.28)),
        0.35,
        0.18
      );
    }

    // Force Arrow (Amber)
    if (forceArrow) {
      const netForce =
        -oscParams.stiffness * oscState.x -
        oscParams.damping * oscState.v +
        oscParams.driveAmp * Math.cos(oscParams.driveFreq * oscState.t);
      forceArrow.visible = overlays.forceVec && Math.abs(netForce) > 0.5;
      const fDir = netForce >= 0 ? 1 : -1;
      forceArrow.setDirection(new THREE.Vector3(fDir, 0, 0));
      forceArrow.position.set(blockX, -1.1, 0);
      forceArrow.setLength(
        Math.min(4.2, Math.max(0.4, Math.abs(netForce) * 0.045)),
        0.35,
        0.18
      );
    }
  }, [moduleId, oscState, oscParams, overlays.velocityVec, overlays.forceVec]);

  // ==========================================
  // UPDATE MULTI-PENDULUM 3D ON EVERY TICK
  // ==========================================
  useEffect(() => {
    if (moduleId !== "pendulum") return;
    const scene = pendulumGroupRef.current;
    if (!scene) return;

    const n = Math.max(1, Math.min(6, Math.floor(pendParams.count || 2)));
    const pivot = { x: 0, y: 2.2, z: 0 };
    const pScale = n <= 2 ? 1.6 : n <= 4 ? 1.3 : 1.0;
    const { positions, velocities } = getNPendulumKinematics(
      pendState.thetas,
      pendState.omegas,
      pendParams.lengths,
      n
    );

    // Synchronize 3D Rods & Bobs array length
    while (pendRodsRef.current.length < n) {
      const i = pendRodsRef.current.length;
      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 1, 16),
        new THREE.MeshStandardMaterial({
          color: 0xcfd8dc,
          metalness: 0.9,
          roughness: 0.15,
        })
      );
      scene.add(rod);
      pendRodsRef.current.push(rod);

      const palette = PENDULUM_BOB_COLORS[i % PENDULUM_BOB_COLORS.length];
      const colorHex = palette?.light || "#38bdf8";
      const bob = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 32, 32),
        new THREE.MeshStandardMaterial({
          color: colorHex,
          metalness: 0.8,
          roughness: 0.18,
          emissive: colorHex,
          emissiveIntensity: 0.22,
        })
      );
      bob.userData = { isPendBob: true, bobIndex: i };
      scene.add(bob);
      pendBobsRef.current.push(bob);
    }

    // Hide extra meshes if count decreased
    for (let i = 0; i < pendRodsRef.current.length; i++) {
      pendRodsRef.current[i].visible = i < n;
      pendBobsRef.current[i].visible = i < n;
    }

    // Position each rod and bob in 3D
    let prev = { x: pivot.x, y: pivot.y, z: pivot.z };
    const yAxis = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < n; i++) {
      const cur = {
        x: pivot.x + positions[i].x * pScale,
        y: pivot.y - positions[i].y * pScale,
        z: 0,
      };

      // Bob
      const bob = pendBobsRef.current[i];
      bob.position.set(cur.x, cur.y, cur.z);
      const m = pendParams.masses[i] || 1.0;
      const bScale = Math.max(0.65, Math.min(1.4, Math.cbrt(m / 1.5)));
      bob.scale.set(bScale, bScale, bScale);

      // Rod
      const rod = pendRodsRef.current[i];
      const mid = new THREE.Vector3(
        (prev.x + cur.x) / 2,
        (prev.y + cur.y) / 2,
        0
      );
      rod.position.copy(mid);

      const dir = new THREE.Vector3(
        cur.x - prev.x,
        cur.y - prev.y,
        0
      );
      const len = dir.length();
      rod.scale.set(1, Math.max(0.01, len), 1);
      dir.normalize();
      rod.quaternion.setFromUnitVectors(yAxis, dir);

      prev = cur;
    }

    // Tip velocity and force vectors
    const tipIdx = n - 1;
    const tipPos = new THREE.Vector3(
      pivot.x + positions[tipIdx].x * pScale,
      pivot.y - positions[tipIdx].y * pScale,
      0
    );
    const tipVel = velocities[tipIdx];
    const velSpeed = tipVel ? Math.hypot(tipVel.x, tipVel.y) : 0;

    if (pendVelArrowRef.current) {
      pendVelArrowRef.current.visible =
        overlays.velocityVec && velSpeed > 0.05;
      if (velSpeed > 0.01 && tipVel) {
        pendVelArrowRef.current.position.copy(tipPos);
        pendVelArrowRef.current.setDirection(
          new THREE.Vector3(tipVel.x / velSpeed, -tipVel.y / velSpeed, 0)
        );
        pendVelArrowRef.current.setLength(
          Math.min(3.0, Math.max(0.4, velSpeed * 0.45)),
          0.3,
          0.15
        );
      }
    }

    // 3D Motion Trail Buffer
    if (overlays.trail) {
      trailPointsRef.current.push(tipPos.clone());
      if (trailPointsRef.current.length > 180) {
        trailPointsRef.current.shift();
      }
      if (pendTrailLineRef.current) {
        const lineGeom = pendTrailLineRef.current.geometry;
        const posAttr = lineGeom.getAttribute(
          "position"
        ) as THREE.BufferAttribute;
        const pts = trailPointsRef.current;
        for (let i = 0; i < pts.length; i++) {
          posAttr.setXYZ(i, pts[i].x, pts[i].y, pts[i].z);
        }
        lineGeom.setDrawRange(0, pts.length);
        posAttr.needsUpdate = true;
      }
    } else {
      trailPointsRef.current = [];
      if (pendTrailLineRef.current) {
        pendTrailLineRef.current.geometry.setDrawRange(0, 0);
      }
    }

    // Ghost Pendulum in 3D
    if (pendParams.ghostEnabled && pendState.ghostThetas) {
      const ghostKin = getNPendulumKinematics(
        pendState.ghostThetas,
        new Array(n).fill(0),
        pendParams.lengths,
        n
      );

      while (pendGhostRodsRef.current.length < n) {
        const i = pendGhostRodsRef.current.length;
        const gRod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.035, 1, 12),
          new THREE.MeshStandardMaterial({
            color: 0x2dd4bf,
            transparent: true,
            opacity: 0.38,
          })
        );
        scene.add(gRod);
        pendGhostRodsRef.current.push(gRod);

        const gBob = new THREE.Mesh(
          new THREE.SphereGeometry(0.28, 24, 24),
          new THREE.MeshStandardMaterial({
            color: 0x2dd4bf,
            transparent: true,
            opacity: 0.45,
            wireframe: false,
          })
        );
        scene.add(gBob);
        pendGhostBobsRef.current.push(gBob);
      }

      for (let i = 0; i < pendGhostRodsRef.current.length; i++) {
        pendGhostRodsRef.current[i].visible = i < n;
        pendGhostBobsRef.current[i].visible = i < n;
      }

      let gPrev = { x: pivot.x, y: pivot.y, z: 0 };
      for (let i = 0; i < n; i++) {
        const gCur = {
          x: pivot.x + ghostKin.positions[i].x * pScale,
          y: pivot.y - ghostKin.positions[i].y * pScale,
          z: 0,
        };
        const gBob = pendGhostBobsRef.current[i];
        gBob.position.set(gCur.x, gCur.y, gCur.z);

        const gRod = pendGhostRodsRef.current[i];
        gRod.position.set(
          (gPrev.x + gCur.x) / 2,
          (gPrev.y + gCur.y) / 2,
          0
        );
        const gDir = new THREE.Vector3(
          gCur.x - gPrev.x,
          gCur.y - gPrev.y,
          0
        );
        gRod.scale.set(1, Math.max(0.01, gDir.length()), 1);
        gDir.normalize();
        gRod.quaternion.setFromUnitVectors(yAxis, gDir);

        gPrev = gCur;
      }

      // Ghost trail
      if (overlays.trail) {
        const gTip = new THREE.Vector3(
          pivot.x + ghostKin.positions[tipIdx].x * pScale,
          pivot.y - ghostKin.positions[tipIdx].y * pScale,
          0
        );
        ghostTrailPointsRef.current.push(gTip);
        if (ghostTrailPointsRef.current.length > 180) {
          ghostTrailPointsRef.current.shift();
        }
        if (pendGhostTrailLineRef.current) {
          const gLineGeom = pendGhostTrailLineRef.current.geometry;
          const gPosAttr = gLineGeom.getAttribute(
            "position"
          ) as THREE.BufferAttribute;
          const gPts = ghostTrailPointsRef.current;
          for (let i = 0; i < gPts.length; i++) {
            gPosAttr.setXYZ(i, gPts[i].x, gPts[i].y, gPts[i].z);
          }
          gLineGeom.setDrawRange(0, gPts.length);
          gPosAttr.needsUpdate = true;
        }
      }
    } else {
      // Hide ghost meshes
      for (let i = 0; i < pendGhostRodsRef.current.length; i++) {
        pendGhostRodsRef.current[i].visible = false;
        pendGhostBobsRef.current[i].visible = false;
      }
      ghostTrailPointsRef.current = [];
      if (pendGhostTrailLineRef.current) {
        pendGhostTrailLineRef.current.geometry.setDrawRange(0, 0);
      }
    }
  }, [
    moduleId,
    pendState,
    pendParams,
    overlays.velocityVec,
    overlays.forceVec,
    overlays.trail,
  ]);

  // ==========================================
  // PROGRAMMATIC 3D CAMERA ACTIONS (ZOOM & PRESETS)
  // ==========================================
  const handleZoomIn = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
    const newDist = Math.max(controls.minDistance, dir.length() * 0.78);
    dir.setLength(newDist);
    targetCamPosRef.current = new THREE.Vector3().addVectors(
      controls.target,
      dir
    );
  };

  const handleZoomOut = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
    const newDist = Math.min(controls.maxDistance, dir.length() * 1.28);
    dir.setLength(newDist);
    targetCamPosRef.current = new THREE.Vector3().addVectors(
      controls.target,
      dir
    );
  };

  const handleResetCamera = () => {
    if (moduleId === "oscillator") {
      targetCamPosRef.current = new THREE.Vector3(8.2, 5.6, 14.8);
      targetCamLookRef.current = new THREE.Vector3(0, 0, 0);
    } else {
      targetCamPosRef.current = new THREE.Vector3(5.5, 3.2, 14.5);
      targetCamLookRef.current = new THREE.Vector3(0, 0.6, 0);
    }
  };

  const handleSetView = (view: "3d" | "front" | "top" | "side") => {
    const controls = controlsRef.current;
    const center = controls ? controls.target.clone() : new THREE.Vector3(0, 0, 0);

    if (view === "3d") {
      targetCamPosRef.current = new THREE.Vector3(
        center.x + 8.5,
        center.y + 6.0,
        center.z + 12.0
      );
      targetCamLookRef.current = center;
    } else if (view === "front") {
      targetCamPosRef.current = new THREE.Vector3(
        center.x,
        center.y,
        center.z + 14.5
      );
      targetCamLookRef.current = center;
    } else if (view === "top") {
      targetCamPosRef.current = new THREE.Vector3(
        center.x,
        center.y + 17.0,
        center.z + 0.001
      );
      targetCamLookRef.current = center;
    } else if (view === "side") {
      targetCamPosRef.current = new THREE.Vector3(
        center.x + 16.0,
        center.y,
        center.z
      );
      targetCamLookRef.current = center;
    }
  };

  // Dynamic status text
  const getConciseInsight = () => {
    if (moduleId === "oscillator") {
      const c = oscParams.damping;
      const k = oscParams.stiffness;
      const m = oscParams.mass;
      const w0 = Math.sqrt(k / m);
      const zeta = c / (2 * Math.sqrt(m * k));
      const T0 = (2 * Math.PI) / w0;

      if (c === 0) {
        return lang === "tr"
          ? `Sürtünmesiz Sonsuz Salınım: Toplam enerji korunuyor (Doğal Periyot T = ${T0.toFixed(2)} s).`
          : `Undamped Perpetual Motion: Total mechanical energy conserved (Period T = ${T0.toFixed(2)} s).`;
      }
      if (zeta < 1) {
        return lang === "tr"
          ? `Eksik Sönüm (ζ = ${zeta.toFixed(2)}): Kütle her gidiş-gelişte enerjisini ısıya bırakarak duruyor.`
          : `Underdamped (ζ = ${zeta.toFixed(2)}): Mechanical energy dissipates into heat with each stroke.`;
      }
      return lang === "tr"
        ? `Aşırı Sönüm (ζ = ${zeta.toFixed(2)}): Bal gibi yoğun viskoz ortamda kütle salınamadan yavaşça duruyor.`
        : `Overdamped (ζ = ${zeta.toFixed(2)}): Viscous resistance prevents oscillation.`;
    }

    const n = Math.max(1, Math.min(6, Math.floor(pendParams.count || 2)));
    if (n === 1) {
      const L1 = pendParams.lengths[0] || 1;
      const T1 = 2 * Math.PI * Math.sqrt(L1 / pendParams.g);
      return lang === "tr"
        ? `Galileo Tek Sarkaç: Düzenli periyodik hareket (T = ${T1.toFixed(2)} s).`
        : `Galileo Simple Pendulum: Regular harmonic period (T = ${T1.toFixed(2)} s).`;
    }
    if (n === 2) {
      const angleDiffDeg = computePendulumAngularDifferenceDeg(
        pendState,
        n
      );
      return angleDiffDeg > 15
        ? lang === "tr"
          ? `🦋 Kelebek Etkisi / Kaos: İkiz sarkaçlar tamamen ayrıştı! (Açısal fark: ${angleDiffDeg.toFixed(1)}°).`
          : `🦋 Butterfly Effect: Ghost pendulum diverged by ${angleDiffDeg.toFixed(1)}°!`
        : lang === "tr"
        ? `Çift Sarkaç: İkizler henüz eş evreli salınıyor (Açısal fark: ${angleDiffDeg.toFixed(2)}°).`
        : `Double Pendulum: Bobs still swinging coherently (diff: ${angleDiffDeg.toFixed(2)}°).`;
    }
    return lang === "tr"
      ? `${n} Kütleli 3B Sarkaç Zinciri: Serbestlik dereceli doğrusal olmayan Euler-Lagrange dinamikleri.`
      : `${n}-Mass 3D Chain in Lagrangian motion.`;
  };

  const insight = getConciseInsight();

  return (
    <div
      ref={mountRef}
      className="relative flex-1 h-full bg-[#0a0b0f] overflow-hidden select-none"
    >
      {/* TOP FLOATING INSIGHT BAR */}
      <div className="absolute top-3.5 left-4 right-56 pointer-events-none z-10 max-w-xl">
        <div className="bg-[#121418]/85 border border-white/[0.09] backdrop-blur-md rounded-full px-4 py-2 shadow-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
            <span className="text-zinc-200 font-medium truncate">{insight}</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono shrink-0 hidden sm:inline-flex items-center gap-1">
            <Hand className="w-3 h-3 text-sky-400" />
            {lang === "tr" ? "Cismi Tutup Çekin" : "Grab & Drag"}
          </span>
        </div>
      </div>

      {/* TOP-RIGHT 3D CAMERA & ZOOM CONTROLS (HUD) */}
      <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-10 bg-[#121418]/90 border border-white/[0.09] backdrop-blur-md rounded-xl p-1 shadow-2xl">
        <button
          onClick={handleZoomIn}
          title={t.toolbar.zoomIn || "Yakınlaş (+)"}
          className="w-8 h-8 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title={t.toolbar.zoomOut || "Uzaklaş (-)"}
          className="w-8 h-8 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetCamera}
          title={t.toolbar.resetCam || "Kamerayı Sıfırla"}
          className="w-8 h-8 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-amber-400 flex items-center justify-center transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-white/10 mx-0.5" />

        {/* Quick View Angle Presets */}
        <button
          onClick={() => handleSetView("3d")}
          title={t.toolbar.view3D || "3B Perspektif"}
          className="px-2 py-1 rounded-md text-[11px] font-mono font-semibold bg-zinc-800/40 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
        >
          3D
        </button>
        <button
          onClick={() => handleSetView("front")}
          title={t.toolbar.viewFront || "Önden (XY)"}
          className="px-2 py-1 rounded-md text-[11px] font-mono font-semibold bg-zinc-800/40 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
        >
          XY
        </button>
        <button
          onClick={() => handleSetView("top")}
          title={t.toolbar.viewTop || "Üstten (XZ)"}
          className="px-2 py-1 rounded-md text-[11px] font-mono font-semibold bg-zinc-800/40 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
        >
          XZ
        </button>
        <button
          onClick={() => handleSetView("side")}
          title={t.toolbar.viewSide || "Yandan (YZ)"}
          className="px-2 py-1 rounded-md text-[11px] font-mono font-semibold bg-zinc-800/40 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
        >
          YZ
        </button>
      </div>

      {/* BOTTOM-LEFT 3D NAVIGATION INSTRUCTION PILL */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#121418]/85 border border-white/[0.08] backdrop-blur-md rounded-lg text-[10px] text-zinc-400 font-mono pointer-events-none shadow-lg">
        <Compass className="w-3.5 h-3.5 text-sky-400" />
        <span>
          {lang === "tr"
            ? "Sol Tık: 3B Döndür · Sağ Tık: Kaydır · Tekerlek: Zoom"
            : "Left Click: Rotate · Right Click: Pan · Scroll: Zoom"}
        </span>
      </div>

      {/* BOTTOM FLOATING TOOLBAR */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#121418]/90 border border-white/[0.09] backdrop-blur-md rounded-xl px-3 py-1.5 shadow-2xl flex flex-wrap items-center gap-2 z-10 whitespace-nowrap">
        {/* Quick Chain Count Selector (for Module 2) */}
        {moduleId === "pendulum" && (
          <div className="flex items-center gap-1 pr-2 border-r border-white/[0.08]">
            <span className="text-[11px] font-mono text-zinc-400 mr-1">
              {lang === "tr" ? "Kütle:" : "Bobs:"}
            </span>
            {[1, 2, 3, 4, 5, 6].map((nVal) => (
              <button
                key={nVal}
                onClick={() => onChangePendCount(nVal)}
                className={`w-6 h-6 rounded-md text-xs font-mono font-bold transition cursor-pointer flex items-center justify-center ${
                  pendParams.count === nVal
                    ? "bg-amber-400 text-zinc-950 shadow"
                    : "bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300"
                }`}
              >
                {nVal}
              </button>
            ))}
          </div>
        )}

        {/* View Overlays (XYZ Axes, 3D Grid, Velocity, Force, Trail) */}
        <div className="flex items-center gap-1.5">
          {(
            [
              { key: "axes3D", label: "XYZ Eksenleri", dot: "bg-rose-400" },
              { key: "grid", label: "3B Izgara", dot: "bg-zinc-400" },
              { key: "velocityVec", label: "v (Hız)", dot: "bg-emerald-400" },
              { key: "forceVec", label: "F (Kuvvet)", dot: "bg-amber-400" },
              { key: "trail", label: "İz", dot: "bg-sky-400" },
            ] as const
          ).map((item) => {
            const active = overlays[item.key];
            return (
              <button
                key={item.key}
                onClick={() => onToggleOverlay(item.key)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  active
                    ? "bg-zinc-800 text-zinc-100 border border-white/[0.12]"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${item.dot} ${
                    active ? "opacity-100" : "opacity-30"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
