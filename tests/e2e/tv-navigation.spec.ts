import { expect, test } from "@playwright/test";

test("loads local artwork and navigates from menu to a movie rail", async ({
  page,
}) => {
  await page.goto("/");
  const heroHeading = page.locator("#hero-title");
  await expect(heroHeading).toBeVisible();

  await expect
    .poll(() =>
      page.locator(".movie-card img").first().evaluate((image) => image.naturalWidth),
    )
    .toBeGreaterThan(0);

  await expect(page.locator("[data-focus-id='nav-0']")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("[data-focus-id='hero-detail']")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  const focusedRailId = await page.evaluate(
    () => (document.activeElement as HTMLElement | null)?.dataset.focusId,
  );
  expect(focusedRailId).toMatch(/^rail-0-[01]$/);

  const focusedColumn = Number(focusedRailId?.split("-").at(-1));
  await page.keyboard.press("ArrowRight");
  await expect(
    page.locator(`[data-focus-id='rail-0-${focusedColumn + 1}']`),
  ).toBeFocused();

  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
});

test("opens Netflix-grade TV Player on hero play and exits with Escape", async ({
  page,
}) => {
  await page.goto("/");
  const heroHeading = page.locator("#hero-title");
  await expect(heroHeading).toBeVisible();
  const heroTitle = await heroHeading.innerText();

  // Navigate to Hero "Xem ngay" button and press Enter
  await page.locator("[data-focus-id='hero-play']").click();

  // Verify Player region is rendered
  const player = page.getByRole("region", { name: "Trình phát video NetPhim TV" });
  await expect(player).toBeVisible();
  await expect(player.locator(".tv-player__movie-title")).toHaveText(heroTitle);
  await expect(player.locator("[data-focus-id='player-play']")).toBeVisible();

  // Press Escape to exit Player
  await page.keyboard.press("Escape");

  // Verify Player is closed and Home is restored
  await expect(player).not.toBeVisible();
  await expect(heroHeading).toBeVisible();
});
