/**
 * WebGL viewport: renderer, lighting, camera, direct manipulation and the two
 * apparatus rigs. Framework-free; it observes the Simulation and is driven by
 * its frame callback, so React never re-renders at animation rate.
 *
 * Rendering is on demand: a frame is drawn only if the physical state, the
 * camera, an overlay or the viewport size changed.
 */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { ModuleId, Simulation } from "@/sim/Simulation";
import { OKABE_ITO, SURFACE } from "@/ui/palette";
import type { Overlays } from "@/ui/prefs";
import { BENCH_TOP, OscillatorRig, RAIL_Y } from "./OscillatorRig";
import { PendulumRig } from "./PendulumRig";
import { createMaterials, disposeMaterials, disposeTree, VectorArrow, type Materials } from "./primitives";

export type ViewPreset = "iso" | "front" | "top" | "side";

export interface SceneReadout {
  /** Newtons represented by one metre of force arrow. */
  forcePerMetre: number;
  /** Metres per second represented by one metre of velocity arrow. */
  velocityPerMetre: number;
  /** Index of the pendulum link whose vectors are shown. */
  activeLink: number;
}

interface DragState {
  kind: "oscillator" | "pendulum";
  link: number;
  pointerId: number;
  startX: number;
  startY: number;
  /** True once the pointer moved far enough to count as a drag rather than a click. */
  active: boolean;
  /** Carriage position minus pointer position at grab time. */
  offset: number;
  samples: Array<{ time: number; value: number }>;
}

const VIEW_DIRECTIONS: Record<ViewPreset, THREE.Vector3> = {
  iso: new THREE.Vector3(0.36, 0.3, 1).normalize(),
  front: new THREE.Vector3(0, 0.04, 1).normalize(),
  top: new THREE.Vector3(0, 1, 0.012).normalize(),
  side: new THREE.Vector3(1, 0.06, 0.02).normalize(),
};

const Z_AXIS = new THREE.Vector3(0, 0, 1);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const DRAG_THRESHOLD_PX = 4;
const FLING_WINDOW_MS = 90;
const MIN_FLING_SAMPLES = 3;
const MIN_FLING_SPAN_MS = 30;
const FOV = 32;

export class SceneManager {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly labelRenderer: CSS2DRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly materials: Materials;
  private readonly environment: THREE.WebGLRenderTarget;
  private readonly oscillator: OscillatorRig;
  private readonly pendulum: PendulumRig;
  private readonly grid: THREE.LineSegments;
  private readonly axes = new THREE.Group();
  private readonly axisArrows: VectorArrow[] = [];
  private readonly keyLight: THREE.DirectionalLight;
  private readonly resizeObserver: ResizeObserver;
  private readonly unsubscribeFrame: () => void;

  private overlays: Overlays;
  private strobeInterval = 0.1;
  private module: ModuleId;
  private dirty = true;
  private lastFrame = -1;
  private lastLength = Number.NaN;
  private disposed = false;

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly plane = new THREE.Plane();
  private readonly hit = new THREE.Vector3();
  private readonly joint = new THREE.Vector3();
  private readonly box = new THREE.Box3();
  private readonly sphere = new THREE.Sphere();
  private drag: DragState | null = null;

  /** True once the user moved the camera by hand; automatic re-framing then leaves it alone. */
  private userCamera = false;
  private framed = false;
  private readonly corner = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly up = new THREE.Vector3();
  private readonly goalPosition = new THREE.Vector3();
  private readonly goalTarget = new THREE.Vector3();
  private animating = false;

  /** Called when the cursor should change (hover / drag feedback). */
  onCursor: (cursor: "default" | "grab" | "grabbing") => void = () => {};
  /** Called once per gesture when a body is actually being dragged. */
  onGrab: () => void = () => {};

  constructor(
    private readonly container: HTMLElement,
    private readonly sim: Simulation,
    overlays: Overlays,
  ) {
    this.overlays = overlays;
    this.module = sim.getState().module;

    /* ---- renderers ---- */
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const canvas = this.renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.touchAction = "none";
    canvas.style.outline = "none";
    container.appendChild(canvas);

    this.labelRenderer = new CSS2DRenderer();
    const overlay = this.labelRenderer.domElement;
    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.style.pointerEvents = "none";
    overlay.style.overflow = "hidden";
    overlay.setAttribute("aria-hidden", "true");
    container.appendChild(overlay);

    /* ---- world ---- */
    this.scene.background = new THREE.Color(SURFACE.bg);
    this.scene.fog = new THREE.Fog(SURFACE.bg, 42, 110);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(new RoomEnvironment(), 0.04);
    pmrem.dispose();
    this.scene.environment = this.environment.texture;
    this.scene.environmentIntensity = 0.62;

    this.scene.add(new THREE.HemisphereLight(0xcdd6e4, 0x0a0c0f, 0.5));
    this.keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
    this.keyLight.position.set(7, 15, 11);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.bias = -0.0003;
    this.keyLight.shadow.normalBias = 0.03;
    const shadowCamera = this.keyLight.shadow.camera;
    shadowCamera.left = -14;
    shadowCamera.right = 14;
    shadowCamera.top = 14;
    shadowCamera.bottom = -6;
    shadowCamera.near = 1;
    shadowCamera.far = 60;
    this.scene.add(this.keyLight, this.keyLight.target);
    const fill = new THREE.DirectionalLight(0x86b4e4, 0.55);
    fill.position.set(-9, 5, -6);
    this.scene.add(fill);

    // Laboratory bench: a matt surface that receives the shadows.
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 240),
      new THREE.MeshStandardMaterial({ color: 0x11151a, metalness: 0, roughness: 0.92 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.grid = createGrid(26, 16);
    this.scene.add(this.grid);

    /* ---- rigs ---- */
    const anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.materials = createMaterials();
    this.oscillator = new OscillatorRig(this.materials, anisotropy);
    this.pendulum = new PendulumRig(this.materials, anisotropy);
    this.scene.add(this.oscillator.group, this.pendulum.group);

    // Coordinate triad (x, y, z) at the physical origin of the active experiment.
    const axisSpec: Array<[string, string, THREE.Vector3]> = [
      [OKABE_ITO.vermillion, "<i>x</i>", new THREE.Vector3(1, 0, 0)],
      [OKABE_ITO.green, "<i>y</i>", new THREE.Vector3(0, 1, 0)],
      [OKABE_ITO.sky, "<i>z</i>", new THREE.Vector3(0, 0, 1)],
    ];
    const zero = new THREE.Vector3();
    for (const [color, symbol, direction] of axisSpec) {
      const arrow = new VectorArrow(color, symbol);
      arrow.set(zero, direction.x, direction.y, direction.z, 1, null);
      this.axisArrows.push(arrow);
      this.axes.add(arrow.group);
    }
    this.scene.add(this.axes);

    /* ---- camera ---- */
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 400);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.09;
    this.controls.rotateSpeed = 0.7;
    this.controls.zoomSpeed = 0.9;
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 90;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.015;
    this.controls.addEventListener("change", this.markDirty);
    this.controls.addEventListener("start", this.cancelAnimation);

    this.resize();
    this.applyModule();
    this.frameView("iso", false);

    /* ---- events ---- */
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
    canvas.addEventListener("pointerleave", this.onPointerLeave);
    canvas.addEventListener("webglcontextlost", this.onContextLost);
    canvas.addEventListener("webglcontextrestored", this.markDirty);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.unsubscribeFrame = sim.onFrame(this.onFrame);
  }

  /* ================================================================ */
  /* Public API                                                        */
  /* ================================================================ */

  setOverlays(overlays: Overlays): void {
    this.overlays = overlays;
    this.dirty = true;
  }

  setStrobeInterval(seconds: number): void {
    this.strobeInterval = seconds;
  }

  /** Moves the camera to a named view of the active apparatus. */
  setView(view: ViewPreset): void {
    this.frameView(view, true);
  }

  zoom(factor: number): void {
    // While a view change is still gliding, zoom relative to its destination rather than freezing it half-way.
    if (!this.animating) {
      this.goalPosition.copy(this.camera.position);
      this.goalTarget.copy(this.controls.target);
    }
    const offset = this.corner.copy(this.goalPosition).sub(this.goalTarget);
    const distance = Math.min(this.controls.maxDistance, Math.max(this.controls.minDistance, offset.length() * factor));
    offset.setLength(distance);
    this.goalPosition.copy(this.goalTarget).add(offset);
    this.userCamera = true;
    this.animating = true;
    this.dirty = true;
  }

  readout(): SceneReadout {
    const rig = this.module === "oscillator" ? this.oscillator : this.pendulum;
    return {
      forcePerMetre: rig.forceScale.unitsPerMetre,
      velocityPerMetre: rig.velocityScale.unitsPerMetre,
      activeLink: this.pendulum.activeLink(this.sim.model.n),
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribeFrame();
    this.resizeObserver.disconnect();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("pointerdown", this.onPointerDown);
    canvas.removeEventListener("pointermove", this.onPointerMove);
    canvas.removeEventListener("pointerup", this.onPointerUp);
    canvas.removeEventListener("pointercancel", this.onPointerUp);
    canvas.removeEventListener("pointerleave", this.onPointerLeave);
    canvas.removeEventListener("webglcontextlost", this.onContextLost);
    canvas.removeEventListener("webglcontextrestored", this.markDirty);
    this.controls.removeEventListener("change", this.markDirty);
    this.controls.removeEventListener("start", this.cancelAnimation);
    this.controls.dispose();
    if (this.drag?.active) this.sim.endDrag(0, this.drag.link);
    else if (this.drag) this.sim.release();
    this.oscillator.dispose();
    this.pendulum.dispose();
    for (const arrow of this.axisArrows) arrow.dispose();
    disposeTree(this.scene);
    disposeMaterials(this.materials);
    this.environment.dispose();
    this.renderer.dispose();
    canvas.remove();
    this.labelRenderer.domElement.remove();
  }

  /* ================================================================ */
  /* Frame                                                             */
  /* ================================================================ */

  private readonly markDirty = (): void => {
    this.dirty = true;
  };

  private readonly cancelAnimation = (): void => {
    this.animating = false;
    this.userCamera = true;
  };

  private readonly onContextLost = (event: Event): void => {
    event.preventDefault();
  };

  private readonly onFrame = (sim: Simulation, dt: number): void => {
    if (this.disposed) return;
    const state = sim.getState();
    if (state.module !== this.module) {
      this.module = state.module;
      this.applyModule();
      this.frameView("iso", true);
    }
    if (this.module === "pendulum") {
      // Re-frame when the chain length changes (the stand grows with it).
      const length = sim.model.totalLength;
      if (length !== this.lastLength) {
        if (!Number.isNaN(this.lastLength)) this.frameView(null, true);
        this.lastLength = length;
      }
    }

    if (this.animating) {
      const blend = 1 - Math.exp(-Math.min(dt, 0.1) * 7);
      this.camera.position.lerp(this.goalPosition, blend);
      this.controls.target.lerp(this.goalTarget, blend);
      if (
        this.camera.position.distanceToSquared(this.goalPosition) < 1e-5 &&
        this.controls.target.distanceToSquared(this.goalTarget) < 1e-5
      ) {
        this.animating = false;
      }
      this.dirty = true;
    }
    this.controls.update();

    if (sim.frame !== this.lastFrame) {
      this.lastFrame = sim.frame;
      this.dirty = true;
    }
    if (!this.dirty) return;
    this.dirty = false;

    if (this.module === "oscillator") this.oscillator.update(sim, this.overlays, this.strobeInterval, dt);
    else this.pendulum.update(sim, this.overlays, this.strobeInterval, dt);

    this.grid.visible = this.overlays.grid;
    this.axes.visible = this.overlays.axes;
    if (this.module === "oscillator") this.axes.position.set(0, RAIL_Y, 0);
    else this.axes.position.set(0, this.pendulum.pivotHeight, 0);
    for (const arrow of this.axisArrows) arrow.labelVisible = this.overlays.axes;

    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  };

  private applyModule(): void {
    const oscillator = this.module === "oscillator";
    this.oscillator.group.visible = oscillator;
    this.pendulum.group.visible = !oscillator;
    this.lastLength = Number.NaN;
    this.keyLight.target.position.set(0, oscillator ? 1 : 2.5, 0);
    this.dirty = true;
  }

  private resize(): void {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(width, height, false);
    this.labelRenderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    // Keep the apparatus framed when the viewport changes shape, unless the user chose a view by hand.
    if (this.framed && !this.userCamera && !this.drag) this.frameView(null, false);
    this.dirty = true;
  }

  /**
   * Frames the active apparatus. With `view` null the current viewing
   * direction is kept and only centre and distance are refreshed.
   */
  private frameView(view: ViewPreset | null, animate: boolean): void {
    if (this.module === "oscillator") {
      this.oscillator.bounds(this.box);
    } else {
      // The rig computes its pivot height during update; make sure it is current.
      this.pendulum.update(this.sim, this.overlays, this.strobeInterval, 0);
      this.pendulum.bounds(this.box, this.sim.model.totalLength);
    }
    this.box.getBoundingSphere(this.sphere);
    const centre = this.sphere.center;
    const direction = view
      ? VIEW_DIRECTIONS[view].clone()
      : this.camera.position.clone().sub(this.controls.target).normalize();
    if (view) this.userCamera = false;
    this.framed = true;
    // Smallest distance at which all eight corners of the bounding box lie inside the view frustum.
    this.right.crossVectors(Math.abs(direction.y) > 0.98 ? Z_AXIS : Y_AXIS, direction).normalize();
    this.up.crossVectors(direction, this.right).normalize();
    const tanV = Math.tan(THREE.MathUtils.degToRad(FOV) / 2);
    const tanH = tanV * this.camera.aspect;
    let distance = 0;
    for (let i = 0; i < 8; i++) {
      this.corner
        .set(i & 1 ? this.box.max.x : this.box.min.x, i & 2 ? this.box.max.y : this.box.min.y, i & 4 ? this.box.max.z : this.box.min.z)
        .sub(centre);
      const depth = this.corner.dot(direction);
      distance = Math.max(
        distance,
        Math.abs(this.corner.dot(this.right)) / tanH + depth,
        Math.abs(this.corner.dot(this.up)) / tanV + depth,
      );
    }
    // Margin for the heads-up elements that overlay the edges of the viewport.
    distance *= 1.14;
    this.goalTarget.copy(centre);
    this.goalPosition.copy(centre).addScaledVector(direction, distance);
    if (animate) {
      this.animating = true;
    } else {
      this.camera.position.copy(this.goalPosition);
      this.controls.target.copy(this.goalTarget);
      this.controls.update();
    }
    this.dirty = true;
  }

  /* ================================================================ */
  /* Direct manipulation                                               */
  /* ================================================================ */

  private setPointer(event: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
  }

  /** Returns the pendulum link under the pointer, 0 for the carriage, or -1 for nothing. */
  private pick(event: PointerEvent): number {
    this.setPointer(event);
    if (this.module === "oscillator") {
      return this.raycaster.intersectObjects(this.oscillator.pickables, false).length > 0 ? 0 : -1;
    }
    const n = this.sim.model.n;
    const hits = this.raycaster.intersectObjects(this.pendulum.pickables, false);
    for (const hit of hits) {
      const link = hit.object.userData.link as number;
      if (link < n) return link;
    }
    return -1;
  }

  /**
   * Coordinate along the rail of the point on the rail axis closest to the
   * pointer ray (the carriage has one degree of freedom, so this is the
   * natural 3-D -> 1-D mapping for any camera angle).
   */
  private pointerOnRail(): number | null {
    const { origin, direction } = this.raycaster.ray;
    const oy = origin.y - RAIL_Y;
    const denominator = direction.y * direction.y + direction.z * direction.z;
    if (denominator < 1e-6) return null;
    const s = -(oy * direction.y + origin.z * direction.z) / denominator;
    return origin.x + s * direction.x;
  }

  /** Absolute angle of link `link` that points from its upper joint towards the pointer. */
  private pointerAngle(link: number): number | null {
    // Plane z = planeZ(link) in which this link moves.
    this.plane.set(Z_AXIS, -this.pendulum.planeZ(link));
    if (!this.raycaster.ray.intersectPlane(this.plane, this.hit)) return null;
    this.pendulum.jointPosition(link, this.joint);
    const dx = this.hit.x - this.joint.x;
    const dy = this.hit.y - this.joint.y;
    if (dx * dx + dy * dy < 1e-6) return null;
    return Math.atan2(dx, -dy);
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || this.drag) return;
    const picked = this.pick(event);
    if (picked < 0) return;
    this.controls.enabled = false;
    this.renderer.domElement.setPointerCapture(event.pointerId);
    // The grabbed point of the carriage stays under the pointer: remember where on the rail it was pressed.
    const onRail = this.module === "oscillator" ? this.pointerOnRail() : null;
    this.drag = {
      kind: this.module,
      link: picked,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      offset: onRail === null ? 0 : this.sim.osc.x - onRail,
      samples: [],
    };
    // Pressing on a body holds it at once, so that a fast-moving mass can be caught.
    this.sim.hold();
    this.onCursor("grabbing");
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const drag = this.drag;
    if (!drag) {
      const picked = this.pick(event);
      if (this.module === "oscillator") this.oscillator.setHighlight(picked >= 0);
      else this.pendulum.setHover(picked >= 0 ? picked : null);
      this.onCursor(picked >= 0 ? "grab" : "default");
      this.dirty = true;
      return;
    }
    if (event.pointerId !== drag.pointerId) return;
    this.setPointer(event);

    if (!drag.active) {
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < DRAG_THRESHOLD_PX) return;
      drag.active = true;
      this.sim.beginDrag();
      this.onGrab();
    }

    let value: number | null = null;
    if (drag.kind === "oscillator") {
      const onRail = this.pointerOnRail();
      if (onRail !== null) {
        this.sim.dragOscillatorTo(onRail + drag.offset);
        value = this.sim.osc.x;
      }
    } else {
      const angle = this.pointerAngle(drag.link);
      if (angle !== null) {
        this.sim.dragPendulumTo(drag.link, angle);
        // Read back the unwrapped angle so that the throw velocity is continuous across +-pi.
        value = this.sim.pend.y[drag.link];
      }
    }
    if (value !== null) {
      const now = performance.now();
      drag.samples.push({ time: now, value });
      while (drag.samples.length > 2 && now - drag.samples[0].time > FLING_WINDOW_MS) drag.samples.shift();
    }
    this.dirty = true;
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    this.drag = null;
    this.controls.enabled = true;
    const canvas = this.renderer.domElement;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    this.onCursor("default");

    if (!drag.active) {
      this.sim.release();
      // A click without movement selects the link whose vectors are displayed.
      if (drag.kind === "pendulum") {
        const n = this.sim.model.n;
        this.pendulum.selectedLink = drag.link === n - 1 ? null : drag.link;
      }
      this.dirty = true;
      return;
    }

    // Throw velocity from the pointer motion during the last moments before release. A release counts
    // as a throw only if the pointer was still moving and the motion was sampled well enough to be
    // meaningful; a body that was moved and then held still is released from rest.
    let velocity = 0;
    const samples = drag.samples;
    if (samples.length >= MIN_FLING_SAMPLES) {
      const first = samples[0];
      const last = samples[samples.length - 1];
      const span = last.time - first.time;
      if (span >= MIN_FLING_SPAN_MS && performance.now() - last.time < 80) {
        velocity = ((last.value - first.value) / span) * 1000;
      }
    }
    this.sim.endDrag(velocity, drag.link);
    this.dirty = true;
  };

  private readonly onPointerLeave = (): void => {
    if (this.drag) return;
    this.oscillator.setHighlight(false);
    this.pendulum.setHover(null);
    this.onCursor("default");
    this.dirty = true;
  };
}

/** Metre grid on the bench, centred on the origin. */
function createGrid(halfX: number, halfZ: number): THREE.LineSegments {
  const positions: number[] = [];
  const colors: number[] = [];
  const minor = new THREE.Color(0x191e24);
  const major = new THREE.Color(0x262d36);
  const push = (x0: number, z0: number, x1: number, z1: number, color: THREE.Color) => {
    positions.push(x0, 0, z0, x1, 0, z1);
    colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
  };
  for (let x = -halfX; x <= halfX; x++) push(x, -halfZ, x, halfZ, x % 5 === 0 ? major : minor);
  for (let z = -halfZ; z <= halfZ; z++) push(-halfX, z, halfX, z, z % 5 === 0 ? major : minor);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const grid = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ vertexColors: true }));
  grid.position.y = 0.004;
  return grid;
}

export { BENCH_TOP };
