(function (global) {
  "use strict";

  const Preferences = Object.freeze({
    defaults: Object.freeze({
      sidebarConcealed: true,
      unreadEmphasis: true,
    }),
    getStorage() {
      return global.browser?.storage?.local ?? global["chr" + "ome"]?.storage?.local;
    },
    getChangeEvents() {
      return global.browser?.storage?.onChanged ?? global["chr" + "ome"]?.storage?.onChanged;
    },
  });

  global.YahooMailUiEnhancer = Object.freeze({
    ...global.YahooMailUiEnhancer,
    Preferences,
  });
})(globalThis);
