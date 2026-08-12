(function (global) {
  "use strict";

  const REQUIRED_ANCHORS = Object.freeze({
    application: '[data-test-id="mail-app"]',
    toolbar: '[data-test-id="novation-ybar-header"]',
    mainContent: '[data-test-id="novation-main-content"]',
    sidebar: '[data-test-id="novation-right-rail"]',
    workspace: '[data-test-id="virtual-list"]',
  });
  const MANAGED_VIEW_ATTRIBUTE = "data-yme-mail-view";
  const SIDEBAR_CONCEALED_ATTRIBUTE = "data-yme-sidebar-concealed";
  const CONTENT_GUTTER_ATTRIBUTE = "data-yme-content-gutter";
  const UNREAD_EMPHASIS_ATTRIBUTE = "data-yme-unread-emphasis";
  const Preferences = global.YahooMailUiEnhancer?.Preferences;

  function isSupportedMailRoute(location) {
    return location.protocol === "https:" &&
      location.hostname === "mail.yahoo.com" &&
      location.pathname.startsWith("/n/folders/");
  }

  function findVerifiedAnchors(document) {
    if (!isSupportedMailRoute(document.location)) return null;

    const anchors = Object.fromEntries(
      Object.entries(REQUIRED_ANCHORS).map(([name, selector]) => [name, document.querySelector(selector)]),
    );

    if (Object.values(anchors).some((anchor) => anchor === null)) return null;
    if (![anchors.mainContent, anchors.sidebar, anchors.workspace]
      .every((anchor) => anchors.application.contains(anchor))) return null;
    return anchors;
  }

  class PageController {
    constructor(document, storage = Preferences.getStorage()) {
      this.document = document;
      this.storage = storage;
      this.preferenceChanges = storage?.onChanged ?? Preferences.getChangeEvents();
      this.isManagingView = false;
      this.isSidebarConcealed = true;
      this.isUnreadEmphasisEnabled = true;
      this.observer = null;
      this.refreshScheduled = false;
      this.toggle = null;
      this.announcement = null;
    }

    async start() {
      const preference = await this.storage?.get(Preferences.defaults);
      this.isSidebarConcealed = preference?.sidebarConcealed ?? true;
      this.isUnreadEmphasisEnabled = preference?.unreadEmphasis ?? true;
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
      await this.storage?.set({ sidebarConcealed: this.isSidebarConcealed });
      if (!this.refresh()) return;

      this.announcement.textContent = this.isSidebarConcealed
        ? "Mail Sidebar concealed"
        : "Mail Sidebar restored";
    }

    renderUnreadEmphasis(anchors) {
      const rows = anchors.workspace.querySelectorAll('a[role="row"]');
      const isDarkTheme = this.document.body?.getAttribute("data-color-scheme") === "dark";

      for (const row of rows) {
        const isUnread = row.querySelector('[data-test-id="unread-indicator"]') !== null;
        if (this.isUnreadEmphasisEnabled && isDarkTheme && isUnread) {
          row.setAttribute(UNREAD_EMPHASIS_ATTRIBUTE, "true");
          this.renderUnreadTextEmphasis(row, true);
        } else {
          row.removeAttribute(UNREAD_EMPHASIS_ATTRIBUTE);
          this.renderUnreadTextEmphasis(row, false);
        }
      }
    }

    renderUnreadTextEmphasis(row, isEnabled) {
      const textElements = this.findVerifiedUnreadTextElements(row);

      for (const element of textElements) {
        element.toggleAttribute("data-yme-unread-text", isEnabled);
      }
    }

    findVerifiedUnreadTextElements(row) {
      const messageDetails = row.children?.[1];
      const sender = messageDetails?.children?.[0];
      const subject = messageDetails?.children?.[1];

      if (!row.querySelector('[data-test-id="unread-indicator"]') ||
        row.children?.length !== 3 ||
        messageDetails?.children?.length !== 3 ||
        !sender ||
        !subject) return [];

      return [sender, subject];
    }

    observePreferenceChanges() {
      this.preferenceChanges?.addListener((changes, areaName) => {
        if (areaName !== "local") return;
        const sidebarChange = changes.sidebarConcealed;
        const unreadChange = changes.unreadEmphasis;
        if (!sidebarChange && !unreadChange) return;

        if (sidebarChange) this.isSidebarConcealed = sidebarChange.newValue;
        if (unreadChange) this.isUnreadEmphasisEnabled = unreadChange.newValue;
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
        ?.querySelectorAll('a[role="row"]')
        .forEach((row) => {
          row.removeAttribute(UNREAD_EMPHASIS_ATTRIBUTE);
          this.renderUnreadTextEmphasis(row, false);
        });
    }
  }

  global.YahooMailUiEnhancer = Object.freeze({
    ...global.YahooMailUiEnhancer,
    PageController,
  });

  if (global.document) {
    new PageController(global.document).start();
  }
})(globalThis);
