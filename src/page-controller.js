(function (global) {
  "use strict";

  const REQUIRED_ANCHORS = Object.freeze({
    application: '[data-test-id="mail-app"]',
    toolbar: '[data-test-id="mail-toolbar"]',
    mainContent: '[data-test-id="mail-main"]',
    sidebar: '[data-test-id="mail-sidebar"]',
    workspace: '[data-test-id="mail-workspace"]',
  });
  const MANAGED_VIEW_ATTRIBUTE = "data-yme-mail-view";
  const SIDEBAR_CONCEALED_ATTRIBUTE = "data-yme-sidebar-concealed";
  const CONTENT_GUTTER_ATTRIBUTE = "data-yme-content-gutter";
  const SIDEBAR_PREFERENCE_KEY = "sidebarConcealed";
  const UNREAD_EMPHASIS_ATTRIBUTE = "data-yme-unread-emphasis";

  function getExtensionStorage() {
    return global.browser?.storage ?? global["chr" + "ome"]?.storage;
  }

  function isSupportedMailRoute(location) {
    return location.protocol === "https:" &&
      location.hostname === "mail.yahoo.com" &&
      location.pathname.startsWith("/d/");
  }

  function findVerifiedAnchors(document) {
    if (!isSupportedMailRoute(document.location)) return null;

    const anchors = Object.fromEntries(
      Object.entries(REQUIRED_ANCHORS).map(([name, selector]) => [name, document.querySelector(selector)]),
    );

    if (Object.values(anchors).some((anchor) => anchor === null)) return null;
    if (Object.values(anchors).some((anchor) => !anchors.application.contains(anchor))) return null;

    return anchors;
  }

  class PageController {
    constructor(document, storage = getExtensionStorage()?.local) {
      this.document = document;
      this.storage = storage;
      this.preferenceChanges = storage?.onChanged ?? getExtensionStorage()?.onChanged;
      this.isManagingView = false;
      this.isSidebarConcealed = true;
      this.observer = null;
      this.refreshScheduled = false;
      this.toggle = null;
      this.announcement = null;
    }

    async start() {
      const preference = await this.storage?.get({ [SIDEBAR_PREFERENCE_KEY]: true });
      this.isSidebarConcealed = preference?.[SIDEBAR_PREFERENCE_KEY] ?? true;
      this.observePreferenceChanges();
      const isVerified = this.refresh();
      this.observePageChanges();
      return isVerified;
    }

    refresh() {
      const anchors = findVerifiedAnchors(this.document);
      if (!anchors) {
        this.stop();
        return false;
      }

      if (this.document.documentElement.getAttribute(MANAGED_VIEW_ATTRIBUTE) !== "verified") {
        this.document.documentElement.setAttribute(MANAGED_VIEW_ATTRIBUTE, "verified");
      }
      this.isManagingView = true;
      this.renderSidebarConcealment(anchors);
      this.renderUnreadEmphasis(anchors);
      return true;
    }

    renderSidebarConcealment(anchors) {
      if (this.isSidebarConcealed) {
        if (this.document.documentElement.getAttribute(SIDEBAR_CONCEALED_ATTRIBUTE) !== "true") {
          this.document.documentElement.setAttribute(SIDEBAR_CONCEALED_ATTRIBUTE, "true");
        }
        if (anchors.mainContent.getAttribute(CONTENT_GUTTER_ATTRIBUTE) !== "true") {
          anchors.mainContent.setAttribute(CONTENT_GUTTER_ATTRIBUTE, "true");
        }
      } else {
        this.document.documentElement.removeAttribute(SIDEBAR_CONCEALED_ATTRIBUTE);
        anchors.mainContent.removeAttribute(CONTENT_GUTTER_ATTRIBUTE);
      }
      this.ensureSidebarToggle(anchors.toolbar);
      this.updateSidebarToggle();
    }

    ensureSidebarToggle(toolbar) {
      if (this.toggle && toolbar.contains(this.toggle)) return;

      this.toggle = null;
      this.announcement = null;

      this.toggle = this.document.createElement("button");
      this.toggle.type = "button";
      this.toggle.setAttribute("data-yme-sidebar-toggle", "true");
      this.toggle.addEventListener("click", () => this.toggleSidebar());

      this.announcement = this.document.createElement("span");
      this.announcement.setAttribute("aria-live", "polite");
      this.announcement.setAttribute("data-yme-sidebar-announcement", "true");
      toolbar.append(this.toggle, this.announcement);
    }

    updateSidebarToggle() {
      this.toggle.setAttribute("aria-pressed", String(this.isSidebarConcealed));
      this.toggle.setAttribute(
        "aria-label",
        this.isSidebarConcealed ? "Show Mail Sidebar" : "Hide Mail Sidebar",
      );
    }

    async toggleSidebar() {
      this.isSidebarConcealed = !this.isSidebarConcealed;
      await this.storage?.set({ [SIDEBAR_PREFERENCE_KEY]: this.isSidebarConcealed });
      if (!this.refresh()) return;

      this.announcement.textContent = this.isSidebarConcealed
        ? "Mail Sidebar concealed"
        : "Mail Sidebar restored";
    }

    renderUnreadEmphasis(anchors) {
      const rows = anchors.workspace.querySelectorAll('[data-test-id="mail-row"]');
      const themeMarker = this.document.querySelector('[data-test-id="mail-theme-marker"]');
      const isDarkTheme = themeMarker?.getAttribute("data-theme") === "dark";

      for (const row of rows) {
        const isUnread = row.querySelector('[data-test-id="unread-indicator"]') !== null;
        if (isDarkTheme && isUnread) {
          row.setAttribute(UNREAD_EMPHASIS_ATTRIBUTE, "true");
        } else {
          row.removeAttribute(UNREAD_EMPHASIS_ATTRIBUTE);
        }
      }
    }

    observePreferenceChanges() {
      this.preferenceChanges?.addListener((changes, areaName) => {
        const preferenceChange = changes[SIDEBAR_PREFERENCE_KEY];
        if (areaName !== "local" || !preferenceChange) return;

        this.isSidebarConcealed = preferenceChange.newValue;
        this.refresh();
      });
    }

    observePageChanges() {
      if (this.observer || typeof global.MutationObserver !== "function") return;

      this.observer = new global.MutationObserver(() => {
        if (this.refreshScheduled) return;
        this.refreshScheduled = true;
        global.setTimeout(() => {
          this.refreshScheduled = false;
          this.refresh();
        }, 0);
      });
      this.observer.observe(this.document.documentElement, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    }

    stop() {
      if (!this.isManagingView) return;

      this.document.documentElement.removeAttribute(MANAGED_VIEW_ATTRIBUTE);
      this.document.documentElement.removeAttribute(SIDEBAR_CONCEALED_ATTRIBUTE);
      this.document.querySelector(REQUIRED_ANCHORS.mainContent)
        ?.removeAttribute(CONTENT_GUTTER_ATTRIBUTE);
      this.removeUnreadEmphasis();
      this.removeSidebarToggle();
      this.isManagingView = false;
    }

    removeSidebarToggle() {
      this.toggle?.remove();
      this.announcement?.remove();
      this.toggle = null;
      this.announcement = null;
    }

    removeUnreadEmphasis() {
      this.document.querySelector(REQUIRED_ANCHORS.workspace)
        ?.querySelectorAll('[data-test-id="mail-row"]')
        .forEach((row) => row.removeAttribute(UNREAD_EMPHASIS_ATTRIBUTE));
    }
  }

  global.YahooMailUiEnhancer = Object.freeze({ PageController });

  if (global.document) {
    new PageController(global.document).start();
  }
})(globalThis);
