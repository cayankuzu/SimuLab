/**
 * Apparatus of experiment 1, drawn to the same dimensions the solver uses
 * (physics/constants.ts): wall, neoprene seat, helical spring on a guide
 * rail, carriage with stackable load plates, rubber end stop, ruler and an
 * eddy-current brake strip representing the linear damper.
 *
 * Nothing interpenetrates: the spring wire diameter is chosen so that the
 * drawn coils touch exactly when the solver reports coil bind (x = xMin), and
 * the end stop sits exactly where the solver reverses the carriage (x = xMax).
 *
 * World frame: x along the rail (identical to the physical coordinate),
 * y up with the bench top at y = BENCH_TOP, z towards the default camera.
 */

import * as THREE from "three";
import { OSC_GEOMETRY, OSC_RANGES } from "@/physics/constants";
import type { OscillatorForces } from "@/physics/oscillator";
import type { Simulation } from "@/sim/Simulation";
import { fixed } from "@/ui/format";
import { QUANTITY } from "@/ui/palette";
import type { Overlays } from "@/ui/prefs";
import { createRuler, Label, VectorArrow, VectorScale, type Materials } from "./primitives";

export const BENCH_TOP = 0.2;
export const RAIL_Y = 1.55;

const G = OSC_GEOMETRY;
const HALF = G.carriageHalfLength;
const CARRIAGE_HEIGHT = 0.5;
const CARRIAGE_DEPTH = 1.1;
/** Mass of the bare carriage; everything above it is drawn as load plates. */
const CARRIAGE_MASS = OSC_RANGES.mass.min;
const PLATE_HEIGHT = 0.1;
const PLATE_GAP = 0.012;
const MAX_PLATES = Math.ceil(OSC_RANGES.mass.max - CARRIAGE_MASS);
const WIRE_RADIUS = G.wireDiameter / 2;
const SPRING_SEGMENTS = G.coils * 28;
const SPRING_RADIAL = 9;
const STROBE_CAPACITY = 24;
/** z of the index needle: above the tick marks of the ruler. */
const NEEDLE_Z = 0.7;

export class OscillatorRig {
  readonly group = new THREE.Group();
  /** Meshes that can be grabbed with the pointer. */
  readonly pickables: THREE.Object3D[] = [];
  readonly forceScale = new VectorScale(1.5, 20, 4);
  readonly velocityScale = new VectorScale(1.5, 2, 4);

  private readonly carriage = new THREE.Group();
  private readonly plates: THREE.Mesh[] = [];
  private readonly magnet: THREE.Mesh;
  private readonly hanger: THREE.Mesh;
  private readonly glow: THREE.Mesh;
  private readonly glowMaterial: THREE.MeshBasicMaterial;
  private readonly springGeometry: THREE.BufferGeometry;
  private readonly springPositions: Float32Array;
  private readonly springNormals: Float32Array;
  private readonly phasor: THREE.Group;
  private readonly phasorNeedle: THREE.Mesh;
  private readonly massLabel: Label;
  private readonly originLabel: Label;

  private readonly velocityArrow: VectorArrow;
  private readonly netArrow: VectorArrow;
  private readonly springArrow: VectorArrow;
  private readonly damperArrow: VectorArrow;
  private readonly driveArrow: VectorArrow;
  private readonly contactArrow: VectorArrow;
  private readonly arrows: VectorArrow[];

  private readonly strobe: THREE.InstancedMesh;
  private strobeCount = 0;
  private strobeNext = 0;
  private strobeEpoch = -1;

  private readonly forces: OscillatorForces = { spring: 0, damper: 0, drive: 0, contact: 0, net: 0 };
  private readonly origin = new THREE.Vector3();
  private readonly matrix = new THREE.Matrix4();
  private shownMass = Number.NaN;
  private stackTop = RAIL_Y + CARRIAGE_HEIGHT / 2;
  private highlighted = false;
  private readonly bodyMaterial: THREE.MeshStandardMaterial;

  constructor(materials: Materials, anisotropy: number) {
    const { group } = this;
    const add = (mesh: THREE.Mesh, cast = true, receive = true) => {
      mesh.castShadow = cast;
      mesh.receiveShadow = receive;
      group.add(mesh);
      return mesh;
    };
    const xAxisCylinder = (radius: number, x0: number, x1: number, material: THREE.Material, segments = 40) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, x1 - x0, segments), material);
      mesh.rotation.z = Math.PI / 2;
      mesh.position.set((x0 + x1) / 2, RAIL_Y, 0);
      return mesh;
    };

    /* ---- fixed structure ---- */
    const wallFront = G.wallCentreX + G.wallThickness / 2;
    const railEnd = 8.75;

    // Bench rail (aluminium profile) carrying the whole apparatus.
    const beam = new THREE.Mesh(new THREE.BoxGeometry(railEnd - (G.wallCentreX - 0.6) + 0.5, BENCH_TOP, 1.9), materials.anodized);
    beam.position.set((railEnd + G.wallCentreX - 0.6 + 0.5) / 2, BENCH_TOP / 2, 0);
    add(beam);

    // Wall slab with four bolts.
    const wallHeight = 3.1;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(G.wallThickness, wallHeight, 2.5), materials.castIron);
    wall.position.set(G.wallCentreX, BENCH_TOP + wallHeight / 2, 0);
    add(wall);
    for (const [by, bz] of [
      [0.75, 0.9],
      [0.75, -0.9],
      [-0.75, 0.9],
      [-0.75, -0.9],
    ]) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.07, 6), materials.steel);
      bolt.rotation.z = Math.PI / 2;
      bolt.position.set(wallFront + 0.035, RAIL_Y + by, bz);
      add(bolt, true, false);
    }

    // Steel flange and neoprene seat: the seat face is the spring anchor.
    const padBack = G.padCentreX - G.padThickness / 2;
    add(xAxisCylinder(0.66, wallFront, padBack, materials.darkSteel));
    add(xAxisCylinder(0.58, padBack, G.anchorX, materials.rubber));

    // Guide rail through spring and carriage.
    add(xAxisCylinder(0.05, G.anchorX, railEnd - 0.15, materials.polished, 24));

    // End post and the rubber stop whose face defines xMax.
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.32, RAIL_Y + 0.3 - BENCH_TOP, 0.7), materials.castIron);
    post.position.set(railEnd - 0.16, BENCH_TOP + (RAIL_Y + 0.3 - BENCH_TOP) / 2, 0);
    add(post);
    const stopFace = G.xMax + HALF;
    add(xAxisCylinder(0.24, stopFace, stopFace + 0.1, materials.rubber));
    add(xAxisCylinder(0.19, stopFace + 0.1, stopFace + 0.26, materials.darkSteel));

    // Copper strip of the eddy-current brake (a linear, velocity-proportional damper).
    const strip = new THREE.Mesh(new THREE.BoxGeometry(stopFace - (G.xMin - HALF) + 0.6, 0.03, 0.46), materials.copper);
    strip.position.set((stopFace + G.xMin - HALF) / 2, BENCH_TOP + 0.015, 0);
    add(strip, false, true);
    // Heat signature: a soft additive patch under the carriage, brightness proportional to c v^2.
    this.glowMaterial = new THREE.MeshBasicMaterial({
      color: QUANTITY.heat,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.glow = new THREE.Mesh(new THREE.PlaneGeometry(2 * HALF + 0.5, 0.44), this.glowMaterial);
    this.glow.rotation.x = -Math.PI / 2;
    this.glow.position.y = BENCH_TOP + 0.032;
    group.add(this.glow);

    // Ruler along the front edge of the bench.
    const ruler = createRuler(-6, 8, 0.3, anisotropy);
    ruler.position.y = BENCH_TOP + 0.003;
    ruler.position.z = 0.78;
    group.add(ruler);
    this.originLabel = new Label("plain");
    this.originLabel.set("<i>x</i> = 0");
    this.originLabel.object.position.set(0, BENCH_TOP + 0.02, 1.12);
    group.add(this.originLabel.object);

    /* ---- spring ---- */
    const vertexCount = (SPRING_SEGMENTS + 1) * (SPRING_RADIAL + 1);
    this.springPositions = new Float32Array(vertexCount * 3);
    this.springNormals = new Float32Array(vertexCount * 3);
    const indices: number[] = [];
    for (let i = 0; i < SPRING_SEGMENTS; i++) {
      for (let j = 0; j < SPRING_RADIAL; j++) {
        const a = i * (SPRING_RADIAL + 1) + j;
        const b = a + SPRING_RADIAL + 1;
        // Counter-clockwise seen from outside the wire (normal = cos(a) n + sin(a) b).
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    this.springGeometry = new THREE.BufferGeometry();
    this.springGeometry.setAttribute("position", new THREE.BufferAttribute(this.springPositions, 3));
    this.springGeometry.setAttribute("normal", new THREE.BufferAttribute(this.springNormals, 3));
    this.springGeometry.setIndex(indices);
    // The helix always lies inside this box, so no per-frame bounds computation is needed.
    this.springGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, RAIL_Y, 0), 9);
    const spring = new THREE.Mesh(this.springGeometry, materials.polished);
    spring.castShadow = true;
    spring.frustumCulled = false;
    group.add(spring);

    /* ---- carriage ---- */
    this.bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x3a434f, metalness: 0.75, roughness: 0.42 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2 * HALF - 0.08, CARRIAGE_HEIGHT, CARRIAGE_DEPTH), this.bodyMaterial);
    body.position.x = 0.04;
    body.castShadow = true;
    body.receiveShadow = true;
    this.carriage.add(body);
    this.pickables.push(body);
    // Spring seat plate forming the left face of the carriage.
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.08, 40), materials.steel);
    seat.rotation.z = Math.PI / 2;
    seat.position.x = -HALF + 0.04;
    seat.castShadow = true;
    this.carriage.add(seat);
    // Linear bearing bushes.
    for (const offset of [-0.55, 0.62]) {
      const bush = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.34, 24), materials.brass);
      bush.rotation.z = Math.PI / 2;
      bush.position.x = offset;
      this.carriage.add(bush);
    }
    // Magnet yoke of the brake; it is lowered towards the strip as c increases.
    this.magnet = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.42), materials.darkSteel);
    this.magnet.castShadow = true;
    this.carriage.add(this.magnet);
    this.hanger = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 0.1), materials.darkSteel);
    this.carriage.add(this.hanger);
    // Index needle pointing at the ruler.
    const needle = new THREE.Mesh(new THREE.BoxGeometry(0.02, RAIL_Y - CARRIAGE_HEIGHT / 2 - BENCH_TOP - 0.02, 0.02), materials.brass);
    needle.position.set(0, -(CARRIAGE_HEIGHT / 2) - needle.geometry.parameters.height / 2, NEEDLE_Z);
    this.carriage.add(needle);
    const needleArm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, NEEDLE_Z - CARRIAGE_DEPTH / 2 + 0.01), materials.brass);
    needleArm.position.set(0, -(CARRIAGE_HEIGHT / 2) + 0.01, (NEEDLE_Z + CARRIAGE_DEPTH / 2) / 2);
    this.carriage.add(needleArm);
    // Load plates.
    const plateGeometry = new THREE.BoxGeometry(1.3, PLATE_HEIGHT, 0.86);
    for (let i = 0; i < MAX_PLATES; i++) {
      const plate = new THREE.Mesh(plateGeometry, materials.steel);
      plate.castShadow = true;
      plate.receiveShadow = true;
      plate.visible = false;
      this.carriage.add(plate);
      this.plates.push(plate);
      this.pickables.push(plate);
    }
    this.massLabel = new Label("chip");
    this.carriage.add(this.massLabel.object);
    this.carriage.position.y = RAIL_Y;
    group.add(this.carriage);

    /* ---- drive phase indicator on the end post ---- */
    this.phasor = new THREE.Group();
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 48), materials.darkSteel);
    dial.rotation.x = Math.PI / 2;
    this.phasor.add(dial);
    this.phasorNeedle = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.035, 0.02),
      new THREE.MeshBasicMaterial({ color: QUANTITY.drive }),
    );
    this.phasorNeedle.geometry.translate(0.15, 0, 0.04);
    this.phasor.add(this.phasorNeedle);
    this.phasor.position.set(railEnd - 0.16, RAIL_Y + 0.75, 0.2);
    group.add(this.phasor);

    /* ---- vectors ---- */
    this.velocityArrow = new VectorArrow(QUANTITY.velocity, "<i>v</i>");
    this.netArrow = new VectorArrow(QUANTITY.netForce, "<i>F</i><sub>net</sub>");
    this.springArrow = new VectorArrow(QUANTITY.spring, "<i>F</i><sub>s</sub>");
    this.damperArrow = new VectorArrow(QUANTITY.damper, "<i>F</i><sub>d</sub>");
    this.driveArrow = new VectorArrow(QUANTITY.drive, "<i>F</i><sub>ext</sub>");
    this.contactArrow = new VectorArrow(QUANTITY.contact, "<i>N</i>");
    this.arrows = [
      this.velocityArrow,
      this.netArrow,
      this.springArrow,
      this.damperArrow,
      this.driveArrow,
      this.contactArrow,
    ];
    for (const arrow of this.arrows) group.add(arrow.group);

    /* ---- stroboscope ---- */
    this.strobe = new THREE.InstancedMesh(
      new THREE.BoxGeometry(2 * HALF, CARRIAGE_HEIGHT, CARRIAGE_DEPTH),
      new THREE.MeshBasicMaterial({ color: QUANTITY.position, transparent: true, opacity: 0.1, depthWrite: false }),
      STROBE_CAPACITY,
    );
    this.strobe.count = 0;
    this.strobe.frustumCulled = false;
    group.add(this.strobe);
  }

  /** Highlights the carriage while it is hovered or held. */
  setHighlight(active: boolean): void {
    if (active === this.highlighted) return;
    this.highlighted = active;
    this.bodyMaterial.emissive.set(active ? 0x3a2a05 : 0x000000);
  }

  private layoutLoad(mass: number, damping: number): void {
    if (mass !== this.shownMass) {
      this.shownMass = mass;
      const load = Math.max(0, mass - CARRIAGE_MASS);
      let y = CARRIAGE_HEIGHT / 2;
      for (let i = 0; i < MAX_PLATES; i++) {
        const plate = this.plates[i];
        const fraction = Math.min(1, Math.max(0, load - i));
        plate.visible = fraction > 1e-6;
        if (!plate.visible) continue;
        const height = PLATE_HEIGHT * fraction;
        plate.scale.y = fraction;
        plate.position.y = y + PLATE_GAP + height / 2;
        y += PLATE_GAP + height;
      }
      this.stackTop = RAIL_Y + y;
      this.massLabel.object.position.set(0, 0, CARRIAGE_DEPTH / 2 + 0.02);
      this.massLabel.set(`<i>m</i> = ${fixed(mass, 1)} kg`);
    }
    // Air gap of the brake shrinks with the damping coefficient (purely illustrative of "more braking").
    const strength = Math.sqrt(damping / OSC_RANGES.damping.max);
    const gap = 0.5 - 0.42 * strength;
    const magnetY = BENCH_TOP + 0.03 + gap + 0.08 - RAIL_Y;
    this.magnet.position.y = magnetY;
    this.magnet.visible = damping > 0;
    const top = -CARRIAGE_HEIGHT / 2;
    this.hanger.visible = damping > 0;
    this.hanger.scale.y = Math.max(0.01, top - (magnetY + 0.08));
    this.hanger.position.y = (top + magnetY + 0.08) / 2;
  }

  private updateSpring(endX: number): void {
    const positions = this.springPositions;
    const normals = this.springNormals;
    const start = G.anchorX + WIRE_RADIUS;
    const span = Math.max(1e-4, endX - WIRE_RADIUS - start);
    const turns = G.coils;
    const totalAngle = 2 * Math.PI * turns;
    const pitch = span / totalAngle; // dx / dphi
    const radius = G.coilRadius;
    const tNorm = 1 / Math.hypot(pitch, radius);
    let k = 0;
    for (let i = 0; i <= SPRING_SEGMENTS; i++) {
      const s = i / SPRING_SEGMENTS;
      const phi = s * totalAngle;
      const cos = Math.cos(phi);
      const sin = Math.sin(phi);
      const cx = start + s * span;
      const cy = RAIL_Y + radius * cos;
      const cz = radius * sin;
      // Tangent, outward normal and binormal of the helix.
      const tx = pitch * tNorm;
      const ty = -radius * sin * tNorm;
      const tz = radius * cos * tNorm;
      const bx = ty * sin - tz * cos;
      const by = -tx * sin;
      const bz = tx * cos;
      for (let j = 0; j <= SPRING_RADIAL; j++) {
        const a = (j / SPRING_RADIAL) * 2 * Math.PI;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        const nx = sa * bx;
        const ny = ca * cos + sa * by;
        const nz = ca * sin + sa * bz;
        positions[k] = cx + WIRE_RADIUS * nx;
        positions[k + 1] = cy + WIRE_RADIUS * ny;
        positions[k + 2] = cz + WIRE_RADIUS * nz;
        normals[k] = nx;
        normals[k + 1] = ny;
        normals[k + 2] = nz;
        k += 3;
      }
    }
    this.springGeometry.attributes.position.needsUpdate = true;
    this.springGeometry.attributes.normal.needsUpdate = true;
  }

  update(sim: Simulation, overlays: Overlays, strobeInterval: number, dt: number): void {
    const osc = sim.osc;
    const state = sim.getState();
    const params = state.oscillator;
    const x = osc.x;
    const v = osc.v;

    this.carriage.position.x = x;
    this.layoutLoad(params.mass, params.damping);
    this.updateSpring(x - HALF);

    // Brake heating: brightness follows the instantaneous dissipated power.
    const power = params.damping * v * v;
    this.glow.position.x = x;
    this.glowMaterial.opacity = Math.min(0.85, power / 400);

    // Drive phasor.
    this.phasor.visible = params.driveAmplitude > 0;
    this.phasorNeedle.rotation.z = osc.phase;

    /* ---- vectors ---- */
    const forces = osc.forces(this.forces);
    this.forceScale.observe(
      Math.max(Math.abs(forces.spring), Math.abs(forces.damper), Math.abs(forces.drive), Math.abs(forces.net)),
      dt,
    );
    this.velocityScale.observe(v, dt);
    const labels = overlays.labels;
    // Vectors are stacked in rows above the load so that arrows and labels never overlap each other or the apparatus.
    let row = this.stackTop + 0.3;
    const place = (arrow: VectorArrow, value: number, scale: VectorScale, unit: string, show: boolean) => {
      if (!show || Math.abs(value) < 1e-9) {
        arrow.hide();
        return;
      }
      arrow.labelVisible = labels;
      this.origin.set(x, row, 0);
      row += 0.34;
      arrow.set(this.origin, Math.sign(value), 0, 0, scale.length(value), `${fixed(value, 1)} ${unit}`, scale.clipped(value));
    };

    const fbd = overlays.freeBody;
    place(this.springArrow, forces.spring, this.forceScale, "N", fbd);
    place(this.damperArrow, forces.damper, this.forceScale, "N", fbd);
    place(this.driveArrow, forces.drive, this.forceScale, "N", fbd);
    place(this.contactArrow, forces.contact, this.forceScale, "N", fbd);
    place(this.netArrow, forces.net, this.forceScale, "N", overlays.netForce && !fbd);
    place(this.velocityArrow, v, this.velocityScale, "m/s", overlays.velocity);

    this.massLabel.visible = labels;
    this.originLabel.visible = labels;

    /* ---- stroboscope ---- */
    if (state.epoch !== this.strobeEpoch || !overlays.strobe) {
      this.strobeEpoch = state.epoch;
      this.strobeCount = 0;
      this.strobeNext = osc.t;
      this.strobe.count = 0;
    }
    if (overlays.strobe && osc.t >= this.strobeNext) {
      this.strobeNext = osc.t + strobeInterval;
      const index = this.strobeCount % STROBE_CAPACITY;
      this.matrix.makeTranslation(x, RAIL_Y, 0);
      this.strobe.setMatrixAt(index, this.matrix);
      this.strobeCount++;
      this.strobe.count = Math.min(this.strobeCount, STROBE_CAPACITY);
      this.strobe.instanceMatrix.needsUpdate = true;
    }
    this.strobe.visible = overlays.strobe;
  }

  /** Axis-aligned extent used to frame the camera. */
  bounds(target: THREE.Box3): THREE.Box3 {
    return target.set(new THREE.Vector3(G.wallCentreX - 0.4, 0, -1.3), new THREE.Vector3(8.9, 3.6, 1.3));
  }

  dispose(): void {
    for (const arrow of this.arrows) arrow.dispose();
    this.massLabel.object.element.remove();
    this.originLabel.object.element.remove();
  }
}
