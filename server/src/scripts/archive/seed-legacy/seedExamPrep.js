/**
 * Seed exam preparation: PPSC, FPSC, NTS, Punjab Police, WAPDA – syllabus, past papers, MCQs, quizzes.
 * Run from server: node src/scripts/seedExamPrep.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { Exam } from '../models/Exam.js';
import { PastPaper } from '../models/PastPaper.js';
import { Quiz } from '../models/Quiz.js';
import { Mcq } from '../models/Mcq.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/edurozgaar';

const EXAMS = [
  { name: 'PPSC', code: 'PPSC', authority: 'Punjab Public Service Commission', description: 'Punjab government jobs and competitive exams.', syllabus: 'General knowledge, English, Urdu, Pakistan Studies, Islamiyat, and subject-specific papers.' },
  { name: 'FPSC', code: 'FPSC', authority: 'Federal Public Service Commission', description: 'Federal government jobs including CSS.', syllabus: 'CSS syllabus: Compulsory and Optional subjects. See FPSC website for details.' },
  { name: 'NTS', code: 'NTS', authority: 'National Testing Service', description: 'NAT, GAT, and other entry tests.', syllabus: 'Quantitative, Verbal, Analytical. Subject tests vary by program.' },
  { name: 'Punjab Police', code: 'PP', authority: 'Punjab Police', description: 'Constable, SI, and other ranks.', syllabus: 'General knowledge, Islamic studies, English, basic mathematics.' },
  { name: 'WAPDA', code: 'WAPDA', authority: 'Water and Power Development Authority', description: 'Engineering and administrative positions.', syllabus: 'Relevant engineering/technical and general ability.' },
];

const SAMPLE_MCQS = [
  { question: 'What is the capital of Pakistan?', options: ['Lahore', 'Islamabad', 'Karachi', 'Rawalpindi'], correctIndex: 1 },
  { question: 'Who was the first Prime Minister of Pakistan?', options: ['Liaquat Ali Khan', 'Quaid-e-Azam', 'Allama Iqbal', 'Fatima Jinnah'], correctIndex: 0 },
  { question: 'The Indus River flows through which province?', options: ['Sindh', 'Punjab', 'KPK', 'All of these'], correctIndex: 3 },
  { question: 'Pakistan Independence Day is celebrated on?', options: ['14 August', '23 March', '6 September', '25 December'], correctIndex: 0 },
  { question: 'Which is the largest province by population?', options: ['Sindh', 'Punjab', 'Balochistan', 'KPK'], correctIndex: 1 },
];

async function seed() {
  await mongoose.connect(MONGO_URI);

  for (const e of EXAMS) {
    const exam = await Exam.findOneAndUpdate(
      { slug: e.name.toLowerCase() },
      { $setOnInsert: { name: e.name, slug: e.name.toLowerCase(), code: e.code, authority: e.authority, description: e.description, syllabus: e.syllabus, status: 'active' } },
      { upsert: true, new: true }
    );

    await PastPaper.findOneAndUpdate(
      { examId: exam._id, title: `${e.name} Sample Paper 2023` },
      { $setOnInsert: { examId: exam._id, title: `${e.name} Sample Paper 2023`, year: 2023, subject: 'General', status: 'active' } },
      { upsert: true }
    );

    let quiz = await Quiz.findOne({ examId: exam._id });
    if (!quiz) {
      quiz = await Quiz.create({
        examId: exam._id,
        title: `${e.name} General Knowledge Practice`,
        durationMinutes: 10,
        totalQuestions: SAMPLE_MCQS.length,
        status: 'active',
      });
      for (let i = 0; i < SAMPLE_MCQS.length; i++) {
        const m = SAMPLE_MCQS[i];
        await Mcq.create({
          examId: exam._id,
          quizId: quiz._id,
          question: m.question,
          options: m.options,
          correctIndex: m.correctIndex,
          status: 'active',
        });
      }
    }
  }

  console.log('Exam prep seed: exams', EXAMS.length, ', past papers & quizzes created.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
