import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const manifest = JSON.parse(await readFile(new URL("../manifest.json", import.meta.url), "utf8"));
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
const acceptanceGuide = await readFile(
  new URL("../docs/manual-acceptance.md", import.meta.url),
  "utf8",
);

test("includes an original local extension icon in the developer-mode package", async () => {
  const expectedIcons = {
    "16": "assets/icon-16.png",
    "32": "assets/icon-32.png",
    "48": "assets/icon-48.png",
    "128": "assets/icon-128.png",
  };

  assert.deepEqual(manifest.icons, expectedIcons);

  await Promise.all(
    Object.values(manifest.icons).map((iconPath) => access(new URL(`../${iconPath}`, import.meta.url))),
  );
});

test("uses a toolbar Popup instead of an extension settings page", async () => {
  assert.equal(manifest.options_page, undefined);
  assert.equal(manifest.action.default_popup, "popup.html");
  assert.equal(manifest.permissions.includes("tabs"), false);
  assert.equal(manifest.permissions.includes("activeTab"), false);
  await access(new URL("../popup.html", import.meta.url));
});

test("documents developer-mode scope, limitations, privacy, and manual acceptance", () => {
  assert.match(readme, /Developer mode/);
  assert.match(readme, /independent, unofficial/i);
  assert.match(readme, /offline/i);
  assert.match(readme, /Store submission.*out of scope/i);
  assert.match(acceptanceGuide, /light mode/i);
  assert.match(acceptanceGuide, /dark mode/i);
  assert.match(acceptanceGuide, /narrow/i);
  assert.match(acceptanceGuide, /unsupported/i);
});
