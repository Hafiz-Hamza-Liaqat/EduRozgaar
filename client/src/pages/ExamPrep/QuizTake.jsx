import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../../components/seo';
import { Link, useParams } from 'react-router-dom';
import { examsApi } from '../../services/listingsService';
import { useToast } from '../../context/ToastContext';
import { ROUTES } from '../../constants';

export default function QuizTake() {
  const { t } = useTranslation('exams');
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!quizId) return;
    examsApi.getQuiz(quizId)
      .then(({ data }) => {
        setQuiz(data);
        setAnswers((data.questions || []).map(() => null));
      })
      .catch(() => setQuiz(null))
      .finally(() => setLoading(false));
  }, [quizId]);

  useEffect(() => {
    if (!started || !quiz?.durationMinutes || submitted) return;
    let total = quiz.durationMinutes * 60;
    setSecondsLeft(total);
    const timer = setInterval(() => {
      total -= 1;
      setSecondsLeft(total);
      if (total <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [started, quiz?.durationMinutes, submitted]);

  const handleSubmit = async () => {
    const selected = answers.map((a) => (a === null ? -1 : a));
    if (selected.some((s) => s < 0)) {
      toast.error(t('answerAllQuestions'));
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await examsApi.submitQuiz({
        quizId,
        answers: selected,
        durationSeconds: quiz?.durationMinutes ? quiz.durationMinutes * 60 - secondsLeft : null,
      });
      setSubmitted(data);
      toast.success(t('scoreToast', { score: data.score }));
    } catch (err) {
      toast.error(err.response?.data?.error || t('submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !quiz) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <SeoHead title={t('quizSeoTitle')} description={t('quizSeoDescription')} noindex />
        <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      </div>
    );
  }

  const questions = quiz.questions || [];

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <SeoHead title={t('quizResultTitle')} noindex />
        <div className="p-6 rounded-xl border border-primary/30 dark:border-mint/30 bg-mint/20 dark:bg-mint/10 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('yourScore', { score: submitted.score })}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('correctCount', { correct: submitted.correctCount, total: submitted.totalQuestions })}
          </p>
        </div>
        <div className="mt-6 flex gap-4">
          <Link to={ROUTES.EXAM_PREP} className="text-primary dark:text-mint hover:underline">
            ← {t('examPrepBreadcrumb')}
          </Link>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <SeoHead title={`${quiz.title} – ${t('quizSeoTitle')}`} noindex />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{quiz.title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('questionsMinutes', { count: questions.length, minutes: quiz.durationMinutes || 30 })}
        </p>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="rounded-lg bg-primary hover:bg-primary-hover text-white btn-theme px-6 py-3 font-medium"
        >
          {t('startQuiz')}
        </button>
        <div className="mt-6">
          <Link to={ROUTES.EXAM_PREP} className="text-sm text-primary dark:text-mint hover:underline">{t('back')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <SeoHead title={`${quiz.title} – ${t('quizSeoTitle')}`} noindex />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{quiz.title}</h1>
        {secondsLeft != null && (
          <span className={`text-lg font-mono ${secondsLeft <= 60 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
          </span>
        )}
      </div>

      <div className="space-y-6">
        {questions.map((q, i) => (
          <div key={q._id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <p className="font-medium text-gray-900 dark:text-white mb-3">Q{i + 1}. {q.question}</p>
            <ul className="space-y-2">
              {(q.options || []).map((opt, j) => (
                <li key={j}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`q-${i}`}
                      checked={answers[i] === j}
                      onChange={() => setAnswers((prev) => { const n = [...prev]; n[i] = j; return n; })}
                      className="rounded-full border-gray-300 dark:border-gray-600 text-primary"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{opt}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-between">
        <Link to={ROUTES.EXAM_PREP} className="text-primary dark:text-mint hover:underline">{t('cancel')}</Link>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || answers.some((a) => a === null)}
          className="rounded-lg bg-primary hover:bg-primary-hover text-white btn-theme px-6 py-2 font-medium disabled:opacity-50"
        >
          {submitting ? t('submitting') : t('submit')}
        </button>
      </div>
    </div>
  );
}
