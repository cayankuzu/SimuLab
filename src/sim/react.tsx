"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { decodeShareHash } from "./exchange";
import { Simulation, type SimState } from "./Simulation";

const SimulationContext = createContext<Simulation | null>(null);

/** Experiment definition carried by the page address (shared link or legacy ?mod= parameter). */
function initialStateFromLocation(): Partial<SimState> {
  if (typeof window === "undefined") return {};
  const shared = decodeShareHash(window.location.hash);
  if (shared) return shared;
  const requested = new URLSearchParams(window.location.search).get("mod");
  return requested === "pendulum" || requested === "oscillator" ? { module: requested } : {};
}

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [sim] = useState(() => new Simulation(initialStateFromLocation()));

  useEffect(() => {
    sim.start();
    return () => sim.stop();
  }, [sim]);

  return <SimulationContext.Provider value={sim}>{children}</SimulationContext.Provider>;
}

export function useSim(): Simulation {
  const sim = useContext(SimulationContext);
  if (!sim) throw new Error("useSim must be used inside <SimulationProvider>");
  return sim;
}

/**
 * Subscribes to the discrete simulation state (parameters, run state, epoch).
 * The selector must return a primitive or a reference stored in the state so
 * that unchanged selections are referentially equal.
 */
export function useSimState<T>(selector: (state: SimState) => T): T {
  const sim = useSim();
  return useSyncExternalStore(
    sim.subscribe,
    () => selector(sim.getState()),
    () => selector(sim.getState()),
  );
}

/**
 * Re-renders the calling component at most `hz` times per second while the
 * continuous state is changing. Components then read live values directly
 * from the Simulation during render. This keeps the 3-D loop and the plots
 * (which draw imperatively every frame) independent of React's render cost.
 */
export function useLiveTick(hz = 10): number {
  const sim = useSim();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let seen = -1;
    const id = window.setInterval(() => {
      if (sim.frame !== seen) {
        seen = sim.frame;
        setTick((value) => value + 1);
      }
    }, 1000 / hz);
    return () => window.clearInterval(id);
  }, [sim, hz]);
  return tick;
}
