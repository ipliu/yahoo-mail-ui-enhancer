# Changelog

All notable changes to this project are documented in this file.

## Unreleased

## [0.3.0] - 2026-08-14

### Added

- Added a release script that creates a Chrome Web Store ZIP package and excludes development and secret files.
- Added Chrome Web Store screenshots and a GitHub Pages workflow that publishes the local privacy policy.

### Changed

- Centralized Sidebar Preference control in the Popup and removed extension-owned page controls.
- Clarified that dark-mode Unread Emphasis uses a `#3A4963` row background while preserving Yahoo's native unread text weight.
- Restricted automatic privacy-policy deployments to policy, policy-icon, and deployment-workflow changes.
- Required GitHub Issues, pull requests, and related tracker content to be written in English.

## [0.2.3] - 2026-08-13

### Added

- Added a toolbar Popup with quick controls and Current Page Status for Eligible Mail Views.
- Added an original extension icon and an expanded Local Privacy Policy page.

### Fixed

- Made Popup preference changes refresh the current and other open Eligible Mail Views immediately through the global local-storage change event.

### Changed

- Clarified Popup status guidance and developer-mode documentation.
