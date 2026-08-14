(function (global) {
  "use strict";

  const Preferences = Object.freeze({
    defaults: Object.freeze({
      sidebarConcealed: true,
      unreadEmphasis: true,
    }),
    getStorage() {
      return global.browser?.storage?.local ?? global.chrome?.storage?.local;
    },
    getChangeEvents() {
      return global.browser?.storage?.onChanged ?? global.chrome?.storage?.onChanged;
    },
    getRuntime() {
      return global.browser?.runtime ?? global.chrome?.runtime;
    },
    getTabs() {
      return global.browser?.tabs ?? global.chrome?.tabs;
    },
  });

  global.YahooMailUiEnhancer = Object.freeze({
    ...global.YahooMailUiEnhancer,
    Preferences,
  });
})(globalThis);
