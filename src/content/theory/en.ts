import { evidenceEn } from "./en.evidence";
import { methodsEn } from "./en.methods";
import { physicsEn } from "./en.physics";
import type { TheoryDocument } from "./types";

/** Theory text, chapters 1-9. The design chapters (10-12) are in design.en.ts. */
export const theoryEn: TheoryDocument = [...physicsEn, ...methodsEn, ...evidenceEn];
