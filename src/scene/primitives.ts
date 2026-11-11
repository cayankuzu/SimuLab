/**
 * Reusable scene primitives: physically based materials, vector arrows with
 * HTML labels, and measuring scales drawn onto canvas textures.
 */

import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { SURFACE } from "@/ui/palette";

/* ------------------------------------------------------------------ */
/* Materials                                                            */
/* ------------------------------------------------------------------ */

export interface Materials {
  steel: THREE.MeshStandardMaterial;
  polished: THREE.MeshStandardMaterial;
  darkSteel: THREE.MeshStandardMaterial;
  anodized: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  copper: THREE.MeshStandardMaterial;
  rubber: THREE.MeshStandardMaterial;
  castIron: THREE.MeshStandardMaterial;
}

export function createMaterials(): Materials {
  return {
    steel: new THREE.MeshStandardMaterial({ color: 0xa9b0b9, metalness: 1, roughness: 0.42 }),
    polished: new THREE.MeshStandardMaterial({ color: 0xd9dee4, metalness: 1, roughness: 0.16 }),
    darkSteel: new THREE.MeshStandardMaterial({ color: 0x3d444d, metalness: 0.9, roughness: 0.5 }),
    anodized: new THREE.MeshStandardMaterial({ color: 0x1b1f25, metalness: 0.75, roughness: 0.48 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb38b3d, metalness: 1, roughness: 0.3 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xb46a3c, metalness: 1, roughness: 0.38 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x0b0c0e, metalness: 0, roughness: 0.96 }),
    castIron: new THREE.MeshStandardMaterial({ color: 0x23272d, metalness: 0.55, roughness: 0.72 }),
  };
}

export function disposeMaterials(materials: Materials): void {
  for (const material of Object.values(materials) as THREE.Material[]) material.dispose();
}

/** Recursively disposes geometries, materials and textures of a sub-tree. */
export function disposeTree(root: THREE.Object3D): void {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    const list = Array.isArray(material) ? material : material ? [material] : [];
    for (const item of list) {
      const map = (item as THREE.MeshStandardMaterial).map;
      if (map) map.dispose();
      item.dispose();
    }
    if (object instanceof CSS2DObject) object.element.remove();
  });
}

/* ------------------------------------------------------------------ */
/* HTML labels                                                          */
/* ------------------------------------------------------------------ */

export class Label {
  readonly object: CSS2DObject;
  private text = "";

  constructor(tone: "chip" | "plain" = "chip", color?: string) {
    const element = document.createElement("div");
    element.className = "scene-label";
    if (tone === "plain") element.dataset.tone = "plain";
    if (color) element.style.color = color;
    this.object = new CSS2DObject(element);
    this.object.center.set(0.5, 0.5);
  }

  /** Updates the markup only when it actually changed (DOM writes are the expensive part). */
  set(html: string): void {
    if (html === this.text) return;
    this.text = html;
    this.object.element.innerHTML = html;
  }

  set visible(value: boolean) {
    this.object.visible = value;
  }
}

/* ------------------------------------------------------------------ */
/* Vector arrow                                                         */
/* ------------------------------------------------------------------ */

const UP = new THREE.Vector3(0, 1, 0);
const SHAFT_RADIUS = 0.032;
const HEAD_RADIUS = 0.095;
const HEAD_LENGTH = 0.26;

/**
 * Arrow drawn with real geometry (constant world-space thickness) in a flat,
 * unlit colour so that it reads as a diagram element rather than as a body.
 * Rendered on top of the apparatus.
 */
export class VectorArrow {
  readonly group = new THREE.Group();
  readonly label: Label;
  private readonly shaft: THREE.Mesh;
  private readonly head: THREE.Mesh;
  /** Second head shown behind the tip when the arrow is drawn shorter than its true scale length. */
  private readonly clipMark: THREE.Mesh;
  private readonly material: THREE.MeshBasicMaterial;
  private readonly direction = new THREE.Vector3();
  private readonly parked = new THREE.Vector3();

  constructor(
    color: string,
    private readonly symbolHtml: string,
  ) {
    this.material = new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false, transparent: true });
    this.shaft = new THREE.Mesh(new THREE.CylinderGeometry(SHAFT_RADIUS, SHAFT_RADIUS, 1, 12, 1, false), this.material);
    this.head = new THREE.Mesh(new THREE.ConeGeometry(HEAD_RADIUS, HEAD_LENGTH, 16), this.material);
    this.clipMark = new THREE.Mesh(this.head.geometry, this.material);
    this.clipMark.visible = false;
    this.shaft.renderOrder = 20;
    this.head.renderOrder = 20;
    this.clipMark.renderOrder = 20;
    this.group.add(this.shaft, this.head, this.clipMark);
    this.label = new Label("chip", color);
    this.group.add(this.label.object);
    this.group.visible = false;
  }

  /**
   * @param origin tail position (world units of the parent group)
   * @param dx,dy,dz direction (need not be normalised)
   * @param length drawn length [m]
   * @param valueText formatted magnitude shown next to the symbol, or null for no number
   * @param clipped true if `length` is shorter than the true scale length (drawn with a double head)
   */
  set(
    origin: THREE.Vector3,
    dx: number,
    dy: number,
    dz: number,
    length: number,
    valueText: string | null,
    clipped = false,
  ): void {
    const norm = Math.hypot(dx, dy, dz);
    if (!(norm > 0) || !(length > 1e-3)) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;
    this.direction.set(dx / norm, dy / norm, dz / norm);
    this.group.position.copy(origin);
    this.group.quaternion.setFromUnitVectors(UP, this.direction);
    const head = Math.min(HEAD_LENGTH, 0.6 * length);
    const shaftLength = Math.max(1e-4, length - head);
    this.shaft.scale.set(1, shaftLength, 1);
    this.shaft.position.set(0, shaftLength / 2, 0);
    this.head.scale.set(head / HEAD_LENGTH, head / HEAD_LENGTH, head / HEAD_LENGTH);
    this.head.position.set(0, shaftLength + head / 2, 0);
    this.clipMark.visible = clipped;
    if (clipped) {
      this.clipMark.scale.copy(this.head.scale);
      this.clipMark.position.set(0, shaftLength - head * 0.35, 0);
    }
    // Anchor the label on the far side of the tip so that it never covers the arrow.
    // CSS2DObject.center: (0, 0) puts the top-left corner of the element on the point, (1, 1) its bottom-right.
    const ux = this.direction.x;
    const uy = this.direction.y;
    this.label.object.center.set(ux > 0.35 ? 0 : ux < -0.35 ? 1 : 0.5, uy > 0.35 ? 1 : uy < -0.35 ? 0 : 0.5);
    this.label.object.position.set(0, length + 0.07, 0);
    this.label.set(valueText === null ? this.symbolHtml : `${this.symbolHtml}&thinsp;=&thinsp;${valueText}`);
  }

  /** Drawn length of the arrow in metres (0 while hidden). */
  get drawnLength(): number {
    return this.group.visible ? this.shaft.scale.y + this.head.scale.y * HEAD_LENGTH : 0;
  }

  /**
   * Parks the label at a point given in the coordinates of the arrow's parent
   * (used when several arrows are too short for their labels to stay apart).
   */
  parkLabel(x: number, y: number, z: number): void {
    this.parked.set(x, y, z);
    this.group.worldToLocal(this.parked);
    this.label.object.position.copy(this.parked);
    this.label.object.center.set(0, 0.5);
  }

  hide(): void {
    this.group.visible = false;
  }

  set labelVisible(value: boolean) {
    this.label.object.visible = value;
  }

  dispose(): void {
    this.shaft.geometry.dispose();
    this.head.geometry.dispose();
    this.material.dispose();
    this.label.object.element.remove();
  }
}

/* ------------------------------------------------------------------ */
/* Auto-ranging vector scale                                            */
/* ------------------------------------------------------------------ */

/**
 * Chooses how many physical units one metre of arrow represents, from the
 * 1-2-5 series, so that the *typical* (root-mean-square) magnitude of the
 * last few seconds is drawn about `typicalLength` metres long. Scaling to
 * the typical value rather than to the peak keeps ordinary vectors legible
 * when a quantity spikes briefly (the rod tension of a whipping chain does);
 * a spike longer than `maxLength` is drawn clipped and marked as such, while
 * its label always shows the true value.
 */
export class VectorScale {
  /** Units per metre of drawn arrow. */
  unitsPerMetre: number;
  private meanSquare = 0;

  constructor(
    private readonly typicalLength: number,
    initial: number,
    readonly maxLength = 3,
  ) {
    this.unitsPerMetre = initial;
  }

  observe(magnitude: number, dt: number): void {
    if (!Number.isFinite(magnitude) || !(dt > 0)) return;
    const square = magnitude * magnitude;
    this.meanSquare += (square - this.meanSquare) * (this.meanSquare === 0 ? 1 : 1 - Math.exp(-dt / 4));
    const rms = Math.sqrt(this.meanSquare);
    if (!(rms > 0)) return;
    const ideal = rms / this.typicalLength;
    // Hysteresis: re-range only when the current scale is clearly unsuitable.
    if (ideal > this.unitsPerMetre * 1.6 || ideal < this.unitsPerMetre * 0.4) {
      this.unitsPerMetre = roundUp125(ideal);
    }
  }

  length(magnitude: number): number {
    return Math.min(this.maxLength, Math.abs(magnitude) / this.unitsPerMetre);
  }

  /** True if the arrow for this magnitude has to be shortened to maxLength. */
  clipped(magnitude: number): boolean {
    return Math.abs(magnitude) / this.unitsPerMetre > this.maxLength;
  }
}

function roundUp125(value: number): number {
  const power = Math.pow(10, Math.floor(Math.log10(value)));
  const fraction = value / power;
  return (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * power;
}

/* ------------------------------------------------------------------ */
/* Measuring scales                                                     */
/* ------------------------------------------------------------------ */

function scaleTexture(canvas: HTMLCanvasElement, anisotropy: number): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

/**
 * Linear ruler lying on the bench: one tick every 0.1 m, longer every 0.5 m,
 * numbered every metre. Returns a mesh whose local x axis is the measured axis.
 */
export function createRuler(xMin: number, xMax: number, width: number, anisotropy: number): THREE.Mesh {
  const pixelsPerMetre = 180;
  const length = xMax - xMin;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(length * pixelsPerMetre);
  canvas.height = Math.round(width * pixelsPerMetre);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#14171b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = SURFACE.ink2;
    ctx.font = `500 ${Math.round(0.34 * canvas.height)}px ui-monospace, Consolas, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    const decimetres = Math.round(length * 10);
    for (let i = 0; i <= decimetres; i++) {
      const x = xMin + i / 10;
      const px = (i / 10) * pixelsPerMetre;
      const whole = Math.abs(x - Math.round(x)) < 1e-6;
      const half = Math.abs(x * 2 - Math.round(x * 2)) < 1e-6;
      const tick = whole ? 0.42 : half ? 0.3 : 0.18;
      ctx.globalAlpha = whole ? 1 : half ? 0.75 : 0.45;
      ctx.fillRect(Math.round(px) - (whole ? 1.5 : 1), 0, whole ? 3 : 2, tick * canvas.height);
      if (whole) {
        ctx.globalAlpha = 1;
        const value = Math.round(x);
        ctx.fillText(value === 0 ? "0" : value > 0 ? String(value) : `−${-value}`, px, canvas.height * 0.97);
      }
    }
  }
  const material = new THREE.MeshStandardMaterial({
    map: scaleTexture(canvas, anisotropy),
    metalness: 0.2,
    roughness: 0.7,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(length, width), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.x = (xMin + xMax) / 2;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Protractor disc: ticks every 5 degrees, longer every 10, numbered every 30
 * with the signed angle from the downward vertical (the pendulum's zero).
 */
export function createProtractor(radius: number, anisotropy: number): THREE.Mesh {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const c = size / 2;
    const r = size / 2 - 4;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "rgba(20,23,27,0.94)";
    ctx.beginPath();
    ctx.arc(c, c, r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = SURFACE.ink2;
    ctx.strokeStyle = SURFACE.ink2;
    ctx.font = `500 ${Math.round(size * 0.042)}px ui-monospace, Consolas, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let degree = -175; degree <= 180; degree += 5) {
      // theta measured from the downward vertical, positive towards +x (counter-clockwise seen from the front).
      const angle = (degree * Math.PI) / 180;
      const dx = Math.sin(angle);
      const dy = Math.cos(angle);
      const major = degree % 30 === 0;
      const medium = degree % 10 === 0;
      const inner = r * (major ? 0.86 : medium ? 0.9 : 0.94);
      ctx.globalAlpha = major ? 1 : medium ? 0.7 : 0.4;
      ctx.lineWidth = major ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(c + dx * inner, c + dy * inner);
      ctx.lineTo(c + dx * r * 0.985, c + dy * r * 0.985);
      ctx.stroke();
      if (major) {
        ctx.globalAlpha = 1;
        const text = degree === 0 ? "0" : degree === 180 ? "180" : degree > 0 ? String(degree) : `−${-degree}`;
        ctx.fillText(text, c + dx * r * 0.76, c + dy * r * 0.76);
      }
    }
  }
  const material = new THREE.MeshStandardMaterial({
    map: scaleTexture(canvas, anisotropy),
    transparent: true,
    metalness: 0.1,
    roughness: 0.85,
  });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 96), material);
  mesh.receiveShadow = true;
  return mesh;
}
