import { useEffect, useState } from 'react';
import { adminFieldClass } from '../admin/AdminImageUrlField';
import { adminContentApi } from '../../services/adminContentApi';

/**
 * Form picker for page builder block config (C.7.0.2).
 */
export function FormPickerField({ value, onChange }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminContentApi.listPublishedForms()
      .then(({ data }) => setForms(data?.items || []))
      .catch(() => setForms([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-xs text-gray-500 mt-1">Loading forms…</p>;

  return (
    <select
      className={`${adminFieldClass} mt-1`}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select a form…</option>
      {forms.map((f) => (
        <option key={f._id} value={f._id}>{f.name} ({f.slug})</option>
      ))}
    </select>
  );
}
