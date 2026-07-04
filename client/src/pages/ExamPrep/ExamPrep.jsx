import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, collectionPageSchema, combineSchemas } from '../../seo/schemas';
import { DEFAULT_KEYWORDS } from '../../seo/config';
import { examsApi } from '../../services/listingsService';
import { ROUTES } from '../../constants';

const EXAM_CATEGORIES = [
  { label: 'FPSC', code: 'FPSC' },
  { label: 'PPSC', code: 'PPSC' },
  { label: 'NTS', code: 'NTS' },
  { label: 'CSS', code: 'CSS' },
  { label: 'Police Jobs', code: 'Police' },
  { label: 'Banking Exams', code: 'Banking' },
];

export default function ExamPrep() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');

  useEffect(() => {
    examsApi.listExams()
      .then(({ data }) => setExams(data?.data || []))
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredExams = !category
    ? exams
    : exams.filter((e) => (e.code || e.name || '').toLowerCase().includes(category.toLowerCase()));

  return (
    <>
      <SeoHead
        title="Exam Preparation – PPSC, FPSC, NTS, CSS, Punjab Police, WAPDA – EduRozgaar"
        description="Government job exam preparation: syllabus, past papers, MCQs, and practice quizzes for PPSC, FPSC, NTS, Punjab Police, WAPDA."
        canonical={ROUTES.EXAM_PREP}
        keywords={`PPSC, FPSC, NTS, CSS, exam preparation, ${DEFAULT_KEYWORDS}`}
        ogType="website"
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: 'Home', url: ROUTES.HOME },
            { name: 'Exam Preparation', url: ROUTES.EXAM_PREP },
          ]),
          collectionPageSchema({
            name: 'Exam Preparation – PPSC, FPSC, NTS, CSS, Punjab Police, WAPDA – EduRozgaar',
            description: 'Government job exam preparation: syllabus, past papers, MCQs, and practice quizzes for PPSC, FPSC, NTS, Punjab Police, WAPDA.',
            url: ROUTES.EXAM_PREP,
          })
        )}
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Government Job Exam Preparation</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Syllabus, past papers, MCQ practice, and timed mock tests for PPSC, FPSC, NTS, CSS, Punjab Police, WAPDA and more.
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          <button
            type="button"
            onClick={() => setCategory('')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!category ? 'bg-edur-steel text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            All
          </button>
          {EXAM_CATEGORIES.map(({ label, code }) => (
            <button
              key={code}
              type="button"
              onClick={() => setCategory(category === code ? '' : code)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${category === code ? 'bg-edur-steel text-white dark:bg-edur-sky dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredExams.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No exams in this category. Try another or check back soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filteredExams.map((exam) => (
              <Link
                key={exam._id}
                to={ROUTES.EXAM_DETAIL.replace(':slug', exam.slug)}
                className="block p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg hover:border-edur-blue/50 dark:hover:border-edur-sky/50 transition-all duration-200 card-hover"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{exam.name}</h2>
                {exam.authority && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{exam.authority}</p>}
                {exam.description && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{exam.description}</p>}
                <span className="text-xs font-medium text-edur-steel dark:text-edur-sky mt-2 inline-block">Syllabus · Past papers · Quizzes →</span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <Link to={ROUTES.DASHBOARD} className="text-sm text-edur-steel dark:text-edur-sky hover:underline">← Dashboard</Link>
        </div>
      </div>
    </>
  );
}
