/**
 * Run: npm run test:import-dates
 */
import assert from "node:assert/strict";
import { excelSerialToIsoDate, parseDateValue } from "./dateUtils";

function test(name: string, fn: () => void) {
  fn();
  console.log(`  ✓ ${name}`);
}

console.log("dateUtils");

test("ISO text YYYY-MM-DD", () => {
  assert.equal(parseDateValue("2026-05-15"), "2026-05-15");
});

test("JavaScript Date object", () => {
  assert.equal(parseDateValue(new Date(2026, 4, 15)), "2026-05-15");
});

test("Excel serial for 2026-05-15", () => {
  const serial = 46157;
  assert.equal(excelSerialToIsoDate(serial), "2026-05-15");
  assert.equal(parseDateValue(serial), "2026-05-15");
});

test("Excel serial as string", () => {
  assert.equal(parseDateValue("46157"), "2026-05-15");
});

test("US slash date M/D/YYYY", () => {
  assert.equal(parseDateValue("3/15/2026"), "2026-03-15");
});

test("EU slash date D/M/YYYY", () => {
  assert.equal(parseDateValue("15/03/2026"), "2026-03-15");
});

test("named month date", () => {
  assert.equal(parseDateValue("15-Mar-2026"), "2026-03-15");
});

test("ISO datetime prefix", () => {
  assert.equal(parseDateValue("2026-05-15T14:30:00.000Z"), "2026-05-15");
});

test("rejects invalid date", () => {
  assert.equal(parseDateValue("not-a-date"), null);
  assert.equal(parseDateValue(""), null);
});

console.log("\nAll dateUtils tests passed.");
