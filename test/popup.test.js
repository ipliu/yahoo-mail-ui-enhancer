import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const popupSource = await readFile(new URL("../src/popup.js", import.meta.url), "utf8");
const popupCss = await readFile(new URL("../src/popup.css", import.meta.url), "utf8");
const popupHtml = await readFile(new URL("../popup.html", import.meta.url), "utf8");
const preferencesSource = await readFile(new URL("../src/preferences.js", import.meta.url), "utf8");
const englishMessages = JSON.parse(await readFile(new URL("../_locales/en/messages.json", import.meta.url), "utf8"));
const traditionalChineseMessages = JSON.parse(await readFile(new URL("../_locales/zh_TW/messages.json", import.meta.url), "utf8"));

function loadPopup() {
  const context = { globalThis: {} };
  vm.runInNewContext(preferencesSource, context);
  vm.runInNewContext(popupSource, context);
  return context.globalThis.YahooMailUiEnhancer.Popup;
}

function createElement() {
  const listeners = new Map();
  return {
    checked: false, dataset: {}, hidden: false, textContent: "",
    addEventListener(type, listener) { listeners.set(type, listener); },
    async dispatch(type) { return listeners.get(type)?.({ target: this }); },
  };
}

function createPopupDocument() {
  const ids = ["title", "title-heading", "status-heading", "status-card", "status", "status-detail", "effect-status", "sidebar-status-label", "unread-status-label", "sidebar-status", "unread-status", "sidebar-concealment", "unread-emphasis", "sidebar-label", "unread-label", "privacy", "unofficial", "privacy-link"];
  const elements = new Map(ids.map((id) => [id, createElement()]));
  return { documentElement: { lang: "en" }, elements, getElementById(id) { return elements.get(id); } };
}

function createI18n(messages) {
  return { getMessage(key) { return messages[key]?.message ?? ""; } };
}

function createStorage(values = {}) {
  return { values, async get(defaults) { return { ...defaults, ...this.values }; }, async set(next) { Object.assign(this.values, next); } };
}

function createRuntime() {
  const listeners = new Set();
  return { onMessage: { addListener(listener) { listeners.add(listener); } }, emit(message, sender) { for (const listener of listeners) listener(message, sender); } };
}

test("shows actual effects and immediately persists Popup controls", async () => {
  const { setupPopup } = loadPopup();
  const document = createPopupDocument();
  const storage = createStorage({ sidebarConcealed: false, unreadEmphasis: true });
  const runtime = createRuntime();
  const tabs = { async query() { return [{ id: 42 }]; }, async sendMessage() { return { state: "light-mode", sidebar: "shown", unread: "light-mode" }; } };

  await setupPopup(document, storage, runtime, tabs, createI18n(englishMessages));

  assert.equal(document.elements.get("status").textContent, "Light mode");
  assert.equal(document.elements.get("sidebar-status").textContent, "Shown");
  assert.equal(document.elements.get("unread-status").textContent, "Unavailable in light mode");
  document.elements.get("sidebar-concealment").checked = true;
  await document.elements.get("sidebar-concealment").dispatch("change");
  assert.equal(storage.values.sidebarConcealed, true);
});

test("does not send a preference message to the active page", async () => {
  const { setupPopup } = loadPopup();
  const document = createPopupDocument();
  const messages = [];
  const tabs = {
    async query() { return [{ id: 42 }]; },
    async sendMessage(tabId, message) {
      messages.push({ tabId, type: message.type });
      return { state: "active", sidebar: "concealed", unread: "active" };
    },
  };

  await setupPopup(document, createStorage(), createRuntime(), tabs, createI18n(englishMessages));
  document.elements.get("sidebar-concealment").checked = false;
  await document.elements.get("sidebar-concealment").dispatch("change");

  assert.deepEqual(messages, [{ tabId: 42, type: "yme-get-page-status" }]);
});

test("reports unsupported pages while keeping Traditional Chinese controls available", async () => {
  const { setupPopup } = loadPopup();
  const document = createPopupDocument();
  const tabs = { async query() { return [{ id: 9 }]; }, async sendMessage() { throw new Error("no content script"); } };
  const storage = createStorage({ sidebarConcealed: true });

  await setupPopup(document, storage, createRuntime(), tabs, createI18n(traditionalChineseMessages));

  assert.equal(document.elements.get("status").textContent, "此頁面不受支援");
  assert.equal(document.elements.get("sidebar-label").textContent, "隱藏郵件側欄");
  assert.equal(document.elements.get("unread-label").textContent, "在深色模式強調未讀信");
  assert.equal(document.elements.get("title-heading").textContent, "Yahoo Mail UI Enhancer");
  assert.equal(document.documentElement.lang, "zh-TW");
  assert.equal(document.elements.get("effect-status").hidden, true);
  assert.equal(document.elements.get("status-card").dataset.state, "not-supported");
  document.elements.get("sidebar-concealment").checked = false;
  await document.elements.get("sidebar-concealment").dispatch("change");
  assert.equal(storage.values.sidebarConcealed, false);
});

test("refreshes Current Page Status from the active Yahoo Mail tab", async () => {
  const { setupPopup } = loadPopup();
  const document = createPopupDocument();
  const runtime = createRuntime();
  const tabs = { async query() { return [{ id: 5 }]; }, async sendMessage() { return { state: "active", sidebar: "concealed", unread: "active" }; } };
  await setupPopup(document, createStorage(), runtime, tabs, createI18n(englishMessages));

  runtime.emit({ type: "yme-page-status", status: { state: "not-supported" } }, { tab: { id: 5 } });

  assert.equal(document.elements.get("status").textContent, "Not supported here");
  assert.equal(document.elements.get("effect-status").hidden, true);
});

test("keeps hidden Popup status rows out of the rendered layout", () => {
  assert.match(popupCss, /\[hidden\]\s*\{\s*display:\s*none\s*!important;/);
});

test("uses distinct visual treatments for active and unsupported page statuses", () => {
  assert.match(popupCss, /#status-card\[data-state="active"\]\s*\{\s*border-left-color:\s*var\(--success\);/);
  assert.match(popupCss, /#status-card\[data-state="not-supported"\]\s*\{\s*border-left-color:\s*var\(--notice\);/);
});

test("shows only the brand above the Popup status and separates controls with rules", () => {
  assert.doesNotMatch(popupHtml, /id="eyebrow"/);
  assert.doesNotMatch(popupHtml, /id="features-heading"/);
  assert.match(popupCss, /\.feature-controls\s*\{\s*border-bottom: 1px solid var\(--rule\); border-top: 1px solid var\(--rule\);/);
});

test("requires complete, non-empty native message catalogs", () => {
  const englishKeys = Object.keys(englishMessages).sort();

  assert.deepEqual(Object.keys(traditionalChineseMessages).sort(), englishKeys);
  for (const messages of [englishMessages, traditionalChineseMessages]) {
    for (const key of englishKeys) assert.notEqual(messages[key].message.trim(), "", `${key} must not be empty`);
  }
});
