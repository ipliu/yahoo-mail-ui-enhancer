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

Open the extension's toolbar icon to use the Popup. It shows whether the current page is an Eligible Mail View and reports the actual Mail Sidebar and Unread Emphasis effects. Both feature controls remain available on unsupported pages and apply as soon as a supported Yahoo Mail tab is open. The Popup follows the browser theme and is available in English and Traditional Chinese (Taiwan).

## Known limitations

- Compatibility is limited to the verified Yahoo Mail Supported Mail Interface. Yahoo Mail changes can cause the extension to fail closed until its structural anchors are revalidated.
- The first release is tested only in the target Chromium browser family.
- Store submission, Firefox, Safari, other browser families, and Yahoo Mail domains outside `mail.yahoo.com` are out of scope.

## Manual verification

Follow [the manual acceptance guide](docs/manual-acceptance.md) before a developer-mode release.
