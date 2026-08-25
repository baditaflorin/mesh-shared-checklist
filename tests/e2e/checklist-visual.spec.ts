import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  name: string;
};

async function closeInitiallyOpenSettings(page: Page): Promise<void> {
  const settings = page.getByRole("dialog", { name: "Settings" });
  if (!(await settings.isVisible().catch(() => false))) return;
  const close = settings.getByRole("button", { name: "close" });
  if (await close.isVisible().catch(() => false)) await close.click();
  else await page.keyboard.press("Escape");
  await expect(settings).toBeHidden();
}

test("a clear task reaches the other person in the room", async ({ browser, baseURL }) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", {
    storagePrefix: pkg.name,
  });

  try {
    await Promise.all([closeInitiallyOpenSettings(a), closeInitiallyOpenSettings(b)]);
    const writeTask = a.getByRole("button", { name: "Write the first task" });
    await expect(writeTask).toBeEnabled();
    await writeTask.click();
    await a.getByLabel("What needs doing?").fill("Confirm the venue access");
    await a.getByLabel("Owner (optional)").fill("Mina");
    await a.getByRole("button", { name: "Add to checklist" }).click();

    await expect(a.getByText("Confirm the venue access")).toBeVisible();
    await expect(b.getByText("Confirm the venue access")).toBeVisible();
    await expect(b.getByText("Owner · Mina")).toBeVisible();
  } finally {
    await cleanup();
  }
});

test("the entry action stays available on a phone-sized viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await closeInitiallyOpenSettings(page);

  const action = page.getByRole("button", { name: "Start with a baseline" });
  await expect(action).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});

test("the entry action is above the fold on a short desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1141, height: 602 });
  await page.goto("./");
  await closeInitiallyOpenSettings(page);

  const action = page.getByRole("button", { name: "Start with a baseline" });
  await expect(action).toBeVisible();
  const bounds = await action.boundingBox();
  expect(bounds).not.toBeNull();
  expect((bounds?.y ?? Infinity) + (bounds?.height ?? 0)).toBeLessThanOrEqual(602);
});
