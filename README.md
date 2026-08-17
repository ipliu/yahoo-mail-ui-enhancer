# Yahoo Mail UI Enhancer

An independent, unofficial browser extension that provides focused visual improvements for the verified Yahoo Mail Supported Mail Interface. It is not affiliated with, endorsed by, or sponsored by Yahoo.

## Supported scope

- Target browser: Chromium-based browsers using developer mode.
- Installation host: `https://mail.yahoo.com/*`.
- Verified Eligible Mail Views: `https://mail.yahoo.com/n/folders/*` when the required Yahoo Mail structure is present. Any other route, non-mail workspace, or unverified layout is left unchanged.
- Features: Sidebar Concealment with a Content Gutter, dark-mode Unread Emphasis, and a Popup with Current Page Status and quick controls.

## Install in developer mode

1. Clone or download this repository.
2. In the target browser, open the extensions management page.
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select this repository folder, containing `manifest.json`.
6. Sign in to a dedicated Yahoo Mail test account and open an Eligible Mail View.

## Privacy and offline operation

The extension stores Sidebar Preference and feature preferences only on the current device. It makes no remote network requests and includes no telemetry, analytics, error reporting, remote configuration, or third-party runtime code. See the [Privacy Policy](privacy.html).

## Popup

Open the extension's toolbar icon to use the Popup, the only control surface for Sidebar Preference and Unread Emphasis. It presents the Current Page Status before separate, scannable Actual-Effect Cards for the Mail Sidebar and Unread Emphasis; this keeps current page effects distinct from device-local controls. Both feature controls remain available on unsupported pages and apply as soon as a supported Yahoo Mail tab is open. Chrome native internationalization provides the Popup and extension metadata in English and Traditional Chinese (Taiwan), with English fallback for other browser languages. The Local Privacy Policy remains in English.

## Known limitations

- Compatibility is limited to the verified Yahoo Mail Supported Mail Interface. Yahoo Mail changes can cause the extension to fail closed until its structural anchors are revalidated.
- The first release is tested only in the target Chromium browser family.
- Store submission, Firefox, Safari, other browser families, and Yahoo Mail domains outside `mail.yahoo.com` are out of scope.

## Manual verification

Follow [the manual acceptance guide](docs/manual-acceptance.md) before a developer-mode release.

## Localization smoke test (macOS)

Run `./scripts/open-locale-test-instance.sh en`, `zh-TW`, or `ja` to open a signed-out Locale Test Instance. On its first launch, load this repository manually from `chrome://extensions` with Developer mode enabled. Run one language at a time: open `chrome://quit` in the prior instance before switching. The Chrome process applies `-AppleLanguages`, so an extra tab named after the locale is expected and can be closed. The script is development-only and is excluded from release packages.

## Create a Chrome Web Store package

Run `./release.sh` from the repository root. It creates `dist/yahoo-mail-ui-enhancer-<version>.zip`, with `manifest.json` at the ZIP root. The package excludes Git metadata, documentation, source maps, test files, development tooling, local build output, and common secret-file formats. Review the generated ZIP before uploading it to the Chrome Web Store.
