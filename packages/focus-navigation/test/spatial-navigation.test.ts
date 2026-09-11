import { describe, expect, it } from "vitest";
import { findNextFocus, type FocusRect } from "../src/index";

const rect = (id: string, left: number, top: number): FocusRect => ({
  id,
  left,
  top,
  width: 100,
  height: 60,
});

describe("findNextFocus", () => {
  const current = rect("current", 200, 200);
  const candidates = [
    rect("left", 40, 200),
    rect("right", 360, 200),
    rect("up", 200, 80),
    rect("down", 200, 340),
    rect("far-diagonal", 600, 600),
  ];

  it.each([
    ["left", "left"],
    ["right", "right"],
    ["up", "up"],
    ["down", "down"],
  ] as const)("moves %s to the nearest candidate", (direction, expected) => {
    expect(findNextFocus(current, candidates, direction)?.id).toBe(expected);
  });

  it("returns undefined when no candidate exists in that direction", () => {
    expect(findNextFocus(current, [rect("right", 400, 200)], "left")).toBeUndefined();
  });

  it("ignores small cross-axis drift between controls in the same row", () => {
    const sameRowWithRoundingDrift = rect("same-row", 360, 204);
    const actualBelow = rect("below", 200, 340);

    expect(
      findNextFocus(current, [sameRowWithRoundingDrift, actualBelow], "down")?.id,
    ).toBe("below");
  });

  it("prefers the nearest row over a farther but better aligned control", () => {
    const nearbyDiagonal = rect("nearby-row", 40, 360);
    const farAligned = rect("far-aligned", 200, 700);

    expect(findNextFocus(current, [nearbyDiagonal, farAligned], "down")?.id).toBe(
      "nearby-row",
    );
  });

  it("keeps horizontal movement inside the current semantic row", () => {
    const rowCurrent = { ...rect("row-current", 100, 300), row: 2 };
    const rightSameRow = { ...rect("right-same-row", 400, 300), row: 2 };
    const rightButAbove = { ...rect("right-above", 240, 120), row: 1 };

    expect(
      findNextFocus(rowCurrent, [rightSameRow, rightButAbove], "right")?.id,
    ).toBe("right-same-row");
  });

  it("moves vertically to the next semantic row", () => {
    const rowCurrent = { ...rect("row-current", 400, 80), row: 0 };
    const nextRow = { ...rect("next-row", 100, 300), row: 1 };
    const lowerAligned = { ...rect("lower-aligned", 400, 500), row: 2 };

    expect(findNextFocus(rowCurrent, [nextRow, lowerAligned], "down")?.id).toBe(
      "next-row",
    );
  });
});
