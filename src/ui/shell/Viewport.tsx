"use client";

import {
  Axis3d,
  Crosshair,
  Grid3x3,
  Move3d,
  Spline,
  Tag,
  Timer,
  Zap,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useReducer, useRef, useState } from "react";
import { oscillatorTheory } from "@/physics/oscillator";
import { exactPendulumPeriod } from "@/physics/special";
import { SceneManager, type ViewPreset } from "@/scene/SceneManager";
import { useLiveTick, useSim, useSimState } from "@/sim/react";
import { useT } from "@/i18n";
import { auto, fixed } from "../format";
import { Button, Chip, cn, IconButton, Tooltip } from "../kit/core";
import { Segmented } from "../kit/controls";
import { getPrefs, setPrefs, STROBE_INTERVALS, toggleOverlay, usePrefs, type Overlays } from "../prefs";

interface ViewportProps {
  /** Receives the scene controller once WebGL is initialised (null on teardown). */
  onScene: (scene: SceneManager | null) => void;
  scene: SceneManager | null;
}

const OVERLAY_ICONS: Record<keyof Overlays, LucideIcon> = {
  velocity: Move3d,
  netForce: Zap,
  freeBody: Crosshair,
  trail: Spline,
  strobe: Timer,
  grid: Grid3x3,
  axes: Axis3d,
  labels: Tag,
};

const OVERLAY_SHORTCUTS: Partial<Record<keyof Overlays, string>> = {
  velocity: "V",
  netForce: "F",
  freeBody: "B",
  trail: "T",
  strobe: "S",
  grid: "G",
};

export function Viewport({ onScene, scene }: ViewportProps) {
  const sim = useSim();
  const t = useT();
  const overlays = usePrefs((prefs) => prefs.overlays);
  const strobeInterval = usePrefs((prefs) => prefs.strobeInterval);
  const hintSeen = usePrefs((prefs) => prefs.dragHintSeen);
  const moduleId = useSimState((state) => state.module);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);
  // The selected pendulum mass is state of the scene; a change of it only has to make the selector below read it again.
  const [, refreshSelection] = useReducer((count: number) => count + 1, 0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let instance: SceneManager;
    try {
      instance = new SceneManager(mount, sim, getPrefs().overlays);
    } catch {
      setFailed(true);
      return;
    }
    instance.setStrobeInterval(getPrefs().strobeInterval);
    instance.onCursor = (cursor) => {
      mount.style.cursor = cursor;
    };
    instance.onGrab = () => {
      if (!getPrefs().dragHintSeen) setPrefs({ dragHintSeen: true });
    };
    instance.onSelectLink = refreshSelection;
    onScene(instance);
    return () => {
      onScene(null);
      instance.dispose();
    };
  }, [sim, onScene]);

  useEffect(() => {
    scene?.setOverlays(overlays);
  }, [scene, overlays]);

  useEffect(() => {
    scene?.setStrobeInterval(strobeInterval);
  }, [scene, strobeInterval]);

  const overlayKeys = (Object.keys(OVERLAY_ICONS) as Array<keyof Overlays>).filter(
    (key) => !(key === "trail" && moduleId === "oscillator"),
  );

  return (
    // A size container: the overlays answer to the width and, in a short scene, to the height of the scene.
    <section className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-bg [container-type:size]" aria-label={t.modules[moduleId].full}>
      {/*
        The scene takes the keyboard focus so that the camera can be turned without a pointer (see
        SceneManager.onKeyDown); it handles its own keys, hence the role. The focus ring is drawn inside
        the box, where the clipping of the section cannot cut it off.
      */}
      <div
        ref={mountRef}
        data-scene
        role="application"
        tabIndex={failed ? undefined : 0}
        aria-label={t.viewport.ariaLabel}
        className="absolute inset-0 focus-visible:-outline-offset-2!"
      />

      {failed ? (
        <p className="absolute inset-0 flex items-center justify-center p-8 text-center text-[13px] text-ink-3">
          {t.app.noWebgl}
        </p>
      ) : null}

      {/*
        Experiment identity and live regime. In a narrow scene the title moves below the camera bar instead of
        running under it. In a very short scene (a phone with the plot panel open) it gives way to the scale key
        and the mass selector, which would otherwise overlap it; the top bar still names the experiment.
      */}
      <div className="pointer-events-none absolute left-3 top-14 flex max-w-[calc(100%-24px)] flex-col items-start gap-1.5 @md:top-3 @md:max-w-[calc(100%-260px)] [@container(height<230px)]:hidden [@container(height<280px)_and_(width<28rem)]:hidden">
        <h2 className="rounded-sm bg-bg/70 px-2 py-1 text-[12.5px] font-medium text-ink-2 backdrop-blur-sm">
          {t.modules[moduleId].full}
        </h2>
        <RegimeChips />
      </div>

      {/* Camera */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md border border-line bg-panel/90 p-1 backdrop-blur-sm">
        <ViewButtons scene={scene} />
        <span aria-hidden className="mx-0.5 h-4 w-px bg-line" />
        <IconButton label={t.viewport.zoomIn} size="sm" onClick={() => scene?.zoom(0.8)}>
          <ZoomIn />
        </IconButton>
        <IconButton label={t.viewport.zoomOut} size="sm" onClick={() => scene?.zoom(1.25)}>
          <ZoomOut />
        </IconButton>
      </div>

      {/* Scale key and hints */}
      <div className="pointer-events-none absolute bottom-14 left-3 flex max-w-[calc(100%-24px)] flex-col items-start gap-1">
        {/* The first-use hint (the welcome dialog says the same) is left out of a short scene, where it would cover the title. */}
        {!hintSeen ? (
          <p className="rounded-sm bg-bg/70 px-2 py-1 text-[12px] text-ink-2 backdrop-blur-sm [@container(height<360px)]:hidden">
            {t.viewport.hint}
          </p>
        ) : null}
        <ScaleKey scene={scene} />
      </div>

      {/*
        Scene layers. A plain group: every button is a tab stop, which a toolbar role would not lead one to
        expect. The 12 px below it stay free of controls: the handle of the plot dock reaches into them.
      */}
      <div
        role="group"
        aria-label={t.viewport.overlaysLabel}
        className="absolute bottom-3 left-1/2 flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-0.5 overflow-x-auto rounded-md border border-line bg-panel/90 p-1 backdrop-blur-sm"
      >
        {overlayKeys.map((key) => {
          const Icon = OVERLAY_ICONS[key];
          return (
            <Tooltip key={key} label={t.viewport.overlayHints[key]} shortcut={OVERLAY_SHORTCUTS[key]} side="top">
              <Button
                variant="ghost"
                size="sm"
                pressed={overlays[key]}
                onClick={() => toggleOverlay(key)}
                aria-label={t.viewport.overlays[key]}
              >
                <Icon aria-hidden className="size-3.5" />
                <span aria-hidden className="hidden @4xl:inline">
                  {t.viewport.overlays[key]}
                </span>
              </Button>
            </Tooltip>
          );
        })}
        {overlays.strobe ? (
          <>
            <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-line" />
            <Segmented
              size="sm"
              ariaLabel={t.viewport.strobeInterval}
              value={String(strobeInterval)}
              onChange={(value) => setPrefs({ strobeInterval: Number(value) })}
              options={STROBE_INTERVALS.map((value) => ({ value: String(value), label: `${value} s` }))}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}

function ViewButtons({ scene }: { scene: SceneManager | null }) {
  const t = useT();
  const views: Array<[ViewPreset, string, string]> = [
    ["iso", t.viewport.views.isoCode, t.viewport.views.iso],
    ["front", "XY", t.viewport.views.front],
    ["top", "XZ", t.viewport.views.top],
    ["side", "YZ", t.viewport.views.side],
  ];
  return (
    <div role="group" aria-label={t.viewport.views.title} className="flex items-center gap-0.5">
      {views.map(([view, code, label]) => (
        <Tooltip key={view} label={label}>
          <Button
            variant="ghost"
            size="sm"
            // The name starts with the text on the button, so that it can be spoken as it is seen (WCAG 2.5.3).
            aria-label={`${code} – ${label}`}
            onClick={() => scene?.setView(view)}
            className="num w-8"
          >
            {code}
          </Button>
        </Tooltip>
      ))}
    </div>
  );
}

/** Key relating arrow lengths to physical magnitudes, plus the choice of the pendulum mass that carries the vectors. */
function ScaleKey({ scene }: { scene: SceneManager | null }) {
  const t = useT();
  const overlays = usePrefs((prefs) => prefs.overlays);
  const moduleId = useSimState((state) => state.module);
  const links = useSimState((state) => state.pendulum.count);
  const timeScale = useSimState((state) => state.timeScale);
  useLiveTick(2);
  if (!scene) return null;
  const forces = overlays.netForce || overlays.freeBody;
  const vectors = forces || overlays.velocity;
  // A time scale other than 1 is a scale of the picture too: the motion on screen is slower or faster than
  // the real one. It is named here, in the one overlay that every scene size keeps (the title block and the
  // hint give way in a short scene), also when the top bar has no room for its time-scale selector.
  const rescaled = timeScale !== 1;
  if (!vectors && !rescaled) return null;
  const readout = scene.readout();
  return (
    <div className="num rounded-sm bg-bg/70 px-2 py-1 text-[11px] leading-relaxed text-ink-3 backdrop-blur-sm">
      {rescaled ? <div className="font-sans text-accent-strong">{t.viewport.scale.time(String(timeScale))}</div> : null}
      {vectors ? <span className="sr-only">{t.viewport.scale.title}: </span> : null}
      {forces ? <div>{t.viewport.scale.force(auto(readout.forcePerMetre, 2))}</div> : null}
      {overlays.velocity ? <div>{t.viewport.scale.velocity(auto(readout.velocityPerMetre, 2))}</div> : null}
      {vectors && moduleId === "pendulum" && links > 1 ? (
        // The same choice as a click on a mass, for those who cannot or do not want to point at the scene.
        // The value is read from the scene, so it follows a click, a preset and a change of the chain.
        <Tooltip label={t.viewport.vectorMass.hint} side="top">
          <div className="pointer-events-auto mb-0.5 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans">
            <span>{t.viewport.vectorMass.label}</span>
            <Segmented
              size="sm"
              ariaLabel={t.viewport.vectorMass.label}
              value={String(readout.activeLink + 1)}
              onChange={(value) => scene.selectLink(Number(value) - 1)}
              options={Array.from({ length: links }, (_, index) => ({ value: String(index + 1), label: String(index + 1) }))}
            />
          </div>
        </Tooltip>
      ) : null}
    </div>
  );
}

/** Classifies what the system is currently doing, from parameters and from measurements. */
function RegimeChips() {
  const t = useT();
  const sim = useSim();
  const moduleId = useSimState((state) => state.module);
  const oscillator = useSimState((state) => state.oscillator);
  const pendulum = useSimState((state) => state.pendulum);
  useLiveTick(4);
  const r = t.viewport.regimes;

  if (moduleId === "oscillator") {
    const theory = oscillatorTheory(oscillator);
    const driven = oscillator.driveAmplitude > 0;
    const reference = theory.omegaPeak ?? theory.omega0;
    const nearResonance =
      driven && Math.abs(oscillator.driveFrequency - reference) <= Math.max(theory.bandwidth / 2, 0.02 * theory.omega0);
    return (
      <div className="flex flex-wrap gap-1">
        <Chip className="bg-bg/70 backdrop-blur-sm">
          {r[theory.regime]}
          <span className="num text-ink-3">ζ = {fixed(theory.zeta, 3)}</span>
        </Chip>
        {driven ? (
          <Chip tone={nearResonance ? "accent" : "neutral"} className="bg-bg/70 backdrop-blur-sm">
            {nearResonance ? r.resonance : r.driven}
          </Chip>
        ) : null}
        {sim.osc.contact !== 0 ? (
          <Chip tone="warn" className="bg-bg/70 backdrop-blur-sm">
            {r.atStop}
          </Chip>
        ) : null}
      </div>
    );
  }

  if (pendulum.count === 1) {
    const exact = exactPendulumPeriod(pendulum.lengths[0], pendulum.gravity, sim.pend.y[0], sim.pend.y[1]);
    const label = exact.motion === "rotation" ? r.rotation : r.libration;
    return (
      <div className="flex flex-wrap gap-1">
        <Chip className="bg-bg/70 backdrop-blur-sm">
          {label}
          {exact.motion === "libration" ? (
            <span className="num text-ink-3">θ₀ = {fixed((exact.amplitude * 180) / Math.PI, 1)}°</span>
          ) : null}
        </Chip>
      </div>
    );
  }

  // For N >= 2 the verdict rests on the measured finite-time Lyapunov exponent, not on a threshold of the twin distance.
  const lambda = sim.lyapunov.exponent;
  const observed = sim.lyapunov.time;
  const verdict = observed < 20 ? r.undetermined : lambda > 0.2 ? r.chaotic : lambda < 0.05 ? r.regular : r.undetermined;
  return (
    <div className="flex flex-wrap gap-1">
      <Chip tone={verdict === r.chaotic ? "accent" : "neutral"} className={cn("bg-bg/70 backdrop-blur-sm")}>
        {verdict}
        {observed >= 5 ? <span className="num text-ink-3">λ ≈ {fixed(lambda, 2)} s⁻¹</span> : null}
      </Chip>
    </div>
  );
}
