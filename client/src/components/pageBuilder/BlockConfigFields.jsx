import { memo } from 'react';
import { adminFieldClass, AdminImageUrlField } from '../admin/AdminImageUrlField';
import { AdminSelectBare } from '../admin/AdminFormFields';
import { BlockCustomField, isCustomField, shouldHideField } from './editors/BlockCustomField';
import { DynamicBlockSettingsEditor } from './dynamic/DynamicBlockSettingsEditor';
import { isDynamicBlockType } from '@shared/dynamicBlocks/registry.js';
import { isMediaPickerField } from '@shared/mediaLibrary.js';

function BlockConfigFieldsInner({ blockType, definition, config, onChange }) {
  const fields = definition?.fields || [];
  const isDynamic = isDynamicBlockType(blockType);

  return (
    <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      {isDynamic && (
        <DynamicBlockSettingsEditor
          blockType={blockType}
          config={config}
          onChange={onChange}
        />
      )}
      {fields.map((field) => {
        if (isDynamic) return null;
        if (shouldHideField(blockType, field, config)) return null;

        const value = config?.[field.key] ?? '';
        const common = {
          className: adminFieldClass,
          id: `${definition.blockType}-${field.key}`,
        };

        if (isCustomField(blockType, field)) {
          return (
            <div key={field.key} className="block text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">{field.label}</span>
              <BlockCustomField
                blockType={blockType}
                field={field}
                config={config}
                onChange={onChange}
              />
            </div>
          );
        }

        if (isMediaPickerField(field)) {
          return (
            <AdminImageUrlField
              key={field.key}
              label={`${field.label}${field.required ? ' *' : ''}`}
              value={value}
              onChange={(v) => onChange(field.key, v)}
              placeholder={field.placeholder}
              compact
              allowUpload={false}
            />
          );
        }

        return (
          <label key={field.key} className="block text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.required ? ' *' : ''}
            </span>
            {field.type === 'textarea' ? (
              <textarea
                {...common}
                rows={4}
                value={value}
                placeholder={field.placeholder}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            ) : field.type === 'select' ? (
              <AdminSelectBare
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
              >
                {(field.options || []).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </AdminSelectBare>
            ) : field.type === 'boolean' ? (
              <input
                type="checkbox"
                className="mt-1"
                checked={Boolean(value)}
                onChange={(e) => onChange(field.key, e.target.checked)}
              />
            ) : field.type === 'range' ? (
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="range"
                  min={field.min ?? 0}
                  max={field.max ?? 100}
                  value={Number(value) || 0}
                  onChange={(e) => onChange(field.key, Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs text-gray-500 w-8 text-right">{Number(value) || 0}</span>
              </div>
            ) : field.type === 'color' ? (
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={String(value || '#ffffff').startsWith('#') ? value : '#ffffff'}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className="h-9 w-12 rounded border border-gray-300 dark:border-gray-600"
                />
                <input
                  {...common}
                  type="text"
                  value={value}
                  placeholder={field.placeholder || '#ffffff'}
                  onChange={(e) => onChange(field.key, e.target.value)}
                />
              </div>
            ) : (
              <input
                {...common}
                type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'}
                min={field.min}
                max={field.max}
                value={value}
                placeholder={field.placeholder}
                onChange={(e) => onChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

export const BlockConfigFields = memo(BlockConfigFieldsInner);
