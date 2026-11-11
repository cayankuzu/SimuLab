"use client";

import dynamic from "next/dynamic";

/**
 * The laboratory is a client-only application (WebGL, Web Audio, local
 * storage). Loading it without server rendering removes any possibility of a
 * hydration mismatch; the server sends this lightweight boot screen instead.
 */
const Workspace = dynamic(() => import("./Workspace"), {
  ssr: false,
  loading: () => <BootScreen />,
});

export function LabLoader() {
  return <Workspace />;
}

function BootScreen() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex h-dvh flex-col items-center justify-center gap-5 bg-bg text-ink"
    >
      <svg viewBox="0 0 32 32" className="size-12" aria-hidden>
        <rect width="32" height="32" rx="7" className="fill-raised" />
        <path
          d="M16 16c0-2.2 1.8-4 4-4s4 1.8 4 4-3.6 8-8 8-8-3.6-8-8S11.600 5 18 5"
          fill="none"
          className="stroke-accent"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="16" cy="16" r="1.9" className="fill-ink" />
      </svg>
      <div className="text-center">
        <div className="text-[15px] font-semibold tracking-tight">SimuLab</div>
        <div className="mt-1 text-[12px] text-ink-3">Laboratuvar hazırlanıyor · Preparing the laboratory</div>
      </div>
      <div className="h-px w-40 overflow-hidden bg-line-strong">
        <div className="h-full w-1/3 animate-pulse bg-accent" />
      </div>
    </div>
  );
}
