---
name: TransitOps
description: Smart transport operations platform
colors:
  primary: "#0f766e"
  primary-light: "#14b8a6"
  brand-orange: "#E8862E"
  canvas: "#f0efea"
  sidebar: "#0c0c0c"
  surface: "#ffffff"
  surface-hover: "#f8fafc"
  border: "#e2e8f0"
  border-mid: "#cbd5e1"
  tx-primary: "#0f172a"
  tx-secondary: "#475569"
  tx-muted: "#94a3b8"
  status-green: "#059669"
  status-amber: "#d97706"
  status-red: "#dc2626"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontWeight: 700
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontWeight: 400
  label:
    fontFamily: "JetBrains Mono, Courier New, monospace"
    fontWeight: 600
rounded:
  btn: "8px"
  card: "12px"
  pill: "999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.btn}"
    padding: "0 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.tx-secondary}"
    rounded: "{rounded.btn}"
    padding: "0 16px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "20px"
---

# Design System: TransitOps

## 1. Overview

**Creative North Star: "The Command Center"**

TransitOps is a crisp, high-density environment that prioritizes accurate data and expert confidence without clutter. The design philosophy centers on maximizing real-time operational control for fleet managers, providing them with the exact data they need, instantly, without unnecessary ornamentation. It explicitly rejects cluttered, outdated enterprise ERP aesthetics in favor of a modern, professional, and tactile experience.

**Key Characteristics:**
- Practice what you preach: Data should be accurate and accessible.
- Expert confidence: The tool empowers managers without getting in their way.
- High density without clutter: Maximize information, minimize noise.

## 2. Colors

Deep Coastal Teal and Mint drive the primary brand identity, conveying professionalism, trustworthiness, and crispness.

### Primary
- **Deep Coastal Teal** (#0f766e): Used for primary actions, active navigation states, and brand moments.
- **Coastal Mint** (#14b8a6): Used in gradients and hover states to provide a sharp, energetic contrast.
- **Brand Orange** (#E8862E): Used for distinctive brand accents where Teal/Mint is not appropriate.

### Neutral
- **Canvas Sand** (#f0efea): The underlying page background, providing a warm, non-stark base.
- **Deep Sidebar** (#0c0c0c): For the primary navigation sidebar, grounding the application.
- **Surface White** (#ffffff): For data cards and primary content areas.
- **Text Primary** (#0f172a): For all primary headings and data values.
- **Text Secondary** (#475569): For table data and secondary labels.

### Named Rules
**The Status Clarity Rule.** Status colors (Green, Amber, Red) are reserved strictly for operational states (Available, On Trip, In Shop) and must never be used for brand decoration.

## 3. Typography

**Display Font:** Inter (with system-ui, -apple-system, sans-serif)
**Body Font:** Inter (with system-ui, -apple-system, sans-serif)
**Label/Mono Font:** JetBrains Mono (with Courier New, monospace)

**Character:** Highly legible, utilitarian, and data-focused. Inter provides clean legibility for dense UI, while JetBrains Mono ensures tabular data and KPI values align perfectly.

### Hierarchy
- **Display** (700, 18px-32px): Used for KPI values and primary page titles.
- **Headline** (600, 13px-16px): Used for card titles and section headers.
- **Body** (400-500, 13px): Used for standard table rows, inputs, and general text.
- **Label** (600, 10px-12px, uppercase): Used for table headers, badges, and metadata. Mono is used for IDs and dates.

### Named Rules
**The Tabular Data Rule.** All IDs, financial amounts, and critical dates must use the JetBrains Mono font to ensure perfect vertical alignment in dense tables.

## 4. Elevation

**Flat-By-Default.** Surfaces are flat at rest; subtle ambient shadows appear on interactive elements (cards, buttons) to indicate depth. Depth is otherwise conveyed through borders and tonal changes.

### Shadow Vocabulary
- **Card Shadow** (`0 1px 3px rgba(15,23,42,0.06)`): Default ambient shadow for surface cards.
- **Button Shadow** (`0 2px 6px rgba(15,118,110,0.35)`): Lift for primary actions.

## 5. Components

Tactile and direct. Buttons and inputs feel precise, with clear interactive states and no unnecessary ornamentation.

### Buttons
- **Shape:** Soft rounded edges (8px).
- **Primary:** Gradient background (Teal to Mint) with white text, padding `0 16px`, height `36px`. Tactile hover lift.
- **Hover / Focus:** Lifts up (`translateY(-1px)`) with expanded shadow.
- **Ghost:** Transparent background, secondary text, border matches border-mid on hover.

### Chips
- **Style:** Fully rounded (999px), white background, mid-gray border.
- **State:** Active state uses green background and border with green text.

### Cards / Containers
- **Corner Style:** 12px radius.
- **Background:** Surface White.
- **Shadow Strategy:** Flat-By-Default ambient shadow.
- **Border:** Light structural border (`#e2e8f0`).
- **Internal Padding:** 20px body padding.

### Inputs / Fields
- **Style:** 40px height, 8px radius, white background, mid-gray border.
- **Focus:** Teal border with a soft teal focus ring (`0 0 0 3px rgba(15,118,110,0.1)`).

### Navigation
- **Style:** Dark sidebar (`#0c0c0c`), light teal active states, with uppercase group labels.

## 6. Do's and Don'ts

### Do:
- **Do** use JetBrains Mono for IDs, amounts, and dates to align data vertically.
- **Do** use the Flat-By-Default shadow strategy; reserve heavy shadows for modals or dropdowns.
- **Do** maintain high density without clutter by using consistent padding (e.g., 20px inside cards).

### Don't:
- **Don't** design a cluttered, outdated enterprise ERP from 2005. Keep it crisp.
- **Don't** use status colors (Green/Amber/Red) for decorative purposes.
- **Don't** use large, sweeping gradients outside of the primary button or logo mark.
