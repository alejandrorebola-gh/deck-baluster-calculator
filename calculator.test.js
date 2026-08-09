import assert from "node:assert/strict";
import test from "node:test";
import { calculateLayout, formatMeasurement } from "./app.js";

test("uses the fewest balusters that keeps gaps at or below four inches", () => {
  const result = calculateLayout(72, 1.5);
  assert.equal(result.balusterCount, 13);
  assert.ok(result.gap <= 4);

  const gapWithOneFewer = (72 - 12 * 1.5) / 13;
  assert.ok(gapWithOneFewer > 4);
});

test("keeps first, middle, and last gaps symmetric", () => {
  const result = calculateLayout(96.375, 0.75);
  assert.equal(result.firstGap, result.gap);
  assert.equal(result.lastGap, result.gap);
  assert.equal(result.totalGaps, result.balusterCount + 1);
});

test("respects a gap exactly at the four-inch limit", () => {
  const result = calculateLayout(9.5, 1.5);
  assert.equal(result.balusterCount, 1);
  assert.equal(result.gap, 4);
  assert.equal(result.withinLimit, true);
});

test("rejects invalid dimensions", () => {
  assert.throws(() => calculateLayout(0, 1.5), /greater than zero/);
  assert.throws(() => calculateLayout(10, 10), /smaller than the opening/);
  assert.throws(() => calculateLayout(10, -1), /greater than zero/);
});

test("formats measurements to the nearest eighth inch", () => {
  assert.equal(formatMeasurement(3.48), "3½″");
  assert.equal(formatMeasurement(0.76), "¾″");
  assert.equal(formatMeasurement(4), "4″");
});
