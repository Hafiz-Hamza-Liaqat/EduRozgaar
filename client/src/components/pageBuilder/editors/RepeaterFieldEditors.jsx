import { adminFieldClass, AdminImageUrlField } from '../../admin/AdminImageUrlField';

function RepeaterShell({ children, onAdd, addLabel = 'Add item' }) {
  return (
    <div className="mt-1 space-y-2">
      <div className="space-y-3">{children}</div>
      <button
        type="button"
        onClick={onAdd}
        className="text-xs px-3 py-1.5 rounded border border-dashed border-gray-400 dark:border-gray-500 hover:border-primary"
      >
        + {addLabel}
      </button>
    </div>
  );
}

function ItemCard({ index, onRemove, children }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2 bg-gray-50/50 dark:bg-gray-900/30">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-500">#{index + 1}</span>
        <button type="button" onClick={onRemove} className="text-xs text-red-600 hover:underline">
          Remove
        </button>
      </div>
      {children}
    </div>
  );
}

function ImageUrlField({ label, value, onChange }) {
  return (
    <AdminImageUrlField
      label={label}
      value={value}
      onChange={onChange}
      compact
      className="text-xs"
    />
  );
}

function FieldInput({ label, value, onChange, type = 'text', rows, placeholder }) {
  return (
    <label className="block text-xs">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      {type === 'textarea' ? (
        <textarea
          className={`${adminFieldClass} mt-0.5 text-sm`}
          rows={rows || 3}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={`${adminFieldClass} mt-0.5 text-sm`}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

export function FaqItemsEditor({ value, onChange }) {
  const items = Array.isArray(value) ? value : [];

  const update = (next) => onChange(next);

  return (
    <RepeaterShell
      addLabel="Add question"
      onAdd={() => update([...items, { question: '', answer: '' }])}
    >
      {items.map((item, i) => (
        <ItemCard key={i} index={i} onRemove={() => update(items.filter((_, j) => j !== i))}>
          <FieldInput
            label="Question *"
            value={item.question || ''}
            onChange={(v) => {
              const next = [...items];
              next[i] = { ...next[i], question: v };
              update(next);
            }}
          />
          <FieldInput
            label="Answer *"
            type="textarea"
            value={item.answer || ''}
            onChange={(v) => {
              const next = [...items];
              next[i] = { ...next[i], answer: v };
              update(next);
            }}
          />
        </ItemCard>
      ))}
      {!items.length ? <p className="text-xs text-gray-500">No FAQ items yet.</p> : null}
    </RepeaterShell>
  );
}

export function GalleryItemsEditor({ value, onChange }) {
  const items = Array.isArray(value) ? value : [];
  const update = (next) => onChange(next);

  return (
    <RepeaterShell addLabel="Add image" onAdd={() => update([...items, { url: '', alt: '', caption: '' }])}>
      {items.map((item, i) => (
        <ItemCard key={i} index={i} onRemove={() => update(items.filter((_, j) => j !== i))}>
          <ImageUrlField
            label="Image URL *"
            value={item.url || ''}
            onChange={(v) => {
              const next = [...items];
              next[i] = { ...next[i], url: v };
              update(next);
            }}
          />
          <FieldInput
            label="Alt text *"
            value={item.alt || ''}
            onChange={(v) => {
              const next = [...items];
              next[i] = { ...next[i], alt: v };
              update(next);
            }}
          />
          <FieldInput
            label="Caption"
            value={item.caption || ''}
            onChange={(v) => {
              const next = [...items];
              next[i] = { ...next[i], caption: v };
              update(next);
            }}
          />
        </ItemCard>
      ))}
      {!items.length ? <p className="text-xs text-gray-500">No gallery images yet.</p> : null}
    </RepeaterShell>
  );
}

export function LogosItemsEditor({ value, onChange }) {
  const items = Array.isArray(value) ? value : [];
  const update = (next) => onChange(next);

  return (
    <RepeaterShell addLabel="Add logo" onAdd={() => update([...items, { url: '', alt: '', linkUrl: '' }])}>
      {items.map((item, i) => (
        <ItemCard key={i} index={i} onRemove={() => update(items.filter((_, j) => j !== i))}>
          <ImageUrlField
            label="Logo image *"
            value={item.url || ''}
            onChange={(v) => {
              const next = [...items];
              next[i] = { ...next[i], url: v };
              update(next);
            }}
          />
          <FieldInput
            label="Alt text"
            value={item.alt || ''}
            onChange={(v) => {
              const next = [...items];
              next[i] = { ...next[i], alt: v };
              update(next);
            }}
          />
          <FieldInput
            label="Link URL"
            type="url"
            value={item.linkUrl || ''}
            onChange={(v) => {
              const next = [...items];
              next[i] = { ...next[i], linkUrl: v };
              update(next);
            }}
          />
        </ItemCard>
      ))}
      {!items.length ? <p className="text-xs text-gray-500">No logos yet.</p> : null}
    </RepeaterShell>
  );
}

export function FeatureCardsEditor({ value, onChange }) {
  const items = Array.isArray(value) ? value : [];

  const update = (next) => onChange(next);

  return (
    <RepeaterShell addLabel="Add card" onAdd={() => update([...items, { icon: '', imageUrl: '', title: '', description: '', linkUrl: '' }])}>
      {items.map((item, i) => (
        <ItemCard key={i} index={i} onRemove={() => update(items.filter((_, j) => j !== i))}>
          <div className="grid gap-2 sm:grid-cols-2">
            <FieldInput
              label="Icon (emoji/text)"
              value={item.icon || ''}
              placeholder="★"
              onChange={(v) => {
                const next = [...items];
                next[i] = { ...next[i], icon: v };
                update(next);
              }}
            />
            <ImageUrlField
              label="Image URL (optional)"
              value={item.imageUrl || ''}
              onChange={(v) => {
                const next = [...items];
                next[i] = { ...next[i], imageUrl: v };
                update(next);
              }}
            />
          </div>
          <FieldInput
            label="Title *"
            value={item.title || ''}
            onChange={(v) => {
              const next = [...items];
              next[i] = { ...next[i], title: v };
              update(next);
            }}
          />
          <FieldInput
            label="Description"
            type="textarea"
            value={item.description || ''}
            onChange={(v) => {
              const next = [...items];
              next[i] = { ...next[i], description: v };
              update(next);
            }}
          />
          <FieldInput
            label="Link URL"
            type="url"
            value={item.linkUrl || ''}
            onChange={(v) => {
              const next = [...items];
              next[i] = { ...next[i], linkUrl: v };
              update(next);
            }}
          />
        </ItemCard>
      ))}
      {!items.length ? <p className="text-xs text-gray-500">No feature cards yet.</p> : null}
    </RepeaterShell>
  );
}
