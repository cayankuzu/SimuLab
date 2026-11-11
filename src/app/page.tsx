import { LabLoader } from "@/ui/LabLoader";

export default function HomePage() {
  return (
    <>
      <LabLoader />
      <noscript>
        <p style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
          SimuLab etkileşimli bir laboratuvardır ve JavaScript gerektirir. · SimuLab is an interactive laboratory and
          requires JavaScript.
        </p>
      </noscript>
    </>
  );
}
