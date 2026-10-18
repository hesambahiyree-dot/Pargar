const FA = "۰۱۲۳۴۵۶۷۸۹";

export function normalizeAnswer(raw: string): string {
  return raw
    .trim()
    .replace(/[۰-۹]/g, (d) => String(FA.indexOf(d)))
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/[،]/g, ",")
    .replace(/[٫]/g, ".")
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, "")
    .toLowerCase();
}

export function answerMatches(input: string, expected: string): boolean {
  const a = normalizeAnswer(input);
  const b = normalizeAnswer(expected);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb) && Math.abs(na - nb) < 1e-6) return true;
  if (b.includes("/")) {
    const [p, q] = b.split("/");
    const pn = Number(p);
    const qn = Number(q);
    if (q && qn !== 0 && Number.isFinite(pn) && Math.abs(na - pn / qn) < 1e-6) return true;
  }
  return false;
}
