import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { talentApi } from '../../services/talentApi';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { formToProfilePayload } from './talentProfileMapper';
import { ResumePreview } from '../ResumeBuilder/ResumePreview';
import { ResumeDownload } from '../ResumeBuilder/ResumeDownload';
import { talentProfileToResumeView } from '@shared/career/resumeBridge.js';
import { ROUTES } from '../../constants';
import '../ResumeBuilder/resume-document.css';

function snapshotToResumeView(snapshot = {}, meta = {}) {
  const skills = Array.isArray(snapshot.skills)
    ? snapshot.skills
    : [
        ...(snapshot.skills?.technical || []).map((name) => ({ name, category: 'technical' })),
        ...(snapshot.skills?.soft || []).map((name) => ({ name, category: 'soft' })),
      ];

  return talentProfileToResumeView({
    displayName: snapshot.displayName || snapshot.personalInfo?.fullName || '',
    headline: snapshot.headline || snapshot.personalInfo?.professionalTitle || '',
    summary: snapshot.summary || snapshot.careerObjective || '',
    education: snapshot.education || [],
    experience: snapshot.experience || [],
    skills,
    languages: snapshot.languages || [],
    certificationReferences: snapshot.certifications
      || (snapshot.certificationReferences || []).map((c) => (typeof c === 'string' ? { name: c } : c)),
    portfolioReferences: snapshot.projects || snapshot.portfolioReferences || [],
    socialProfile: snapshot.socialProfile || {
      linkedInUrl: snapshot.personalInfo?.linkedInUrl,
      githubUrl: snapshot.personalInfo?.githubUrl,
      portfolioUrl: snapshot.personalInfo?.portfolioUrl,
    },
    personal: {
      phone: snapshot.personalInfo?.phone || '',
      city: snapshot.personalInfo?.city || '',
      region: snapshot.personalInfo?.province || '',
    },
    avatarUrl: snapshot.personalInfo?.profilePhotoUrl || '',
  }, meta);
}

export function ResumeVersionsPanel({ profileLoaded, form }) {
  const { t } = useTranslation(['talent', 'common', 'resume']);
  const { toast } = useToast();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [previewMode, setPreviewMode] = useState('professional');
  const [busy, setBusy] = useState(false);
  const previewRef = useRef(null);

  const load = useCallback(() => {
    if (!profileLoaded) return;
    setLoading(true);
    talentApi
      .listResumeVersions()
      .then(({ data }) => setVersions(data || []))
      .catch(() => toast.error(t('talent:resumes.error')))
      .finally(() => setLoading(false));
  }, [profileLoaded, t, toast]);

  useEffect(() => { load(); }, [load]);

  const resumeView = useMemo(() => {
    if (!preview?.snapshot) return null;
    return snapshotToResumeView(preview.snapshot, {
      _id: preview._id,
      title: preview.title,
      template: preview.template,
    });
  }, [preview]);

  const template = previewMode === 'ats'
    ? 'minimal-ats'
    : (preview?.template || resumeView?.template || 'modern-professional');

  const handleCreate = async () => {
    setBusy(true);
    try {
      const payload = formToProfilePayload(form);
      await talentApi.updateMe(payload);
      await talentApi.createResumeVersion({
        title: 'My Resume',
        isPrimary: versions.length === 0,
        status: 'draft',
        snapshot: {
          displayName: payload.displayName,
          headline: payload.headline,
          summary: payload.summary,
          education: payload.education,
          experience: payload.experience,
          skills: payload.skills,
          languages: payload.languages,
          certifications: payload.certificationReferences,
          projects: payload.portfolioReferences,
          socialProfile: payload.socialProfile,
        },
      });
      toast.success(t('talent:resumes.createSuccess'));
      load();
    } catch {
      toast.error(t('talent:resumes.error'));
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await talentApi.publishResumeVersion(id);
      toast.success(t('talent:resumes.publishSuccess'));
      load();
    } catch {
      toast.error(t('talent:resumes.error'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('talent:resumes.deleteConfirm'))) return;
    try {
      await talentApi.deleteResumeVersion(id);
      toast.success(t('talent:resumes.deleteSuccess'));
      if (preview?._id === id) setPreview(null);
      load();
    } catch {
      toast.error(t('talent:resumes.error'));
    }
  };

  const handlePreview = async (id) => {
    try {
      const { data } = await talentApi.getResumeVersion(id);
      setPreview(data);
      setPreviewMode('professional');
    } catch {
      toast.error(t('talent:resumes.error'));
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">{t('common:loading')}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('talent:resumes.title')}</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            to={ROUTES.RESUME_BUILDER}
            className="inline-flex items-center px-3 py-2 rounded-lg border text-sm text-primary border-primary hover:bg-primary/5"
          >
            {t('talent:resumes.openBuilder', { defaultValue: 'Open Resume Builder' })}
          </Link>
          <Button type="button" onClick={handleCreate} disabled={busy || !profileLoaded}>
            {t('talent:resumes.create')}
          </Button>
        </div>
      </div>

      {versions.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('talent:resumes.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {versions.map((v) => (
            <li key={v._id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">{v.title}</p>
                <p className="text-xs text-gray-500">
                  {t('talent:resumes.version')} {v.sourceVersion} · {t('talent:resumes.status')}: {v.status}
                  {v.isPrimary ? ` · ${t('talent:resumes.primary')}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => handlePreview(v._id)}>{t('talent:resumes.preview')}</Button>
                {v.status !== 'published' && (
                  <Button type="button" variant="secondary" onClick={() => handlePublish(v._id)}>{t('talent:resumes.publish')}</Button>
                )}
                <Button type="button" variant="outline" onClick={() => handleDelete(v._id)}>{t('talent:resumes.delete')}</Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {preview && resumeView ? (
        <div className="rounded-xl border border-primary/30 bg-gray-50 dark:bg-gray-900/40 p-4 space-y-3">
          <div className="flex flex-wrap justify-between items-start gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">{preview.title}</h3>
            <Button type="button" variant="outline" onClick={() => setPreview(null)}>{t('common:close')}</Button>
          </div>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Preview mode">
            {[
              { id: 'professional', label: t('talent:resumes.previewProfessional', { defaultValue: 'Professional' }) },
              { id: 'ats', label: t('talent:resumes.previewAts', { defaultValue: 'ATS-friendly' }) },
              { id: 'print', label: t('talent:resumes.previewPrint', { defaultValue: 'Print' }) },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={previewMode === mode.id}
                onClick={() => setPreviewMode(mode.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  previewMode === mode.id
                    ? 'bg-primary text-white'
                    : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className={previewMode === 'print' ? 'print:block bg-white p-2' : ''}>
            <ResumePreview ref={previewRef} resume={resumeView} template={template} />
          </div>

          <div className="flex flex-wrap gap-2">
            <ResumeDownload previewRef={previewRef} fileName={(preview.title || 'Strideto-Resume').replace(/\s+/g, '-')} />
            {previewMode === 'print' ? (
              <Button type="button" variant="secondary" onClick={() => window.print()}>
                {t('talent:resumes.print', { defaultValue: 'Print' })}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
