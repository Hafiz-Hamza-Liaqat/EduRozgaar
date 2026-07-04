import { SeoHead } from '../../components/seo';

export default function SchoolsAndColleges() {
  return (
    <>
      <SeoHead
        title="Schools & Colleges"
        description="Schools and colleges in Pakistan. Directories and information."
        noindex
      />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Schools & Colleges</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Explore institutions across Pakistan. Full directory coming soon.</p>
        <div className="p-8 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-center text-gray-500 dark:text-gray-400">
          Directory and search will be available in a future update.
        </div>
      </div>
    </>
  );
}
