/** Inclusive Excel serial range for calendar dates (roughly 1900–9999). */
const MIN_EXCEL_SERIAL = 1;
const MAX_EXCEL_SERIAL = 2958465;

/**
 * Days from Excel serial to Unix epoch (1970-01-01).
 * Serial 1 maps to 1899-12-31 with this offset (no SheetJS dependency).
 */
const EXCEL_UNIX_EPOCH_SERIAL = 25569;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toIsoDateParts(year: number, month: number, day: number): string | null {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probe = new Date(year, month - 1, day);
  if (
    probe.getFullYear() !== year ||
    probe.getMonth() !== month - 1 ||
    probe.getDate() !== day
  ) {
    return null;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function fromJsDate(date: Date): string | null {
  if (Number.isNaN(date.getTime())) return null;
  return toIsoDateParts(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * Convert an Excel serial date to YYYY-MM-DD (UTC calendar components).
 * Serial 1 = 1899-12-31; aligns with Excel/xlsx for typical 1900+ business dates.
 */
export function excelSerialToIsoDate(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < MIN_EXCEL_SERIAL || serial > MAX_EXCEL_SERIAL) {
    return null;
  }

  const days = Math.floor(serial);
  const utcMs = (days - EXCEL_UNIX_EPOCH_SERIAL) * 86400000;
  const date = new Date(utcMs);
  if (Number.isNaN(date.getTime())) return null;

  return toIsoDateParts(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
}

function parseNumericSerial(value: number): string | null {
  if (!Number.isInteger(value) && value % 1 !== 0) {
    const fraction = value - Math.floor(value);
    if (fraction > 0 && fraction < 1) {
      return excelSerialToIsoDate(value);
    }
  }
  return excelSerialToIsoDate(Math.round(value));
}

function parseSlashDate(text: string): string | null {
  const match = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/.exec(text);
  if (!match) return null;

  const a = Number(match[1]);
  const b = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) year += year >= 70 ? 1900 : 2000;

  let month: number;
  let day: number;

  if (a > 12) {
    day = a;
    month = b;
  } else if (b > 12) {
    month = a;
    day = b;
  } else {
    day = a;
    month = b;
  }

  return toIsoDateParts(year, month, day);
}

export interface ParseDateOptions {
  /** Used for values like "May 10" without a year */
  defaultYear?: number;
}

function parseMonthNameDate(text: string, defaultYear?: number): string | null {
  const months: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  };

  const dmy = /^(\d{1,2})[-\s]([A-Za-z]{3,9})[-\s](\d{4})$/.exec(text);
  if (dmy) {
    const month = months[dmy[2].slice(0, 3).toLowerCase()];
    if (month) return toIsoDateParts(Number(dmy[3]), month, Number(dmy[1]));
  }

  const mdy = /^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/.exec(text);
  if (mdy) {
    const month = months[mdy[1].slice(0, 3).toLowerCase()];
    if (month) return toIsoDateParts(Number(mdy[3]), month, Number(mdy[2]));
  }

  if (defaultYear != null) {
    const monthDay = /^([A-Za-z]{3,9})\s+(\d{1,2})$/.exec(text.trim());
    if (monthDay) {
      const month = months[monthDay[1].slice(0, 3).toLowerCase()];
      if (month) return toIsoDateParts(defaultYear, month, Number(monthDay[2]));
    }
  }

  return null;
}

/** True when value looks like "May 10" without a year. */
export function isMonthDayWithoutYear(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  const text = String(value).trim();
  return /^[A-Za-z]{3,9}\s+\d{1,2}$/.test(text);
}

/**
 * Parse Excel serial, Date objects, ISO text, and common locale date strings
 * into YYYY-MM-DD.
 */
export function parseDateValue(
  value: unknown,
  options?: ParseDateOptions
): string | null {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date) {
    return fromJsDate(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const fromSerial = parseNumericSerial(value);
    if (fromSerial) return fromSerial;
    return null;
  }

  const text = String(value).trim();
  if (!text) return null;

  const serialFromText = Number(text);
  if (/^\d+(\.\d+)?$/.test(text) && Number.isFinite(serialFromText)) {
    const fromSerial = parseNumericSerial(serialFromText);
    if (fromSerial) return fromSerial;
  }

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (isoMatch) {
    return toIsoDateParts(
      Number(isoMatch[1]),
      Number(isoMatch[2]),
      Number(isoMatch[3])
    );
  }

  const slash = parseSlashDate(text);
  if (slash) return slash;

  const named = parseMonthNameDate(text, options?.defaultYear);
  if (named) return named;

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return fromJsDate(parsed);
  }

  return null;
}
