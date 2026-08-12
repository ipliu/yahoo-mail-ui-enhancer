# Manual acceptance guide

Use a dedicated signed-in Yahoo Mail test account. Confirm the page is an Eligible Mail View before each check.

## Setup

1. Load the repository through developer mode as described in the README.
2. Open the extension settings page and enable both features.
3. Keep browser developer tools available to observe unexpected errors, but do not inspect or alter message data.

## Sidebar Concealment

- In a mail list, confirm the Mail Sidebar is concealed by default, main content expands, and a responsive Content Gutter remains at narrow and wide viewport widths.
- Use the Sidebar Toggle with a pointer, Enter, and Space. Confirm its pressed state and announcement reflect the change.
- Restore the Mail Sidebar and confirm its native controls and contents remain intact.
- Reload the tab and open another supported tab. Confirm the Sidebar Preference persists in both.
- Repeat in a message-reading workspace.

## Unread Emphasis

- In dark mode, confirm unread message rows have restrained emphasis on their background, sender, and subject.
- Confirm the native unread dot, preview, date, attachments, and labels are unchanged.
- Confirm read rows are unchanged.
- In light mode, confirm no Unread Emphasis is visible.
- Hover, select, keyboard-focus, and drag an unread row. Confirm Yahoo Mail's own visual feedback takes precedence.

## Dynamic and failure cases

- Change folders, search, scroll through a virtualized list, and allow Yahoo Mail to rerender. Confirm both features remain correct without duplicate Sidebar Toggles.
- Change the Yahoo Mail theme while a list is visible. Confirm Unread Emphasis updates correctly.
- Visit a non-mail workspace and an unsupported route. Confirm the extension makes no visual changes.
- Temporarily verify a missing or altered supported-interface anchor in a controlled test fixture only. Confirm the extension fails closed and restores extension-owned state.

## Release decision

Record the browser version, test-account date, light and dark theme outcomes, narrow viewport result, and every failure before sharing a developer-mode build.
