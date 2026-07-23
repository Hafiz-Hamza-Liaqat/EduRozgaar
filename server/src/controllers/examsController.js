import mongoose from 'mongoose';
import { Exam } from '../models/Exam.js';
import { PastPaper } from '../models/PastPaper.js';
import { Quiz } from '../models/Quiz.js';
import { Mcq } from '../models/Mcq.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find({ status: 'active' }).sort({ name: 1 }).lean();
  res.json({ data: exams });
});

export const getExamBySlug = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ slug: req.params.slug, status: 'active' }).lean();
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  res.json(exam);
});

export const listPastPapers = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const exam = mongoose.Types.ObjectId.isValid(examId) && String(new mongoose.Types.ObjectId(examId)) === examId
    ? await Exam.findById(examId)
    : await Exam.findOne({ slug: examId, status: 'active' });
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  const papers = await PastPaper.find({ examId: exam._id, status: 'active' }).sort({ year: -1 }).lean();
  res.json({ data: papers });
});

export const listQuizzes = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const exam = mongoose.Types.ObjectId.isValid(examId) && String(new mongoose.Types.ObjectId(examId)) === examId
    ? await Exam.findById(examId)
    : await Exam.findOne({ slug: examId, status: 'active' });
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  const quizzes = await Quiz.find({ examId: exam._id, status: 'active' }).sort({ createdAt: -1 }).lean();
  res.json({ data: quizzes });
});

export const getQuizWithMcqs = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const quiz = await Quiz.findOne({ _id: quizId, status: 'active' }).lean();
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
  const mcqs = await Mcq.find({ quizId, status: 'active' }).sort({ createdAt: 1 }).lean();
  const questions = mcqs.map(({ _id, question, options }) => ({ _id, question, options }));
  res.json({ ...quiz, questions });
});
