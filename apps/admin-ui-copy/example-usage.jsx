/**
 * Example Implementation of Tooltips in Admin UI
 *
 * This file demonstrates how to integrate the tooltips.json
 * into your React components. DO NOT import this file directly.
 * Copy the patterns below into your actual components.
 */

import React, { useState } from 'react';
import tooltips from './tooltips.json';

// ============================================================================
// EXAMPLE 1: Reusable Tooltip Component
// ============================================================================

export const Tooltip = ({
  tooltipKey,
  children,
  position = 'top',
  className = ''
}) => {
  const [visible, setVisible] = useState(false);

  // Navigate nested keys like "dashboard.tasks.ingestDirectory"
  const getContent = (key) => {
    return key.split('.').reduce((obj, k) => obj?.[k], tooltips);
  };

  const content = getContent(tooltipKey);

  if (!content?.tooltip) {
    console.warn(`Tooltip key not found: ${tooltipKey}`);
    return children;
  }

  return (
    <div
      className={`tooltip-wrapper ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
      role="tooltip"
      aria-label={content.tooltip}
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

// ============================================================================
// EXAMPLE 2: Label Component with Tooltip
// ============================================================================

export const Label = ({
  tooltipKey,
  required = false,
  className = ''
}) => {
  const content = tooltipKey.split('.').reduce((obj, key) => obj?.[key], tooltips);

  return (
    <Tooltip tooltipKey={tooltipKey}>
      <label className={`form-label ${className}`}>
        {content?.label || content?.text || tooltipKey}
        {required && <span className="required">*</span>}
        <span className="info-icon" aria-hidden="true">ⓘ</span>
      </label>
    </Tooltip>
  );
};

// ============================================================================
// EXAMPLE 3: Button with Tooltip
// ============================================================================

export const TooltipButton = ({
  tooltipKey,
  onClick,
  variant = 'primary',
  disabled = false,
  children
}) => {
  const content = tooltipKey.split('.').reduce((obj, key) => obj?.[key], tooltips);

  return (
    <Tooltip tooltipKey={tooltipKey}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`btn btn-${variant}`}
      >
        {children || content?.text || 'Button'}
      </button>
    </Tooltip>
  );
};

// ============================================================================
// EXAMPLE 4: Usage in Dashboard Page
// ============================================================================

export const DashboardExample = ({ guildData }) => {
  const handleIngest = () => {
    console.log('Running ingest...');
  };

  return (
    <div className="dashboard-page">
      {/* Page title with tooltip */}
      <h1>
        <Tooltip tooltipKey="dashboard.pageTitle">
          Dashboard
        </Tooltip>
      </h1>

      {/* Stat cards with labels */}
      <div className="stats-grid">
        <div className="stat-card">
          <Label tooltipKey="dashboard.members" />
          <span className="stat-value">{guildData.memberCount}</span>
        </div>

        <div className="stat-card">
          <Label tooltipKey="dashboard.totalPower" />
          <span className="stat-value">
            {guildData.totalPower} / {guildData.totalPowerThreshold}
          </span>
        </div>

        <div className="stat-card">
          <Label tooltipKey="dashboard.simPower" />
          <span className="stat-value">
            {guildData.simPower} / {guildData.simPowerThreshold}
          </span>
        </div>
      </div>

      {/* Task buttons with tooltips */}
      <div className="task-buttons">
        <TooltipButton
          tooltipKey="dashboard.tasks.ingestDirectory"
          onClick={handleIngest}
        />

        <TooltipButton
          tooltipKey="dashboard.tasks.runVerify"
          onClick={() => console.log('Verifying...')}
        />

        <TooltipButton
          tooltipKey="dashboard.tasks.recomputeLatest"
          onClick={() => console.log('Recomputing...')}
          variant="secondary"
        />
      </div>
    </div>
  );
};

// ============================================================================
// EXAMPLE 5: Usage in Settings Form
// ============================================================================

export const SettingsFormExample = () => {
  const [settings, setSettings] = useState({
    sheetId: '',
    defaultTab: 'Baseline (10-24-25)',
    screenshotChannelId: '',
    enableUploads: true,
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <form className="settings-form">
      <h2>
        <Tooltip tooltipKey="settings.pageTitle">
          Club Settings
        </Tooltip>
      </h2>

      {/* Text input with label tooltip */}
      <div className="form-group">
        <Label tooltipKey="settings.sheetId" required />
        <input
          type="text"
          name="sheetId"
          value={settings.sheetId}
          onChange={handleChange}
          placeholder="1A2B3C4D5E6F7G8H9I0J..."
        />
      </div>

      {/* Select with label tooltip */}
      <div className="form-group">
        <Label tooltipKey="settings.defaultTab" />
        <input
          type="text"
          name="defaultTab"
          value={settings.defaultTab}
          onChange={handleChange}
        />
      </div>

      {/* Checkbox with tooltip */}
      <div className="form-group checkbox-group">
        <Label tooltipKey="settings.enableUploads" />
        <input
          type="checkbox"
          name="enableUploads"
          checked={settings.enableUploads}
          onChange={handleChange}
        />
      </div>

      {/* Textarea with tooltip */}
      <div className="form-group">
        <Label tooltipKey="settings.notes" />
        <textarea
          name="notes"
          value={settings.notes}
          onChange={handleChange}
          rows={4}
        />
      </div>

      <TooltipButton
        tooltipKey="channels.saveButton"
        variant="primary"
        onClick={() => console.log('Saving...')}
      >
        Save Changes
      </TooltipButton>
    </form>
  );
};

// ============================================================================
// EXAMPLE 6: Usage in Snail Tools
// ============================================================================

export const SnailAnalyzeExample = () => {
  const [files, setFiles] = useState([]);
  const [prompt, setPrompt] = useState('');

  const handleAnalyze = () => {
    console.log('Analyzing screenshots with prompt:', prompt);
  };

  return (
    <div className="snail-analyze">
      <h2>
        <Tooltip tooltipKey="snail.analyze.title">
          🐌 Analyze
        </Tooltip>
      </h2>

      {/* Dropzone with tooltip */}
      <Tooltip tooltipKey="snail.analyze.dropzone">
        <div className="dropzone">
          <p>{tooltips.snail.analyze.dropzone.text}</p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setFiles(Array.from(e.target.files))}
          />
        </div>
      </Tooltip>

      {/* Optional prompt input */}
      <div className="form-group">
        <Label tooltipKey="snail.analyze.prompt" />
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={tooltips.snail.analyze.prompt.placeholder}
        />
      </div>

      {/* Run button */}
      <TooltipButton
        tooltipKey="snail.analyze.runButton"
        onClick={handleAnalyze}
        disabled={files.length === 0}
      />

      {/* Results with stat labels */}
      {files.length > 0 && (
        <div className="results-grid">
          <div className="stat">
            <Label tooltipKey="snail.analyze.results.hp" />
            <span>1250</span>
          </div>
          <div className="stat">
            <Label tooltipKey="snail.analyze.results.atk" />
            <span>450</span>
          </div>
          <div className="stat">
            <Label tooltipKey="snail.analyze.results.def" />
            <span>380</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXAMPLE 7: Direct Access Pattern (Alternative)
// ============================================================================

export const DirectAccessExample = () => {
  // For cases where you just need the text without a tooltip wrapper
  const buttonText = tooltips.dashboard.tasks.runVerify.text;
  const tooltipContent = tooltips.dashboard.tasks.runVerify.tooltip;

  return (
    <button title={tooltipContent}>
      {buttonText}
    </button>
  );
};

// ============================================================================
// EXAMPLE 8: TypeScript Usage (with type safety)
// ============================================================================

/*
// Create types/tooltips.ts first:
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
*/

// Then use in components:
/*
interface TooltipProps {
  tooltipKey: TooltipKey;  // Now you get autocomplete!
  children: React.ReactNode;
}

export const TypeSafeTooltip: React.FC<TooltipProps> = ({ tooltipKey, children }) => {
  // Implementation...
};
*/

// ============================================================================
// EXAMPLE 9: Mobile-Friendly Tooltip (tap instead of hover)
// ============================================================================

export const MobileTooltip = ({ tooltipKey, children }) => {
  const [visible, setVisible] = useState(false);
  const content = tooltipKey.split('.').reduce((obj, key) => obj?.[key], tooltips);

  const toggleTooltip = () => setVisible(!visible);

  return (
    <div className="mobile-tooltip-wrapper">
      <div onClick={toggleTooltip} className="tooltip-trigger">
        {children}
        <span className="info-icon">ⓘ</span>
      </div>
      {visible && (
        <div className="mobile-tooltip-overlay" onClick={toggleTooltip}>
          <div className="mobile-tooltip-content">
            {content?.tooltip}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXAMPLE 10: Helper Hook for Tooltip Content
// ============================================================================

export const useTooltip = (tooltipKey) => {
  const content = tooltipKey.split('.').reduce((obj, key) => obj?.[key], tooltips);

  return {
    text: content?.text || '',
    label: content?.label || '',
    placeholder: content?.placeholder || '',
    tooltip: content?.tooltip || '',
    hasTooltip: !!content?.tooltip
  };
};

// Usage:
export const HookExample = () => {
  const { text, tooltip } = useTooltip('dashboard.tasks.ingestDirectory');

  return (
    <button title={tooltip}>
      {text}
    </button>
  );
};

// ============================================================================
// CSS EXAMPLE (add to your global styles)
// ============================================================================

/*
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

.info-icon {
  margin-left: 4px;
  color: #888;
  font-size: 14px;
  cursor: help;
}

@media (prefers-color-scheme: dark) {
  .tooltip {
    background: #2a2a2a;
    color: #e0e0e0;
  }
}
*/
