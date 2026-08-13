import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const controllerSource = await readFile(
  new URL("../src/page-controller.js", import.meta.url),
  "utf8",
);
const preferencesSource = await readFile(
  new URL("../src/preferences.js", import.meta.url),
  "utf8",
);
const unreadStyles = await readFile(
  new URL("../src/sidebar-concealment.css", import.meta.url),
  "utf8",
);

function loadPageController(extension = {}) {
  const context = { globalThis: extension, setTimeout };
  vm.runInNewContext(preferencesSource, context);
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
        if (selector === 'a[role="row"]' &&
          child.getAttribute("role") === "row") matches.push(child);
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

function createPreferenceChanges() {
  const listeners = new Set();
  return {
    addListener(listener) {
      listeners.add(listener);
    },
    emit(changes, areaName = "local") {
      for (const listener of listeners) listener(changes, areaName);
    },
  };
}

function createStorage(values = {}, preferenceChanges) {
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
      preferenceChanges?.emit(changes);
    },
  };
}

function createMailDocument({
  url = "https://mail.yahoo.com/n/folders/1",
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
  const body = createElement();
  body.setAttribute("data-color-scheme", theme);
  application.append(mainContent);
  if (includeWorkspace) application.append(workspace);
  if (includeSidebar && sidebarInApplication) application.append(sidebar);
  body.append(toolbar, application);
  for (const row of rows) workspace.append(row);

  const anchors = new Map([
    ['[data-test-id="mail-app"]', application],
    ['[data-test-id="novation-ybar-header"]', toolbar],
    ['[data-test-id="novation-main-content"]', mainContent],
    ['[data-test-id="novation-right-rail"]', includeSidebar ? sidebar : null],
    ['[data-test-id="virtual-list"]', includeWorkspace ? workspace : null],
  ]);

  return {
    application,
    document: {
      documentElement,
      body,
      location: new URL(url),
      createElement,
      querySelector(selector) {
        return anchors.get(selector) ?? null;
      },
    },
    mainContent,
    sidebar,
    body,
    toolbar,
    workspace,
  };
}

function createMessageRow({ unread = false } = {}) {
  const row = createElement();
  row.setAttribute("role", "row");
  const sender = createElement();
  const subject = createElement();
  const preview = createElement();
  preview.setAttribute("data-test-id", "mail-preview");
  const date = createElement();
  date.setAttribute("data-test-id", "mail-date");
  const selectionDetails = createElement();
  const messageDetails = createElement();
  const dateDetails = createElement();
  messageDetails.append(sender, subject, preview);
  dateDetails.append(date);
  row.append(selectionDetails, messageDetails, dateDetails);
  if (unread) {
    const unreadIndicator = createElement();
    unreadIndicator.setAttribute("data-test-id", "unread-indicator");
    selectionDetails.append(unreadIndicator);
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
  const preferenceChanges = createPreferenceChanges();
  const storage = createStorage({}, preferenceChanges);
  const firstPage = createMailDocument({});
  const secondPage = createMailDocument({});
  await new PageController(firstPage.document, storage, preferenceChanges).start();
  await new PageController(secondPage.document, storage, preferenceChanges).start();

  await findToggle(firstPage.toolbar).dispatch("click");

  assert.equal(secondPage.document.documentElement.hasAttribute("data-yme-sidebar-concealed"), false);
  assert.equal(findToggle(secondPage.toolbar).getAttribute("aria-pressed"), "false");
});

test("applies a global local-storage change to the current Eligible Mail View", async () => {
  const PageController = loadPageController();
  const preferenceChanges = createPreferenceChanges();
  const storage = createStorage({}, preferenceChanges);
  const page = createMailDocument({});
  const controller = new PageController(page.document, storage, preferenceChanges);
  await controller.start();

  await storage.set({ sidebarConcealed: false });

  assert.equal(page.document.documentElement.hasAttribute("data-yme-sidebar-concealed"), false);
  assert.equal(findToggle(page.toolbar).getAttribute("aria-pressed"), "false");
});

test("uses the global storage change event by default", async () => {
  const preferenceChanges = createPreferenceChanges();
  const storage = createStorage({}, preferenceChanges);
  const PageController = loadPageController({
    chrome: { storage: { local: storage, onChanged: preferenceChanges } },
  });
  const page = createMailDocument({});
  const controller = new PageController(page.document);
  await controller.start();

  await storage.set({ sidebarConcealed: false });

  assert.equal(page.document.documentElement.hasAttribute("data-yme-sidebar-concealed"), false);
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
    url: "https://mail.yahoo.com/n/calendar",
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

test("reports light mode while preserving the actual Mail Sidebar status", async () => {
  const PageController = loadPageController();
  const page = createMailDocument({ theme: "light" });
  const controller = new PageController(page.document, createStorage());

  await controller.start();

  const status = controller.getCurrentPageStatus();
  assert.equal(status.state, "light-mode");
  assert.equal(status.sidebar, "concealed");
  assert.equal(status.unread, "light-mode");
});

test("leaves mail rows unchanged when Unread Emphasis is disabled", async () => {
  const PageController = loadPageController();
  const unread = createMessageRow({ unread: true });
  const page = createMailDocument({ rows: [unread.row] });

  await new PageController(page.document, createStorage({ unreadEmphasis: false })).start();

  assert.equal(unread.row.hasAttribute("data-yme-unread-emphasis"), false);
});

test("removes Unread Emphasis after mail-list replacement or a theme change", async () => {
  const PageController = loadPageController();
  const unread = createMessageRow({ unread: true });
  const page = createMailDocument({ rows: [unread.row] });
  const controller = new PageController(page.document, createStorage());
  await controller.start();
  page.body.setAttribute("data-color-scheme", "light");

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
  assert.match(unreadStyles, /\[data-yme-unread-text="true"\]/);
});

test("does not emphasize text when an unread row structure is not verified", async () => {
  const PageController = loadPageController();
  const unread = createMessageRow({ unread: true });
  const page = createMailDocument({ rows: [unread.row] });
  unread.row.children[1].children = [unread.sender];

  await new PageController(page.document, createStorage()).start();

  assert.equal(unread.row.getAttribute("data-yme-unread-emphasis"), "true");
  assert.equal(unread.sender.hasAttribute("data-yme-unread-text"), false);
});

test("keeps Sidebar Concealment active when the Mail Theme Marker is not dark", async () => {
  const PageController = loadPageController();
  const unread = createMessageRow({ unread: true });
  const page = createMailDocument({ rows: [unread.row] });
  const controller = new PageController(page.document, createStorage());
  await controller.start();
  page.body.removeAttribute("data-color-scheme");

  controller.refresh();

  assert.equal(page.document.documentElement.getAttribute("data-yme-sidebar-concealed"), "true");
  assert.equal(unread.row.hasAttribute("data-yme-unread-emphasis"), false);
});
