import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const controllerSource = await readFile(
  new URL("../src/page-controller.js", import.meta.url),
  "utf8",
);

function loadPageController() {
  const context = { globalThis: {} };
  vm.runInNewContext(controllerSource, context);
  return context.globalThis.YahooMailUiEnhancer.PageController;
}

function createElement() {
  const attributes = new Map();
  return {
    contains(other) {
      return other === this || this.children.includes(other);
    },
    children: [],
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    hasAttribute(name) {
      return attributes.has(name);
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
  };
}

function createMailDocument({
  url,
  includeSidebar = true,
  includeWorkspace = true,
  sidebarInApplication = true,
}) {
  const application = createElement();
  const toolbar = createElement();
  const mainContent = createElement();
  const sidebar = createElement();
  const workspace = createElement();
  application.children.push(toolbar, mainContent);
  if (includeWorkspace) application.children.push(workspace);
  if (includeSidebar && sidebarInApplication) application.children.push(sidebar);

  const anchors = new Map([
    ['[data-test-id="mail-app"]', application],
    ['[data-test-id="mail-toolbar"]', toolbar],
    ['[data-test-id="mail-main"]', mainContent],
    ['[data-test-id="mail-sidebar"]', includeSidebar ? sidebar : null],
    ['[data-test-id="mail-workspace"]', includeWorkspace ? workspace : null],
  ]);

  return {
    documentElement: createElement(),
    location: new URL(url),
    querySelector(selector) {
      return anchors.get(selector) ?? null;
    },
  };
}

test("marks a verified Eligible Mail View as extension-managed", () => {
  const PageController = loadPageController();
  const document = createMailDocument({ url: "https://mail.yahoo.com/d/folders/1" });

  const controller = new PageController(document);
  controller.start();

  assert.equal(document.documentElement.getAttribute("data-yme-mail-view"), "verified");
});

test("leaves an unsupported route unchanged", () => {
  const PageController = loadPageController();
  const document = createMailDocument({ url: "https://mail.yahoo.com/calendar" });
  document.documentElement.setAttribute("data-yahoo-state", "unchanged");

  const controller = new PageController(document);
  controller.start();

  assert.equal(document.documentElement.hasAttribute("data-yme-mail-view"), false);
  assert.equal(document.documentElement.getAttribute("data-yahoo-state"), "unchanged");
});

test("leaves a page with an altered anchor unchanged", () => {
  const PageController = loadPageController();
  const document = createMailDocument({
    url: "https://mail.yahoo.com/d/folders/1",
    includeSidebar: false,
  });

  const controller = new PageController(document);
  controller.start();

  assert.equal(document.documentElement.hasAttribute("data-yme-mail-view"), false);
});

test("leaves a structurally similar non-mail workspace unchanged", () => {
  const PageController = loadPageController();
  const document = createMailDocument({
    url: "https://mail.yahoo.com/d/calendar",
    includeWorkspace: false,
  });

  new PageController(document).start();

  assert.equal(document.documentElement.hasAttribute("data-yme-mail-view"), false);
});

test("leaves a page with an altered anchor hierarchy unchanged", () => {
  const PageController = loadPageController();
  const document = createMailDocument({
    url: "https://mail.yahoo.com/d/folders/1",
    sidebarInApplication: false,
  });

  new PageController(document).start();

  assert.equal(document.documentElement.hasAttribute("data-yme-mail-view"), false);
});

test("removes extension-owned state when the Eligible Mail View disappears", () => {
  const PageController = loadPageController();
  const document = createMailDocument({ url: "https://mail.yahoo.com/d/folders/1" });
  const controller = new PageController(document);
  controller.start();
  document.location = new URL("https://mail.yahoo.com/calendar");

  controller.refresh();

  assert.equal(document.documentElement.hasAttribute("data-yme-mail-view"), false);
});
