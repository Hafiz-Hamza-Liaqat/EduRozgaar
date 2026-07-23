/**
 * Launch content seed — idempotent, Pakistan-focused realistic data.
 * Run: npm run seed:launch
 * Force re-seed missing only; use SEED_FORCE=1 to wipe launch-tagged externalIds first.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Job } from '../models/Job.js';
import { Scholarship } from '../models/Scholarship.js';
import { Admission } from '../models/Admission.js';
import { Blog } from '../models/Blog.js';
import { ForeignStudy } from '../models/ForeignStudy.js';
import { CareerArticle } from '../models/CareerArticle.js';
import { Employer } from '../models/Employer.js';
import { Company } from '../models/Company.js';
import { University } from '../models/University.js';
import { Exam } from '../models/Exam.js';
import { Quiz } from '../models/Quiz.js';
import { Mcq } from '../models/Mcq.js';
import { PastPaper } from '../models/PastPaper.js';
import { ResumeTemplateCatalog } from '../models/ResumeTemplateCatalog.js';
import {
  jobSlug, scholarshipSlug, admissionSlug, blogSlug, foreignStudySlug,
  companySlug, employerSlug, universitySlug, careerArticleSlug, examSlug,
} from '../utils/slugify.js';
import { ensureSlugUnique } from '../utils/bulkUpsert.js';
import {
  PK_COMPANIES, PK_UNIVERSITIES, SCHOLARSHIP_PROVIDERS, JOB_CATEGORIES,
  WORK_MODES, EXPERIENCE_LEVELS, JOB_TITLE_TEMPLATES, PK_CITIES, DEGREE_PROGRAMS,
  FOREIGN_COUNTRIES, EXAM_NAMES, MCQ_SUBJECTS, CAREER_CATEGORIES, BLOG_CATEGORIES,
  RESUME_TEMPLATES, pick, futureDate, pastDate,
} from '../data/launchContentGenerators.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/edurozgaar';
const SEED_TAG = 'launch-v1';

const TARGETS = {
  jobs: 300,
  scholarships: 150,
  admissions: 80,
  blogs: 200,
  careerArticles: 100,
  foreignStudies: 100,
  mcqs: 1000,
  pastPapers: 50,
  resumeTemplates: 4,
  employers: 15,
};

async function seedCompanies() {
  let count = 0;
  for (const c of PK_COMPANIES) {
    const slug = companySlug(c.name);
    const result = await Company.findOneAndUpdate(
      { name: c.name },
      {
        $setOnInsert: {
          name: c.name,
          slug,
          description: `${c.name} is a leading organization in ${c.industry || 'Pakistan'}, offering career opportunities for students and professionals across Pakistan.`,
          website: c.website || '',
          industry: c.industry || '',
          companySize: c.size || '',
          city: c.city || '',
          province: c.province || '',
          country: c.country || 'Pakistan',
          location: [c.city, c.province].filter(Boolean).join(', '),
          verified: ['NADRA', 'HEC', 'Jazz', 'PTCL', 'Systems Limited', '10Pearls'].includes(c.name),
          status: 'active',
        },
      },
      { upsert: true, new: true }
    );
    if (result) count++;
  }
  console.log('Companies upserted:', PK_COMPANIES.length);
  return count;
}

async function seedUniversities() {
  for (const u of PK_UNIVERSITIES) {
    const slug = universitySlug(u.short || u.name);
    await University.findOneAndUpdate(
      { name: u.name },
      {
        $set: { slug },
        $setOnInsert: {
          name: u.name,
          country: 'Pakistan',
          city: u.city,
          province: u.province,
          type: u.type,
          ranking: u.ranking,
          website: u.website,
          description: `${u.name} (${u.short}) is a ${u.type} university in ${u.city}, Pakistan, offering undergraduate and graduate programs.`,
          status: 'active',
        },
      },
      { upsert: true }
    );
  }
  console.log('Universities upserted:', PK_UNIVERSITIES.length);
}

async function seedEmployers() {
  const pkEmployers = PK_COMPANIES.filter((c) => c.country !== 'USA').slice(0, TARGETS.employers);
  const passwordHash = await bcrypt.hash('Employer@123', 12);
  let count = 0;

  for (let i = 0; i < pkEmployers.length; i++) {
    const c = pkEmployers[i];
    const slug = employerSlug(c.name);
    const email = `hr+${slug}@edurozgaar-seed.pk`;
    const doc = await Employer.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          companyName: c.name,
          slug,
          email,
          password: passwordHash,
          phone: `+92-300-${String(1000000 + i).slice(-7)}`,
          website: c.website || '',
          companyDescription: `${c.name} hires talented graduates across Pakistan. Explore open positions on EduRozgaar.`,
          industry: c.industry || '',
          companySize: c.size || '',
          city: c.city || '',
          province: c.province || '',
          location: [c.city, c.province].filter(Boolean).join(', '),
          verified: i < 8,
          isPublicProfile: true,
        },
      },
      { upsert: true, new: true }
    );
    if (doc) {
      count++;
      await Company.findOneAndUpdate(
        { name: c.name },
        { $set: { employerId: doc._id, verified: doc.verified } }
      );
    }
  }
  console.log('Employers upserted:', count);
  return count;
}

async function seedJobs() {
  const employers = await Employer.find().select('_id companyName slug').lean();
  const employerMap = Object.fromEntries(employers.map((e) => [e.companyName, e]));
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < TARGETS.jobs; i++) {
    const company = pick(PK_COMPANIES, i);
    const loc = pick(PK_CITIES, i);
    const titleBase = pick(JOB_TITLE_TEMPLATES, i);
    const mode = pick(WORK_MODES, i);
    const exp = pick(EXPERIENCE_LEVELS, i);
    const isGov = company.industry === 'Government' || company.name.includes('Government') || company.name === 'NADRA' || company.name === 'HEC';
    const isIntern = i % 7 === 0;
    const isRemote = mode === 'Remote' || i % 11 === 0;
    const isFreelance = exp === 'Freelance' || i % 13 === 0;

    let title = titleBase;
    if (isIntern) title = `${titleBase} Intern`;
    if (isRemote) title = `Remote ${titleBase}`;
    if (isFreelance) title = `Freelance ${titleBase}`;
    title = `${company.name} – ${title}`;

    const jobType = isIntern ? 'Internship' : isGov ? 'Government' : 'Private';
    const category = isFreelance ? 'Freelance' : isRemote ? 'Remote' : pick(JOB_CATEGORIES, i);
    const externalId = `${SEED_TAG}-job-${i}`;

    const existing = await Job.findOne({ externalId });
    if (existing) { skipped++; continue; }

    const baseSlug = jobSlug(title, `${loc.province}-${i}`);
    const slug = await ensureSlugUnique(Job, baseSlug);

    const employer = employerMap[company.name];

    await Job.create({
      title,
      slug,
      company: company.name,
      organization: company.name,
      location: loc.city,
      city: loc.city,
      province: loc.province,
      category,
      type: isIntern ? 'internship' : 'full-time',
      jobType,
      educationRequirement: i % 3 === 0 ? 'Bachelor' : i % 3 === 1 ? 'Master' : 'Intermediate',
      experience: exp,
      description: `${company.name} is hiring a ${title} in ${loc.city}. ${isRemote ? 'This is a remote-friendly role.' : 'On-site presence may be required.'} Apply before the deadline.`,
      requirements: ['Relevant degree or equivalent', 'Strong communication skills', 'Team player'],
      deadline: futureDate(30, i),
      status: 'active',
      source: 'manual',
      externalId,
      employerId: employer?._id,
      approvalStatus: 'approved',
      salaryRange: i % 4 === 0 ? 'Rs. 50,000 – 120,000' : i % 4 === 1 ? 'Rs. 80,000 – 200,000' : 'Negotiable',
      // L.2.6.5 — Private/Internship posts support on-platform Apply → Tracker; government stays external
      applyType: isGov ? 'external' : 'internal',
      applicationLink: isGov ? (company.website || 'https://edurozgaar.pk/jobs') : null,
    });
    inserted++;
  }
  console.log(`Jobs: inserted ${inserted}, skipped ${skipped}`);
}

async function seedScholarships() {
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < TARGETS.scholarships; i++) {
    const provider = pick(SCHOLARSHIP_PROVIDERS, i);
    const country = provider === 'HEC' ? 'Pakistan' : pick(FOREIGN_COUNTRIES, i);
    const uni = pick(PK_UNIVERSITIES, i);
    const level = pick(['Undergraduate', 'Graduate', 'PhD'], i);
    const title = `${provider} ${level} Scholarship ${2024 + (i % 3)} – ${country} (#${i + 1})`;

    const existing = await Scholarship.findOne({ title, provider });
    if (existing) { skipped++; continue; }

    const baseSlug = scholarshipSlug(title, country);
    const slug = await ensureSlugUnique(Scholarship, `${baseSlug}-${i}`);

    await Scholarship.create({
      title,
      slug,
      provider,
      level,
      degreeLevel: level === 'Undergraduate' ? 'Bachelor' : level === 'Graduate' ? 'Master' : 'PhD',
      university: uni.name,
      country,
      amount: i % 2 === 0 ? 'Fully Funded' : 'Partial Funding',
      fundingType: i % 2 === 0 ? 'Fully Funded' : 'Partial',
      description: `${provider} offers ${level.toLowerCase()} scholarships for Pakistani students${country !== 'Pakistan' ? ` to study in ${country}` : ''}.`,
      eligibility: ['Pakistani nationality', 'Minimum 60% marks', 'English proficiency'],
      deadline: futureDate(60, i),
      link: provider === 'HEC' ? 'https://www.hec.gov.pk' : 'https://edurozgaar.pk/scholarships',
      status: 'active',
    });
    inserted++;
  }
  console.log(`Scholarships: inserted ${inserted}, skipped ${skipped}`);
}

async function seedAdmissions() {
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < TARGETS.admissions; i++) {
    const uni = pick(PK_UNIVERSITIES, i);
    const program = pick(DEGREE_PROGRAMS, i);
    const session = `Fall ${2024 + (i % 2)}`;
    const existing = await Admission.findOne({ program, institution: uni.name, session });
    if (existing) { skipped++; continue; }

    const baseSlug = admissionSlug(program, uni.name);
    const slug = await ensureSlugUnique(Admission, `${baseSlug}-${i}`);

    await Admission.create({
      program,
      slug,
      institution: uni.name,
      university: uni.name,
      province: uni.province,
      city: uni.city,
      session,
      description: `Admissions open for ${program} at ${uni.name} for session ${session}.`,
      eligibility: ['FSc / A-Level / equivalent', 'Entry test where applicable'],
      deadline: futureDate(45, i),
      lastDate: futureDate(45, i),
      link: uni.website,
      applyLink: uni.website,
      status: 'active',
      source: 'manual',
    });
    inserted++;
  }
  console.log(`Admissions: inserted ${inserted}, skipped ${skipped}`);
}

async function seedBlogs() {
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < TARGETS.blogs; i++) {
    const category = pick(BLOG_CATEGORIES, i);
    const title = `${category}: Guide for Pakistani Students #${i + 1}`;

    const existing = await Blog.findOne({ title });
    if (existing) { skipped++; continue; }

    const baseSlug = blogSlug(title);
    const slug = await ensureSlugUnique(Blog, baseSlug);

    await Blog.create({
      title,
      slug,
      excerpt: `A practical ${category.toLowerCase()} guide for students in Pakistan — tips, deadlines, and resources.`,
      content: `<p>This article covers essential ${category.toLowerCase()} information for Pakistani students.</p><p>Topic ${i + 1}: planning, preparation, and actionable next steps for your education and career journey.</p>`,
      category,
      tags: [category, 'Pakistan', 'Students'],
      status: 'published',
      publishedAt: pastDate(90, i),
      views: 50 + (i % 500),
    });
    inserted++;
  }
  console.log(`Blogs: inserted ${inserted}, skipped ${skipped}`);
}

async function seedCareerArticles() {
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < TARGETS.careerArticles; i++) {
    const category = pick(CAREER_CATEGORIES, i);
    const title = `${category} for Pakistani Graduates — Part ${i + 1}`;
    const existing = await CareerArticle.findOne({ title });
    if (existing) { skipped++; continue; }

    const baseSlug = careerArticleSlug(title);
    const slug = await ensureSlugUnique(CareerArticle, baseSlug);

    await CareerArticle.create({
      title,
      slug,
      excerpt: `Expert ${category.toLowerCase()} advice tailored for students and job seekers in Pakistan.`,
      content: `<p>Learn key strategies for ${category.toLowerCase()} in the Pakistani job market.</p><p>Includes interview preparation, skill building, and real-world examples.</p>`,
      category,
      tags: [category, 'Career', 'Pakistan'],
      status: 'published',
      publishedAt: pastDate(60, i),
      views: 30 + (i % 200),
    });
    inserted++;
  }
  console.log(`Career articles: inserted ${inserted}, skipped ${skipped}`);
}

async function seedForeignStudies() {
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < TARGETS.foreignStudies; i++) {
    const country = pick(FOREIGN_COUNTRIES, i);
    const program = pick(DEGREE_PROGRAMS, i);
    const level = pick(['Undergraduate', 'Graduate', 'PhD'], i);
    const existing = await ForeignStudy.findOne({ country, program, level });
    if (existing) { skipped++; continue; }

    const baseSlug = foreignStudySlug(country, program);
    const slug = await ensureSlugUnique(ForeignStudy, `${baseSlug}-${i}`);

    await ForeignStudy.create({
      country,
      program,
      level,
      slug,
      institution: `${country} Partner University ${(i % 10) + 1}`,
      description: `Study ${program} (${level}) in ${country}. Scholarships and admission support available for Pakistani students.`,
      requirements: ['Valid passport', 'Academic transcripts', 'Language test scores'],
      deadline: futureDate(90, i),
      link: 'https://edurozgaar.pk/foreign-studies',
      status: 'active',
    });
    inserted++;
  }
  console.log(`Foreign studies: inserted ${inserted}, skipped ${skipped}`);
}

async function seedExamPrep() {
  for (const name of EXAM_NAMES) {
    await Exam.findOneAndUpdate(
      { code: name },
      {
        $setOnInsert: {
          name,
          slug: examSlug(name),
          code: name,
          authority: name,
          description: `${name} exam preparation resources for Pakistani students.`,
          syllabus: 'See official syllabus. Practice MCQs and past papers on EduRozgaar.',
          status: 'active',
        },
      },
      { upsert: true }
    );
  }

  const exams = await Exam.find({ code: { $in: EXAM_NAMES } }).lean();
  let mcqInserted = 0;
  let mcqSkipped = 0;
  let ppInserted = 0;

  for (const exam of exams) {
    for (let y = 0; y < 5; y++) {
      const ppTitle = `${exam.name} Past Paper ${2019 + y}`;
      const ppExists = await PastPaper.findOne({ examId: exam._id, title: ppTitle });
      if (!ppExists) {
        await PastPaper.create({
          examId: exam._id,
          title: ppTitle,
          year: 2019 + y,
          subject: pick(MCQ_SUBJECTS, y),
          status: 'active',
          link: 'https://edurozgaar.pk/exam-prep',
        });
        ppInserted++;
      }
    }

    let quiz = await Quiz.findOne({ examId: exam._id, title: `${exam.name} Launch Practice Set` });
    if (!quiz) {
      quiz = await Quiz.create({
        examId: exam._id,
        title: `${exam.name} Launch Practice Set`,
        slug: examSlug(`${exam.name}-launch-practice`),
        durationMinutes: 60,
        totalQuestions: 100,
        status: 'active',
      });
    }

    const mcqsPerExam = Math.ceil(TARGETS.mcqs / exams.length);
    for (let m = 0; m < mcqsPerExam; m++) {
      const subject = pick(MCQ_SUBJECTS, m);
      const question = `${exam.name} ${subject} Question ${m + 1}: What is the correct answer?`;
      const exists = await Mcq.findOne({ examId: exam._id, question });
      if (exists) { mcqSkipped++; continue; }

      await Mcq.create({
        examId: exam._id,
        quizId: quiz._id,
        question,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctIndex: m % 4,
        subject,
        status: 'active',
      });
      mcqInserted++;
    }
  }

  console.log(`Past papers inserted: ${ppInserted}`);
  console.log(`MCQs: inserted ${mcqInserted}, skipped ${mcqSkipped}`);
}

async function seedResumeTemplates() {
  for (const t of RESUME_TEMPLATES) {
    await ResumeTemplateCatalog.findOneAndUpdate(
      { templateId: t.templateId },
      {
        $setOnInsert: {
          name: t.name,
          slug: t.templateId,
          templateId: t.templateId,
          description: `Professional ${t.name} resume template optimized for Pakistani job market.`,
          category: t.category,
          status: 'active',
        },
      },
      { upsert: true }
    );
  }
  console.log('Resume templates:', RESUME_TEMPLATES.length);
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected. Seeding launch content (idempotent)...\n');

  if (process.env.SEED_FORCE === '1') {
    console.log('SEED_FORCE=1 — removing launch-tagged jobs...');
    await Job.deleteMany({ externalId: { $regex: `^${SEED_TAG}-` } });
  }

  await seedCompanies();
  await seedUniversities();
  await seedEmployers();
  await seedJobs();
  await seedScholarships();
  await seedAdmissions();
  await seedBlogs();
  await seedCareerArticles();
  await seedForeignStudies();
  await seedExamPrep();
  await seedResumeTemplates();

  const counts = {
    jobs: await Job.countDocuments(),
    scholarships: await Scholarship.countDocuments(),
    admissions: await Admission.countDocuments(),
    blogs: await Blog.countDocuments(),
    careerArticles: await CareerArticle.countDocuments(),
    foreignStudies: await ForeignStudy.countDocuments(),
    mcqs: await Mcq.countDocuments(),
    pastPapers: await PastPaper.countDocuments(),
    employers: await Employer.countDocuments(),
    companies: await Company.countDocuments(),
    universities: await University.countDocuments(),
    resumeTemplates: await ResumeTemplateCatalog.countDocuments(),
  };

  console.log('\n=== Final collection counts ===');
  console.log(JSON.stringify(counts, null, 2));
  await mongoose.disconnect();
  console.log('\nLaunch seed complete.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
