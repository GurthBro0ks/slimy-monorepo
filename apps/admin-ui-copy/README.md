# Admin UI Copy Integration Guide

This directory contains copy (text content) for tooltips, labels, and onboarding in the slimy.ai Admin Panel.

## What's Here

- **`tooltips.json`**: Complete mapping of UI element keys to display text and tooltip content
- **`../docs/admin-copy/`**: Detailed documentation (overview, tooltips, onboarding flow)

## How to Use This Copy

### 1. Import the JSON

In your React components (Next.js app), import the tooltips:

```javascript
import tooltips from '@/admin-ui-copy/tooltips.json';
// or
import tooltips from '../../../apps/admin-ui-copy/tooltips.json';
```

### 2. Create a Tooltip Helper Component

Build a reusable `Tooltip` component:

```jsx
// components/Tooltip.jsx
import React, { useState } from 'react';
import tooltips from '@/admin-ui-copy/tooltips.json';

export const Tooltip = ({ tooltipKey, children, position = 'top' }) => {
  const [visible, setVisible] = useState(false);

  // Navigate nested keys like "dashboard.tasks.ingestDirectory"
  const content = tooltipKey.split('.').reduce((obj, key) => obj?.[key], tooltips);

  if (!content?.tooltip) return children;

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className={`tooltip tooltip-${position}`}>
          {content.tooltip}
        </div>
      )}
    </div>
  );
};

export const Label = ({ tooltipKey, className = '' }) => {
  const content = tooltipKey.split('.').reduce((obj, key) => obj?.[key], tooltips);

  return (
    <Tooltip tooltipKey={tooltipKey}>
      <label className={className}>
        {content?.label || content?.text || tooltipKey}
        <span className="info-icon">ⓘ</span>
      </label>
    </Tooltip>
  );
};
```

### 3. Use in Your Components

#### Example: Dashboard Page

```jsx
// pages/guilds/[guildId]/index.js
import { Tooltip, Label } from '@/components/Tooltip';

export default function GuildDashboard() {
  return (
    <div>
      <h1>
        <Tooltip tooltipKey="dashboard.pageTitle">
          Dashboard
        </Tooltip>
      </h1>

      <div className="stat-card">
        <Label tooltipKey="dashboard.members" />
        <span>{memberCount}</span>
      </div>

      <div className="stat-card">
        <Label tooltipKey="dashboard.totalPower" />
        <span>{totalPower}</span>
      </div>

      <Tooltip tooltipKey="dashboard.tasks.ingestDirectory">
        <button onClick={handleIngest}>
          Ingest Directory
        </button>
      </Tooltip>
    </div>
  );
}
```

#### Example: Settings Page

```jsx
// pages/guilds/[guildId]/settings.js
import { Label } from '@/components/Tooltip';

export default function Settings() {
  return (
    <form>
      <div className="form-group">
        <Label tooltipKey="settings.sheetId" />
        <input type="text" name="sheetId" />
      </div>

      <div className="form-group">
        <Label tooltipKey="settings.screenshotChannel" />
        <input type="text" name="channelId" />
      </div>

      <div className="form-group">
        <Label tooltipKey="settings.enableUploads" />
        <input type="checkbox" name="enableUploads" />
      </div>
    </form>
  );
}
```

### 4. Alternative: Direct Access Pattern

If you prefer direct imports in each file:

```jsx
import tooltips from '@/admin-ui-copy/tooltips.json';

const MyComponent = () => {
  return (
    <button title={tooltips.dashboard.tasks.runVerify.tooltip}>
      {tooltips.dashboard.tasks.runVerify.text}
    </button>
  );
};
```

## JSON Structure

The `tooltips.json` file uses nested keys to organize by page/section:

```json
{
  "page": {
    "section": {
      "element": {
        "text": "Display text",        // Button text, label, etc.
        "label": "Form label",         // For form fields
        "placeholder": "Input hint",   // For text inputs
        "tooltip": "Help text"         // Tooltip content
      }
    }
  }
}
```

### Key Naming Convention

- **Dot notation**: `page.section.element` (e.g., `dashboard.tasks.ingestDirectory`)
- **Descriptive**: Use the UI element name or purpose
- **Consistent**: Follow existing patterns in `tooltips.json`

### Example Keys

| Key | Usage |
|-----|-------|
| `guilds.table.guildName` | Guild list table header |
| `dashboard.totalPower` | Dashboard stat card |
| `settings.sheetId` | Settings form field |
| `snail.analyze.runButton` | Snail Tools analyze button |
| `chat.messageInput` | Chat message input field |

## TypeScript Support (Optional)

Generate types from the JSON for autocomplete:

```typescript
// types/tooltips.ts
import tooltipsJson from '@/admin-ui-copy/tooltips.json';

type DeepKeys<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${DeepKeys<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

export type TooltipKey = DeepKeys<typeof tooltipsJson>;

// Usage in component:
import { TooltipKey } from '@/types/tooltips';

interface TooltipProps {
  tooltipKey: TooltipKey;  // Autocomplete enabled!
  children: React.ReactNode;
}
```

## Styling Tooltips

Add this CSS to your global styles or Tailwind config:

```css
/* styles/tooltip.css */
.tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.tooltip {
  position: absolute;
  z-index: 1000;
  background: #1a1a1a;
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.4;
  max-width: 250px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  white-space: normal;
}

.tooltip-top {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
}

.tooltip-bottom {
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(8px);
}

.tooltip-left {
  right: 100%;
  top: 50%;
  transform: translateY(-50%) translateX(-8px);
}

.tooltip-right {
  left: 100%;
  top: 50%;
  transform: translateY(-50%) translateX(8px);
}

.info-icon {
  margin-left: 4px;
  color: #888;
  font-size: 14px;
  cursor: help;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .tooltip {
    background: #2a2a2a;
    color: #e0e0e0;
  }
}
```

### Tailwind Classes (Alternative)

```jsx
<div className="relative group inline-block">
  {children}
  <div className="absolute invisible group-hover:visible bg-gray-900 text-white text-sm rounded px-3 py-2 max-w-[250px] bottom-full left-1/2 -translate-x-1/2 -translate-y-2 shadow-lg">
    {tooltipContent}
  </div>
</div>
```

## Accessibility

Ensure tooltips are keyboard-accessible:

```jsx
export const Tooltip = ({ tooltipKey, children }) => {
  const [visible, setVisible] = useState(false);
  const content = tooltipKey.split('.').reduce((obj, key) => obj?.[key], tooltips);

  return (
    <div
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
      role="tooltip"
      aria-label={content?.tooltip}
    >
      {children}
      {visible && <div className="tooltip">{content.tooltip}</div>}
    </div>
  );
};
```

## Mobile Considerations

For touch devices, use click/tap instead of hover:

```jsx
const [visible, setVisible] = useState(false);

const toggleTooltip = () => setVisible(!visible);

return (
  <div onClick={toggleTooltip}>
    {children}
    {visible && <div className="tooltip">{content}</div>}
  </div>
);
```

## Onboarding Integration

For first-time user onboarding, see `../docs/admin-copy/onboarding-flow.md`. The flow uses:

- Modal overlays for step-by-step guidance
- Spotlight highlights on specific UI elements
- Progress indicators ("Step 2 of 10")
- Skip/dismiss options at every step

Implement onboarding using a library like:
- [react-joyride](https://docs.react-joyride.com/)
- [intro.js](https://introjs.com/)
- [shepherd.js](https://shepherdjs.dev/)

Or build custom with state management:

```jsx
const [onboardingStep, setOnboardingStep] = useState(0);
const [showOnboarding, setShowOnboarding] = useState(
  !localStorage.getItem('onboardingCompleted')
);
```

## Adding New Copy

When adding new UI elements:

1. Add the key to `tooltips.json` following the existing structure
2. Document the new tooltip in `../docs/admin-copy/tooltips.md`
3. Update this README if you add new patterns or conventions

Example:

```json
// tooltips.json
{
  "newPage": {
    "newSection": {
      "newButton": {
        "text": "Click Me",
        "tooltip": "This button does something cool"
      }
    }
  }
}
```

```jsx
// In your component
<Tooltip tooltipKey="newPage.newSection.newButton">
  <button>Click Me</button>
</Tooltip>
```

## Testing

Test tooltips across:
- Desktop (hover states)
- Mobile (tap states)
- Keyboard navigation (focus states)
- Screen readers (aria-label)
- Both light and dark modes

## Questions?

- Check `../docs/admin-copy/overview.md` for context on admin panel features
- See `../docs/admin-copy/tooltips.md` for the complete tooltip reference
- Review `../docs/admin-copy/onboarding-flow.md` for first-time UX guidance

## Contributing Copy Changes

When updating copy:

1. Keep it **concise** (max 2 sentences for tooltips)
2. Use **active voice** ("Click to upload" not "Uploads can be clicked")
3. Match the **ADHD-friendly tone** (clear, fast, no jargon)
4. Test on real users if possible (especially onboarding flow)

---

**Last Updated**: 2025-11-19
**Copy Version**: 1.0
**Owned by**: slimy.ai team
