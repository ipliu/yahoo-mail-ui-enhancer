(function (global) {
  "use strict";

  const Preferences = global.YahooMailUiEnhancer?.Preferences;
  const COPY = Object.freeze({
    en: {
      title: "Yahoo Mail UI Enhancer", currentPage: "Current page", checking: "Checking", active: "Active", lightModeStatus: "Light mode", unsupported: "Not supported here",
      unsupportedDetail: "Open a supported Yahoo Mail folder to apply these changes.", sidebar: "Conceal Mail Sidebar", unread: "Emphasize unread mail in dark mode",
      sidebarStatus: "Sidebar", unreadStatus: "Unread emphasis", concealed: "Concealed", shown: "Shown", unreadActive: "Active", lightMode: "Unavailable in light mode", disabled: "Disabled",
      privacy: "Your preferences and page changes stay on this device. This extension makes no network requests.", unofficial: "This independent, unofficial extension is not affiliated with Yahoo.", privacyLink: "Privacy",
    },
    "zh-TW": {
      title: "Yahoo Mail 介面增強", currentPage: "目前頁面", checking: "檢查中", active: "已啟用", lightModeStatus: "淺色模式", unsupported: "此頁面不受支援",
      unsupportedDetail: "請開啟受支援的 Yahoo Mail 資料夾以套用這些變更。", sidebar: "隱藏郵件側欄", unread: "在深色模式強調未讀郵件",
      sidebarStatus: "郵件側欄", unreadStatus: "未讀強調", concealed: "已隱藏", shown: "已顯示", unreadActive: "已啟用", lightMode: "淺色模式無法使用", disabled: "已停用",
      privacy: "你的偏好設定與頁面變更僅保留在此裝置。此擴充功能不會發出網路請求。", unofficial: "此獨立、非官方擴充功能與 Yahoo 無關。", privacyLink: "隱私權",
    },
  });

  function setText(document, id, value) { document.getElementById(id).textContent = value; }

  function renderStatus(document, status, copy) {
    const effects = document.getElementById("effect-status");
    if (status?.state === "active" || status?.state === "light-mode") {
      setText(document, "status", status.state === "light-mode" ? copy.lightModeStatus : copy.active);
      setText(document, "status-detail", "");
      effects.hidden = false;
      setText(document, "sidebar-status", status.sidebar === "concealed" ? copy.concealed : copy.shown);
      setText(document, "unread-status", status.unread === "active" ? copy.unreadActive : status.unread === "light-mode" ? copy.lightMode : copy.disabled);
      return;
    }
    effects.hidden = true;
    setText(document, "status", status?.state === "checking" ? copy.checking : copy.unsupported);
    setText(document, "status-detail", status?.state === "checking" ? "" : copy.unsupportedDetail);
  }

  async function getActiveTab(tabs) {
    const result = await tabs?.query?.({ active: true, currentWindow: true });
    return result?.[0] ?? null;
  }

  function isSupportedMailTab(tab) {
    return typeof tab?.url === "string" && /^https:\/\/mail\.yahoo\.com\/n\/folders\//.test(tab.url);
  }

  async function requestStatus(tabs, activeTab) {
    const status = await tabs?.sendMessage?.(activeTab?.id, { type: "yme-get-page-status" });
    if (status) return status;
    throw new Error("No Current Page Status response");
  }

  async function setupPopup(document, storage = Preferences.getStorage(), runtime = Preferences.getRuntime(), tabs = Preferences.getTabs(), displayLanguage = global.navigator?.language) {
    const copy = COPY[Preferences.resolveDisplayLanguage(displayLanguage)];
    for (const [id, value] of Object.entries({ title: copy.title, "title-heading": copy.title, "status-heading": copy.currentPage, "sidebar-label": copy.sidebar, "unread-label": copy.unread, "sidebar-status-label": copy.sidebarStatus, "unread-status-label": copy.unreadStatus, privacy: copy.privacy, unofficial: copy.unofficial, "privacy-link": copy.privacyLink })) setText(document, id, value);
    const preferences = await storage?.get(Preferences.defaults) ?? Preferences.defaults;
    const sidebarControl = document.getElementById("sidebar-concealment");
    const unreadControl = document.getElementById("unread-emphasis");
    sidebarControl.checked = preferences.sidebarConcealed;
    unreadControl.checked = preferences.unreadEmphasis;
    sidebarControl.addEventListener("change", () => storage?.set({ sidebarConcealed: sidebarControl.checked }));
    unreadControl.addEventListener("change", () => storage?.set({ unreadEmphasis: unreadControl.checked }));

    let activeTab = null;
    renderStatus(document, { state: "checking" }, copy);
    try {
      activeTab = await getActiveTab(tabs);
      const status = await requestStatus(tabs, activeTab);
      renderStatus(document, status, copy);
    } catch {
      if (isSupportedMailTab(activeTab)) {
        global.setTimeout(async () => {
          try {
            renderStatus(document, await requestStatus(tabs, activeTab), copy);
          } catch {
            renderStatus(document, { state: "not-supported" }, copy);
          }
        }, 250);
      } else {
        renderStatus(document, { state: "not-supported" }, copy);
      }
    }
    runtime?.onMessage?.addListener?.((message, sender) => {
      if (message?.type === "yme-page-status" && sender?.tab?.id === activeTab?.id) renderStatus(document, message.status, copy);
    });
  }

  global.YahooMailUiEnhancer = Object.freeze({ ...global.YahooMailUiEnhancer, Popup: { setupPopup } });
  if (global.document) setupPopup(global.document);
})(globalThis);
