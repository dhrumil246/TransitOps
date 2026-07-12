---
target: src/pages/Dashboard/index.tsx
total_score: 16
p0_count: 1
p1_count: 1
timestamp: 2026-07-12T10-15-55Z
slug: src-pages-dashboard-index-tsx
---
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Clear fleet status and alert banner, but lacks loading states |
| 2 | Match System / Real World | 3 | Good use of transit terminology (Dispatch, In Shop, On Trip) |
| 3 | User Control and Freedom | 2 | Alert is dismissible, but no way to recover if dismissed accidentally |
| 4 | Consistency and Standards | 1 | Rampant inline styles completely bypass the CSS design system |
| 5 | Error Prevention | N/A | Primarily a read-only dashboard |
| 6 | Recognition Rather Than Recall | 3 | Key metrics are immediately visible and well-grouped |
| 7 | Flexibility and Efficiency | 1 | No global filters, keyboard shortcuts, or customization for power users |
| 8 | Aesthetic and Minimalist Design | 2 | Good layout, but source is cluttered with raw SVG and inline CSS |
| 9 | Error Recovery | N/A | - |
| 10 | Help and Documentation | 1 | No tooltips or contextual help for derived metrics like "Fleet Utilization" |
| **Total** | | **16/40** | **Poor** |

#### Anti-Patterns Verdict

**Yes, this looks heavily AI-generated.** 
The biggest tell is the massive proliferation of inline `style={{...}}` blocks throughout the markup (e.g., `<div style={{marginTop:14,display:'flex',alignItems:'center',gap:5}}>`). The AI that generated this bypassed the standard `index.css` and `style.css` classes in favor of hardcoding pixel values and hex colors on the fly. 

**Deterministic scan**: The CLI detector flagged **8 color violations** where the component uses undocumented hex values (e.g., `#b45309`, `#d1fae5`, `#fef3c7`, `#0d9488`) that do not exist in the newly extracted `DESIGN.md` palette. 

**Visual overlays**: *Browser visualization skipped: no direct DOM mutation API exposed to orchestrator; relied on CLI scan.*

#### Overall Impression
The dashboard has a strong, dense layout ("The Command Center") and successfully groups critical fleet data. However, it is structurally brittle due to severe inline styling and completely fails basic accessibility standards for its data visualizations.

#### What's Working
1. **Data Density:** The KPI grid successfully surfaces utilization, active vehicles, trips, and drivers without requiring scrolling.
2. **Actionable Alerts:** The top amber banner effectively surfaces a time-sensitive operational issue (expiring licenses) with a direct link to resolve it.

#### Priority Issues

- **[P0] Inaccessible Data Visualizations**
  - **Why it matters**: The core value of this dashboard is the fleet activity chart and fleet status donut. These are implemented as raw `<svg>` elements with no `<title>`, `<desc>`, or `aria-labels`. Screen reader users (Sam) get absolutely no data from these charts.
  - **Fix**: Add `aria-label` or `aria-labelledby` to the SVGs, and include visually hidden text (`sr-only`) containing the tabular data equivalents of the charts.
  - **Suggested command**: `$impeccable polish`

- **[P1] Severe Inline Style Debt & Color Drift**
  - **Why it matters**: The file contains over 30 inline `style={{...}}` blocks using undocumented hex colors. This makes the dashboard impossible to theme, difficult to maintain, and inconsistent with the rest of the app.
  - **Fix**: Move all inline styles into the corresponding CSS files or replace them with standard Tailwind utility classes (since Tailwind is installed). Map rogue colors like `#0d9488` back to `var(--brand-teal)`.
  - **Suggested command**: `$impeccable distill`

- **[P2] Static Analytical Views**
  - **Why it matters**: Power users (Alex) need to filter this data (e.g., by region, vehicle type). The dashboard currently offers no filtering or drill-down capabilities.
  - **Fix**: Add a filter bar above the KPI grid to allow slicing the data by date range or fleet segment.
  - **Suggested command**: `$impeccable layout`

#### Persona Red Flags

**Sam (Accessibility-Dependent User)**: 
- The SVG charts and KPI trend arrows are invisible. Sam hears "graphic" or nothing at all, missing the entire Fleet Activity context.
- The alert banner's dismiss button is `<button ...>✕</button>` which reads as "times" or "multiplication X" instead of "Close alert". 

**Alex (Power User)**: 
- No keyboard shortcuts to quickly jump to the `Review` action for the driver licenses. 
- The chart has "Week/Month/Year" tabs, but they appear to be hardcoded UI with no actual data-fetching mechanism or interactivity attached.

#### Minor Observations
- The utilization percentage calculation `(activeVehicles / totalVehicles) * 100` can throw a NaN if `totalVehicles` is 0 (e.g., when the API is empty), though there is a fallback.
- The "Soon" maintenance badge uses inline hardcoded styles instead of the established `.pill` component system.

#### Questions to Consider
- Does the "Fleet Activity" chart need to be a custom SVG, or should we use the installed `recharts` library for better interactivity and accessibility?
- Should the alert banner be globally positioned in a layout wrapper rather than hardcoded in the Dashboard component?
