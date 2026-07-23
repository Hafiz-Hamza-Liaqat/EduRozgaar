/**
 * Assessment platform shared constants (C.8.4).
 * Categories are configurable via AssessmentCategory documents; these are defaults.
 */

export const ASSESSMENT_STATUSES = ['draft', 'review', 'published', 'archived'];

export const ASSESSMENT_ATTEMPT_STATUSES = [
  'started',
  'in_progress',
  'submitted',
  'scored',
  'voided',
];

/** Top-level family — future categories register under these without schema redesign. */
export const ASSESSMENT_CATEGORY_FAMILIES = [
  'general_employment',
  'technical',
  'professional',
];

/** Default category slugs (seed / catalog). */
export const DEFAULT_ASSESSMENT_CATEGORIES = [
  { slug: 'iq', family: 'general_employment', labelKey: 'categories.iq' },
  { slug: 'logical_reasoning', family: 'general_employment', labelKey: 'categories.logicalReasoning' },
  { slug: 'numerical_reasoning', family: 'general_employment', labelKey: 'categories.numericalReasoning' },
  { slug: 'verbal_reasoning', family: 'general_employment', labelKey: 'categories.verbalReasoning' },
  { slug: 'english', family: 'general_employment', labelKey: 'categories.english' },
  { slug: 'communication', family: 'general_employment', labelKey: 'categories.communication' },
  { slug: 'aptitude', family: 'general_employment', labelKey: 'categories.aptitude' },
  { slug: 'computer_fundamentals', family: 'general_employment', labelKey: 'categories.computerFundamentals' },
  { slug: 'problem_solving', family: 'general_employment', labelKey: 'categories.problemSolving' },
  { slug: 'excel', family: 'general_employment', labelKey: 'categories.excel' },
  { slug: 'ms_office', family: 'general_employment', labelKey: 'categories.msOffice' },
  { slug: 'programming_fundamentals', family: 'technical', labelKey: 'categories.programmingFundamentals' },
  { slug: 'html', family: 'technical', labelKey: 'categories.html' },
  { slug: 'css', family: 'technical', labelKey: 'categories.css' },
  { slug: 'javascript', family: 'technical', labelKey: 'categories.javascript' },
  { slug: 'react', family: 'technical', labelKey: 'categories.react' },
  { slug: 'sql', family: 'technical', labelKey: 'categories.sql' },
  { slug: 'python', family: 'technical', labelKey: 'categories.python' },
  { slug: 'java', family: 'technical', labelKey: 'categories.java' },
  { slug: 'project_management', family: 'professional', labelKey: 'categories.projectManagement' },
  { slug: 'customer_service', family: 'professional', labelKey: 'categories.customerService' },
  { slug: 'hr', family: 'professional', labelKey: 'categories.hr' },
  { slug: 'sales', family: 'professional', labelKey: 'categories.sales' },
  { slug: 'accounting', family: 'professional', labelKey: 'categories.accounting' },
];

export const ASSESSMENT_PROCTORING_LEVELS = ['none', 'basic', 'proctored'];

export const QUESTION_TYPES = ['mcq', 'true_false', 'multi_select'];

export const ASSESSMENT_DOMAIN_EVENTS = [
  'AssessmentPublished',
  'AssessmentStarted',
  'AssessmentCompleted',
  'AssessmentPassed',
  'AssessmentFailed',
];
