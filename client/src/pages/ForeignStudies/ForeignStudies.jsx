import { SeoHead } from '../../components/seo';

export default function ForeignStudies() {
  return (
    <>
      <SeoHead
        title="Foreign Studies"
        description="Study abroad opportunities for Pakistani students. UK, USA, Australia, and more."
        noindex
      />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Foreign Studies</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Study abroad programs and guides. More content coming soon.</p>
        <div className="p-8 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-center text-gray-500 dark:text-gray-400">
          Country-wise guides and scholarship links will be added here.
        </div>
      </div>
    </>
  );
}
