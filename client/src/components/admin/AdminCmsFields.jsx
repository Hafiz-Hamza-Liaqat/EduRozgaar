import { adminFieldClass } from './AdminImageUrlField';
import { AdminImageUrlField } from './AdminImageUrlField';
import { AdminSelectBare } from '../admin/AdminFormFields';

const SCHEMA_TYPES = ['WebPage', 'AboutPage', 'FAQPage', 'ContactPage', 'Article'];
const TWITTER_CARDS = ['summary', 'summary_large_image'];

export function AdminLocaleSelect({ value, onChange, className = adminFieldClass }) {
  return (
    <AdminSelectBare value={value || 'en'} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="en">English</option>
      <option value="ur">Urdu</option>
      <option value="ar">Arabic</option>
    </AdminSelectBare>
  );
}

export function AdminSeoFields({ form, setForm, showCanonical = true }) {
  return (
    <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
      <h3 className="font-semibold text-gray-900 dark:text-white">SEO</h3>
      <label className="block text-sm">
        Meta title
        <input className={adminFieldClass} value={form.seoTitle || ''} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
      </label>
      <label className="block text-sm">
        Meta description
        <textarea className={adminFieldClass} rows={2} value={form.metaDescription || ''} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} />
      </label>
      {showCanonical && (
        <label className="block text-sm">
          Canonical URL
          <input className={adminFieldClass} value={form.canonicalUrl || ''} onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })} />
        </label>
      )}
      <AdminImageUrlField
        label="OG image URL"
        value={form.ogImageUrl || ''}
        onChange={(v) => setForm({ ...form, ogImageUrl: v })}
        compact
      />
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-sm">
          Twitter card
          <AdminSelectBare  value={form.twitterCard || 'summary_large_image'} onChange={(e) => setForm({ ...form, twitterCard: e.target.value })}>
            {TWITTER_CARDS.map((c) => <option key={c} value={c}>{c}</option>)}
          </AdminSelectBare>
        </label>
        <label className="block text-sm">
          Schema type
          <AdminSelectBare  value={form.schemaType || 'WebPage'} onChange={(e) => setForm({ ...form, schemaType: e.target.value })}>
            {SCHEMA_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
          </AdminSelectBare>
        </label>
      </div>
    </div>
  );
}

export function AdminPublishFields({ form, setForm, canPublish }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <label className="block text-sm">
        Status
        <AdminSelectBare
          
          value={form.status || 'draft'}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          disabled={!canPublish && form.status !== 'published'}
        >
          <option value="draft">Draft</option>
          {canPublish && <option value="published">Published</option>}
          {canPublish && <option value="archived">Archived</option>}
        </AdminSelectBare>
      </label>
      <label className="block text-sm">
        Schedule publish (optional)
        <input
          type="datetime-local"
          className={adminFieldClass}
          value={form.scheduledAt ? form.scheduledAt.slice(0, 16) : ''}
          onChange={(e) => setForm({ ...form, scheduledAt: e.target.value || '' })}
        />
      </label>
    </div>
  );
}
