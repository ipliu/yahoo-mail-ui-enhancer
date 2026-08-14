# Use Chrome native internationalization

The extension uses Chrome native internationalization for Popup copy and manifest metadata. It provides `_locales/en/messages.json` as the default catalog and `_locales/zh_TW/messages.json` for Traditional Chinese (Taiwan). Chrome resolves the browser UI language and falls back to English when no supported catalog applies.

The Popup reads messages through `chrome.i18n.getMessage()` and derives its document language from the resolved catalog. Tests require both catalogs to contain the same non-empty message keys. This avoids duplicated frontend copy tables and prevents a missing required key from silently rendering empty text.

The extension brand remains `Yahoo Mail UI Enhancer` in both catalogs. The localized feature names use `郵件側欄` and `強調未讀信`, aligned with the Chrome Web Store Popup artwork. The Local Privacy Policy remains an English-only page.
