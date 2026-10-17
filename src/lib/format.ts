const DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function faNum(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  const t = Number(n.toFixed(digits)).toString();
  return t.replace("-", "−").replace(/\d/g, (d) => DIGITS[Number(d)] ?? d);
}

export function faInt(n: number): string {
  return faNum(n, 0);
}
