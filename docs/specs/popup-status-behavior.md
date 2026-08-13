# Popup status behavior

## Purpose

The Popup separates the Current Page Status from the device-local preferences that will apply when an Eligible Mail View is available. This prevents a stored choice from being mistaken for an effect that is currently active.

## Current Page Status

| Active-page condition | Status heading | Actual-effect rows | Guidance |
| --- | --- | --- | --- |
| Verified dark Eligible Mail View | Active | Show Mail Sidebar and Unread Emphasis results | None |
| Verified light Eligible Mail View | Light mode | Show Mail Sidebar result and the unavailable Unread Emphasis result | None |
| Any other page, route, workspace, or unverified interface | Not supported here | Hide both actual-effect rows | Direct the user to a supported Yahoo Mail folder |
| Status request in progress | Checking | Hide both actual-effect rows | None |

The Mail Sidebar result reports the actual Sidebar Concealment on the active page. The Unread Emphasis result reports the actual dark-mode treatment on the active page; it does not report the stored preference.

## Unsupported-page decision

On an unsupported page, the Popup hides the Mail Sidebar and Unread Emphasis result rows. The two feature switches remain visible and operable because they control device-local preferences, not the effects on the current page. A changed preference applies as soon as a supported Yahoo Mail tab is available.

The extension fails closed on an unsupported page: it must not apply Sidebar Concealment, Unread Emphasis, or other extension-owned page changes. This rule preserves Yahoo Mail pages outside a verified Eligible Mail View.

## Acceptance criteria

- An unsupported page shows the localized unsupported status and guidance.
- An unsupported page hides both actual-effect rows.
- An unsupported page keeps both feature switches available and persists changes locally.
- A verified Eligible Mail View shows only its actual effects.
- Status and controls remain available in English and Traditional Chinese (Taiwan), with English fallback.
