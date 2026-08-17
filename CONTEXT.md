# Yahoo Mail UI Enhancer

An independent browser extension that makes targeted visual improvements to supported Yahoo Mail pages. It preserves the mail service's functionality and does not process message data.

## Language

**Supported Mail Interface**:
The Yahoo Mail interface version whose structure has been explicitly verified as compatible with this extension. Pages outside that interface are left unchanged.
_Avoid_: New Mail UI, supported page

**Mail Sidebar**:
The existing right-side Yahoo Mail panel that users can hide or restore through the extension.
_Avoid_: Right panel, right-side panel

**Sidebar Preference**:
The device-local user choice that determines whether the Mail Sidebar is hidden across supported Yahoo Mail tabs.
_Avoid_: Panel state, toggle state

**Content Gutter**:
The intentional right-side spacing retained for the mail content after the Mail Sidebar is removed.
_Avoid_: Right padding, blank space

**Sidebar Concealment**:
The reversible CSS treatment that hides the Mail Sidebar while allowing Yahoo Mail to expand the main content area.
_Avoid_: Sidebar removal, DOM removal

**Unread Emphasis**:
The dark-mode-only visual treatment that makes unread message rows more distinct while preserving Yahoo Mail's existing unread dot and leaving read rows unchanged.
_Avoid_: Unread style, dark-mode style

**Mail Theme Marker**:
The verified Yahoo Mail indicator that identifies the active mail theme. Unread Emphasis is applied only when this marker identifies dark mode.
_Avoid_: System theme, operating-system preference

**Eligible Mail View**:
The verified Yahoo Mail list or reading workspace where Sidebar Concealment may safely be applied. Other workspaces remain unchanged.
_Avoid_: Any mail page, Mail tab

**Display Language**:
The Chrome UI language resolution used for extension controls and metadata. The extension supports English and Traditional Chinese as used in Taiwan, with English as the fallback.
_Avoid_: Language setting, locale preview

**Locale Test Instance**:
An isolated, signed-out Chrome launch used to manually verify Chrome-native extension localization during release validation. It is reused sequentially across test languages and is separate from the user's everyday Chrome profiles.
_Avoid_: Language setting, locale preview

**Popup**:
The extension action panel that provides quick feature controls, current-page status, and links to its local policy information.
_Avoid_: Settings page, menu

**Current Page Status**:
The Popup's report of whether the active browser page is an Eligible Mail View and which extension effects currently apply there.
_Avoid_: Enabled status, extension status

**Actual-Effect Card**:
A scannable Popup card that reports the effect currently applied on the active Eligible Mail View. It never represents a device-local feature preference.
_Avoid_: Preference card, feature setting

**Local Privacy Policy**:
The extension-bundled offline page that explains its data boundary and independent status.
_Avoid_: Privacy link, external privacy policy

**Offline Operation**:
The extension's mode of operation in which all interface changes and preferences remain on the device, without telemetry, analytics, error reporting, or remote network requests.
_Avoid_: Private mode, local processing
