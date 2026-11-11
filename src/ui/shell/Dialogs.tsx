"use client";

import { useT } from "@/i18n";
import { Button, Kbd } from "../kit/core";
import { Dialog } from "../kit/overlays";
import { setPrefs, usePrefs } from "../prefs";

interface OpenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsDialog({ open, onOpenChange }: OpenProps) {
  const t = useT();
  const items = t.shortcuts.items;
  const groups: Array<{ title: string; rows: Array<[string, string]> }> = [
    {
      title: t.shortcuts.groups.transport,
      rows: [
        ["Space", items.toggleRun],
        [".", items.step],
        ["R", items.reset],
        ["1", items.moduleOscillator],
        ["2", items.modulePendulum],
      ],
    },
    {
      title: t.shortcuts.groups.view,
      rows: [
        ["V", items.velocity],
        ["F", items.netForce],
        ["B", items.freeBody],
        ["T", items.trail],
        ["S", items.strobe],
        ["G", items.grid],
      ],
    },
    {
      title: t.shortcuts.groups.panels,
      rows: [
        ["D", items.dock],
        ["K", items.theory],
        ["M", items.sound],
        ["?", items.help],
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={t.shortcuts.title} closeLabel={t.common.close} widthClass="max-w-[640px]">
      <div className="grid gap-5 p-5 sm:grid-cols-3">
        {groups.map((group) => (
          <section key={group.title}>
            <h3 className="label-caps mb-2">{group.title}</h3>
            <dl className="grid gap-1.5">
              {group.rows.map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-3 text-[13px]">
                  <dt className="text-ink-2">{label}</dt>
                  <dd>
                    <Kbd>{key}</Kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Dialog>
  );
}

/** First-run orientation; never shown again once dismissed. */
export function WelcomeDialog() {
  const t = useT();
  const seen = usePrefs((prefs) => prefs.welcomeSeen);
  const dismiss = () => setPrefs({ welcomeSeen: true });

  return (
    <Dialog
      open={!seen}
      onOpenChange={(open) => {
        if (!open) dismiss();
      }}
      title={t.welcome.title}
      description={t.welcome.lead}
      closeLabel={t.common.close}
      widthClass="max-w-[620px]"
      footer={
        <div className="flex justify-end">
          <Button variant="primary" onClick={dismiss}>
            {t.welcome.start}
          </Button>
        </div>
      }
    >
      <ol className="grid gap-px bg-line sm:grid-cols-2">
        {t.welcome.steps.map((step, index) => (
          <li key={step.title} className="bg-panel p-5">
            <div className="num text-[11px] text-accent-strong">{String(index + 1).padStart(2, "0")}</div>
            <h3 className="mt-1 text-[13.5px] font-semibold text-ink">{step.title}</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">{step.body}</p>
          </li>
        ))}
      </ol>
    </Dialog>
  );
}
