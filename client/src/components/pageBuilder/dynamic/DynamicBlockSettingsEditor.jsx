import { adminFieldClass } from '../../admin/AdminImageUrlField';
import { getDynamicBlockDefaults } from '@shared/dynamicBlocks/registry.js';

function Field({ label, children }) {
  return (
    <label className="block text-xs mb-2">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <div className="mt-0.5">{children}</div>
    </label>
  );
}

/**
 * Visual settings editor for dynamic blocks (no raw JSON).
 */
export function DynamicBlockSettingsEditor({ blockType, config, onChange }) {
  const defaults = getDynamicBlockDefaults(blockType);
  const c = { ...defaults, ...config };

  const patch = (key, value) => onChange(key, value);

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50/50 dark:bg-gray-900/30">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Dynamic content settings</p>

      <Field label="Section title">
        <input className={adminFieldClass} value={c.title || ''} onChange={(e) => patch('title', e.target.value)} />
      </Field>

      <Field label="Items to display">
        <input type="number" min={1} max={24} className={adminFieldClass} value={c.count ?? c.limit ?? 6} onChange={(e) => patch('count', Number(e.target.value))} />
      </Field>

      <Field label="Layout">
        <select className={adminFieldClass} value={c.layout || 'grid'} onChange={(e) => patch('layout', e.target.value)}>
          <option value="grid">Grid</option>
          <option value="list">List</option>
        </select>
      </Field>

      <Field label="Card style">
        <select className={adminFieldClass} value={c.cardStyle || 'default'} onChange={(e) => patch('cardStyle', e.target.value)}>
          <option value="default">Default</option>
          <option value="compact">Compact</option>
          <option value="featured">Featured</option>
        </select>
      </Field>

      {blockType === 'featured-jobs' && (
        <>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={Boolean(c.governmentOnly)} onChange={(e) => patch('governmentOnly', e.target.checked)} />
            Government jobs only
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={Boolean(c.featuredOnly)} onChange={(e) => patch('featuredOnly', e.target.checked)} />
            Featured only
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={Boolean(c.remote)} onChange={(e) => patch('remote', e.target.checked)} />
            Remote only
          </label>
          <Field label="Province">
            <input className={adminFieldClass} value={c.province || ''} onChange={(e) => patch('province', e.target.value)} placeholder="e.g. Punjab" />
          </Field>
          <Field label="Category">
            <input className={adminFieldClass} value={c.category || ''} onChange={(e) => patch('category', e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={c.showLogo !== false} onChange={(e) => patch('showLogo', e.target.checked)} />
            Show logo
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={c.showDeadline !== false} onChange={(e) => patch('showDeadline', e.target.checked)} />
            Show deadline
          </label>
        </>
      )}

      {blockType === 'featured-scholarships' && (
        <>
          <Field label="Country">
            <input className={adminFieldClass} value={c.country || ''} onChange={(e) => patch('country', e.target.value)} placeholder="e.g. UK" />
          </Field>
          <Field label="Degree level">
            <input className={adminFieldClass} value={c.degree || ''} onChange={(e) => patch('degree', e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={c.featured !== false} onChange={(e) => patch('featured', e.target.checked)} />
            Featured only
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={c.deadlineFirst !== false} onChange={(e) => patch('deadlineFirst', e.target.checked)} />
            Sort by deadline
          </label>
        </>
      )}

      {blockType === 'featured-admissions' && (
        <>
          <Field label="University">
            <input className={adminFieldClass} value={c.university || ''} onChange={(e) => patch('university', e.target.value)} />
          </Field>
          <Field label="Province">
            <input className={adminFieldClass} value={c.province || ''} onChange={(e) => patch('province', e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={c.upcomingOnly !== false} onChange={(e) => patch('upcomingOnly', e.target.checked)} />
            Upcoming only
          </label>
        </>
      )}

      {blockType === 'dynamic-universities' && (
        <>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={Boolean(c.featured)} onChange={(e) => patch('featured', e.target.checked)} />
            Featured only
          </label>
          <Field label="Type">
            <select className={adminFieldClass} value={c.institutionType || ''} onChange={(e) => patch('institutionType', e.target.value)}>
              <option value="">All</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </Field>
          <Field label="Province">
            <input className={adminFieldClass} value={c.province || ''} onChange={(e) => patch('province', e.target.value)} />
          </Field>
        </>
      )}

      {(blockType === 'dynamic-blogs' || blockType === 'dynamic-career') && (
        <Field label="Category">
          <input className={adminFieldClass} value={c.category || ''} onChange={(e) => patch('category', e.target.value)} placeholder="e.g. Career" />
        </Field>
      )}

      {blockType === 'dynamic-testimonials' && (
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={Boolean(c.random)} onChange={(e) => patch('random', e.target.checked)} />
          Random order
        </label>
      )}

      {blockType === 'dynamic-partners' && (
        <Field label="Grid columns">
          <input type="number" min={2} max={6} className={adminFieldClass} value={c.gridSize || 4} onChange={(e) => patch('gridSize', Number(e.target.value))} />
        </Field>
      )}

      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={c.showImage !== false} onChange={(e) => patch('showImage', e.target.checked)} />
        Show image
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={c.showDescription !== false} onChange={(e) => patch('showDescription', e.target.checked)} />
        Show description
      </label>

      <Field label="View all button text">
        <input className={adminFieldClass} value={c.buttonText || ''} onChange={(e) => patch('buttonText', e.target.value)} />
      </Field>
      <Field label="View all link">
        <input className={adminFieldClass} value={c.buttonLink || ''} onChange={(e) => patch('buttonLink', e.target.value)} />
      </Field>
      <Field label="Empty state message (preview)">
        <input className={adminFieldClass} value={c.emptyMessage || ''} onChange={(e) => patch('emptyMessage', e.target.value)} />
      </Field>
    </div>
  );
}
