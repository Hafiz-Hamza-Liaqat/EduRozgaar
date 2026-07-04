import { useState } from 'react';
import { SeoHead } from '../../components/seo';
import { aiJobApi } from '../../services/listingsService';
import { useToast } from '../../context/ToastContext';

export default function AIJobGenerator() {
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { toast } = useToast();

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Job title is required');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await aiJobApi.generate({
        title: title.trim(),
        organization: organization.trim() || undefined,
        location: location.trim() || undefined,
        skills: skills.trim() ? skills.split(/[,;]/).map((s) => s.trim()).filter(Boolean) : undefined,
      });
      setResult(data);
      toast.success('Description generated. Edit below before publishing.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SeoHead title="AI Job Generator" description="Generate SEO-friendly job descriptions with AI." noindex />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">AI Job Description Generator</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Generate SEO-friendly job descriptions. Edit the output before saving to Jobs.</p>

        <form onSubmit={handleGenerate} className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Software Engineer"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organization / Company</label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. TechCorp Pakistan"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location / Province</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Punjab, Lahore"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills (comma-separated)</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. JavaScript, React, Node.js"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary hover:bg-primary-hover text-white btn-theme px-4 py-2 font-medium disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Generate description'}
          </button>
        </form>

        {result && (
          <div className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Generated (editable)</h2>
            {result.summary && (
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Summary</label>
                <p className="text-gray-700 dark:text-gray-300">{result.summary}</p>
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Description</label>
              <textarea
                readOnly
                value={result.description}
                rows={14}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm font-mono"
              />
            </div>
            {result.suggested && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Suggested fields for job creation:</p>
                <pre className="text-xs mt-1 text-gray-600 dark:text-gray-300 overflow-auto">{JSON.stringify(result.suggested, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
