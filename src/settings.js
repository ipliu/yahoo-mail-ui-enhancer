(function (global) {
  "use strict";

  const Preferences = global.YahooMailUiEnhancer?.Preferences;

  const COPY = Object.freeze({
    en: {
      title: "Yahoo Mail UI Enhancer Settings",
      sidebar: "Conceal Mail Sidebar",
      unread: "Emphasize unread mail in dark mode",
      privacy: "Your preferences and page changes stay on this device. This extension makes no network requests.",
      unofficial: "This independent, unofficial extension is not affiliated with Yahoo.",
      privacyLink: "Privacy",
    },
    "zh-TW": {
      title: "Yahoo Mail 介面增強設定",
      sidebar: "隱藏郵件側欄",
      unread: "在深色模式強調未讀郵件",
      privacy: "你的偏好設定與頁面變更僅保留在此裝置。此擴充功能不會發出網路請求。",
      unofficial: "此獨立、非官方擴充功能與 Yahoo 無關。",
      privacyLink: "隱私權",
    },
  });

  function getCopy(displayLanguage) {
    return COPY[displayLanguage === "zh-TW" ? "zh-TW" : "en"];
  }

  function setText(document, id, value) {
    document.getElementById(id).textContent = value;
  }

  async function setupSettings(document, storage = Preferences.getStorage(), displayLanguage = global.navigator?.language) {
    const copy = getCopy(displayLanguage);
    setText(document, "title", copy.title);
    const titleHeading = document.getElementById("title-heading");
    if (titleHeading) titleHeading.textContent = copy.title;
    setText(document, "sidebar-label", copy.sidebar);
    setText(document, "unread-label", copy.unread);
    setText(document, "privacy", copy.privacy);
    setText(document, "unofficial", copy.unofficial);
    setText(document, "privacy-link", copy.privacyLink);

    const preferences = await storage?.get(Preferences.defaults) ?? Preferences.defaults;
    const sidebarControl = document.getElementById("sidebar-concealment");
    const unreadControl = document.getElementById("unread-emphasis");
    sidebarControl.checked = preferences.sidebarConcealed;
    unreadControl.checked = preferences.unreadEmphasis;
    sidebarControl.addEventListener("change", () => storage?.set({ sidebarConcealed: sidebarControl.checked }));
    unreadControl.addEventListener("change", () => storage?.set({ unreadEmphasis: unreadControl.checked }));
  }

  global.YahooMailUiEnhancer = Object.freeze({
    ...global.YahooMailUiEnhancer,
    Settings: { setupSettings },
  });

  if (global.document) setupSettings(global.document);
})(globalThis);
