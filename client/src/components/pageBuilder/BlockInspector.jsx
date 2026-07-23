import { memo, useCallback, useMemo, useState } from 'react';
import {
  ANIMATION_PRESET_KEYS,
  ANIMATION_PRESET_LABELS,
  CONTAINER_WIDTH_KEYS,
  CONTAINER_WIDTH_LABELS,
  GRID_BLOCK_TYPES,
  GRID_COLUMN_OPTIONS,
  SPACING_PRESET_KEYS,
  SPACING_PRESET_LABELS,
  STYLE_PRESET_KEYS,
  STYLE_PRESET_LABELS,
  TYPOGRAPHY_ALIGN_KEYS,
  TYPOGRAPHY_BODY_SIZE_KEYS,
  TYPOGRAPHY_HEADING_SIZE_KEYS,
  TYPOGRAPHY_MAX_WIDTH_KEYS,
  TYPOGRAPHY_WEIGHT_KEYS,
} from '@shared/designTokens.js';
import { mergeBlockLayoutSettings, getBlockLayoutSettings } from '@shared/pageBuilderLayout.js';
import { adminFieldClass, AdminImageUrlField } from '../admin/AdminImageUrlField';
import { AdminSelectBare } from '../admin/AdminFormFields';
import { BlockConfigFields } from './BlockConfigFields';

function InspectorPanel({ title, open, onToggle, children, badge }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className="flex items-center gap-2 text-xs text-gray-500">
          {badge}
          <span aria-hidden>{open ? '▾' : '▸'}</span>
        </span>
      </button>
      {open ? <div className="p-3 space-y-3 border-t border-gray-200 dark:border-gray-700">{children}</div> : null}
    </div>
  );
}

function SpacingSelect({ label, value, onChange }) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <AdminSelectBare value={value} onChange={(e) => onChange(e.target.value)}>
        {SPACING_PRESET_KEYS.map((k) => (
          <option key={k} value={k}>{SPACING_PRESET_LABELS[k]}</option>
        ))}
      </AdminSelectBare>
    </label>
  );
}

function BlockInspectorInner({ block, definition, onUpdateBlock }) {
  const layout = useMemo(() => getBlockLayoutSettings(block), [block]);
  const supportsGrid = GRID_BLOCK_TYPES.has(block.type);

  const [openPanels, setOpenPanels] = useState(() => ({
    content: true,
    layout: false,
    spacing: false,
    background: false,
    typography: false,
    advanced: false,
  }));

  const toggle = useCallback((key) => {
    setOpenPanels((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const patchLayout = useCallback((patch) => {
    const nextLayout = mergeBlockLayoutSettings(block, patch);
    onUpdateBlock({
      ...block,
      metadata: { ...block.metadata, layout: nextLayout },
    });
  }, [block, onUpdateBlock]);

  const updateConfig = useCallback((key, val) => {
    onUpdateBlock({ ...block, config: { ...block.config, [key]: val } });
  }, [block, onUpdateBlock]);

  const hiddenCount = [
    !layout.visibility.desktop,
    !layout.visibility.tablet,
    !layout.visibility.mobile,
  ].filter(Boolean).length;

  return (
    <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
      <InspectorPanel
        title="Content"
        open={openPanels.content}
        onToggle={() => toggle('content')}
      >
        <BlockConfigFields
          blockType={block.type}
          definition={definition}
          config={block.config}
          onChange={updateConfig}
        />
      </InspectorPanel>

      <InspectorPanel
        title="Layout"
        open={openPanels.layout}
        onToggle={() => toggle('layout')}
        badge={hiddenCount ? `${hiddenCount} hidden` : null}
      >
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-gray-500 uppercase tracking-wide">Visibility</legend>
          {(['desktop', 'tablet', 'mobile']).map((bp) => (
            <label key={bp} className="flex items-center gap-2 text-sm capitalize">
              <input
                type="checkbox"
                checked={layout.visibility[bp] !== false}
                onChange={(e) => patchLayout({ visibility: { [bp]: e.target.checked } })}
              />
              {bp}
            </label>
          ))}
        </fieldset>
        <label className="block text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Container width</span>
          <AdminSelectBare
            value={layout.containerWidth}
            onChange={(e) => patchLayout({ containerWidth: e.target.value })}
          >
            {CONTAINER_WIDTH_KEYS.map((k) => (
              <option key={k} value={k}>{CONTAINER_WIDTH_LABELS[k]}</option>
            ))}
          </AdminSelectBare>
        </label>
        {supportsGrid ? (
          <fieldset className="grid grid-cols-3 gap-2">
            <legend className="col-span-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Grid columns</legend>
            {(['desktop', 'tablet', 'mobile']).map((bp) => (
              <label key={bp} className="block text-sm capitalize">
                <span className="text-xs text-gray-500">{bp}</span>
                <AdminSelectBare
                  value={String(layout.grid[bp])}
                  onChange={(e) => patchLayout({ grid: { [bp]: Number(e.target.value) } })}
                >
                  {GRID_COLUMN_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </AdminSelectBare>
              </label>
            ))}
          </fieldset>
        ) : null}
      </InspectorPanel>

      <InspectorPanel title="Spacing" open={openPanels.spacing} onToggle={() => toggle('spacing')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <SpacingSelect label="Padding top" value={layout.spacing.paddingTop} onChange={(v) => patchLayout({ spacing: { paddingTop: v } })} />
          <SpacingSelect label="Padding bottom" value={layout.spacing.paddingBottom} onChange={(v) => patchLayout({ spacing: { paddingBottom: v } })} />
          <SpacingSelect label="Margin top" value={layout.spacing.marginTop} onChange={(v) => patchLayout({ spacing: { marginTop: v } })} />
          <SpacingSelect label="Margin bottom" value={layout.spacing.marginBottom} onChange={(v) => patchLayout({ spacing: { marginBottom: v } })} />
        </div>
      </InspectorPanel>

      <InspectorPanel title="Background" open={openPanels.background} onToggle={() => toggle('background')}>
        <label className="block text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Type</span>
          <AdminSelectBare
            value={layout.background.type}
            onChange={(e) => patchLayout({ background: { type: e.target.value } })}
          >
            <option value="none">None</option>
            <option value="solid">Solid color</option>
            <option value="gradient">Gradient</option>
            <option value="image">Background image</option>
          </AdminSelectBare>
        </label>
        {layout.background.type === 'solid' ? (
          <label className="block text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Color</span>
            <input
              type="color"
              className="mt-1 h-9 w-12 rounded border"
              value={layout.background.color?.startsWith('#') ? layout.background.color : '#ffffff'}
              onChange={(e) => patchLayout({ background: { color: e.target.value } })}
            />
          </label>
        ) : null}
        {layout.background.type === 'gradient' ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium">From</span>
              <input type="color" className="mt-1 h-9 w-full" value={layout.background.gradientFrom || '#635BFF'} onChange={(e) => patchLayout({ background: { gradientFrom: e.target.value } })} />
            </label>
            <label className="block text-sm">
              <span className="font-medium">To</span>
              <input type="color" className="mt-1 h-9 w-full" value={layout.background.gradientTo || '#E0E7FF'} onChange={(e) => patchLayout({ background: { gradientTo: e.target.value } })} />
            </label>
          </div>
        ) : null}
        {layout.background.type === 'image' ? (
          <>
            <AdminImageUrlField
              label="Image URL"
              value={layout.background.imageUrl || ''}
              onChange={(v) => patchLayout({ background: { imageUrl: v } })}
              compact
              allowUpload={false}
            />
            <label className="block text-sm">
              <span className="font-medium">Overlay opacity (0–100)</span>
              <input type="range" min={0} max={100} value={Number(layout.background.overlayOpacity) || 0} onChange={(e) => patchLayout({ background: { overlayOpacity: Number(e.target.value) } })} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(layout.background.parallax)} onChange={(e) => patchLayout({ background: { parallax: e.target.checked } })} />
              Parallax (experimental)
            </label>
          </>
        ) : null}
      </InspectorPanel>

      <InspectorPanel title="Typography" open={openPanels.typography} onToggle={() => toggle('typography')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium">Heading size</span>
            <AdminSelectBare value={layout.typography.headingSize} onChange={(e) => patchLayout({ typography: { headingSize: e.target.value } })}>
              {TYPOGRAPHY_HEADING_SIZE_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
            </AdminSelectBare>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Body size</span>
            <AdminSelectBare value={layout.typography.bodySize} onChange={(e) => patchLayout({ typography: { bodySize: e.target.value } })}>
              {TYPOGRAPHY_BODY_SIZE_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
            </AdminSelectBare>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Alignment</span>
            <AdminSelectBare value={layout.typography.alignment} onChange={(e) => patchLayout({ typography: { alignment: e.target.value } })}>
              {TYPOGRAPHY_ALIGN_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
            </AdminSelectBare>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Weight</span>
            <AdminSelectBare value={layout.typography.weight} onChange={(e) => patchLayout({ typography: { weight: e.target.value } })}>
              {TYPOGRAPHY_WEIGHT_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
            </AdminSelectBare>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium">Max text width</span>
            <AdminSelectBare value={layout.typography.maxTextWidth} onChange={(e) => patchLayout({ typography: { maxTextWidth: e.target.value } })}>
              {TYPOGRAPHY_MAX_WIDTH_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
            </AdminSelectBare>
          </label>
        </div>
      </InspectorPanel>

      <InspectorPanel title="Advanced" open={openPanels.advanced} onToggle={() => toggle('advanced')}>
        <label className="block text-sm">
          <span className="font-medium">Style preset</span>
          <AdminSelectBare value={layout.stylePreset} onChange={(e) => patchLayout({ stylePreset: e.target.value })}>
            {STYLE_PRESET_KEYS.map((k) => (
              <option key={k} value={k}>{STYLE_PRESET_LABELS[k]}</option>
            ))}
          </AdminSelectBare>
        </label>
        <label className="block text-sm">
          <span className="font-medium">Enter animation</span>
          <AdminSelectBare value={layout.animation} onChange={(e) => patchLayout({ animation: e.target.value })}>
            {ANIMATION_PRESET_KEYS.map((k) => (
              <option key={k} value={k}>{ANIMATION_PRESET_LABELS[k]}</option>
            ))}
          </AdminSelectBare>
        </label>
        <p className="text-xs text-gray-500">Animations respect prefers-reduced-motion.</p>
      </InspectorPanel>
    </div>
  );
}

export const BlockInspector = memo(BlockInspectorInner, (prev, next) => (
  prev.block === next.block && prev.definition === next.definition
));
