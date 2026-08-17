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

function loadPopup(setTimeout) {
  const context = { globalThis: {} };
  if (setTimeout) context.globalThis.setTimeout = setTimeout;
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
  const ids = ["title", "title-heading", "subtitle", "status-heading", "status-card", "status", "status-detail", "effect-status", "sidebar-effect-card", "unread-effect-card", "sidebar-status-label", "unread-status-label", "sidebar-status", "unread-status", "sidebar-concealment", "unread-emphasis", "sidebar-label", "unread-label", "privacy", "privacy-boundary-copy", "unofficial", "privacy-link"];
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

  assert.equal(document.elements.get("status").textContent, "Enabled");
  assert.equal(document.elements.get("sidebar-status").textContent, "Not hidden");
  assert.equal(document.elements.get("unread-status").textContent, "Not supported in light mode");
  assert.equal(document.elements.get("status-card").dataset.state, "active");
  assert.equal(document.elements.get("effect-status").hidden, false);
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

  assert.equal(document.elements.get("status").textContent, "未啟用");
  assert.equal(document.elements.get("sidebar-label").textContent, "隱藏郵件側欄");
  assert.equal(document.elements.get("unread-label").textContent, "強調未讀信");
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

  assert.equal(document.elements.get("status").textContent, "Not enabled");
  assert.equal(document.elements.get("effect-status").hidden, true);
});

test("keeps actual-effect cards hidden while the page status is checking, then reveals them when Yahoo Mail responds", async () => {
  const { setupPopup } = loadPopup();
  const document = createPopupDocument();
  let respond;
  let reportRequested;
  const statusRequested = new Promise((resolve) => { reportRequested = resolve; });
  const tabs = {
    async query() { return [{ id: 12 }]; },
    sendMessage() {
      reportRequested();
      return new Promise((resolve) => { respond = resolve; });
    },
  };

  const setup = setupPopup(document, createStorage(), createRuntime(), tabs, createI18n(englishMessages));
  await statusRequested;

  assert.equal(document.elements.get("status").textContent, "Checking");
  assert.equal(document.elements.get("effect-status").hidden, true);
  respond({ state: "active", sidebar: "concealed", unread: "active" });
  await setup;

  assert.equal(document.elements.get("status").textContent, "Enabled");
  assert.equal(document.elements.get("effect-status").hidden, false);
});

test("recovers from the delayed-page fallback when Yahoo Mail later reports a verified status", async () => {
  let completeRetry;
  const retried = new Promise((resolve) => { completeRetry = resolve; });
  const { setupPopup } = loadPopup((callback) => Promise.resolve(callback()).then(completeRetry));
  const document = createPopupDocument();
  const runtime = createRuntime();
  const tabs = {
    async query() { return [{ id: 13, url: "https://mail.yahoo.com/n/folders/1" }]; },
    async sendMessage() { throw new Error("Yahoo Mail is still loading"); },
  };

  await setupPopup(document, createStorage(), runtime, tabs, createI18n(englishMessages));
  await retried;

  assert.equal(document.elements.get("status").textContent, "Not enabled");
  assert.equal(document.elements.get("effect-status").hidden, true);
  runtime.emit(
    { type: "yme-page-status", status: { state: "active", sidebar: "concealed", unread: "active" } },
    { tab: { id: 13 } },
  );

  assert.equal(document.elements.get("status").textContent, "Enabled");
  assert.equal(document.elements.get("effect-status").hidden, false);
});

test("keeps hidden Popup status rows out of the rendered layout", () => {
  assert.match(popupCss, /\[hidden\]\s*\{\s*display:\s*none\s*!important;/);
});

test("uses distinct visual treatments for active and unsupported page statuses", () => {
  assert.match(popupCss, /#status-card\[data-state="active"\]\s+\.status-value::before\s*\{\s*background:\s*var\(--success\);/);
  assert.match(popupCss, /#status-card\[data-state="not-supported"\]\s+\.status-value::before\s*\{\s*background:\s*var\(--notice\);/);
});

test("moves the switch thumb to the enabled position", () => {
  assert.match(popupCss, /\.feature-control input:checked::after\s*\{\s*transform:\s*translateX\(1\.05rem\);/);
});

test("keeps light-mode text, loading status, and focus treatment neutral", () => {
  assert.match(popupCss, /\.status-value::before\s*\{\s*background:\s*var\(--muted\);/);
  assert.match(popupCss, /\.feature-control input:focus-visible, a:focus-visible\s*\{\s*outline:\s*2px solid var\(--ink\);/);
  assert.match(popupCss, /a\s*\{\s*color:\s*var\(--ink\);/);
});

test("orders the branded Popup header, status, separate actual-effect cards, controls, and disclosure", () => {
  assert.match(popupHtml, /id="subtitle"/);
  assert.match(popupHtml, /id="sidebar-effect-card"/);
  assert.match(popupHtml, /id="unread-effect-card"/);
  assert.ok(popupHtml.indexOf('class="masthead"') < popupHtml.indexOf('id="status-card"'));
  assert.ok(popupHtml.indexOf('id="status-card"') < popupHtml.indexOf('id="effect-status"'));
  assert.ok(popupHtml.indexOf('id="effect-status"') < popupHtml.indexOf('class="feature-controls"'));
  assert.ok(popupHtml.indexOf('class="feature-controls"') < popupHtml.indexOf('class="disclosure"'));
  assert.doesNotMatch(popupHtml, /id="features-heading"/);
  assert.match(popupCss, /\.feature-controls\s*\{\s*border-bottom: 1px solid var\(--rule\); border-top: 1px solid var\(--rule\);/);
});

test("uses the agreed English and Traditional Chinese Popup copy", () => {
  assert.equal(englishMessages.subtitle.message, "Hide the sidebar. Highlight unread mail.");
  assert.equal(englishMessages.active.message, "Enabled");
  assert.equal(englishMessages.unsupported.message, "Not enabled");
  assert.equal(englishMessages.concealed.message, "Hidden");
  assert.equal(englishMessages.shown.message, "Not hidden");
  assert.equal(englishMessages.lightMode.message, "Not supported in light mode");
  assert.equal(traditionalChineseMessages.subtitle.message, "隱藏側欄，強調未讀信");
  assert.equal(traditionalChineseMessages.active.message, "已啟用");
  assert.equal(traditionalChineseMessages.unsupported.message, "未啟用");
  assert.equal(traditionalChineseMessages.concealed.message, "已隱藏");
  assert.equal(traditionalChineseMessages.shown.message, "未隱藏");
  assert.equal(traditionalChineseMessages.lightMode.message, "不支援淺色模式");
  assert.equal(traditionalChineseMessages.privacyLink.message, "隱私權政策");
});

test("requires complete, non-empty native message catalogs", () => {
  const englishKeys = Object.keys(englishMessages).sort();

  assert.deepEqual(Object.keys(traditionalChineseMessages).sort(), englishKeys);
  for (const messages of [englishMessages, traditionalChineseMessages]) {
    for (const key of englishKeys) assert.notEqual(messages[key].message.trim(), "", `${key} must not be empty`);
  }
});
