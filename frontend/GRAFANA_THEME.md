# Grafana Theme Implementation

The SmartZone Analytics Dashboard now follows Grafana's distinctive design language and visual style.

## Color Palette

### Background Colors
- **Primary Background** (`#0b0c0e`) - Main dashboard background, very dark almost black
- **Panel Background** (`#181b1f`) - Card/panel backgrounds, slightly lighter
- **Hover State** (`#23262b`) - Interactive element hover states
- **Border** (`#2e3238`) - Subtle borders and dividers

### Accent Colors
- **Orange** (`#ff7833`) - Primary accent, active states, CTAs
- **Orange Light** (`#ff9966`) - Hover states for orange elements
- **Blue** (`#5794f2`) - Links, info states
- **Green** (`#73bf69`) - Success, positive metrics
- **Yellow** (`#fade2a`) - Warnings, caution states
- **Red** (`#f2495c`) - Errors, critical alerts

### Text Colors
- **Primary Text** (`#d8d9da`) - Main content, headings
- **Secondary Text** (`#9fa0a5`) - Labels, descriptions
- **Disabled Text** (`#6e6e7e`) - Inactive elements

## Layout Structure

### Narrow Sidebar (56px)
- Icon-only navigation
- Orange circle logo at top
- Main nav icons in center
- Settings and user icons at bottom
- Active state: Orange background
- Hover state: Subtle gray background

### Header Bar
- Dark panel background
- Dashboard title on left
- Search, notifications, user profile on right
- Red dot notification indicator
- 56px height for consistency

### Content Area
- Dark background
- Cards/panels with borders
- Consistent 16px spacing between elements
- Responsive grid layouts

## Typography

### Font Family
- Primary: Inter, Helvetica, Arial, sans-serif
- Clean, modern, highly readable

### Font Weights
- Normal (400) - Body text, numbers
- Medium (500) - Headings, buttons
- Semibold (600) - Important labels (used sparingly)

### Font Sizes
- Labels: 10-12px uppercase
- Body: 13-14px
- Values: 24-32px for metrics
- Headings: 14-16px

## Component Styles

### Metric Cards
- Dark panel background with border
- Small uppercase label
- Large value display (32px)
- Trend indicators with arrows
- Hover: Orange border highlight

### Buttons
- Primary: Orange background, white text
- Secondary: Dark background, light text
- Hover: Slight color shift
- Small padding, compact design

### Charts
- Dark backgrounds
- Colored lines (green, blue, orange)
- Subtle grid lines
- Legend with colored dots
- Time range selectors (24h, 7d, 30d)

### Progress Bars
- Dark background
- Colored fills (green, yellow, red, orange)
- 8px height
- Rounded ends
- Value displayed on right

### Tables
- Dark panel background
- Subtle row borders
- Hover: Lighter background
- Status badges with colors

## Key Design Principles

1. **Dark First** - Everything starts with dark backgrounds
2. **Orange Accent** - Used sparingly for primary actions and active states
3. **Subtle Borders** - Thin, dark borders for separation
4. **Color Meaning** - Consistent color coding (green=good, red=bad, orange=action)
5. **Typography** - Clean, readable, not too bold
6. **Spacing** - Generous but not excessive (16px standard)
7. **Icons** - Simple, monochrome, clear
8. **Hover States** - Subtle but noticeable feedback
9. **Data Density** - Show more information without clutter
10. **Professional** - Enterprise-grade appearance

## Grafana-Specific Features

### Navigation Pattern
- Collapsed sidebar with icons only
- Tooltips on hover (via title attribute)
- Active page highlighted in orange
- Minimal visual weight

### Panel Design
- Rounded corners (4px)
- Border on all sides
- Padding: 16px
- Title in small, light text
- Content area clearly defined

### Time Range Controls
- Pill-shaped buttons
- Active state: Orange
- Inactive: Dark with light text
- Hover: Lighter background

### Status Indicators
- Colored dots (8-12px circles)
- Live data: Pulsing green dot
- Notifications: Red dot
- Color-coded badges

## Accessibility

- High contrast text on dark backgrounds
- Clear hover and focus states
- Readable font sizes (minimum 12px)
- Color not sole indicator (icons + text)

## Responsive Behavior

- Fixed sidebar on all screen sizes
- Flexible content area
- Grid layouts collapse on mobile
- Touch-friendly button sizes (minimum 40px)

## Implementation Notes

- Uses Tailwind CSS with custom color palette
- Grafana colors defined in `tailwind.config.js`
- Components follow consistent patterns
- Hover states use transition utilities
- Dark theme applied globally

This implementation captures Grafana's professional, data-focused aesthetic while maintaining the SmartZone Analytics dashboard functionality.
