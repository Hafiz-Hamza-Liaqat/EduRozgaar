import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, combineSchemas, webPageSchema } from '../../seo/schemas';
import { DEFAULT_KEYWORDS } from '../../seo/config';
import { useAuth } from '../../context/AuthContext';
import { resumesApi } from '../../services/listingsService';
import { ROUTES } from '../../constants';
import { defaultResume } from './resumeDefaults';
import { TemplateSelector } from './TemplateSelector';
import { ResumeWizard } from './ResumeWizard';
import { ResumePreview } from './ResumePreview';
import { ResumeScore } from './ResumeScore';
import { ResumeDownload } from './ResumeDownload';
import { useToast } from '../../context/ToastContext';

export default function ResumeBuilder() {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('id');
  const optimizeForJobId = searchParams.get('optimizeForJob');
  const [resume, setResume] = useState(defaultResume);
  const [resumeId, setResumeId] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState(null);
  const previewRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!editId || !isAuthenticated) {
      if (!editId) setLoading(false);
      return;
    }
    resumesApi
      .getById(editId)
      .then(({ data }) => {
        const r = data;
        setResume({
          title: r.title || 'My Resume',
          template: r.template || 'modern-professional',
          personalInfo: r.personalInfo || {},
          careerObjective: r.careerObjective || '',
          education: r.education || [],
          skills: r.skills || { technical: [], soft: [] },
          experience: r.experience || [],
          projects: r.projects || [],
          certifications: r.certifications || [],
          languages: r.languages || [],
        });
        setResumeId(r._id);
      })
      .catch(() => toast.error('Could not load resume.'))
      .finally(() => setLoading(false));
  }, [editId, isAuthenticated, toast]);

  useEffect(() => {
    if (!optimizeForJobId || !isAuthenticated) return;
    const call = resumeId
      ? resumesApi.optimizeForJob(resumeId, optimizeForJobId)
      : resumesApi.optimizeForJob(null, optimizeForJobId, resume);
    call.then(({ data }) => setOptimizeResult(data)).catch(() => setOptimizeResult(null));
  }, [optimizeForJobId, isAuthenticated, resumeId]);

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Login to save your resume.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: resume.title,
        template: resume.template,
        personalInfo: resume.personalInfo,
        careerObjective: resume.careerObjective,
        education: resume.education,
        skills: resume.skills,
        experience: resume.experience,
        projects: resume.projects,
        certifications: (resume.certifications || []).filter(Boolean),
        languages: (resume.languages || []).filter(Boolean),
      };
      if (resumeId) {
        await resumesApi.update(resumeId, payload);
        toast.success('Resume updated.');
      } else {
        const { data } = await resumesApi.create(payload);
        setResumeId(data._id);
        toast.success('Resume saved.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save resume.');
    } finally {
      setSaving(false);
    }
  };

  const fileName = (resume.personalInfo?.fullName || 'Resume').replace(/\s+/g, '-') + '-EduRozgaar';

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <>
      <SeoHead
        title="Resume Builder – EduRozgaar"
        description="Build a professional CV for jobs, scholarships, and admissions. Multiple templates, AI suggestions, PDF export."
        canonical={ROUTES.RESUME_BUILDER}
        keywords={`resume builder, CV maker, ${DEFAULT_KEYWORDS}`}
        ogType="website"
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: 'Home', url: ROUTES.HOME },
            { name: 'Resume Builder', url: ROUTES.RESUME_BUILDER },
          ]),
          webPageSchema({
            name: 'Resume Builder – EduRozgaar',
            description: 'Build a professional CV for jobs, scholarships, and admissions. Multiple templates, AI suggestions, PDF export.',
            url: ROUTES.RESUME_BUILDER,
          })
        )}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <Link to={ROUTES.DASHBOARD} className="text-primary dark:text-mint hover:underline text-sm mb-4 inline-block">← Dashboard</Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Resume Builder</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Create a professional resume for jobs, internships, scholarships, and university admissions. Choose a template and fill in the steps below.
        </p>

        {optimizeResult && (
          <div className="mb-6 p-4 rounded-xl border border-primary/30 dark:border-mint/30 bg-primary/5 dark:bg-mint/10">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Optimize for: {optimizeResult.jobTitle}</h3>
            {optimizeResult.missingKeywords?.length > 0 && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                <strong>Consider adding:</strong> {optimizeResult.missingKeywords.join(', ')}
              </p>
            )}
            {optimizeResult.suggestions?.map((s, i) => (
              <p key={i} className="text-sm text-gray-600 dark:text-gray-400">{s}</p>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          <div className="lg:col-span-3 space-y-6 min-w-0">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resume name</label>
                <input
                  type="text"
                  value={resume.title || ''}
                  onChange={(e) => setResume({ ...resume, title: e.target.value })}
                  placeholder="e.g. Resume for Internships"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Choose template</h2>
              <TemplateSelector value={resume.template} onChange={(t) => setResume({ ...resume, template: t })} />
            </div>
            <ResumeWizard
              resume={resume}
              onChange={setResume}
              stepIndex={stepIndex}
              setStepIndex={setStepIndex}
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !isAuthenticated}
                className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-50 dark:bg-mint dark:text-gray-900 dark:hover:bg-mint/90"
              >
                {saving ? 'Saving…' : resumeId ? 'Update resume' : 'Save resume'}
              </button>
              {!isAuthenticated && (
                <Link to={ROUTES.LOGIN} className="text-sm text-primary dark:text-mint hover:underline">
                  Login to save and manage multiple resumes
                </Link>
              )}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4 min-w-0">
            <ResumePreview ref={previewRef} resume={resume} template={resume.template} />
            <ResumeScore resume={resume} />
            <ResumeDownload previewRef={previewRef} fileName={fileName} />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link to={ROUTES.RESUME_ANALYZER} className="text-primary dark:text-mint hover:underline text-sm">
            Analyze your resume with AI →
          </Link>
        </div>
      </div>
    </>
  );
}
