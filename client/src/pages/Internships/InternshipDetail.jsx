import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { jobPostingSchema, breadcrumbSchema, combineSchemas } from '../../seo/schemas';
import { buildCanonicalUrl } from '../../seo/config';
import { internshipsApi, savedApi } from '../../services/listingsService';
import { ROUTES } from '../../constants';
import { SaveButton } from '../../components/listings/SaveButton';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatDate';

export default function InternshipDetail() {
  const { idOrSlug } = useParams();
  const { isAuthenticated } = useAuth();
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    internshipsApi.get(idOrSlug).then(({ data }) => setInternship(data)).catch((e) => setError(e.response?.data?.error || 'Not found')).finally(() => setLoading(false));
  }, [idOrSlug]);

  useEffect(() => {
    if (!isAuthenticated || !internship) return;
    savedApi.get().then(({ data: d }) => {
      const ids = (d.savedInternships || []).map((i) => i._id);
      setSaved(ids.includes(internship._id));
    }).catch(() => {});
  }, [isAuthenticated, internship]);

  const handleSaveToggle = async (id, save) => {
    if (!id) return;
    if (save) await internshipsApi.save(id);
    else await internshipsApi.unsave(id);
    setSaved(!!save);
  };

  const handleApply = async () => {
    if (!internship || applied) return;
    setApplying(true);
    try {
      await internshipsApi.apply(internship.slug || internship._id);
      setApplied(true);
    } catch (e) {
      if (e.response?.status === 400 && e.response?.data?.error?.includes('Already applied')) setApplied(true);
      else window.alert(e.response?.data?.error || 'Apply failed');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (error || !internship) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-red-600 dark:text-red-400">{error || 'Internship not found.'}</p>
        <Link to={ROUTES.INTERNSHIPS} className="text-primary dark:text-mint hover:underline mt-2 inline-block">← Back to Internships</Link>
      </div>
    );
  }

  const canonicalPath = `${ROUTES.INTERNSHIPS}/${internship.slug || internship._id}`;
  const description = `${internship.title} at ${internship.organization}. ${internship.duration || ''}`.trim();
  const postingSchema = jobPostingSchema({
    ...internship,
    organization: internship.organization,
    type: 'INTERN',
    slug: undefined,
  });
  if (postingSchema) postingSchema.url = buildCanonicalUrl(canonicalPath);

  return (
    <>
      <SeoHead
        title={internship.title}
        description={description}
        canonical={canonicalPath}
        jsonLd={combineSchemas(
          postingSchema,
          breadcrumbSchema([
            { name: 'Home', url: ROUTES.HOME },
            { name: 'Internships', url: ROUTES.INTERNSHIPS },
            { name: internship.title, url: canonicalPath },
          ]),
        )}
      />
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        <Link to={ROUTES.INTERNSHIPS} className="text-sm text-primary dark:text-mint hover:underline mb-4 inline-block">← Internships</Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{internship.title}</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">{internship.organization}</p>
            <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
              {internship.location && <span>{internship.location}</span>}
              {internship.province && <span> · {internship.province}</span>}
              {internship.duration && <span> · {internship.duration}</span>}
              {internship.deadline && <span> · Deadline {formatDate(internship.deadline)}</span>}
            </div>
          </div>
          {isAuthenticated && <SaveButton id={internship._id} saved={saved} onToggle={(id, save) => handleSaveToggle(id, save)} />}
        </div>

        {internship.skillset?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {internship.skillset.map((s) => (
              <span key={s} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">{s}</span>
            ))}
          </div>
        )}

        {internship.description && (
          <div className="mt-6 prose dark:prose-invert max-w-none">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Description</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{internship.description}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {internship.applyInPlatform && (
            <button
              type="button"
              onClick={handleApply}
              disabled={applying || applied}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover btn-theme disabled:opacity-50"
            >
              {applied ? 'Applied' : applying ? 'Applying…' : 'Apply on platform'}
            </button>
          )}
          {internship.applicationLink && (
            <a
              href={internship.applicationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 rounded-lg border-2 border-primary text-primary dark:text-mint hover:bg-mint/20 dark:hover:bg-mint/10 btn-theme"
            >
              Apply on company portal →
            </a>
          )}
        </div>
      </div>
    </>
  );
}
