import { useTranslation } from 'react-i18next';
import { AdminSelectBare, adminFieldClass } from '../admin/AdminFormFields';

export function AdminTableFilters({ filters, onChange, fields = [] }) {
  const { t } = useTranslation('admin');

  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap gap-3 mb-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      {fields.includes('search') && (
        <input
          type="search"
          placeholder={t('filterSearch')}
          value={filters.search || ''}
          onChange={(e) => update('search', e.target.value)}
          className={`w-full sm:flex-1 sm:min-w-[160px] min-w-0 ${adminFieldClass}`}
        />
      )}
      {fields.includes('status') && (
        <AdminSelectBare
          value={filters.status || filters.approvalStatus || ''}
          onChange={(e) => update(fields.includes('approvalStatus') ? 'approvalStatus' : 'status', e.target.value)}
          className={adminFieldClass}
        >
          <option value="">{t('filterAll')}</option>
          <option value="draft">{t('statusDraft')}</option>
          <option value="active">{t('statusActive')}</option>
          <option value="closed">{t('statusClosed')}</option>
          <option value="pending">{t('filterPending')}</option>
          <option value="approved">{t('filterApproved')}</option>
          <option value="rejected">{t('filterRejected')}</option>
          <option value="completed">{t('statusCompleted')}</option>
          <option value="failed">{t('statusFailed')}</option>
          <option value="refunded">{t('statusRefunded')}</option>
          <option value="suspended">{t('statusSuspended')}</option>
        </AdminSelectBare>
      )}
      {fields.includes('approvalStatus') && !fields.includes('status') && (
        <AdminSelectBare
          value={filters.approvalStatus || ''}
          onChange={(e) => update('approvalStatus', e.target.value)}
          className={adminFieldClass}
        >
          <option value="">{t('filterAll')}</option>
          <option value="pending">{t('filterPending')}</option>
          <option value="approved">{t('filterApproved')}</option>
          <option value="rejected">{t('filterRejected')}</option>
        </AdminSelectBare>
      )}
      {fields.includes('country') && (
        <input
          type="text"
          placeholder={t('countryPlaceholder')}
          value={filters.country || ''}
          onChange={(e) => update('country', e.target.value)}
          className={adminFieldClass}
        />
      )}
      {fields.includes('funding') && (
        <input
          type="text"
          placeholder={t('fieldFunding')}
          value={filters.funding || ''}
          onChange={(e) => update('funding', e.target.value)}
          className={adminFieldClass}
        />
      )}
      {fields.includes('province') && (
        <input
          type="text"
          placeholder={t('filterProvince')}
          value={filters.province || ''}
          onChange={(e) => update('province', e.target.value)}
          className={adminFieldClass}
        />
      )}
      {fields.includes('city') && (
        <input
          type="text"
          placeholder={t('filterCity')}
          value={filters.city || ''}
          onChange={(e) => update('city', e.target.value)}
          className={adminFieldClass}
        />
      )}
      {fields.includes('category') && (
        <input
          type="text"
          placeholder={t('filterCategory')}
          value={filters.category || ''}
          onChange={(e) => update('category', e.target.value)}
          className={adminFieldClass}
        />
      )}
      {fields.includes('employer') && (
        <input
          type="text"
          placeholder={t('filterEmployer')}
          value={filters.employer || ''}
          onChange={(e) => update('employer', e.target.value)}
          className={adminFieldClass}
        />
      )}
      {fields.includes('role') && (
        <AdminSelectBare
          value={filters.role || ''}
          onChange={(e) => update('role', e.target.value)}
          className={adminFieldClass}
        >
          <option value="">{t('filterAllRoles')}</option>
          <option value="User">{t('roleStudent')}</option>
          <option value="Editor">{t('roleEditor')}</option>
          <option value="Moderator">{t('roleModerator')}</option>
          <option value="Admin">{t('roleAdmin')}</option>
          <option value="SuperAdmin">{t('roleSuperAdmin')}</option>
        </AdminSelectBare>
      )}
      {fields.includes('provider') && (
        <AdminSelectBare
          value={filters.provider || ''}
          onChange={(e) => update('provider', e.target.value)}
          className={adminFieldClass}
        >
          <option value="">{t('filterAllGateways')}</option>
          <option value="stripe">Stripe</option>
          <option value="manual">Manual</option>
        </AdminSelectBare>
      )}
      {fields.includes('featured') && (
        <AdminSelectBare
          value={filters.featured || ''}
          onChange={(e) => update('featured', e.target.value)}
          className={adminFieldClass}
        >
          <option value="">{t('filterAll')}</option>
          <option value="true">{t('filterFeatured')}</option>
        </AdminSelectBare>
      )}
      {fields.includes('from') && (
        <input
          type="date"
          value={filters.from || ''}
          onChange={(e) => update('from', e.target.value)}
          className={adminFieldClass}
        />
      )}
      {fields.includes('to') && (
        <input
          type="date"
          value={filters.to || ''}
          onChange={(e) => update('to', e.target.value)}
          className={adminFieldClass}
        />
      )}
      {fields.includes('action') && (
        <input
          type="text"
          placeholder={t('filterAction')}
          value={filters.action || ''}
          onChange={(e) => update('action', e.target.value)}
          className={adminFieldClass}
        />
      )}
    </div>
  );
}
