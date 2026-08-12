import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const settingsSource = await readFile(new URL("../src/settings.js", import.meta.url), "utf8");
const preferencesSource = await readFile(new URL("../src/preferences.js", import.meta.url), "utf8");

function loadSettings() {
  const context = { globalThis: {} };
  vm.runInNewContext(preferencesSource, context);
  vm.runInNewContext(settingsSource, context);
  return context.globalThis.YahooMailUiEnhancer.Settings;
}

function createElement() {
  const listeners = new Map();
  return {
    checked: false,
    textContent: "",
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    async dispatch(type) {
      return listeners.get(type)?.({ target: this });
    },
  };
}

function createSettingsDocument() {
  const elements = new Map([
    ["sidebar-concealment", createElement()],
    ["unread-emphasis", createElement()],
    ["title", createElement()],
    ["sidebar-label", createElement()],
    ["unread-label", createElement()],
    ["privacy", createElement()],
    ["unofficial", createElement()],
    ["privacy-link", createElement()],
  ]);
  return {
    getElementById(id) {
      return elements.get(id);
    },
    elements,
  };
}

function createStorage(values = {}) {
  return {
    values,
    async get(defaults) {
      return { ...defaults, ...this.values };
    },
    async set(nextValues) {
      Object.assign(this.values, nextValues);
    },
  };
}

test("renders settings in Traditional Chinese for zh-TW", async () => {
  const { setupSettings } = loadSettings();
  const document = createSettingsDocument();

  await setupSettings(document, createStorage(), "zh-TW");

  assert.equal(document.elements.get("title").textContent, "Yahoo Mail 介面增強設定");
  assert.equal(document.elements.get("sidebar-label").textContent, "隱藏郵件側欄");
  assert.equal(document.elements.get("privacy-link").textContent, "隱私權");
});

test("uses English for every Display Language other than zh-TW", async () => {
  const { setupSettings } = loadSettings();
  const document = createSettingsDocument();

  await setupSettings(document, createStorage(), "ja-JP");

  assert.equal(document.elements.get("title").textContent, "Yahoo Mail UI Enhancer Settings");
  assert.equal(document.elements.get("sidebar-label").textContent, "Conceal Mail Sidebar");
  assert.equal(document.elements.get("privacy-link").textContent, "Privacy");
});

test("restores and independently persists feature preferences", async () => {
  const { setupSettings } = loadSettings();
  const document = createSettingsDocument();
  const storage = createStorage({ sidebarConcealed: false, unreadEmphasis: true });

  await setupSettings(document, storage, "en-US");
  assert.equal(document.elements.get("sidebar-concealment").checked, false);
  assert.equal(document.elements.get("unread-emphasis").checked, true);

  document.elements.get("sidebar-concealment").checked = true;
  await document.elements.get("sidebar-concealment").dispatch("change");
  assert.deepEqual(storage.values, { sidebarConcealed: true, unreadEmphasis: true });

  document.elements.get("unread-emphasis").checked = false;
  await document.elements.get("unread-emphasis").dispatch("change");
  assert.deepEqual(storage.values, { sidebarConcealed: true, unreadEmphasis: false });
});
