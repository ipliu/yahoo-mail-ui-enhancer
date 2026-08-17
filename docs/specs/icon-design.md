# Icon design

## Purpose

The extension icon communicates focused mail work without adopting Yahoo branding. It is an original, independent visual asset for the browser toolbar, extension management surfaces, and distribution materials.

## Concept

The central midnight-blue envelope represents mail. Two ice-blue chevrons point inward from either side, representing Sidebar Concealment and a more focused mail workspace. The envelope's lower fold lines sit beneath the pale-blue flap to preserve the physical reading order of an envelope.

## Visual rules

- Use a transparent canvas; do not use a full rounded-square background that can expose contrasting corner pixels in browser toolbars.
- Use midnight blue `#1C2D4A` for the envelope, ice blue `#8BDBE8` for the inward chevrons, pale ice `#D8F6FA` for the flap, and muted blue `#526B8D` for lower folds.
- Do not use Yahoo logos, wordmarks, or official brand assets.
- Preserve the inward chevrons and envelope silhouette at small sizes; omit decorative detail rather than reducing their contrast.

## Assets

The source is `assets/icon.svg`. The manifest registers PNG derivatives at 16, 32, 48, and 128 pixels. Each derivative retains transparency and is generated from the SVG source.

## Popup relationship

The Popup reuses the icon as its compact brand mark, setting it on a circular pale-ice background in light mode and muted-blue background in dark mode so its midnight-blue envelope remains distinct. The enabled switch uses midnight blue in light mode and the dark mode background continues the midnight-blue palette. Current Page Status uses separate semantic colors: green for an active Eligible Mail View and orange for an unsupported page. Popup status and feature behavior are defined separately in `docs/specs/popup-status-behavior.md`.
