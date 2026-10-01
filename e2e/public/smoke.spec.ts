import { test, expect } from "@playwright/test";

const PUBLIC_ROUTES = ["/", "/forums", "/courses", "/marketplace", "/marketplace/projects", "/help", "/legal", "/auth"];

for (const path of PUBLIC_ROUTES) {
  test(`public page loads: ${path} @mobile`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const res = await page.goto(path);
    expect(res?.status() ?? 200).toBeLessThan(400);
    await expect(page.locator("body")).not.toBeEmpty();
    expect(errors).toEqual([]);
  });
}

test("document is RTL Arabic", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("SEO basics: title, description, robots, sitemap", async ({ page, request }) => {
  await page.goto("/");
  expect((await page.title()).length).toBeGreaterThan(0);
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  expect((await request.get("/robots.txt")).ok()).toBe(true);
  expect((await request.get("/sitemap.xml")).ok()).toBe(true);
});

test("PWA: manifest is served", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBeTruthy();
  expect((await request.get(href!)).ok()).toBe(true);
});

test("protected routes do not expose private content when signed out", async ({ page }) => {
  await page.goto("/marketplace/dashboard");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/auth|\/$/);
});

test("unknown routes show the not-found page", async ({ page }) => {
  await page.goto("/this-route-does-not-exist-xyz");
  await expect(page.getByText(/404|غير موجود/).first()).toBeVisible();
});
