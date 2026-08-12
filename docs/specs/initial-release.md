# Initial release

## Problem Statement

Yahoo Mail's Supported Mail Interface can leave a substantial Mail Sidebar visible beside the mail workspace, reducing usable space. In dark mode, the distinction between read and unread messages can be too subtle for users who need to triage mail quickly. Users need focused, reversible interface improvements that preserve Yahoo Mail behavior, privacy, and accessibility.

## Solution

Deliver an independent browser extension that operates only on the verified Yahoo Mail interface at `mail.yahoo.com`. It provides a Sidebar Toggle that controls the device-local Sidebar Preference, preserves a responsive Content Gutter when the Mail Sidebar is concealed, and adds restrained Unread Emphasis in dark mode. The extension has English and Traditional Chinese (Taiwan) settings, operates fully offline, and leaves any unverified Yahoo Mail view unchanged.

## User Stories

1. As a Yahoo Mail user, I want the Mail Sidebar concealed by default in an Eligible Mail View, so that I have more horizontal workspace.
2. As a Yahoo Mail user, I want a Sidebar Toggle in the top toolbar, so that I can restore or conceal the Mail Sidebar without leaving my mailbox.
3. As a Yahoo Mail user, I want my Sidebar Preference retained on this device, so that my preferred workspace persists across supported Yahoo Mail tabs and reloads.
4. As a Yahoo Mail user, I want the main mail content to expand when the Mail Sidebar is concealed, so that the recovered space is useful.
5. As a Yahoo Mail user, I want a responsive Content Gutter after the Mail Sidebar is concealed, so that the expanded workspace does not appear flush against the browser edge.
6. As a Yahoo Mail user, I want the Mail Sidebar restored intact when I switch the Sidebar Toggle off, so that existing Yahoo Mail state and functionality remain available.
7. As a Yahoo Mail user, I want Unread Emphasis only when Yahoo Mail is in dark mode, so that the extension does not alter my light-mode experience.
8. As a Yahoo Mail user, I want unread message rows to be easier to distinguish, so that I can scan a busy inbox more quickly.
9. As a Yahoo Mail user, I want Yahoo Mail's existing unread dot preserved, so that the service's native unread signal remains familiar.
10. As a Yahoo Mail user, I want selected, hovered, focused, and dragged messages to retain their native feedback, so that Unread Emphasis does not interfere with mail actions.
11. As a Yahoo Mail user, I want the extension to adapt after folder changes, searches, scrolling, and dynamic rerenders, so that the chosen improvements remain correct throughout normal use.
12. As a Yahoo Mail user, I want non-mail workspaces and unverified pages to remain untouched, so that the extension never conceals required controls or changes an incompatible interface.
13. As a keyboard user, I want the Sidebar Toggle to be focusable and operable with the keyboard, so that I can control the Mail Sidebar without a pointer.
14. As a screen-reader user, I want the Sidebar Toggle to expose its pressed state and announce changes, so that I can understand whether the Mail Sidebar is concealed.
15. As an English-speaking user, I want extension controls and settings in English, so that I can use the feature without translation friction.
16. As a Traditional Chinese user in Taiwan, I want extension controls and settings in Traditional Chinese, so that the feature matches my preferred language.
17. As a user of another browser language, I want a predictable English fallback, so that the settings remain understandable.
18. As a privacy-conscious user, I want all preferences and page processing to remain on my device, so that my mailbox information is never transmitted.
19. As a privacy-conscious user, I want no telemetry, analytics, error reporting, remote configuration, or third-party runtime code, so that the extension has a verifiable offline boundary.
20. As a prospective user, I want clear documentation that the extension is independent and unofficial, so that I do not mistake it for a Yahoo product.
21. As a prospective user, I want installation and testing instructions for a developer-mode release, so that I can validate the extension before any store release.
22. As a maintainer, I want the extension to fail closed when the Supported Mail Interface cannot be verified, so that Yahoo Mail updates do not risk unintended page changes.

## Implementation Decisions

- Build the first release as a Manifest V3 browser extension using native JavaScript and CSS, without a framework or bundling pipeline.
- Support the verified Yahoo Mail interface at `https://mail.yahoo.com/*`; the first release is tested and supported in the target Chromium browser.
- Verify the Supported Mail Interface through stable structural attributes before applying either feature. Use the verified mail application, top toolbar, main content area, and Mail Sidebar anchors; do not depend on opaque generated class names.
- Identify the Mail Sidebar through its verified right-rail test attribute and conceal it with reversible CSS `display: none`, never by removing or recreating Yahoo Mail DOM nodes.
- Apply the Content Gutter to the verified main content area using responsive logical CSS spacing that follows the content's existing horizontal rhythm.
- Render the Sidebar Toggle as an extension-owned, original neutral monochrome control in the verified top toolbar. Do not use Yahoo images, logos, or brand styling.
- Store Sidebar Preference and independent feature switches in device-local extension storage. Default Sidebar Concealment and Unread Emphasis to enabled.
- Provide a minimal settings page with separate switches for Sidebar Concealment and Unread Emphasis, concise offline/privacy and unofficial-extension text, and a Privacy link. The settings page does not inspect the active browser tab.
- Localize extension-owned controls and settings for English and Traditional Chinese (Taiwan); select Traditional Chinese only for `zh-TW` and use English for every other language.
- Use Yahoo Mail's verified Mail Theme Marker to gate Unread Emphasis. Apply it only when the page declares dark mode; do not infer it from the operating system theme.
- Identify unread rows through Yahoo Mail's verified unread indicator, then add a restrained dark-mode background and stronger sender/subject weight only to static unread rows. Preserve Yahoo's existing unread dot and do not alter preview, date, attachments, or labels.
- Preserve Yahoo Mail's own selected, hover, keyboard-focus, and drag visual states over Unread Emphasis.
- Observe dynamic page changes with a throttled idempotent controller. Each feature separately re-verifies its prerequisites and removes only extension-owned state when the relevant Eligible Mail View disappears.
- Keep the first release fully offline as required by ADR-0001: no remote network requests, telemetry, analytics, error reporting, remote configuration, or third-party runtime code.
- Provide an original extension icon, README, privacy policy, independent/unofficial disclaimer, developer-mode installation instructions, test instructions, and known limitations. Store submission is deferred.

## Testing Decisions

- Use one high-level test seam: a simulated Yahoo Mail document driven through the extension's public page controller. Tests must assert externally observable page outcomes rather than selectors, helper calls, or internal state.
- Add focused fixtures for a verified Eligible Mail View in dark and light themes, with the verified Mail Sidebar, main content, toolbar, and unread indicator represented structurally.
- Verify Sidebar Concealment behavior: default application, Sidebar Toggle transitions, device-local Sidebar Preference restoration, preserved main-content expansion, responsive Content Gutter, and sidebar restoration without DOM replacement.
- Verify Unread Emphasis behavior: it appears only for unread rows in a dark Mail Theme Marker, preserves the native unread indicator, leaves read rows alone, and yields to hover, selection, focus, and drag states.
- Verify fail-closed behavior for missing or altered anchors, unsupported routes, and non-mail workspaces: neither feature may alter the page.
- Verify dynamic behavior after simulated route changes, mail-list replacement, theme changes, and virtualized row updates; repeated observation must be idempotent.
- Verify localization fallback and both supported Display Languages, plus keyboard and screen-reader semantics for Sidebar Toggle state changes.
- Perform manual regression checks with a dedicated signed-in test account in light mode, dark mode, narrow viewport, mail list, message reading, switching and reload persistence, and failure cases.
- There is no pre-existing test suite; this feature establishes the first test seam and its fixtures.

## Out of Scope

- Support for Safari, Firefox, non-verified browser families, or store publication.
- Yahoo Mail domains other than `mail.yahoo.com`.
- Any modification to Yahoo Mail source code, branding, mail content, message data, account data, or service behavior.
- Cloud synchronization, telemetry, analytics, remote services, error reporting, remote configuration, and third-party runtime code.
- Changes to light-mode unread styling, Yahoo Mail non-mail workspaces, or any view that cannot be verified as an Eligible Mail View.
- New mailbox capabilities such as composing, search changes, filtering, rules, mail organization, or message actions.

## Further Notes

- The extension is independent, unofficial, and not affiliated with, endorsed by, or sponsored by Yahoo.
- The implementation must request the minimum permissions necessary for the verified host and device-local preference storage.
- The layout and theme anchors were validated in a signed-in Yahoo Mail inbox. Because Yahoo Mail is a dynamic third-party interface, selectors require ongoing conservative validation and a fail-closed response to structural changes.
- This spec respects ADR-0001, which deliberately prioritizes an offline privacy boundary over cross-device preference sync and operational visibility.
