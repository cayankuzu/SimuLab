/**
 * Apparatus of experiment 2: a chain of up to six links on a rear-mounted
 * cantilever stand, so that every link can turn through full circles.
 *
 * As in real multi-link pendulums, successive links turn in parallel planes
 * (link i in the plane z = i * PLANE_SPACING) and are joined by axle pins.
 * The bobs are discs thinner than the plane spacing; consequently no rod or
 * bob can ever pass through another one, whatever the configuration. The
 * stand grows with the chain so that the lowest point always clears the bench.
 *
 * World frame: pivot at (0, pivotHeight, 0), x to the right, y up; the
 * physical angle theta_i is measured from the downward vertical towards +x.
 */

import * as THREE from "three";
import { MAX_LINKS, PEND_RANGES } from "@/physics/constants";
import type { Simulation } from "@/sim/Simulation";
import { fixed } from "@/ui/format";
import { LINK_COLORS, QUANTITY } from "@/ui/palette";
import type { Overlays } from "@/ui/prefs";
import { createProtractor, Label, VectorArrow, VectorScale, type Materials } from "./primitives";

const PLANE_SPACING = 0.14;
const BOB_THICKNESS = 0.09;
const ROD_WIDTH = 0.06;
const ROD_THICKNESS = 0.03;
const BASE_HEIGHT = 0.12;
const COLUMN_Z = -1.1;
const CLEARANCE = 0.32;
const TRAIL_POINTS = 260;
const TRAIL_WIDTH = 0.028;
const STROBE_FLASHES = 36;

/** Disc radius for a bob of mass m (constant thickness and density: r proportional to sqrt m). */
export function bobRadius(mass: number): number {
  return 0.15 * Math.sqrt(mass);
}

interface LinkVisual {
  group: THREE.Group;
  rod: THREE.Mesh;
  bob: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
}

interface TwinVisual {
  group: THREE.Group;
  rod: THREE.Mesh;
  bob: THREE.Mesh;
}

/** Fading ribbon lying in a plane z = const (the motion is planar, so a flat strip reads as a line). */
class Trail {
  readonly mesh: THREE.Mesh;
  private readonly points = new Float32Array(TRAIL_POINTS * 2);
  private readonly positions = new Float32Array(TRAIL_POINTS * 2 * 3);
  private readonly geometry = new THREE.BufferGeometry();
  private count = 0;
  private head = 0;

  constructor(color: string, opacity: number) {
    const colors = new Float32Array(TRAIL_POINTS * 2 * 4);
    const c = new THREE.Color(color);
    for (let i = 0; i < TRAIL_POINTS; i++) {
      // Alpha is baked per ribbon position: index 0 is always the oldest retained point.
      const alpha = Math.pow(i / (TRAIL_POINTS - 1), 1.6) * opacity;
      for (let side = 0; side < 2; side++) {
        const k = (i * 2 + side) * 4;
        colors[k] = c.r;
        colors[k + 1] = c.g;
        colors[k + 2] = c.b;
        colors[k + 3] = alpha;
      }
    }
    const indices: number[] = [];
    for (let i = 0; i < TRAIL_POINTS - 1; i++) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 4));
    this.geometry.setIndex(indices);
    this.geometry.setDrawRange(0, 0);
    this.mesh = new THREE.Mesh(
      this.geometry,
      new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
    );
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
  }

  clear(): void {
    this.count = 0;
    this.head = 0;
    this.geometry.setDrawRange(0, 0);
  }

  push(x: number, y: number): void {
    this.points[this.head * 2] = x;
    this.points[this.head * 2 + 1] = y;
    this.head = (this.head + 1) % TRAIL_POINTS;
    if (this.count < TRAIL_POINTS) this.count++;
  }

  /** Rebuilds the strip; the newest point is mapped to the opaque end. */
  rebuild(z: number): void {
    const n = this.count;
    if (n < 2) {
      this.geometry.setDrawRange(0, 0);
      return;
    }
    const first = (this.head - n + TRAIL_POINTS) % TRAIL_POINTS;
    const offset = TRAIL_POINTS - n;
    const at = (i: number) => ((first + i) % TRAIL_POINTS) * 2;
    for (let i = 0; i < n; i++) {
      const p = at(i);
      const a = at(Math.max(0, i - 1));
      const b = at(Math.min(n - 1, i + 1));
      let dx = this.points[b] - this.points[a];
      let dy = this.points[b + 1] - this.points[a + 1];
      const norm = Math.hypot(dx, dy) || 1;
      dx /= norm;
      dy /= norm;
      const nx = (-dy * TRAIL_WIDTH) / 2;
      const ny = (dx * TRAIL_WIDTH) / 2;
      const k = (offset + i) * 6;
      this.positions[k] = this.points[p] + nx;
      this.positions[k + 1] = this.points[p + 1] + ny;
      this.positions[k + 2] = z;
      this.positions[k + 3] = this.points[p] - nx;
      this.positions[k + 4] = this.points[p + 1] - ny;
      this.positions[k + 5] = z;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.setDrawRange(offset * 6, (n - 1) * 6);
  }

  dispose(): void {
    this.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

export class PendulumRig {
  readonly group = new THREE.Group();
  /** Bob meshes; userData.link holds the link index. */
  readonly pickables: THREE.Object3D[] = [];
  readonly forceScale = new VectorScale(0.9, 20, 2.4);
  readonly velocityScale = new VectorScale(0.9, 4, 2.4);
  /** Link whose vectors are shown; null selects the last (free) one. */
  selectedLink: number | null = null;
  pivotHeight = 3;

  private readonly column: THREE.Mesh;
  private readonly head = new THREE.Group();
  private readonly protractor: THREE.Mesh;
  private readonly links: LinkVisual[] = [];
  private readonly twins: TwinVisual[] = [];
  private readonly twinGroup = new THREE.Group();
  private readonly trail = new Trail(QUANTITY.position, 0.9);
  private readonly twinTrail = new Trail(QUANTITY.twin, 0.75);
  private readonly selectionRing: THREE.Mesh;
  private readonly bobLabel: Label;

  private readonly velocityArrow: VectorArrow;
  private readonly netArrow: VectorArrow;
  private readonly weightArrow: VectorArrow;
  private readonly tensionUpArrow: VectorArrow;
  private readonly tensionDownArrow: VectorArrow;
  private readonly arrows: VectorArrow[];

  private readonly strobeBobs: THREE.InstancedMesh;
  private readonly strobeRods: THREE.InstancedMesh;
  private strobeFlashes = 0;
  private strobeNext = 0;
  private epoch = -1;
  private lastTime = Number.NaN;
  private hovered: number | null = null;

  private readonly px = new Float64Array(MAX_LINKS);
  private readonly py = new Float64Array(MAX_LINKS);
  private readonly vx = new Float64Array(MAX_LINKS);
  private readonly vy = new Float64Array(MAX_LINKS);
  private readonly tx = new Float64Array(MAX_LINKS);
  private readonly ty = new Float64Array(MAX_LINKS);
  private readonly tension = new Float64Array(MAX_LINKS);
  private readonly netX = new Float64Array(MAX_LINKS);
  private readonly netY = new Float64Array(MAX_LINKS);
  private readonly origin = new THREE.Vector3();
  private readonly matrix = new THREE.Matrix4();
  private readonly quaternion = new THREE.Quaternion();
  private readonly scale = new THREE.Vector3();
  private readonly zAxis = new THREE.Vector3(0, 0, 1);

  constructor(materials: Materials, anisotropy: number) {
    const { group } = this;

    /* ---- stand ---- */
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, BASE_HEIGHT, 1.9), materials.castIron);
    base.position.set(0, BASE_HEIGHT / 2, COLUMN_Z + 0.55);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const columnGeometry = new THREE.CylinderGeometry(0.085, 0.085, 1, 32);
    columnGeometry.translate(0, 0.5, 0);
    this.column = new THREE.Mesh(columnGeometry, materials.steel);
    this.column.position.set(0, BASE_HEIGHT, COLUMN_Z);
    this.column.castShadow = true;
    group.add(this.column);

    // Everything that moves up and down with the pivot.
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.34, 32), materials.darkSteel);
    collar.position.set(0, 0, COLUMN_Z);
    const boomLength = -0.2 - COLUMN_Z;
    const boom = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, boomLength), materials.darkSteel);
    boom.position.set(0, 0, COLUMN_Z + boomLength / 2);
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.16, 40), materials.anodized);
    housing.rotation.x = Math.PI / 2;
    housing.position.set(0, 0, -0.14);
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 24), materials.brass);
    axle.rotation.x = Math.PI / 2;
    axle.position.set(0, 0, -0.005);
    for (const part of [collar, boom, housing, axle]) {
      part.castShadow = true;
      this.head.add(part);
    }
    this.protractor = createProtractor(1, anisotropy);
    this.protractor.position.z = -0.052;
    this.head.add(this.protractor);
    group.add(this.head);

    /* ---- links ---- */
    const rodGeometry = new THREE.BoxGeometry(ROD_WIDTH, 1, ROD_THICKNESS);
    rodGeometry.translate(0, -0.5, 0);
    const bobGeometry = new THREE.CylinderGeometry(1, 1, 1, 56);
    bobGeometry.rotateX(Math.PI / 2);
    const hubGeometry = new THREE.CylinderGeometry(0.045, 0.045, BOB_THICKNESS + 0.012, 24);
    hubGeometry.rotateX(Math.PI / 2);
    const pinGeometry = new THREE.CylinderGeometry(0.028, 0.028, PLANE_SPACING, 16);
    pinGeometry.rotateX(Math.PI / 2);
    pinGeometry.translate(0, 0, -PLANE_SPACING / 2);

    for (let i = 0; i < MAX_LINKS; i++) {
      const linkGroup = new THREE.Group();
      linkGroup.position.z = i * PLANE_SPACING;
      const rod = new THREE.Mesh(rodGeometry, materials.steel);
      rod.castShadow = true;
      const material = new THREE.MeshStandardMaterial({
        color: LINK_COLORS[i],
        metalness: 0.55,
        roughness: 0.42,
      });
      const bob = new THREE.Mesh(bobGeometry, material);
      bob.castShadow = true;
      bob.userData.link = i;
      const hub = new THREE.Mesh(hubGeometry, materials.brass);
      bob.add(hub);
      // The hub must not inherit the bob's non-uniform scale visually: it is re-scaled in update().
      hub.name = "hub";
      linkGroup.add(rod, bob);
      if (i > 0) {
        const pin = new THREE.Mesh(pinGeometry, materials.brass);
        linkGroup.add(pin);
      }
      group.add(linkGroup);
      this.links.push({ group: linkGroup, rod, bob, material });
      this.pickables.push(bob);
    }

    /* ---- twin (drawn as a translucent phantom) ---- */
    const twinMaterial = new THREE.MeshBasicMaterial({
      color: QUANTITY.twin,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const twinRodGeometry = new THREE.BoxGeometry(ROD_WIDTH * 0.55, 1, ROD_THICKNESS);
    twinRodGeometry.translate(0, -0.5, 0);
    for (let i = 0; i < MAX_LINKS; i++) {
      const twinGroup = new THREE.Group();
      twinGroup.position.z = i * PLANE_SPACING;
      const rod = new THREE.Mesh(twinRodGeometry, twinMaterial);
      const bob = new THREE.Mesh(bobGeometry, twinMaterial);
      rod.renderOrder = 4;
      bob.renderOrder = 4;
      twinGroup.add(rod, bob);
      this.twinGroup.add(twinGroup);
      this.twins.push({ group: twinGroup, rod, bob });
    }
    group.add(this.twinGroup);
    group.add(this.trail.mesh, this.twinTrail.mesh);

    /* ---- selection, labels, vectors ---- */
    this.selectionRing = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.012, 8, 64),
      new THREE.MeshBasicMaterial({ color: 0xeef1f5, transparent: true, opacity: 0.85, depthTest: false }),
    );
    this.selectionRing.renderOrder = 19;
    group.add(this.selectionRing);
    this.bobLabel = new Label("chip");
    group.add(this.bobLabel.object);

    this.velocityArrow = new VectorArrow(QUANTITY.velocity, "<i>v</i>");
    this.netArrow = new VectorArrow(QUANTITY.netForce, "<i>F</i><sub>net</sub>");
    this.weightArrow = new VectorArrow(QUANTITY.gravity, "<i>m</i><i>g</i>");
    this.tensionUpArrow = new VectorArrow(QUANTITY.tension, "<i>T</i>");
    this.tensionDownArrow = new VectorArrow(QUANTITY.tension, "<i>T</i>′");
    this.arrows = [this.velocityArrow, this.netArrow, this.weightArrow, this.tensionUpArrow, this.tensionDownArrow];
    for (const arrow of this.arrows) group.add(arrow.group);

    /* ---- stroboscope ---- */
    const strobeCapacity = STROBE_FLASHES * MAX_LINKS;
    const strobeMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.16, depthWrite: false });
    this.strobeBobs = new THREE.InstancedMesh(bobGeometry, strobeMaterial, strobeCapacity);
    this.strobeRods = new THREE.InstancedMesh(rodGeometry, strobeMaterial, strobeCapacity);
    const tint = new THREE.Color();
    for (let k = 0; k < strobeCapacity; k++) {
      tint.set(LINK_COLORS[k % MAX_LINKS]);
      this.strobeBobs.setColorAt(k, tint);
      this.strobeRods.setColorAt(k, tint);
    }
    for (const mesh of [this.strobeBobs, this.strobeRods]) {
      mesh.count = 0;
      mesh.frustumCulled = false;
      mesh.renderOrder = 3;
      group.add(mesh);
    }
  }

  setHover(link: number | null): void {
    if (link === this.hovered) return;
    if (this.hovered !== null) this.links[this.hovered].material.emissive.set(0x000000);
    this.hovered = link;
    if (link !== null) this.links[link].material.emissive.set(0x2a2a2a);
  }

  /** Index of the link whose vectors are currently displayed. */
  activeLink(n: number): number {
    return this.selectedLink !== null && this.selectedLink < n ? this.selectedLink : n - 1;
  }

  /** World-space z of the plane in which link i moves. */
  planeZ(link: number): number {
    return link * PLANE_SPACING;
  }

  /** World position of the upper joint of link i (the pivot for i = 0). */
  jointPosition(link: number, target: THREE.Vector3): THREE.Vector3 {
    return target.set(
      link > 0 ? this.px[link - 1] : 0,
      this.pivotHeight + (link > 0 ? this.py[link - 1] : 0),
      link * PLANE_SPACING,
    );
  }

  update(sim: Simulation, overlays: Overlays, strobeInterval: number, dt: number): void {
    const state = sim.getState();
    const params = state.pendulum;
    const model = sim.model;
    const n = model.n;
    const y = sim.pend.y;

    /* ---- stand height: the lowest reachable point must clear the bench ---- */
    let largestBob = 0;
    for (let i = 0; i < n; i++) largestBob = Math.max(largestBob, bobRadius(params.masses[i]));
    const H = Math.max(2, model.totalLength + largestBob + CLEARANCE + BASE_HEIGHT);
    this.pivotHeight = H;
    this.head.position.y = H;
    this.column.scale.y = H - BASE_HEIGHT + 0.3;
    const dial = Math.min(0.95, Math.max(0.3, 0.62 * params.lengths[0]));
    this.protractor.scale.set(dial, dial, 1);

    /* ---- chain ---- */
    model.kinematics(y, this.px, this.py, this.vx, this.vy);
    for (let i = 0; i < MAX_LINKS; i++) {
      const link = this.links[i];
      link.group.visible = i < n;
      if (i >= n) continue;
      link.group.position.x = i > 0 ? this.px[i - 1] : 0;
      link.group.position.y = H + (i > 0 ? this.py[i - 1] : 0);
      link.group.rotation.z = y[i];
      const length = params.lengths[i];
      const radius = bobRadius(params.masses[i]);
      link.rod.scale.y = length;
      link.bob.position.y = -length;
      link.bob.scale.set(radius, radius, BOB_THICKNESS);
      const hub = link.bob.children[0];
      hub.scale.set(1 / radius, 1 / radius, 1 / BOB_THICKNESS);
    }

    /* ---- twin ---- */
    const twinVisible = state.twin.enabled;
    this.twinGroup.visible = twinVisible;
    if (twinVisible) {
      const ty = sim.twin.y;
      model.kinematics(ty, this.tx, this.ty);
      for (let i = 0; i < MAX_LINKS; i++) {
        const twin = this.twins[i];
        twin.group.visible = i < n;
        if (i >= n) continue;
        twin.group.position.x = i > 0 ? this.tx[i - 1] : 0;
        twin.group.position.y = H + (i > 0 ? this.ty[i - 1] : 0);
        twin.group.rotation.z = ty[i];
        const radius = bobRadius(params.masses[i]) * 0.94;
        twin.rod.scale.y = params.lengths[i];
        twin.bob.position.y = -params.lengths[i];
        twin.bob.scale.set(radius, radius, BOB_THICKNESS * 0.5);
      }
    }

    /* ---- trails and stroboscope (reset whenever the trajectory restarts) ---- */
    const tip = n - 1;
    const restarted = state.epoch !== this.epoch;
    if (restarted) {
      this.epoch = state.epoch;
      this.trail.clear();
      this.twinTrail.clear();
      this.strobeFlashes = 0;
      this.strobeNext = sim.pend.t;
      this.strobeBobs.count = 0;
      this.strobeRods.count = 0;
      this.lastTime = Number.NaN;
    }
    const advanced = sim.pend.t !== this.lastTime;
    this.lastTime = sim.pend.t;
    const tipZ = tip * PLANE_SPACING + BOB_THICKNESS / 2 + 0.004;
    if (overlays.trail) {
      if (advanced) {
        this.trail.push(this.px[tip], H + this.py[tip]);
        if (twinVisible) this.twinTrail.push(this.tx[tip], H + this.ty[tip]);
      }
      this.trail.rebuild(tipZ);
      this.twinTrail.rebuild(tipZ + 0.002);
    } else if (!restarted) {
      this.trail.clear();
      this.twinTrail.clear();
    }
    this.trail.mesh.visible = overlays.trail;
    this.twinTrail.mesh.visible = overlays.trail && twinVisible;

    if (!overlays.strobe && this.strobeFlashes > 0) {
      this.strobeFlashes = 0;
      this.strobeBobs.count = 0;
      this.strobeRods.count = 0;
      this.strobeNext = sim.pend.t;
    }
    if (overlays.strobe && sim.pend.t >= this.strobeNext) {
      this.strobeNext = sim.pend.t + strobeInterval;
      const slot = this.strobeFlashes % STROBE_FLASHES;
      for (let i = 0; i < MAX_LINKS; i++) {
        const k = slot * MAX_LINKS + i;
        if (i < n) {
          const z = i * PLANE_SPACING;
          const radius = bobRadius(params.masses[i]);
          this.origin.set(this.px[i], H + this.py[i], z);
          this.scale.set(radius, radius, BOB_THICKNESS * 0.6);
          this.matrix.compose(this.origin, this.quaternion.identity(), this.scale);
          this.strobeBobs.setMatrixAt(k, this.matrix);
          this.jointPosition(i, this.origin);
          this.quaternion.setFromAxisAngle(this.zAxis, y[i]);
          this.scale.set(0.5, params.lengths[i], 0.6);
          this.matrix.compose(this.origin, this.quaternion, this.scale);
          this.strobeRods.setMatrixAt(k, this.matrix);
        } else {
          this.matrix.makeScale(0, 0, 0);
          this.strobeBobs.setMatrixAt(k, this.matrix);
          this.strobeRods.setMatrixAt(k, this.matrix);
        }
      }
      this.strobeFlashes++;
      const shown = Math.min(this.strobeFlashes, STROBE_FLASHES) * MAX_LINKS;
      this.strobeBobs.count = shown;
      this.strobeRods.count = shown;
      this.strobeBobs.instanceMatrix.needsUpdate = true;
      this.strobeRods.instanceMatrix.needsUpdate = true;
    }
    this.strobeBobs.visible = overlays.strobe;
    this.strobeRods.visible = overlays.strobe;

    /* ---- vectors on the selected bob ---- */
    const s = this.activeLink(n);
    const mass = params.masses[s];
    const z = s * PLANE_SPACING + BOB_THICKNESS / 2 + 0.03;
    const bx = this.px[s];
    const by = H + this.py[s];
    const labels = overlays.labels;
    const anyVector = overlays.velocity || overlays.netForce || overlays.freeBody;

    this.selectionRing.visible = n > 1 && anyVector;
    const ring = bobRadius(mass) + 0.035;
    this.selectionRing.position.set(bx, by, z - 0.02);
    this.selectionRing.scale.set(ring, ring, 1);
    this.bobLabel.visible = labels && anyVector;
    this.bobLabel.object.position.set(bx, by - bobRadius(mass) - 0.2, z);
    this.bobLabel.set(`<i>m</i><sub>${s + 1}</sub> = ${fixed(mass, 1)} kg`);

    const needForces = overlays.netForce || overlays.freeBody;
    if (needForces) model.rodForces(y, this.tension, undefined, this.netX, this.netY);
    const speed = Math.hypot(this.vx[s], this.vy[s]);
    const net = needForces ? Math.hypot(this.netX[s], this.netY[s]) : 0;
    const weight = mass * params.gravity;
    const tUp = needForces ? this.tension[s] : 0;
    const tDown = needForces && s < n - 1 ? this.tension[s + 1] : 0;
    this.velocityScale.observe(speed, dt);
    this.forceScale.observe(Math.max(net, weight, Math.abs(tUp), Math.abs(tDown)), dt);
    for (const arrow of this.arrows) arrow.labelVisible = labels;
    this.origin.set(bx, by, z);

    if (overlays.velocity && speed > 1e-6) {
      this.velocityArrow.set(
        this.origin,
        this.vx[s],
        this.vy[s],
        0,
        this.velocityScale.length(speed),
        `${fixed(speed, 2)} m/s`,
        this.velocityScale.clipped(speed),
      );
    } else this.velocityArrow.hide();

    if (overlays.netForce && !overlays.freeBody && net > 1e-6) {
      this.netArrow.set(
        this.origin,
        this.netX[s],
        this.netY[s],
        0,
        this.forceScale.length(net),
        `${fixed(net, 1)} N`,
        this.forceScale.clipped(net),
      );
    } else this.netArrow.hide();

    if (overlays.freeBody) {
      if (weight > 1e-9) {
        this.weightArrow.set(this.origin, 0, -1, 0, this.forceScale.length(weight), `${fixed(weight, 1)} N`);
      } else this.weightArrow.hide();
      // Rod s pulls the bob towards its upper joint when in tension (T > 0) and pushes when compressed.
      const sin = Math.sin(y[s]);
      const cos = Math.cos(y[s]);
      const sign = Math.sign(tUp);
      this.tensionUpArrow.set(
        this.origin,
        -sin * sign,
        cos * sign,
        0,
        this.forceScale.length(tUp),
        `${fixed(tUp, 1)} N`,
        this.forceScale.clipped(tUp),
      );
      if (s < n - 1) {
        const sinNext = Math.sin(y[s + 1]);
        const cosNext = Math.cos(y[s + 1]);
        const signNext = Math.sign(tDown);
        this.tensionDownArrow.set(
          this.origin,
          sinNext * signNext,
          -cosNext * signNext,
          0,
          this.forceScale.length(tDown),
          `${fixed(tDown, 1)} N`,
          this.forceScale.clipped(tDown),
        );
      } else this.tensionDownArrow.hide();
    } else {
      this.weightArrow.hide();
      this.tensionUpArrow.hide();
      this.tensionDownArrow.hide();
    }

    // Arrows are drawn to scale, so some are very short; their labels would pile up on the bob.
    // Park those labels in a column beside it instead.
    if (labels) {
      this.group.updateMatrixWorld(true);
      let slot = 0;
      for (const arrow of this.arrows) {
        const length = arrow.drawnLength;
        if (length > 0 && length < 0.55) {
          arrow.parkLabel(bx + ring + 0.14, by + 0.16 - slot * 0.24, z);
          slot++;
        }
      }
    }
  }

  /** Extent of everything the chain can reach, used to frame the camera. */
  bounds(target: THREE.Box3, totalLength: number): THREE.Box3 {
    const reach = totalLength + 0.45;
    return target.set(
      new THREE.Vector3(-reach, Math.max(0, this.pivotHeight - reach), -0.4),
      new THREE.Vector3(reach, this.pivotHeight + reach, 0.9),
    );
  }

  dispose(): void {
    for (const arrow of this.arrows) arrow.dispose();
    for (const link of this.links) link.material.dispose();
    this.trail.dispose();
    this.twinTrail.dispose();
    this.bobLabel.object.element.remove();
  }
}

/** Largest pivot height the stand can take (for camera limits). */
export const MAX_PIVOT_HEIGHT =
  MAX_LINKS * PEND_RANGES.length.max + bobRadius(PEND_RANGES.mass.max) + CLEARANCE + BASE_HEIGHT;
