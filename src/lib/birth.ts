import type { PersonFlat } from "@/lib/types";

const CN_NUM: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};
const CN_DIGITS = "一二三四五六七八九〇零";

export interface BirthInfo {
  year: number;
  month: number;
  day: number;
  isSolar: boolean;
  solarDate?: string;
}

function cnToNumber(s: string): number {
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  let result = 0;
  let section = 0;
  let number = 0;
  for (const ch of s) {
    if (ch in CN_NUM) {
      number = CN_NUM[ch];
    } else if (ch === "十") {
      section = section * 10 + (number === 0 && section === 0 ? 1 : number) * 10;
      number = 0;
    } else if (ch === "百") {
      section = (section || number) * 100;
      number = 0;
    } else if (ch === "千") {
      section = (section || number) * 1000;
      number = 0;
    } else if (ch === "万") {
      result = (result + section + number) * 10000;
      section = 0;
      number = 0;
    }
  }
  return result + section + number;
}

function parseYear(seg: string): { year: number; isSolar: boolean } | null {
  let m = seg.match(/[（(](\d{4})年[）)]/);
  if (m) return { year: parseInt(m[1], 10), isSolar: true };
  m = seg.match(/公历(\d{4})年/);
  if (m) return { year: parseInt(m[1], 10), isSolar: true };
  m = seg.match(/(\d{4})年/);
  if (m) return { year: parseInt(m[1], 10), isSolar: false };
  m = seg.match(/民国([一二三四五六七八九十〇零]+|\d+)年/);
  if (m) return { year: 1911 + cnToNumber(m[1]), isSolar: false };
  m = seg.match(/光绪([一二三四五六七八九十〇零]+|\d+)年/);
  if (m) return { year: 1874 + cnToNumber(m[1]), isSolar: false };
  m = seg.match(/宣统([一二三四五六七八九十〇零]+|\d+)年/);
  if (m) return { year: 1908 + cnToNumber(m[1]), isSolar: false };
  m = seg.match(new RegExp(`([${CN_DIGITS}]{2,5})年`));
  if (m) return { year: cnToNumber(m[1]), isSolar: false };
  return null;
}

function hasMonthDay(seg: string): boolean {
  const m = seg.match(
    /(?:[\d一二三四五六七八九十廿卄]|[正腊冬元端])月(?:[初廿卄一二三四五六七八九十\d]{1,3})日/
  );
  return !!m;
}

function extractSolarDate(seg: string): string | undefined {
  const m = seg.match(/公历(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!m) return undefined;
  return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
}

export function parseBirth(detail: string): BirthInfo | null {
  if (!detail) return null;
  let idx = detail.indexOf("生于");
  while (idx !== -1) {
    const before = detail.slice(Math.max(0, idx - 4), idx);
    if (!/[妻娶夫嫁]/.test(before)) break;
    idx = detail.indexOf("生于", idx + 1);
  }
  if (idx === -1) return null;
  const seg = detail.slice(idx + 2).split(/[。；]/)[0];
  if (!hasMonthDay(seg)) return null;
  const y = parseYear(seg);
  if (!y) return null;
  return {
    year: y.year,
    month: 0,
    day: 0,
    isSolar: y.isSolar,
    solarDate: y.isSolar ? extractSolarDate(seg) : undefined,
  };
}

export function isZmfEligible(person: PersonFlat): boolean {
  const birth = parseBirth(person.detail || "");
  if (!birth) return false;
  return birth.year >= 1900;
}
