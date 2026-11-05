import { PhasePoint, EnergySnapshot, OscillatorParams, PendulumParams } from "@/engine/physicsModules";

export function exportTelemetryCSV(
  moduleId: "oscillator" | "pendulum",
  phaseHistory: PhasePoint[],
  energyHistory: EnergySnapshot[],
  oscParams?: OscillatorParams,
  pendParams?: PendulumParams
) {
  const isOsc = moduleId === "oscillator";
  const headers = isOsc
    ? [
        "Zaman (s)",
        "Konum x (m)",
        "Hiz v (m/s)",
        "Kinetik Enerji (J)",
        "Potansiyel Enerji (J)",
        "Isi Kaybi (J)",
        "Toplam Enerji (J)",
      ]
    : [
        "Zaman (s)",
        "Uç Aci theta (rad)",
        "Acisal Hiz omega (rad/s)",
        "Kinetik Enerji (J)",
        "Potansiyel Enerji (J)",
        "Isi Kaybi (J)",
        "Toplam Enerji (J)",
      ];

  const rows = phaseHistory.map((pt, i) => {
    const e =
      energyHistory[i] ||
      energyHistory[energyHistory.length - 1] || {
        kinetic: 0,
        potential: 0,
        thermal: 0,
        total: 0,
      };
    return [
      (pt.t ?? i * 0.016).toFixed(3),
      pt.q.toFixed(4),
      pt.p.toFixed(4),
      e.kinetic.toFixed(3),
      e.potential.toFixed(3),
      e.thermal.toFixed(3),
      e.total.toFixed(3),
    ].join(",");
  });

  const csvContent =
    "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const now = new Date();
  const dateStr = `${now.getFullYear()}${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}_${now
    .getHours()
    .toString()
    .padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;
  link.setAttribute("download", `simulab_${moduleId}_telemetri_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
