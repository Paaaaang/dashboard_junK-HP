// Format: YYYY-MMDDNNN  (e.g. 2026-0520001)
// The PDF template already prints 제…호 around the number.

export function mmddFromIso(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (m) return m[2] + m[3];
  const now = new Date();
  return String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0");
}

export function buildCertificateNo(year: number, mmdd: string, sequence: number): string {
  return `${year}-${mmdd}${String(sequence).padStart(3, "0")}`;
}

export function parseCertificateNo(value: string): { year: number; mmdd: string; sequence: number } | null {
  const m = /^(\d{4})-(\d{4})(\d{3})$/.exec(value.trim());
  if (!m) return null;
  return { year: Number(m[1]), mmdd: m[2], sequence: Number(m[3]) };
}

/**
 * Given existing certificate numbers, allocates `count` new sequential numbers
 * for the given year + MMDD combination.
 */
export function allocateCertificateNos(
  existing: Iterable<string | null | undefined>,
  year: number,
  mmdd: string,
  count: number
): string[] {
  let maxSeq = 0;
  for (const v of existing) {
    if (!v) continue;
    const parsed = parseCertificateNo(v);
    if (parsed && parsed.year === year && parsed.mmdd === mmdd && parsed.sequence > maxSeq) {
      maxSeq = parsed.sequence;
    }
  }
  const out: string[] = [];
  for (let i = 1; i <= count; i++) {
    out.push(buildCertificateNo(year, mmdd, maxSeq + i));
  }
  return out;
}
