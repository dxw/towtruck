import { test, expect } from "@playwright/test";
import { filterQuery, hasTag } from "./filterUrl.js";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });
test.describe.configure({ mode: "serial" });

const copyTable = async (page) => {
  await page.getByRole("button", { name: "Copy table", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Table copied.");
  return page.evaluate(() => navigator.clipboard.readText());
};

test("copies all columns with group headers and formatted values", async ({ page }) => {
  await page.goto("/dxw");
  await expect(page.locator("[col-id='name'].ag-cell")).toHaveCount(3);

  const text = await copyTable(page);
  const lines = text.split("\r\n");
  expect(lines).toHaveLength(5);
  expect(lines[0]).toContain('"Runtime vulnerabilities"');
  expect(lines[0]).toContain('"Dev vulnerabilities"');
  expect(lines[1]).toMatch(/^"Repo"\t"Description"\t"Language"\t"Visibility"/);
  expect(lines[1]).toContain('"Most recent non-bot commit"');
  expect(lines[1]).toMatch(/"Open issues"$/);
  expect(lines[2]).toMatch(/^"govuk-blogs"\t/);
  expect(text).toContain('"Public"');
  expect(text).toContain('"Private"');
  expect(text).toContain('"govpress, wordpress-theme"');
  expect(text).toContain('"Ada Lovelace"');
  expect(text).not.toContain("[object Object]");
  expect(text).not.toContain("<a");

  const updatedAt = await page.locator(".ag-row[row-index='0'] [col-id='updatedAt']").textContent();
  expect(lines[2]).toContain(`"${updatedAt}"`);
});

test("copies only rows matching URL filters and filter buttons, including an empty result", async ({ page }) => {
  await page.goto(`/dxw?${filterQuery({ tags: hasTag("wordpress-theme") })}`);
  await expect(page.locator("[col-id='name'].ag-cell")).toHaveText(["govuk-blogs"]);

  const text = await copyTable(page);
  expect(text.split("\r\n")).toHaveLength(3);
  expect(text).toContain('"govuk-blogs"');
  expect(text).not.toContain('"optionparser"');
  expect(text).not.toContain('"php-missing"');

  await page.getByRole("button", { name: "Only D+", exact: true }).click();
  await expect(page.locator("[col-id='name'].ag-cell")).toHaveCount(0);
  expect((await copyTable(page)).split("\r\n")).toHaveLength(2);

  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator("[col-id='name'].ag-cell")).toHaveCount(3);
  expect((await copyTable(page)).split("\r\n")).toHaveLength(5);
});

test("copies only rows matching a column-menu filter", async ({ page }) => {
  await page.goto("/dxw");
  const header = page.locator(".ag-header-cell[col-id='name']");
  await header.hover();
  await header.locator(".ag-header-cell-filter-button").click();
  await page.locator(".ag-filter").getByRole("textbox").first().fill("optionparser");
  await expect(page.locator("[col-id='name'].ag-cell")).toHaveText(["optionparser"]);
  await page.keyboard.press("Escape");

  const text = await copyTable(page);
  expect(text.split("\r\n")).toHaveLength(3);
  expect(text).toContain('"optionparser"');
  expect(text).not.toContain('"govuk-blogs"');
});

test("copies sorted rows from every page and escapes special characters", async ({ page }) => {
  await page.route("**/dxw", async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /(<script type="application\/json" id="repo-grid-data">)(.*?)(<\/script>)/s,
      (_, start, json, end) => {
        const [row] = JSON.parse(json);
        const rows = Array.from({ length: 60 }, (_, index) => ({
          ...row,
          name: `repo-${String(index).padStart(2, "0")}`,
          description: 'A "quoted" description\twith a tab\nand a new line',
        }));
        return start + JSON.stringify(rows) + end;
      },
    );
    await route.fulfill({ response, body });
  });
  await page.goto("/dxw");
  const header = page.locator(".ag-header-cell[col-id='name']");
  await header.click();
  await header.click();
  await expect(header).toHaveAttribute("aria-sort", "descending");
  await expect(page.locator(".ag-row[row-index='0'] [col-id='name']")).toHaveText("repo-59");
  await expect(page.locator("[col-id='name'].ag-cell", { hasText: "repo-00" })).toHaveCount(0);

  const text = await copyTable(page);
  const names = [...text.matchAll(/"(repo-\d+)"/g)].map((match) => match[1]);
  expect(names).toEqual(Array.from({ length: 60 }, (_, index) => `repo-${String(59 - index).padStart(2, "0")}`));
  expect(text).toContain('"A ""quoted"" description\twith a tab\nand a new line"');
});

test("reports clipboard failures and allows retrying", async ({ page }) => {
  await page.goto("/dxw");
  await expect(page.locator("[col-id='name'].ag-cell")).toHaveCount(3);
  await page.evaluate(() => {
    const writeText = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = () => {
      navigator.clipboard.writeText = writeText;
      return Promise.reject(new Error("Clipboard permission denied"));
    };
  });

  const button = page.getByRole("button", { name: "Copy table", exact: true });
  await button.click();
  await expect(page.getByRole("status")).toHaveText("Could not copy table. Check clipboard permissions and try again.");
  await expect(button).toBeEnabled();
  expect(await copyTable(page)).toContain('"Repo"');
});

test("reports when clipboard access is unavailable", async ({ page }) => {
  await page.goto("/dxw");
  await expect(page.locator("[col-id='name'].ag-cell")).toHaveCount(3);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { value: undefined });
  });

  const button = page.getByRole("button", { name: "Copy table", exact: true });
  await button.click();
  await expect(page.getByRole("status")).toHaveText("Could not copy table. Check clipboard permissions and try again.");
  await expect(button).toBeEnabled();
});
