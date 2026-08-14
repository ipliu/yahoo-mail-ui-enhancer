# Manual acceptance guide

Use a dedicated signed-in Yahoo Mail test account. Confirm the page is a verified Eligible Mail View at `https://mail.yahoo.com/n/folders/*` before each check.

## Native i18n smoke test (macOS)

Run this test separately from the signed-in Yahoo Mail checks. The Locale Test Instance uses a shared, unsigned-in temporary Chrome profile; it must be tested sequentially, never in parallel.

1. Run `./scripts/open-locale-test-instance.sh en`. In that test instance, open `chrome://extensions`, enable Developer mode, and use **Load unpacked** to select this repository. This is required only the first time that temporary profile is used.
2. In `chrome://extensions`, confirm the extension name and description are English. Close the expected extra `(en)` tab, then open the Popup on a non-Yahoo page. Confirm its copy, accessible names, and `html[lang]` are English.
3. In the Locale Test Instance, open `chrome://quit` and wait for Chrome to close.
4. Repeat steps 1–3 with `zh-TW`; confirm the extension metadata, Popup copy, accessible names, and `html[lang]` are Traditional Chinese (Taiwan).
5. Repeat steps 1–3 with `ja`; confirm the extension metadata and Popup fall back to English, including `html[lang="en"]`.
6. Confirm the Locale Test Instance remains signed out of Yahoo Mail throughout. Do not delete its temporary profile directory between language runs.

## Setup

1. Load the repository through developer mode as described in the README.
2. Open the extension Popup from the browser toolbar and enable both features.
3. Keep browser developer tools available to observe unexpected errors, but do not inspect or alter message data.

## Sidebar Concealment

- In a mail list, confirm the Mail Sidebar is concealed by default, main content expands, and a responsive Content Gutter remains at narrow and wide viewport widths.
- Use the Popup Sidebar Concealment control with a pointer and keyboard. Confirm the Mail Sidebar and Current Page Status update accordingly.
- Restore the Mail Sidebar and confirm its native controls and contents remain intact.
- Reload the tab and open another supported tab. Confirm the Sidebar Preference persists in both.
- Repeat in a message-reading workspace.

## Popup and Current Page Status

- In a dark Eligible Mail View, open the Popup and confirm Current Page Status is `Active`, Mail Sidebar reports `Concealed` or `Shown`, and Unread Emphasis reports `Active`.
- In a light Eligible Mail View, confirm the Popup reports that Unread Emphasis is unavailable in light mode while the Mail Sidebar status remains accurate.
- Toggle each feature in the Popup. Confirm the effect applies immediately in the current tab and every already open Eligible Mail View.
- While the Popup is open, change folders or the Yahoo Mail theme. Confirm Current Page Status updates without reopening the Popup.
- Open the Popup on a non-Yahoo page and an unsupported Yahoo Mail route. Confirm it displays `Not supported here` with an orange status marker, hides both actual-effect rows, keeps both controls available, and does not change the page.
- In an active Eligible Mail View, confirm the status marker is green and visually distinct from the orange unsupported-page marker.
- Complete the Native i18n smoke test above. Confirm the Local Privacy Policy remains in English for every language.
- Select `Privacy` and confirm the Local Privacy Policy opens from the extension package without a network request.

## Unread Emphasis

- In dark mode, confirm unread message rows have the `#3A4963` background treatment, while their senders and subjects retain Yahoo's native `font-weight: 600`.
- Confirm the native unread dot, preview, date, attachments, and labels are unchanged.
- Confirm read rows are unchanged.
- In light mode, confirm no Unread Emphasis is visible.
- Hover, select, keyboard-focus, and drag an unread row. Confirm Yahoo Mail's own visual feedback takes precedence.

## Dynamic and failure cases

- Change folders, search, scroll through a virtualized list, and allow Yahoo Mail to rerender. Confirm both features remain correct and no extension-owned page controls are inserted.
- Change the Yahoo Mail theme while a list is visible. Confirm Unread Emphasis updates correctly.
- Visit a non-mail workspace and an unsupported route. Confirm the extension makes no visual changes.
- Temporarily verify a missing or altered supported-interface anchor in a controlled test fixture only. Confirm the extension fails closed and restores extension-owned state.

## Release decision

Record the browser version, test-account date, light and dark theme outcomes, narrow viewport result, and every failure before sharing a developer-mode build.

## Chrome Web Store package

1. Run `./release.sh` from the repository root.
2. Confirm `dist/yahoo-mail-ui-enhancer-<version>.zip` contains `manifest.json` at its root.
3. Confirm the ZIP contains no Git metadata, source maps, test files, or secret files.
4. Load the exact ZIP contents as an unpacked extension and repeat the applicable checks above before uploading the ZIP to the Chrome Web Store.
