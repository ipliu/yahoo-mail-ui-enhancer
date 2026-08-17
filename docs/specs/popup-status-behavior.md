# Popup status behavior

## Purpose

The Popup separates the Current Page Status from the device-local preferences that will apply when an Eligible Mail View is available. This prevents a stored choice from being mistaken for an effect that is currently active.

## Current Page Status

| Active-page condition | Status heading | Actual-effect rows | Guidance |
| --- | --- | --- | --- |
| Verified dark Eligible Mail View | Enabled | Show separate Mail Sidebar and Unread Emphasis Actual-Effect Cards | None |
| Verified light Eligible Mail View | Enabled | Show Mail Sidebar and `Not supported in light mode` Actual-Effect Cards | None |
| Any other page, route, workspace, or unverified interface | Not enabled | Hide both Actual-Effect Cards | Direct the user to a supported Yahoo Mail folder |
| Status request in progress | Checking | Hide both actual-effect rows | None |

The Mail Sidebar Actual-Effect Card reports `Hidden` or `Not hidden` on the active page. The Unread Emphasis Actual-Effect Card reports `Enabled`, `Not enabled`, or `Not supported in light mode`; it does not report a stored preference as an active effect.

If Yahoo Mail has not completed loading, the Popup first shows `Checking`. After the single 250-millisecond status retry fails, it displays `Not enabled` and hides both cards. A later page-status message replaces that fallback with the verified result without requiring the Popup to reopen.

## Layout

The Popup presents the branded masthead, Current Page Status, two Actual-Effect Cards, feature controls, then offline disclosure. The masthead pairs the brand with the concise feature description `Hide the sidebar. Highlight unread mail.` The icon sits on a circular ice-tinted background in light mode and a blue-gray background in dark mode. The feature controls have no visible section heading; horizontal rules separate them from the status and disclosure content.

Light mode uses the Chrome Web Store reference's restrained white, black, and gray hierarchy. Midnight blue is reserved for the enabled switch and ice-blue brand treatment; dark mode derives a compatible midnight-blue surface palette. The disclosure states that preferences stay on the device and mail data is not sent, analyzed, or tracked. Its Local Privacy Policy link is aligned with the latter statement.

## Unsupported-page decision

On an unsupported page, the Popup hides the Mail Sidebar and Unread Emphasis result rows. The two feature switches remain visible and operable because they control device-local preferences, not the effects on the current page. A changed preference applies as soon as a supported Yahoo Mail tab is available.

The extension fails closed on an unsupported page: it must not apply Sidebar Concealment, Unread Emphasis, or other extension-owned page changes. This rule preserves Yahoo Mail pages outside a verified Eligible Mail View.

## Acceptance criteria

- An unsupported page shows the localized unsupported status and guidance.
- An unsupported page hides both actual-effect rows.
- An unsupported page keeps both feature switches available and persists changes locally.
- A verified Eligible Mail View shows only its actual effects.
- Supported pages show the two actual effects in separate, scannable Actual-Effect Cards before the device-local controls.
- A delayed supported page keeps both cards hidden while Checking, may temporarily show Not enabled after the retry, and updates to its verified cards when Yahoo Mail responds.
- Status and controls use Chrome native internationalization in English and Traditional Chinese (Taiwan), with English fallback. The Popup document language matches the resolved catalog.
