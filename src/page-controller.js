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

  function isSupportedMailRoute(location) {
    return location.protocol === "https:" &&
      location.hostname === "mail.yahoo.com" &&
      location.pathname.startsWith("/d/");
  }

  function findVerifiedAnchors(document) {
    if (!isSupportedMailRoute(document.location)) return null;

    const anchors = Object.fromEntries(
      Object.entries(REQUIRED_ANCHORS).map(([name, selector]) => [
        name,
        document.querySelector(selector),
      ]),
    );

    if (Object.values(anchors).some((anchor) => anchor === null)) return null;
    if (!anchors.application.contains(anchors.toolbar)) return null;
    if (!anchors.application.contains(anchors.mainContent)) return null;
    if (!anchors.application.contains(anchors.sidebar)) return null;
    if (!anchors.application.contains(anchors.workspace)) return null;

    return anchors;
  }

  class PageController {
    constructor(document) {
      this.document = document;
      this.isManagingView = false;
      this.observer = null;
      this.refreshScheduled = false;
    }

    start() {
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
      return true;
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
      this.isManagingView = false;
    }
  }

  global.YahooMailUiEnhancer = Object.freeze({ PageController });

  if (global.document) {
    new PageController(global.document).start();
  }
})(globalThis);
