export type AnswerKind = "number" | "text" | "choice";

export function normalizeAnswer(raw: string): string {
  return raw
    .trim()
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/,/g, ".")
    .replace(/\s+/g, " ");
}

export function answersMatch(expected: string, given: string, kind: AnswerKind = "text"): boolean {
  const a = normalizeAnswer(expected);
  const b = normalizeAnswer(given);
  if (kind === "number") {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return Math.abs(na - nb) < 1e-6;
  }
  return a === b;
}
