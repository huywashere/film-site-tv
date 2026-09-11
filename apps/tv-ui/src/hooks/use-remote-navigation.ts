import { findNextFocus, type FocusDirection } from "@netphim/focus-navigation";
import { useEffect } from "react";

const FOCUSABLE_SELECTOR = "[data-tv-focusable='true']:not([disabled])";
const FOCUS_MEMORY_KEY = "netphim-tv:last-focus";

const isVisible = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && element.offsetParent !== null;
};

const getFocusableElements = () =>
  Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    isVisible,
  );

const getFocusRow = (element: HTMLElement) => {
  const row = Number(element.dataset.focusRow);
  return Number.isFinite(row) ? row : undefined;
};

const toDirection = (key: string): FocusDirection | undefined => {
  switch (key) {
    case "ArrowLeft":
      return "left";
    case "ArrowRight":
      return "right";
    case "ArrowUp":
      return "up";
    case "ArrowDown":
      return "down";
    default:
      return undefined;
  }
};

export function useRemoteNavigation(ready: boolean) {
  useEffect(() => {
    if (!ready) return;

    const focusInitialElement = () => {
      const rememberedId = sessionStorage.getItem(FOCUS_MEMORY_KEY);
      const remembered = rememberedId
        ? document.querySelector<HTMLElement>(
            `[data-focus-id="${CSS.escape(rememberedId)}"]`,
          )
        : null;
      const preferred = document.querySelector<HTMLElement>(
        "[data-tv-focus-default='true']",
      );
      (remembered && isVisible(remembered) ? remembered : preferred)?.focus();
    };

    const initialFocusId = window.setTimeout(focusInitialElement, 0);

    const handleFocus = (event: FocusEvent) => {
      const element = event.target as HTMLElement | null;
      const id = element?.dataset.focusId;
      if (!id) return;
      sessionStorage.setItem(FOCUS_MEMORY_KEY, id);
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      element.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "nearest",
        inline: "center",
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = toDirection(event.key);
      if (direction) {
        event.preventDefault();
        const elements = getFocusableElements();
        const current = document.activeElement as HTMLElement | null;

        if (!current || !elements.includes(current)) {
          elements[0]?.focus();
          return;
        }

        const currentRect = current.getBoundingClientRect();
        const next = findNextFocus(
          {
            id: current.dataset.focusId ?? "current",
            row: getFocusRow(current),
            left: currentRect.left,
            top: currentRect.top,
            width: currentRect.width,
            height: currentRect.height,
          },
          elements.map((element, index) => {
            const rect = element.getBoundingClientRect();
            return {
              id: element.dataset.focusId ?? `focus-${index}`,
              row: getFocusRow(element),
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            };
          }),
          direction,
        );

        if (next) {
          elements.find((element) => element.dataset.focusId === next.id)?.focus();
        }
        return;
      }

      if (
        event.key === "Escape" ||
        event.key === "Backspace" ||
        event.key === "BrowserBack"
      ) {
        event.preventDefault();
        window.history.back();
      }
    };

    document.addEventListener("focusin", handleFocus);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(initialFocusId);
      document.removeEventListener("focusin", handleFocus);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [ready]);
}
