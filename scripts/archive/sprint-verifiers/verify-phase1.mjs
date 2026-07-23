/**
 * Phase 1 seed data verification via public API.
 * Run: node scripts/verify-phase1.mjs
 */
const API = process.env.API_URL || 'http://localhost:5000/api';

async function get(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
}

const checks = [];

function record(name, pass, detail) {
  checks.push({ name, pass, detail });
  console.log(`${pass ? '✅' : '❌'} ${name}: ${detail}`);
}

async function main() {
  console.log('Phase 1 API verification\n');

  try {
    const jobs = await get('/jobs?limit=1&page=1');
    const jobTotal = jobs.pagination?.total ?? 0;
    record('Jobs', jobTotal >= 280, `${jobTotal} total (target ~300)`);
  } catch (e) { record('Jobs', false, e.message); }

  try {
    const sch = await get('/scholarships?limit=1');
    const total = sch.pagination?.total ?? 0;
    record('Scholarships', total >= 100, `${total} total`);
  } catch (e) { record('Scholarships', false, e.message); }

  try {
    const adm = await get('/admissions?limit=1');
    const total = adm.pagination?.total ?? 0;
    record('Admissions', total >= 70, `${total} total (target 80)`);
  } catch (e) { record('Admissions', false, e.message); }

  try {
    const blogs = await get('/blogs?limit=1');
    const total = blogs.pagination?.total ?? 0;
    record('Blogs', total >= 150, `${total} total (target 200)`);
  } catch (e) { record('Blogs', false, e.message); }

  try {
    const career = await get('/career-articles?limit=1');
    const total = career.pagination?.total ?? 0;
    record('Career articles API', total >= 90, `${total} total (target 100)`);
  } catch (e) { record('Career articles API', false, e.message); }

  try {
    const fs = await get('/foreign-studies?limit=1');
    const total = fs.pagination?.total ?? fs.data?.length ?? 0;
    record('Foreign studies', total >= 50, `${total} records`);
  } catch (e) { record('Foreign studies', false, e.message); }

  try {
    const exams = await get('/exams');
    const examList = exams.data || exams;
    const count = Array.isArray(examList) ? examList.length : 0;
    record('Exams', count >= 5, `${count} exams`);
    if (count > 0) {
      const ppsc = examList.find((e) => e.code === 'PPSC' || e.slug === 'ppsc') || examList[0];
      const examId = ppsc._id;
      const papers = await get(`/exams/${examId}/past-papers`);
      const paperCount = (papers.data || papers).length;
      record('Past papers', paperCount >= 1, `${paperCount} for ${ppsc.name}`);
      const quizzes = await get(`/exams/${examId}/quizzes`);
      const quizList = quizzes.data || quizzes;
      record('Quizzes', quizList.length >= 1, `${quizList.length} for ${ppsc.name}`);
      const launchQuiz = quizList.find((q) => q.title?.includes('Launch')) || quizList[0];
      if (launchQuiz) {
        const quiz = await get(`/quizzes/${launchQuiz._id}`);
        const mcqCount = quiz.questions?.length ?? 0;
        record('MCQs in quiz', mcqCount >= 50, `${mcqCount} in "${launchQuiz.title}"`);
      }
    }
  } catch (e) { record('Exam prep', false, e.message); }

  try {
    const tpl = await get('/resume-templates');
    const count = tpl.data?.length ?? 0;
    record('Resume templates', count >= 4, `${count} templates`);
  } catch (e) { record('Resume templates', false, e.message); }

  const passed = checks.filter((c) => c.pass).length;
  const failed = checks.filter((c) => !c.pass).length;
  console.log(`\nResult: ${passed}/${checks.length} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
