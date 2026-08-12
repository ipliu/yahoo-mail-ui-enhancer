import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const controllerSource = await readFile(
  new URL("../src/page-controller.js", import.meta.url),
  "utf8",
);
const unreadStyles = await readFile(
  new URL("../src/sidebar-concealment.css", import.meta.url),
  "utf8",
);

function loadPageController() {
  const context = { globalThis: {}, setTimeout };
  vm.runInNewContext(controllerSource, context);
  return context.globalThis.YahooMailUiEnhancer.PageController;
}

function createElement() {
  const attributes = new Map();
  const listeners = new Map();
  return {
    children: [],
    contains(other) {
      return other === this || this.children.some((child) => child.contains(other));
    },
    append(...children) {
      this.children.push(...children);
    },
    remove() {
      this.removed = true;
    },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    async dispatch(type, event = {}) {
      return listeners.get(type)?.({ preventDefault() {}, key: "", ...event });
    },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    hasAttribute(name) {
      return attributes.has(name);
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] ?? null;
    },
    querySelectorAll(selector) {
      const matches = [];
      for (const child of this.children) {
        if (selector === '[data-test-id="unread-indicator"]' &&
          child.getAttribute("data-test-id") === "unread-indicator") matches.push(child);
        if (selector === '[data-test-id="mail-row"]' &&
          child.getAttribute("data-test-id") === "mail-row") matches.push(child);
        matches.push(...child.querySelectorAll(selector));
      }
      return matches;
    },
    toggleAttribute(name, force) {
      if (force) attributes.set(name, "");
      else attributes.delete(name);
    },
  };
}

function createStorage(values = {}) {
  const listeners = new Set();
  return {
    values,
    async get(defaults) {
      return { ...defaults, ...this.values };
    },
    async set(nextValues) {
      const changes = Object.fromEntries(
        Object.entries(nextValues).map(([key, newValue]) => [key, {
          oldValue: this.values[key],
          newValue,
        }]),
      );
      Object.assign(this.values, nextValues);
      for (const listener of listeners) listener(changes, "local");
    },
    onChanged: {
      addListener(listener) {
        listeners.add(listener);
      },
    },
  };
}

function createMailDocument({
  url = "https://mail.yahoo.com/d/folders/1",
  includeSidebar = true,
  includeWorkspace = true,
  sidebarInApplication = true,
  theme = "dark",
  rows = [],
}) {
  const application = createElement();
  const toolbar = createElement();
  const mainContent = createElement();
  const sidebar = createElement();
  const workspace = createElement();
  const documentElement = createElement();
  const themeMarker = createElement();
  themeMarker.setAttribute("data-test-id", "mail-theme-marker");
  themeMarker.setAttribute("data-theme", theme);
  application.append(toolbar);
  application.append(mainContent);
  if (includeWorkspace) application.append(workspace);
  if (includeSidebar && sidebarInApplication) application.append(sidebar);
  application.append(themeMarker);
  for (const row of rows) workspace.append(row);

  const anchors = new Map([
    ['[data-test-id="mail-app"]', application],
    ['[data-test-id="mail-toolbar"]', toolbar],
    ['[data-test-id="mail-main"]', mainContent],
    ['[data-test-id="mail-sidebar"]', includeSidebar ? sidebar : null],
    ['[data-test-id="mail-workspace"]', includeWorkspace ? workspace : null],
    ['[data-test-id="mail-theme-marker"]', themeMarker],
  ]);

  return {
    application,
    document: {
      documentElement,
      location: new URL(url),
      createElement,
      querySelector(selector) {
        return anchors.get(selector) ?? null;
      },
    },
    mainContent,
    sidebar,
    themeMarker,
    toolbar,
    workspace,
  };
}

function createMessageRow({ unread = false } = {}) {
  const row = createElement();
  row.setAttribute("data-test-id", "mail-row");
  const sender = createElement();
  sender.setAttribute("data-test-id", "mail-sender");
  const subject = createElement();
  subject.setAttribute("data-test-id", "mail-subject");
  const preview = createElement();
  preview.setAttribute("data-test-id", "mail-preview");
  const date = createElement();
  date.setAttribute("data-test-id", "mail-date");
  row.append(sender, subject, preview, date);
  if (unread) {
    const unreadIndicator = createElement();
    unreadIndicator.setAttribute("data-test-id", "unread-indicator");
    row.append(unreadIndicator);
  }
  return { date, preview, row, sender, subject };
}

function findToggle(toolbar) {
  return toolbar.children.find(
    (child) => child.getAttribute("data-yme-sidebar-toggle") === "true",
  );
}

function findAnnouncement(toolbar) {
  return toolbar.children.find(
    (child) => child.getAttribute("data-yme-sidebar-announcement") === "true",
  );
}

test("conceals the Mail Sidebar by default without replacing it", async () => {
  const PageController = loadPageController();
  const page = createMailDocument({});
  const controller = new PageController(page.document, createStorage());

  await controller.start();

  assert.equal(page.document.documentElement.getAttribute("data-yme-sidebar-concealed"), "true");
  assert.equal(page.mainContent.getAttribute("data-yme-content-gutter"), "true");
  assert.equal(page.sidebar.removed, undefined);
  assert.equal(findToggle(page.toolbar).getAttribute("aria-pressed"), "true");
});

test("Sidebar Toggle restores and conceals the existing Mail Sidebar", async () => {
  const PageController = loadPageController();
  const page = createMailDocument({});
  const controller = new PageController(page.document, createStorage());
  await controller.start();
  const toggle = findToggle(page.toolbar);

  await toggle.dispatch("click");
  assert.equal(page.document.documentElement.hasAttribute("data-yme-sidebar-concealed"), false);
  assert.equal(page.mainContent.hasAttribute("data-yme-content-gutter"), false);
  assert.equal(page.sidebar.removed, undefined);
  assert.equal(toggle.getAttribute("aria-pressed"), "false");
  assert.equal(findAnnouncement(page.toolbar).textContent, "Mail Sidebar restored");

  await toggle.dispatch("click", { detail: 0 });
  assert.equal(page.document.documentElement.getAttribute("data-yme-sidebar-concealed"), "true");
  assert.equal(toggle.getAttribute("aria-pressed"), "true");
});

test("restores the device-local Sidebar Preference in another supported tab", async () => {
  const PageController = loadPageController();
  const storage = createStorage();
  const firstPage = createMailDocument({});
  const firstController = new PageController(firstPage.document, storage);
  await firstController.start();
  await findToggle(firstPage.toolbar).dispatch("click");

  const secondPage = createMailDocument({});
  await new PageController(secondPage.document, storage).start();

  assert.equal(secondPage.document.documentElement.hasAttribute("data-yme-sidebar-concealed"), false);
  assert.equal(findToggle(secondPage.toolbar).getAttribute("aria-pressed"), "false");
});

test("synchronizes Sidebar Preference to an already open supported tab", async () => {
  const PageController = loadPageController();
  const storage = createStorage();
  const firstPage = createMailDocument({});
  const secondPage = createMailDocument({});
  await new PageController(firstPage.document, storage).start();
  await new PageController(secondPage.document, storage).start();

  await findToggle(firstPage.toolbar).dispatch("click");

  assert.equal(secondPage.document.documentElement.hasAttribute("data-yme-sidebar-concealed"), false);
  assert.equal(findToggle(secondPage.toolbar).getAttribute("aria-pressed"), "false");
});

test("leaves unsupported pages unchanged", async () => {
  const PageController = loadPageController();
  const page = createMailDocument({ url: "https://mail.yahoo.com/calendar" });
  page.document.documentElement.setAttribute("data-yahoo-state", "unchanged");

  await new PageController(page.document, createStorage()).start();

  assert.equal(page.document.documentElement.hasAttribute("data-yme-sidebar-concealed"), false);
  assert.equal(page.mainContent.hasAttribute("data-yme-content-gutter"), false);
  assert.equal(findToggle(page.toolbar), undefined);
  assert.equal(page.document.documentElement.getAttribute("data-yahoo-state"), "unchanged");
});

test("leaves pages with missing or altered mail anchors unchanged", async () => {
  const PageController = loadPageController();
  const cases = [
    createMailDocument({ includeSidebar: false }),
    createMailDocument({ includeWorkspace: false }),
    createMailDocument({ sidebarInApplication: false }),
  ];

  for (const page of cases) {
    await new PageController(page.document, createStorage()).start();

    assert.equal(page.document.documentElement.hasAttribute("data-yme-sidebar-concealed"), false);
    assert.equal(page.mainContent.hasAttribute("data-yme-content-gutter"), false);
    assert.equal(findToggle(page.toolbar), undefined);
  }
});

test("leaves a non-mail workspace unchanged", async () => {
  const PageController = loadPageController();
  const page = createMailDocument({
    url: "https://mail.yahoo.com/d/calendar",
    includeWorkspace: false,
  });

  await new PageController(page.document, createStorage()).start();

  assert.equal(page.document.documentElement.hasAttribute("data-yme-sidebar-concealed"), false);
  assert.equal(page.mainContent.hasAttribute("data-yme-content-gutter"), false);
  assert.equal(findToggle(page.toolbar), undefined);
});

test("keeps one Sidebar Toggle after an idempotent refresh", async () => {
  const PageController = loadPageController();
  const page = createMailDocument({});
  const controller = new PageController(page.document, createStorage());
  await controller.start();

  controller.refresh();

  assert.equal(page.toolbar.children.filter(
    (child) => child.getAttribute("data-yme-sidebar-toggle") === "true",
  ).length, 1);
});

test("removes Sidebar Concealment when the Eligible Mail View disappears", async () => {
  const PageController = loadPageController();
  const page = createMailDocument({});
  const controller = new PageController(page.document, createStorage());
  await controller.start();
  page.document.location = new URL("https://mail.yahoo.com/calendar");

  controller.refresh();

  assert.equal(page.document.documentElement.hasAttribute("data-yme-sidebar-concealed"), false);
  assert.equal(page.mainContent.hasAttribute("data-yme-content-gutter"), false);
  assert.equal(findToggle(page.toolbar).removed, true);
});

test("emphasizes only unread rows in a dark Eligible Mail View", async () => {
  const PageController = loadPageController();
  const unread = createMessageRow({ unread: true });
  const read = createMessageRow();
  const page = createMailDocument({ rows: [unread.row, read.row] });

  await new PageController(page.document, createStorage()).start();

  assert.equal(unread.row.getAttribute("data-yme-unread-emphasis"), "true");
  assert.equal(read.row.hasAttribute("data-yme-unread-emphasis"), false);
  assert.equal(unread.preview.hasAttribute("data-yme-unread-emphasis"), false);
  assert.equal(unread.date.hasAttribute("data-yme-unread-emphasis"), false);
  assert.equal(unread.row.querySelector('[data-test-id="unread-indicator"]').removed, undefined);
});

test("leaves mail rows unchanged in a light Mail Theme Marker", async () => {
  const PageController = loadPageController();
  const unread = createMessageRow({ unread: true });
  const page = createMailDocument({ rows: [unread.row], theme: "light" });

  await new PageController(page.document, createStorage()).start();

  assert.equal(unread.row.hasAttribute("data-yme-unread-emphasis"), false);
});

test("removes Unread Emphasis after mail-list replacement or a theme change", async () => {
  const PageController = loadPageController();
  const unread = createMessageRow({ unread: true });
  const page = createMailDocument({ rows: [unread.row] });
  const controller = new PageController(page.document, createStorage());
  await controller.start();
  page.themeMarker.setAttribute("data-theme", "light");

  controller.refresh();

  assert.equal(unread.row.hasAttribute("data-yme-unread-emphasis"), false);
});

test("applies Unread Emphasis to virtualized rows after mail-list replacement", async () => {
  const PageController = loadPageController();
  const firstUnread = createMessageRow({ unread: true });
  const replacementUnread = createMessageRow({ unread: true });
  const page = createMailDocument({ rows: [firstUnread.row] });
  const controller = new PageController(page.document, createStorage());
  await controller.start();
  page.workspace.children = [replacementUnread.row];

  controller.refresh();
  controller.refresh();

  assert.equal(replacementUnread.row.getAttribute("data-yme-unread-emphasis"), "true");
});

test("keeps Unread Emphasis from overriding native interaction states", () => {
  assert.match(unreadStyles, /\[data-yme-unread-emphasis="true"\]:not\(:hover\)/);
  assert.match(unreadStyles, /:not\(:focus-within\)/);
  assert.match(unreadStyles, /:not\(\[aria-selected="true"\]\)/);
  assert.match(unreadStyles, /:not\(\[data-dragging="true"\]\)/);
});

test("keeps Sidebar Concealment active when the Mail Theme Marker disappears", async () => {
  const PageController = loadPageController();
  const unread = createMessageRow({ unread: true });
  const page = createMailDocument({ rows: [unread.row] });
  const controller = new PageController(page.document, createStorage());
  await controller.start();
  page.document.querySelector = (selector) => {
    if (selector === '[data-test-id="mail-theme-marker"]') return null;
    return new Map([
      ['[data-test-id="mail-app"]', page.application],
      ['[data-test-id="mail-toolbar"]', page.toolbar],
      ['[data-test-id="mail-main"]', page.mainContent],
      ['[data-test-id="mail-sidebar"]', page.sidebar],
      ['[data-test-id="mail-workspace"]', page.workspace],
    ]).get(selector) ?? null;
  };

  controller.refresh();

  assert.equal(page.document.documentElement.getAttribute("data-yme-sidebar-concealed"), "true");
  assert.equal(unread.row.hasAttribute("data-yme-unread-emphasis"), false);
});
