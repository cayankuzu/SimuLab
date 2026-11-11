import { evidenceTr } from "./tr.evidence";
import { methodsTr } from "./tr.methods";
import { physicsTr } from "./tr.physics";
import type { TheoryDocument } from "./types";

/** Kuram metni, Bölüm 1-9. Tasarım bölümleri (10-12) design.tr.ts içindedir. */
export const theoryTr: TheoryDocument = [...physicsTr, ...methodsTr, ...evidenceTr];
