/**
 * L.2.6 — Deterministic MVP assessment + question bank seed.
 * No AI. Idempotent by assessment slug.
 */
import { AssessmentService } from '../services/career/AssessmentService.js';
import { AssessmentRepository } from '../repositories/career/AssessmentRepository.js';
import { QuestionBankRepository } from '../repositories/career/QuestionBankRepository.js';
import { AssessmentCategoryRepository } from '../repositories/career/AssessmentCategoryRepository.js';

function q(prompt, options, correctIndex) {
  return { prompt, options, correctIndex, questionType: 'mcq' };
}

const MVP_ASSESSMENTS = [
  {
    slug: 'iq-fundamentals',
    title: 'IQ Test (Fundamentals)',
    categorySlug: 'iq',
    family: 'general_employment',
    skillName: 'Cognitive Aptitude',
    description: 'Short pattern and analogy questions for general cognitive readiness.',
    durationMinutes: 20,
    questions: [
      q('What comes next: 2, 4, 8, 16, ?', ['18', '24', '32', '30'], 2),
      q('Which number is the odd one out: 3, 5, 7, 9, 11?', ['3', '7', '9', '11'], 2),
      q('Complete the analogy: Book is to Reading as Fork is to ___', ['Drawing', 'Writing', 'Eating', 'Walking'], 2),
      q('If all Bloops are Razzies and all Razzies are Lazzies, then all Bloops are definitely Lazzies.', ['True', 'False', 'Cannot say', 'Sometimes'], 0),
      q('Find the next letter: A, C, F, J, ?', ['K', 'M', 'O', 'N'], 2),
      q('Which shape has 6 sides?', ['Pentagon', 'Hexagon', 'Octagon', 'Triangle'], 1),
      q('22 − 7 × 2 = ?', ['30', '15', '8', '0'], 2),
      q('If yesterday was Monday, what day is tomorrow?', ['Tuesday', 'Wednesday', 'Thursday', 'Friday'], 1),
    ],
  },
  {
    slug: 'logical-reasoning-basics',
    title: 'Logical Reasoning',
    categorySlug: 'logical_reasoning',
    family: 'general_employment',
    skillName: 'Logical Reasoning',
    description: 'Deductive and rule-based reasoning practice.',
    durationMinutes: 25,
    questions: [
      q('If A > B and B > C, which is true?', ['C > A', 'A > C', 'A = C', 'Cannot compare'], 1),
      q('All cats are animals. Some animals are pets. Therefore some cats are pets.', ['Must be true', 'Must be false', 'May be true', 'Contradiction'], 2),
      q('Which statement is a valid conclusion if only left-handed people play cricket in a group and Ali plays cricket?', ['Ali is left-handed', 'Ali is right-handed', 'Ali is tall', 'No conclusion'], 0),
      q('Series: 5, 10, 20, 40, ?', ['50', '60', '80', '70'], 2),
      q('If “blue” means “green”, green means “white”, white means “yellow”, what is the color of milk (in real life)?', ['Blue', 'Green', 'White', 'Yellow'], 2),
      q('Which completes: Red is to Stop as Green is to ___', ['Wait', 'Go', 'Park', 'Slow'], 1),
      q('Premise: Only graduates may apply. Sara applied. Conclusion: Sara is a graduate.', ['Valid', 'Invalid', 'Possibly valid', 'Irrelevant'], 0),
      q('Odd one out: Circle, Square, Triangle, Cube', ['Circle', 'Square', 'Triangle', 'Cube'], 3),
    ],
  },
  {
    slug: 'numerical-reasoning-basics',
    title: 'Numerical Reasoning',
    categorySlug: 'numerical_reasoning',
    family: 'general_employment',
    skillName: 'Numerical Reasoning',
    description: 'Percentages, ratios, and basic arithmetic for work scenarios.',
    durationMinutes: 25,
    questions: [
      q('What is 15% of 200?', ['20', '25', '30', '35'], 2),
      q('If a shirt costs PKR 2,000 after 20% discount, what was the original price?', ['2200', '2400', '2500', '2600'], 2),
      q('Ratio 2:3 of 50 is?', ['20 and 30', '25 and 25', '10 and 40', '15 and 35'], 0),
      q('Average of 10, 20, 30 is?', ['15', '20', '25', '30'], 1),
      q('A train travels 120 km in 2 hours. Average speed?', ['40 km/h', '50 km/h', '60 km/h', '80 km/h'], 2),
      q('3/4 of 80 is?', ['50', '55', '60', '70'], 2),
      q('If x + 5 = 12, x = ?', ['5', '6', '7', '17'], 2),
      q('Compound: PKR 100 grows 10% once. New amount?', ['110', '120', '101', '90'], 0),
    ],
  },
  {
    slug: 'verbal-reasoning-basics',
    title: 'Verbal Reasoning',
    categorySlug: 'verbal_reasoning',
    family: 'general_employment',
    skillName: 'Verbal Reasoning',
    description: 'Vocabulary, comprehension, and word relationships.',
    durationMinutes: 20,
    questions: [
      q('Synonym of “rapid”:', ['Slow', 'Quick', 'Heavy', 'Quiet'], 1),
      q('Antonym of “scarce”:', ['Rare', 'Abundant', 'Tiny', 'Weak'], 1),
      q('Choose the correctly spelled word:', ['Recieve', 'Receive', 'Receve', 'Receeve'], 1),
      q('Complete: She ___ to work every day.', ['go', 'goes', 'going', 'gone'], 1),
      q('“Transparent” most nearly means:', ['Opaque', 'Clear', 'Heavy', 'Loud'], 1),
      q('Which sentence is grammatically correct?', ['He don’t know.', 'He doesn’t know.', 'He no know.', 'He not knows.'], 1),
      q('Idiom: “Hit the books” means', ['Fight', 'Study', 'Cook', 'Travel'], 1),
      q('Best summary word for “brief, clear, to the point”:', ['Verbose', 'Concise', 'Ambiguous', 'Informal'], 1),
    ],
  },
  {
    slug: 'english-proficiency-basics',
    title: 'English Proficiency',
    categorySlug: 'english',
    family: 'general_employment',
    skillName: 'English Proficiency',
    description: 'Workplace English fundamentals for Pakistan and international roles.',
    durationMinutes: 25,
    questions: [
      q('Choose the correct article: ___ honest person.', ['a', 'an', 'the', 'no article'], 1),
      q('Past tense of “write”:', ['writed', 'wrote', 'written', 'writing'], 1),
      q('Which is a polite workplace closing?', ['Bye forever', 'Best regards', 'Whatever', 'See ya dumb'], 1),
      q('Fill: I look forward ___ hearing from you.', ['to', 'for', 'at', 'on'], 0),
      q('“Could you please…” is used to', ['Order rudely', 'Make a polite request', 'Refuse', 'Apologize only'], 1),
      q('Subject-verb: The list of items ___ on the desk.', ['are', 'is', 'be', 'were'], 1),
      q('Choose formal vocabulary for “ask for” in email:', ['beg', 'request', 'yell', 'grab'], 1),
      q('Correct plural of “analysis”:', ['analysises', 'analyses', 'analysis', 'analyzes'], 1),
    ],
  },
  {
    slug: 'communication-skills-basics',
    title: 'Communication Skills',
    categorySlug: 'communication',
    family: 'general_employment',
    skillName: 'Communication',
    description: 'Professional communication and soft-skill situational judgment.',
    durationMinutes: 20,
    questions: [
      q('Best response when you do not understand a task:', ['Ignore it', 'Ask clarifying questions', 'Guess silently', 'Blame others'], 1),
      q('Active listening includes:', ['Interrupting often', 'Paraphrasing to confirm', 'Checking phone', 'Only nodding once'], 1),
      q('In conflict at work, preferred first step:', ['Escalate publicly', 'Listen and seek common ground', 'Quit', 'Gossip'], 1),
      q('Clear email subjects should be:', ['Blank', 'Specific and short', 'ALL CAPS always', 'Emoji only'], 1),
      q('When presenting, you should:', ['Read slides word-for-word', 'Speak to the audience', 'Face only the screen', 'Avoid eye contact'], 1),
      q('Feedback is most useful when:', ['Vague', 'Specific and actionable', 'Personal attack', 'Delayed forever'], 1),
      q('Cross-cultural communication tip:', ['Assume sameness', 'Respect differences and clarify', 'Use slang heavily', 'Never ask questions'], 1),
      q('Phone etiquette in interviews:', ['Eat loudly', 'Find quiet place and answer clearly', 'Put on mute forever', 'Have TV loud'], 1),
    ],
  },
  {
    slug: 'computer-fundamentals',
    title: 'Computer Fundamentals',
    categorySlug: 'computer_fundamentals',
    family: 'general_employment',
    skillName: 'Computer Fundamentals',
    description: 'OS, files, internet, and basic IT literacy.',
    durationMinutes: 20,
    questions: [
      q('RAM primarily stores:', ['Permanent files', 'Temporary working data', 'Only videos', 'Printer ink'], 1),
      q('HTTPS indicates:', ['Unsecured site', 'Encrypted connection', 'Offline mode', 'Broken DNS'], 1),
      q('Ctrl+C then Ctrl+V usually:', ['Deletes file', 'Copy then paste', 'Shuts down', 'Prints'], 1),
      q('A PDF is typically used for:', ['Executable code only', 'Portable documents', 'Wi-Fi passwords', 'CPU cooling'], 1),
      q('Cloud storage example:', ['USB only', 'Google Drive / OneDrive', 'CRT monitor', 'Mouse pad'], 1),
      q('Strong password trait:', ['123456', 'Long unique phrase', 'Your name', 'blank'], 1),
      q('Browser cookies often store:', ['Site preferences/session data', 'Your entire hard disk', 'CPU heat', 'Printer paper'], 0),
      q('SSD vs HDD generally:', ['SSD is usually faster', 'HDD is always faster', 'Same always', 'SSD stores only photos'], 0),
    ],
  },
  {
    slug: 'ms-office-basics',
    title: 'MS Office',
    categorySlug: 'ms_office',
    family: 'general_employment',
    skillName: 'MS Office',
    description: 'Word, Excel, and PowerPoint basics for office roles.',
    durationMinutes: 25,
    questions: [
      q('In Excel, =SUM(A1:A3) adds:', ['Text styles', 'Values in A1 to A3', 'Worksheets', 'Macros only'], 1),
      q('Mail merge is commonly used to:', ['Send personalized letters', 'Defrag disk', 'Install printers', 'Compile code'], 0),
      q('PowerPoint slide sorter view helps:', ['Reorder slides', 'Edit BIOS', 'Format C:', 'Block emails'], 0),
      q('Word shortcut for bold (common):', ['Ctrl+B', 'Ctrl+Z', 'Alt+F4', 'Shift+Esc'], 0),
      q('Excel absolute reference for A1:', ['A1', '$A$1', '#A#1', '@A@1'], 1),
      q('Best chart for category comparison:', ['Pie for 100 series', 'Bar/column', 'Scatter of text', '3D always'], 1),
      q('Track Changes in Word is for:', ['Collaborative editing review', 'Antivirus', 'Wi-Fi', 'Calculus'], 0),
      q('Pivot tables help:', ['Summarize large data', 'Shoot videos', 'Tune guitar', 'Flash BIOS'], 0),
    ],
  },
  {
    slug: 'programming-fundamentals',
    title: 'Programming Fundamentals',
    categorySlug: 'programming_fundamentals',
    family: 'technical',
    skillName: 'Programming Fundamentals',
    description: 'Core programming concepts without a live coding judge.',
    durationMinutes: 30,
    questions: [
      q('A loop that runs while a condition is true is typically a:', ['while/for loop', 'comment', 'CSS rule', 'DNS record'], 0),
      q('Variable stores:', ['A value in memory', 'A keyboard', 'A monitor', 'A router'], 0),
      q('An array is best described as:', ['Ordered collection of items', 'Single boolean only', 'Network cable', 'Printer driver'], 0),
      q('Debugging means:', ['Finding and fixing errors', 'Deleting OS', 'Buying RAM', 'Designing logos'], 0),
      q('Boolean values are:', ['true/false', 'only strings', 'only images', 'CSS colors'], 0),
      q('Function/method primarily:', ['Reusable block of logic', 'A database server', 'A GPU cooler', 'A firewall brand'], 0),
      q('Git is used for:', ['Version control', 'Cooking', 'Payroll tax only', 'Painting'], 0),
      q('API typically allows:', ['Software components to communicate', 'Plants to grow', 'Cars to fly', 'Paper to fold itself'], 0),
    ],
  },
  {
    slug: 'problem-solving-basics',
    title: 'Problem Solving',
    categorySlug: 'problem_solving',
    family: 'general_employment',
    skillName: 'Problem Solving',
    description: 'Structured approach to workplace and analytical problems.',
    durationMinutes: 20,
    questions: [
      q('First useful step in solving a vague problem:', ['Define the problem clearly', 'Buy new tools immediately', 'Ignore metrics', 'Blame teammates'], 0),
      q('Breaking a problem into parts is:', ['Decomposition', 'Encryption', 'Compression', 'Pagination'], 0),
      q('A hypothesis is:', ['A testable explanation', 'A final invoice', 'A logo', 'A password'], 0),
      q('When a fix fails, you should:', ['Iterate with new evidence', 'Never try again', 'Hide the log', 'Change nothing'], 0),
      q('Prioritization often uses:', ['Impact vs effort', 'Random chance only', 'Loudest voice only', 'Coin flips only'], 0),
      q('Root cause analysis seeks:', ['Underlying cause', 'Surface symptom only', 'Budget padding', 'Meeting invites'], 0),
      q('MVP means shipping:', ['Minimal useful version', 'Final eternal product', 'Only UI mock', 'Unlogged binaries'], 0),
      q('Good metric is:', ['Measurable and relevant', 'Vague vibes', 'Unrelated fluff', 'Secret forever'], 0),
    ],
  },
  {
    slug: 'career-aptitude-basics',
    title: 'Career Aptitude',
    categorySlug: 'aptitude',
    family: 'general_employment',
    skillName: 'Career Aptitude',
    description: 'Self-knowledge prompts mapped to role-fit signals (deterministic scoring).',
    durationMinutes: 20,
    questions: [
      q('You enjoy building systems and automating work. Lean toward:', ['Engineering / IT', 'Only hospitality seating', 'None', 'Unrelated farming only'], 0),
      q('Strong interest in helping people through conversation suggests:', ['Counseling / HR / support', 'Silent warehouse only forever', 'No people roles', 'Avoid speaking'], 0),
      q('Preferring structured rules and audits may fit:', ['Accounting / compliance', 'Unstructured improv only', 'Random gigs only', 'No data work'], 0),
      q('Liking visual design and storytelling may fit:', ['Marketing / content / design', 'Only server racks', 'Tax filing only', 'Mining heavy equipment'], 0),
      q('Comfort with teaching others suggests:', ['Training / education roles', 'Never mentor', 'Avoid explanation', 'Only solo labs forever'], 0),
      q('Entrepreneurial interest often needs:', ['Sales + problem ownership', 'Zero risk appetite forever', 'No customer contact', 'Ignore cashflow'], 0),
      q('Data curiosity leans toward:', ['Analytics / research', 'Ignore numbers always', 'Avoid spreadsheets', 'Refuse charts'], 0),
      q('Best next step after aptitude insight:', ['Pick a path and take related assessments', 'Do nothing', 'Delete profile', 'Avoid guidance'], 0),
    ],
  },
];

export async function seedAssessments({ force = false } = {}) {
  await AssessmentCategoryRepository.ensureDefaults();
  let created = 0;
  let skipped = 0;
  const actor = { type: 'system', id: null };

  for (const def of MVP_ASSESSMENTS) {
    const existing = await AssessmentRepository.findBySlug(def.slug);
    if (existing && !force) {
      skipped += 1;
      continue;
    }

    let bank = await QuestionBankRepository.findBySlug(`${def.slug}-bank`);
    if (!bank) {
      bank = await AssessmentService.createQuestionBank({
        title: `${def.title} Question Bank`,
        slug: `${def.slug}-bank`,
        description: def.description,
        categorySlug: def.categorySlug,
        status: 'active',
      });
      for (const item of def.questions) {
        await AssessmentService.addQuestion(bank._id, item);
      }
    }

    if (!existing) {
      const assessment = await AssessmentService.createAssessment({
        title: def.title,
        slug: def.slug,
        description: def.description,
        categorySlug: def.categorySlug,
        family: def.family,
        skillName: def.skillName,
        durationMinutes: def.durationMinutes,
        passingScore: 70,
        maxAttempts: 5,
        employerVisible: true,
        questionBankId: bank._id,
        status: 'draft',
        credentialRule: {
          enabled: true,
          skillName: def.skillName,
          credentialTitle: `${def.skillName} Verified`,
          issuer: 'EduRozgaar Assessments',
          minScore: 70,
          expiryDays: 365,
          autoVerify: true,
        },
      }, actor);
      await AssessmentService.publishAssessment(assessment._id, actor);
      created += 1;
    }
  }

  console.log(`Assessments seed: created=${created}, skipped=${skipped}, catalog=${MVP_ASSESSMENTS.length}`);
  return { created, skipped, total: MVP_ASSESSMENTS.length };
}
