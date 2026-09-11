export type FocusDirection = "up" | "down" | "left" | "right";

export type FocusRect = {
  id: string;
  row?: number;
  left: number;
  top: number;
  width: number;
  height: number;
};

type Point = { x: number; y: number };

const AXIS_TOLERANCE_PX = 8;

const center = (rect: FocusRect): Point => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
});

const isInDirection = (
  origin: Point,
  candidate: Point,
  direction: FocusDirection,
) => {
  switch (direction) {
    case "left":
      return candidate.x < origin.x - AXIS_TOLERANCE_PX;
    case "right":
      return candidate.x > origin.x + AXIS_TOLERANCE_PX;
    case "up":
      return candidate.y < origin.y - AXIS_TOLERANCE_PX;
    case "down":
      return candidate.y > origin.y + AXIS_TOLERANCE_PX;
  }
};

export function findNextFocus(
  current: FocusRect,
  candidates: FocusRect[],
  direction: FocusDirection,
): FocusRect | undefined {
  const origin = center(current);
  const candidatesInDirection = candidates.filter((candidate) => {
    if (candidate.id === current.id) return false;
    return isInDirection(origin, center(candidate), direction);
  });
  let scopedCandidates = candidatesInDirection;

  if (current.row !== undefined) {
    if (direction === "left" || direction === "right") {
      const sameRow = candidatesInDirection.filter(
        (candidate) => candidate.row === current.row,
      );
      if (sameRow.length > 0) scopedCandidates = sameRow;
    } else {
      const rows = candidatesInDirection
        .map((candidate) => candidate.row)
        .filter((row): row is number => row !== undefined)
        .filter((row) =>
          direction === "down" ? row > current.row! : row < current.row!,
        );

      if (rows.length > 0) {
        const nearestRow =
          direction === "down" ? Math.min(...rows) : Math.max(...rows);
        scopedCandidates = candidatesInDirection.filter(
          (candidate) => candidate.row === nearestRow,
        );
      }
    }
  }

  return scopedCandidates
    .map((candidate) => {
      const point = center(candidate);

      const horizontal = Math.abs(point.x - origin.x);
      const vertical = Math.abs(point.y - origin.y);
      const primary =
        direction === "left" || direction === "right" ? horizontal : vertical;
      const crossAxis =
        direction === "left" || direction === "right" ? vertical : horizontal;

      return {
        candidate,
        // TV navigation should enter the nearest visual row first. Alignment
        // inside that row is a secondary tie-breaker.
        score: primary * 3 + crossAxis,
      };
    })
    .sort((a, b) => a.score - b.score)[0]?.candidate;
}
