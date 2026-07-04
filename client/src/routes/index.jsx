import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { MainLayoutWrapper } from '../layouts/MainLayout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { ProtectedEmployerRoute } from '../components/employer/ProtectedEmployerRoute';
import { ROUTES } from '../constants';
import { ROLES } from '../constants';

const Home = lazyLoad(() => import('../pages/Home/Home'));
const Jobs = lazyLoad(() => import('../pages/Jobs/Jobs'));
const JobDetail = lazyLoad(() => import('../pages/Jobs/JobDetail'));
const Scholarships = lazyLoad(() => import('../pages/Scholarships/Scholarships'));
const ScholarshipDetail = lazyLoad(() => import('../pages/Scholarships/ScholarshipDetail'));
const Admissions = lazyLoad(() => import('../pages/Admissions/Admissions'));
const AdmissionDetail = lazyLoad(() => import('../pages/Admissions/AdmissionDetail'));
const SchoolsAndColleges = lazyLoad(() => import('../pages/SchoolsAndColleges/SchoolsAndColleges'));
const ForeignStudies = lazyLoad(() => import('../pages/ForeignStudies/ForeignStudies'));
const Blog = lazyLoad(() => import('../pages/Blog/Blog'));
const BlogPost = lazyLoad(() => import('../pages/Blog/BlogPost'));
const Contact = lazyLoad(() => import('../pages/Contact/Contact'));
const Login = lazyLoad(() => import('../pages/Auth/Login'));
const Register = lazyLoad(() => import('../pages/Auth/Register'));
const ForgotPassword = lazyLoad(() => import('../pages/Auth/ForgotPassword'));
const ResetPassword = lazyLoad(() => import('../pages/Auth/ResetPassword'));
const Profile = lazyLoad(() => import('../pages/Profile/Profile'));
const Dashboard = lazyLoad(() => import('../pages/Dashboard/Dashboard'));
const SavedJobs = lazyLoad(() => import('../pages/SavedJobs/SavedJobs'));
const Admin = lazyLoad(() => import('../pages/Admin/Admin'));
const AIJobGenerator = lazyLoad(() => import('../pages/Admin/AIJobGenerator'));
const AnalyticsDashboard = lazyLoad(() => import('../pages/Admin/AnalyticsDashboard'));
const GrowthDashboard = lazyLoad(() => import('../pages/Admin/GrowthDashboard'));
const AlertsAdmin = lazyLoad(() => import('../pages/Admin/AlertsAdmin'));
const JobsProvinceLanding = lazyLoad(() => import('../pages/Landing/JobsProvinceLanding'));
const JobsCategoryLanding = lazyLoad(() => import('../pages/Landing/JobsCategoryLanding'));
const ResumeAnalyzer = lazyLoad(() => import('../pages/ResumeAnalyzer/ResumeAnalyzer'));
const ExamPrep = lazyLoad(() => import('../pages/ExamPrep/ExamPrep'));
const ExamDetail = lazyLoad(() => import('../pages/ExamPrep/ExamDetail'));
const QuizTake = lazyLoad(() => import('../pages/ExamPrep/QuizTake'));
const Internships = lazyLoad(() => import('../pages/Internships/Internships'));
const InternshipDetail = lazyLoad(() => import('../pages/Internships/InternshipDetail'));
const Webinars = lazyLoad(() => import('../pages/Webinars/Webinars'));
const IntlScholarships = lazyLoad(() => import('../pages/IntlScholarships/IntlScholarships'));
const IntlScholarshipDetail = lazyLoad(() => import('../pages/IntlScholarships/IntlScholarshipDetail'));
const Badges = lazyLoad(() => import('../pages/Badges/Badges'));
const ResumeBuilder = lazyLoad(() => import('../pages/ResumeBuilder/ResumeBuilder'));
const CareerGuidance = lazyLoad(() => import('../pages/CareerGuidance/CareerGuidance'));
const SEOJobsPage = lazyLoad(() => import('../pages/SEO/SEOJobsPage'));
const SEOScholarshipsPage = lazyLoad(() => import('../pages/SEO/SEOScholarshipsPage'));
const About = lazyLoad(() => import('../pages/Static/About'));
const Services = lazyLoad(() => import('../pages/Static/Services'));
const Advertise = lazyLoad(() => import('../pages/Static/Advertise'));
const HelpCenter = lazyLoad(() => import('../pages/Static/HelpCenter'));
const FAQ = lazyLoad(() => import('../pages/Static/FAQ'));
const SubmitOpportunity = lazyLoad(() => import('../pages/Static/SubmitOpportunity'));
const PrivacyPolicy = lazyLoad(() => import('../pages/Static/PrivacyPolicy'));
const Terms = lazyLoad(() => import('../pages/Static/Terms'));
const Cookies = lazyLoad(() => import('../pages/Static/Cookies'));
const License = lazyLoad(() => import('../pages/Static/License'));
const EmployerLogin = lazyLoad(() => import('../pages/Employer/EmployerLogin'));
const EmployerRegister = lazyLoad(() => import('../pages/Employer/EmployerRegister'));
const EmployerLayout = lazyLoad(() => import('../pages/Employer/EmployerLayout'));
const EmployerDashboard = lazyLoad(() => import('../pages/Employer/EmployerDashboard'));
const EmployerJobs = lazyLoad(() => import('../pages/Employer/EmployerJobs'));
const EmployerPostJob = lazyLoad(() => import('../pages/Employer/EmployerPostJob'));
const EmployerApplications = lazyLoad(() => import('../pages/Employer/EmployerApplications'));
const EmployerAnalytics = lazyLoad(() => import('../pages/Employer/EmployerAnalytics'));
const EmployerSettings = lazyLoad(() => import('../pages/Employer/EmployerSettings'));

function lazyLoad(importFn) {
  const Lazy = lazy(importFn);
  return function Wrapped(props) {
    return (
      <Suspense fallback={<PageFallback />}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}

function PageFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading...</div>
    </div>
  );
}

export const routes = [
  {
    path: '/',
    element: <MainLayoutWrapper />,
    children: [
      { index: true, element: <Home /> },
      { path: ROUTES.JOBS, element: <Jobs /> },
      { path: '/jobs-in-:slug', element: <SEOJobsPage /> },
      { path: '/latest-government-jobs', element: <SEOJobsPage /> },
      { path: '/fpsc-jobs', element: <SEOJobsPage /> },
      { path: '/nts-jobs', element: <SEOJobsPage /> },
      { path: '/ppsc-jobs', element: <SEOJobsPage /> },
      { path: '/wapda-jobs', element: <SEOJobsPage /> },
      { path: '/government-jobs', element: <SEOJobsPage /> },
      { path: '/private-jobs', element: <SEOJobsPage /> },
      { path: '/internship-jobs', element: <SEOJobsPage /> },
      { path: `${ROUTES.JOBS}/province/:slug`, element: <JobsProvinceLanding /> },
      { path: `${ROUTES.JOBS}/category/:slug`, element: <JobsCategoryLanding /> },
      { path: `${ROUTES.JOBS}/:slug`, element: <JobDetail /> },
      { path: '/scholarships-in-:country', element: <SEOScholarshipsPage /> },
      { path: ROUTES.SCHOLARSHIPS, element: <Scholarships /> },
      { path: `${ROUTES.SCHOLARSHIPS}/:slug`, element: <ScholarshipDetail /> },
      { path: ROUTES.ADMISSIONS, element: <Admissions /> },
      { path: `${ROUTES.ADMISSIONS}/:slug`, element: <AdmissionDetail /> },
      { path: ROUTES.SCHOOLS_AND_COLLEGES, element: <SchoolsAndColleges /> },
      { path: ROUTES.FOREIGN_STUDIES, element: <ForeignStudies /> },
      { path: ROUTES.BLOG, element: <Blog /> },
      { path: `${ROUTES.BLOG}/:slug`, element: <BlogPost /> },
      { path: ROUTES.CONTACT, element: <Contact /> },
      { path: ROUTES.ABOUT, element: <About /> },
      { path: ROUTES.SERVICES, element: <Services /> },
      { path: ROUTES.ADVERTISE, element: <Advertise /> },
      { path: ROUTES.HELP_CENTER, element: <HelpCenter /> },
      { path: ROUTES.FAQ, element: <FAQ /> },
      { path: ROUTES.SUBMIT_OPPORTUNITY, element: <SubmitOpportunity /> },
      { path: ROUTES.PRIVACY_POLICY, element: <PrivacyPolicy /> },
      { path: ROUTES.TERMS, element: <Terms /> },
      { path: ROUTES.COOKIES, element: <Cookies /> },
      { path: ROUTES.LICENSE, element: <License /> },
      { path: ROUTES.LOGIN, element: <Login /> },
      { path: ROUTES.REGISTER, element: <Register /> },
      { path: ROUTES.EMPLOYER_LOGIN, element: <EmployerLogin /> },
      { path: ROUTES.EMPLOYER_REGISTER, element: <EmployerRegister /> },
      {
        path: ROUTES.EMPLOYER_DASHBOARD,
        element: (
          <ProtectedEmployerRoute>
            <EmployerLayout />
          </ProtectedEmployerRoute>
        ),
        children: [
          { index: true, element: <EmployerDashboard /> },
          { path: 'jobs', element: <EmployerJobs /> },
          { path: 'jobs/new', element: <EmployerPostJob /> },
          { path: 'applications', element: <EmployerApplications /> },
          { path: 'analytics', element: <EmployerAnalytics /> },
          { path: 'settings', element: <EmployerSettings /> },
        ],
      },
      { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPassword /> },
      { path: ROUTES.RESET_PASSWORD, element: <ResetPassword /> },
      {
        path: ROUTES.PROFILE,
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.DASHBOARD,
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SAVED_JOBS,
        element: (
          <ProtectedRoute>
            <SavedJobs />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN,
        element: (
          <ProtectedRoute requireRole={[ROLES.ADMIN]}>
            <Admin />
          </ProtectedRoute>
        ),
        children: [
          { path: 'growth-dashboard', element: <GrowthDashboard /> },
          { path: 'ai-job-generator', element: <AIJobGenerator /> },
          { path: 'analytics', element: <AnalyticsDashboard /> },
          { path: 'alerts', element: <AlertsAdmin /> },
        ],
      },
      {
        path: ROUTES.RESUME_ANALYZER,
        element: (
          <ProtectedRoute>
            <ResumeAnalyzer />
          </ProtectedRoute>
        ),
      },
      { path: ROUTES.RESUME_BUILDER, element: <ResumeBuilder /> },
      { path: ROUTES.CAREER_GUIDANCE, element: <CareerGuidance /> },
      { path: ROUTES.EXAM_PREP, element: <ExamPrep /> },
      { path: `${ROUTES.EXAM_PREP}/quiz/:quizId`, element: <QuizTake /> },
      { path: `${ROUTES.EXAM_PREP}/:slug`, element: <ExamDetail /> },
      { path: ROUTES.INTERNSHIPS, element: <Internships /> },
      { path: `${ROUTES.INTERNSHIPS}/:idOrSlug`, element: <InternshipDetail /> },
      { path: ROUTES.WEBINARS, element: <Webinars /> },
      { path: ROUTES.INTL_SCHOLARSHIPS, element: <IntlScholarships /> },
      { path: `${ROUTES.INTL_SCHOLARSHIPS}/:id`, element: <IntlScholarshipDetail /> },
      {
        path: ROUTES.BADGES_LEADERBOARD,
        element: (
          <ProtectedRoute>
            <Badges />
          </ProtectedRoute>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
];
