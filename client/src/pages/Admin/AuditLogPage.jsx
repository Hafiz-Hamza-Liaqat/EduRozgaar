import { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';

import { SeoHead } from '../../components/seo';

import { adminApi } from '../../services/listingsService';

import { AdminTableFilters } from '../../components/admin/AdminTableFilters';

import { usePermissions } from '../../hooks/usePermissions';

import { PERMISSIONS } from '../../config/rbac';

import { AdminRouteGuard } from '../../components/admin/AdminRouteGuard';



const EMPTY_FILTERS = { search: '', action: '', from: '', to: '' };



export default function AuditLogPage() {

  const { t } = useTranslation(['admin', 'common']);

  const { can, role } = usePermissions();

  const [logs, setLogs] = useState([]);

  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const abortRef = useRef(null);



  const hasAccess = can(PERMISSIONS.AUDIT_READ);



  useEffect(() => {

    if (!hasAccess) {

      setLoading(false);

      return undefined;

    }



    abortRef.current?.abort();

    const controller = new AbortController();

    abortRef.current = controller;



    setLoading(true);

    setError(null);

    adminApi.auditLogs({ page, limit: 25, ...appliedFilters }, { signal: controller.signal })

      .then(({ data }) => {

        if (controller.signal.aborted) return;

        setLogs(data.data || []);

        setPagination(data.pagination || { page: 1, totalPages: 1 });

      })

      .catch((e) => {

        if (controller.signal.aborted || e.code === 'ERR_CANCELED') return;

        setError(e.response?.data?.error || t('common:failedToLoad'));

      })

      .finally(() => {

        if (!controller.signal.aborted) setLoading(false);

      });



    return () => controller.abort();

  }, [hasAccess, role, page, appliedFilters, t]);



  const applyFilters = () => {

    setPage(1);

    setAppliedFilters({ ...filters });

  };



  if (!hasAccess) {

    return (
      <AdminRouteGuard permission={PERMISSIONS.AUDIT_READ}>
        <p className="text-gray-500">{t('admin:noAuditAccess')}</p>
      </AdminRouteGuard>
    );

  }



  return (

    <AdminRouteGuard permission={PERMISSIONS.AUDIT_READ}>

      <SeoHead title={t('admin:auditLog')} noindex />

      <div className="max-w-5xl">

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('admin:auditLog')}</h1>



        <AdminTableFilters

          filters={filters}

          onChange={setFilters}

          fields={['search', 'action', 'from', 'to']}

        />

        <button

          type="button"

          onClick={applyFilters}

          className="mb-4 text-sm px-4 py-2 rounded-lg bg-primary text-white btn-theme"

        >

          {t('admin:applyFilters')}

        </button>



        {error && <p className="text-red-600 mb-4">{error}</p>}



        {loading ? (

          <div className="animate-pulse h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />

        ) : logs.length === 0 ? (

          <p className="text-gray-500">{t('admin:noAuditLogs')}</p>

        ) : (

          <div className="table-scroll rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">

                <tr>

                  <th className="text-left p-3">{t('admin:timestamp')}</th>

                  <th className="text-left p-3">{t('admin:actor')}</th>

                  <th className="text-left p-3">{t('admin:action')}</th>

                  <th className="text-left p-3">{t('admin:target')}</th>

                  <th className="text-left p-3">IP</th>

                  <th className="text-left p-3">{t('admin:status')}</th>

                </tr>

              </thead>

              <tbody>

                {logs.map((log) => (

                  <tr key={log._id} className="border-t border-gray-100 dark:border-gray-700">

                    <td className="p-3 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>

                    <td className="p-3">{log.actorEmail || log.actorRole || '—'}</td>

                    <td className="p-3 font-mono text-xs">{log.action}</td>

                    <td className="p-3">{log.targetLabel || log.targetType || '—'}</td>

                    <td className="p-3 text-xs text-gray-500">{log.ip || '—'}</td>

                    <td className="p-3">{log.status}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}



        {pagination.totalPages > 1 && (

          <div className="flex flex-wrap gap-2 mt-4">

            <button

              type="button"

              disabled={page <= 1}

              onClick={() => setPage((p) => Math.max(1, p - 1))}

              className="text-sm px-3 py-1 rounded border disabled:opacity-50"

            >

              {t('common:previous')}

            </button>

            <span className="text-sm text-gray-500 self-center">

              {page} / {pagination.totalPages}

            </span>

            <button

              type="button"

              disabled={page >= pagination.totalPages}

              onClick={() => setPage((p) => p + 1)}

              className="text-sm px-3 py-1 rounded border disabled:opacity-50"

            >

              {t('common:next')}

            </button>

          </div>

        )}

      </div>

    </AdminRouteGuard>

  );

}

