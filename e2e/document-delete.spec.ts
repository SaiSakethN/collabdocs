import { expect, test } from "@playwright/test";

const ownerDoc = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "Synthetic owner document",
  owner_id: "alice",
  content: { type: "doc", content: [{ type: "paragraph" }] },
  version: 1,
  created_at: "2026-11-17T00:00:00Z",
  updated_at: "2026-11-17T00:00:00Z",
};
const sharedDoc = {
  ...ownerDoc,
  id: "00000000-0000-4000-8000-000000000002",
  title: "Synthetic shared document",
  owner_id: "bob",
};

test.describe("delete UI with intercepted synthetic documents", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/documents", (route) =>
      route.fulfill({ json: [ownerDoc, sharedDoc] }),
    );
  });
  test("three dots are visible on every card; only owners see Delete", async ({
    page,
  }) => {
    await page.goto("/");
    const ownerMenu = page.getByLabel(`Actions for ${ownerDoc.title}`, {
      exact: true,
    });
    await expect(ownerMenu).toBeVisible();
    await ownerMenu.click();
    await expect(
      page.getByRole("button", { name: "Delete document", exact: true }),
    ).toBeVisible();
    await page
      .getByLabel(`Actions for ${sharedDoc.title}`, { exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Delete document", exact: true }),
    ).toHaveCount(0);
  });
  test("confirmation cancellation sends no DELETE request", async ({
    page,
  }) => {
    let calls = 0;
    await page.route(`**/api/documents/${ownerDoc.id}`, (route) => {
      calls++;
      return route.fulfill({ json: { deleted: true } });
    });
    await page.goto("/");
    await page
      .getByLabel(`Actions for ${ownerDoc.title}`, { exact: true })
      .click();
    await page
      .getByRole("button", { name: "Delete document", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "Delete document?" });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Cancel", exact: true }),
    ).toBeFocused();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    expect(calls).toBe(0);
    await expect(
      page.getByRole("heading", { name: ownerDoc.title, exact: true }),
    ).toBeVisible();
  });
  test("confirmed synthetic deletion updates the dashboard", async ({
    page,
  }) => {
    let calls = 0;
    await page.route(`**/api/documents/${ownerDoc.id}`, (route) => {
      expect(route.request().method()).toBe("DELETE");
      calls++;
      return route.fulfill({ json: { deleted: true, id: ownerDoc.id } });
    });
    await page.goto("/");
    await page
      .getByLabel(`Actions for ${ownerDoc.title}`, { exact: true })
      .click();
    await page
      .getByRole("button", { name: "Delete document", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete document", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: ownerDoc.title, exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole("status")).toContainText("Deleted");
    expect(calls).toBe(1);
  });
  test("failed deletion retains the document and shows the error", async ({
    page,
  }) => {
    await page.route(`**/api/documents/${ownerDoc.id}`, (route) =>
      route.fulfill({
        status: 403,
        json: { error: "Only the owner can delete this document." },
      }),
    );
    await page.goto("/");
    await page
      .getByLabel(`Actions for ${ownerDoc.title}`, { exact: true })
      .click();
    await page
      .getByRole("button", { name: "Delete document", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete document", exact: true })
      .click();
    await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
      "Only the owner",
    );
    await expect(
      page.getByRole("heading", { name: ownerDoc.title, exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("dialog")
        .getByRole("button", { name: "Cancel", exact: true }),
    ).toBeEnabled();
  });
});

test("live documents: owner menu and cancel only, no existing document deletion", async ({
  page,
  request,
}, testInfo) => {
  test.skip(
    process.env.VERIFY_LIVE !== "1",
    "Explicit opt-in for read-only live checks",
  );
  const beforeResponse = await request.get("/api/documents", {
    headers: { "x-demo-user": "alice" },
  });
  expect(beforeResponse.ok()).toBeTruthy();
  const before = await beforeResponse.json();
  const target =
    before.find(
      (doc: typeof ownerDoc) =>
        doc.owner_id === "alice" && doc.title === "Product Launch Plan",
    ) || before.find((doc: typeof ownerDoc) => doc.owner_id === "alice");
  expect(target).toBeTruthy();
  // Abort ALL browser DELETE traffic as an additional safeguard for existing data.
  let deleteAttempts = 0;
  await page.route("**/api/documents/**", (route) => {
    if (route.request().method() === "DELETE") {
      deleteAttempts++;
      return route.abort();
    }
    return route.continue();
  });
  await page.goto("/");
  await page.getByLabel(`Actions for ${target.title}`, { exact: true }).click();
  await page.screenshot({
    path: testInfo.outputPath("production-delete-menu.png"),
  });
  await page
    .getByRole("button", { name: "Delete document", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Delete document?" }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("production-delete-confirmation.png"),
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const bobResponse = await request.get("/api/documents", {
    headers: { "x-demo-user": "bob" },
  });
  expect(bobResponse.ok()).toBeTruthy();
  const bobDocuments = await bobResponse.json();
  const shared = bobDocuments.find(
    (doc: typeof ownerDoc) => doc.owner_id === "alice",
  );
  expect(shared).toBeTruthy();
  await page
    .getByLabel("DEMO MODE user switcher", { exact: true })
    .selectOption("bob");
  await page.getByLabel(`Actions for ${shared.title}`, { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Delete document", exact: true }),
  ).toHaveCount(0);
  const afterResponse = await request.get("/api/documents", {
    headers: { "x-demo-user": "alice" },
  });
  expect(afterResponse.ok()).toBeTruthy();
  const after = await afterResponse.json();
  expect(after.map((doc: typeof ownerDoc) => doc.id).sort()).toEqual(
    before.map((doc: typeof ownerDoc) => doc.id).sort(),
  );
  expect(deleteAttempts).toBe(0);
});
