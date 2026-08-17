(function (global) {
  "use strict";

  const Preferences = global.YahooMailUiEnhancer?.Preferences;
  function setText(document, id, value) { document.getElementById(id).textContent = value; }

  function renderStatus(document, status, message) {
    const effects = document.getElementById("effect-status");
    const statusCard = document.getElementById("status-card");
    if (status?.state === "active" || status?.state === "light-mode") {
      statusCard.dataset.state = "active";
      setText(document, "status", message("active"));
      setText(document, "status-detail", "");
      effects.hidden = false;
      setText(document, "sidebar-status", status.sidebar === "concealed" ? message("concealed") : message("shown"));
      setText(document, "unread-status", status.unread === "active" ? message("unreadActive") : status.unread === "light-mode" ? message("lightMode") : message("disabled"));
      return;
    }
    statusCard.dataset.state = status?.state === "checking" ? "checking" : "not-supported";
    effects.hidden = true;
    setText(document, "status", status?.state === "checking" ? message("checking") : message("unsupported"));
    setText(document, "status-detail", status?.state === "checking" ? "" : message("unsupportedDetail"));
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

  function getI18n() {
    return global.browser?.i18n ?? global.chrome?.i18n;
  }

  async function setupPopup(document, storage = Preferences.getStorage(), runtime = Preferences.getRuntime(), tabs = Preferences.getTabs(), i18n = getI18n()) {
    const message = (key) => {
      const value = i18n?.getMessage?.(key);
      if (!value) throw new Error(`Missing required i18n message: ${key}`);
      return value;
    };
    document.documentElement.lang = message("language");
    for (const [id, key] of Object.entries({ title: "extensionName", "title-heading": "extensionName", subtitle: "subtitle", "status-heading": "currentPage", "sidebar-label": "sidebar", "unread-label": "unread", "sidebar-status-label": "sidebarStatus", "unread-status-label": "unreadStatus", privacy: "privacy", "privacy-boundary-copy": "privacyBoundary", unofficial: "unofficial", "privacy-link": "privacyLink" })) setText(document, id, message(key));
    const preferences = await storage?.get(Preferences.defaults) ?? Preferences.defaults;
    const sidebarControl = document.getElementById("sidebar-concealment");
    const unreadControl = document.getElementById("unread-emphasis");
    sidebarControl.checked = preferences.sidebarConcealed;
    unreadControl.checked = preferences.unreadEmphasis;

    sidebarControl.addEventListener("change", () => storage?.set({ sidebarConcealed: sidebarControl.checked }));
    unreadControl.addEventListener("change", () => storage?.set({ unreadEmphasis: unreadControl.checked }));

    let activeTab = null;

    renderStatus(document, { state: "checking" }, message);
    try {
      activeTab = await getActiveTab(tabs);
      const status = await requestStatus(tabs, activeTab);
      renderStatus(document, status, message);
    } catch {
      if (isSupportedMailTab(activeTab)) {
        global.setTimeout(async () => {
          try {
            renderStatus(document, await requestStatus(tabs, activeTab), message);
          } catch {
            renderStatus(document, { state: "not-supported" }, message);
          }
        }, 250);
      } else {
        renderStatus(document, { state: "not-supported" }, message);
      }
    }
    runtime?.onMessage?.addListener?.((incomingMessage, sender) => {
      if (incomingMessage?.type === "yme-page-status" && sender?.tab?.id === activeTab?.id) renderStatus(document, incomingMessage.status, message);
    });
  }

  global.YahooMailUiEnhancer = Object.freeze({ ...global.YahooMailUiEnhancer, Popup: { setupPopup } });
  if (global.document) setupPopup(global.document);
})(globalThis);
