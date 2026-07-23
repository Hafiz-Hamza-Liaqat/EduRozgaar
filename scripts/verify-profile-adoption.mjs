#!/usr/bin/env node
/**
 * TalentProfile platform adoption verification (C.8.0.2B.2).
 */
import { existsSync, readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let passed = 0;

function pass(name) { passed += 1; }
function fail(name, detail) { failures.push(`${name}${detail ? `: ${detail}` : ''}`); }
function exists(rel) { return docExists(root, rel); }
function read(rel) { return readFileSync(join(root, rel), 'utf8'); }

// Shared bridge
{
  const bridge = read('shared/career/resumeBridge.js');
  if (bridge.includes('talentProfileToResumeView') && bridge.includes('resumeViewToTalentProfilePayload')) {
    pass('resumeBridge exports');
  } else fail('resumeBridge exports');
}

// Read service + adoption API
{
  const svc = read('server/src/services/career/TalentProfileReadService.js');
  const routes = read('server/src/routes/talent.js');
  if (svc.includes('getResumeBuilderView') && svc.includes('getCareerTargetingContext')) pass('TalentProfileReadService');
  else fail('TalentProfileReadService');

  if (exists('server/src/controllers/career/profileAdoptionController.js')) pass('profileAdoptionController');
  else fail('profileAdoptionController');

  for (const ep of ['/talent/me/resume-builder', '/talent/me/summary', '/talent/me/apply-kit', '/talent/me/prefill', '/talent/me/candidate-card']) {
    if (routes.includes(ep)) pass(`route ${ep}`);
    else fail(`route ${ep}`);
  }
}

// Feature flags (server + client)
{
  const serverFlags = read('server/src/config/careerFeatureFlags.js');
  const clientFlags = read('client/src/config/careerFeatureFlags.js');
  if (serverFlags.includes('TALENT_PROFILE_READ_CANONICAL') && clientFlags.includes('VITE_TALENT_PROFILE_READ_CANONICAL')) {
    pass('feature flags mirrored');
  } else fail('feature flags mirrored');
}

// Migrated consumers read from TalentProfile
{
  const resumeBuilder = read('client/src/pages/ResumeBuilder/ResumeBuilder.jsx');
  if (resumeBuilder.includes('talentApi') && resumeBuilder.includes('saveResumeBuilder')) pass('ResumeBuilder → talentApi');
  else fail('ResumeBuilder → talentApi');

  const legacyDashboard = read('client/src/pages/Dashboard/LegacyDashboard.jsx');
  if (legacyDashboard.includes('data.resumes') && !legacyDashboard.includes('resumesApi.getMy')) pass('Dashboard resumes from API summary');
  else fail('Dashboard resumes from API summary');

  const jobDetail = read('client/src/pages/Jobs/JobDetail.jsx');
  if (jobDetail.includes('getApplyKit')) pass('Job apply → apply-kit');
  else fail('Job apply → apply-kit');

  const scholarship = read('client/src/pages/Scholarships/ScholarshipDetail.jsx');
  const admission = read('client/src/pages/Admissions/AdmissionDetail.jsx');
  if (scholarship.includes('ApplyKitBanner') && admission.includes('ApplyKitBanner')) pass('scholarship/admission apply-kit');
  else fail('scholarship/admission apply-kit');

  const employer = read('client/src/pages/Employer/EmployerApplications.jsx');
  if (employer.includes('app.candidate')) pass('employer candidate preview');
  else fail('employer candidate preview');

  const formRenderer = read('client/src/components/forms/FormRenderer.jsx');
  if (formRenderer.includes('getPrefill')) pass('forms autofill');
  else fail('forms autofill');

  const menu = read('client/src/components/layout/UserAccountMenu.jsx');
  if (menu.includes('getSummary')) pass('header profile summary');
  else fail('header profile summary');
}

// Server controllers use read service (no duplicate career writes on User)
{
  const dash = read('server/src/controllers/dashboardController.js');
  const rec = read('server/src/controllers/recommendationsController.js');
  const apps = read('server/src/controllers/applicationsController.js');
  const emp = read('server/src/controllers/employerController.js');

  if (dash.includes('TalentProfileReadService') && rec.includes('TalentProfileReadService')) pass('server targeting reads');
  else fail('server targeting reads');

  if (apps.includes('resolveResumeUrlForApply') && apps.includes('resumeSource')) pass('job apply canonical resume');
  else fail('job apply canonical resume');

  if (emp.includes('getCandidateCardForUser')) pass('employer enrichment');
  else fail('employer enrichment');
}

// Application model linkage
{
  const app = read('server/src/models/Application.js');
  if (app.includes('talentProfileId') && app.includes('resumeSource')) pass('Application talent fields');
  else fail('Application talent fields');
}

// Legacy backward compatibility
{
  const resumesRoute = read('server/src/routes/resumes.js');
  const resumeSvc = read('server/src/services/career/TalentProfileService.js');
  if (resumesRoute.includes('createResume') && resumeSvc.includes('dualWriteLegacyResume')) pass('legacy resume backward compat');
  else fail('legacy resume backward compat');
}

// No duplicate career writes in migrated client modules
{
  const forbiddenWrites = ['authApi.updateProfile', 'usersApi.updateProvince'];
  const files = [
    'client/src/pages/ResumeBuilder/ResumeBuilder.jsx',
    'client/src/pages/Dashboard/Dashboard.jsx',
    'client/src/pages/Jobs/JobDetail.jsx',
    'client/src/components/forms/FormRenderer.jsx',
  ];
  let leaked = false;
  for (const f of files) {
    const content = read(f);
    for (const w of forbiddenWrites) {
      if (content.includes(w)) leaked = true;
    }
  }
  if (!leaked) pass('no duplicate career writes in migrated UI');
  else fail('no duplicate career writes in migrated UI');
}

// Search mapper remains canonical
{
  const mappers = read('server/src/services/search/documentMappers.js');
  if (mappers.includes('mapTalentProfileToSearchDocument')) pass('search mapper');
  else fail('search mapper');
}

// talentApi adoption endpoints
{
  const api = read('client/src/services/talentApi.js');
  for (const fn of ['getResumeBuilder', 'getApplyKit', 'getPrefill', 'getSummary']) {
    if (api.includes(fn)) pass(`talentApi.${fn}`);
    else fail(`talentApi.${fn}`);
  }
}

// Env template documents client flags
{
  const env = exists('.env.template') ? read('.env.template') : '';
  if (env.includes('VITE_TALENT_PROFILE_READ_CANONICAL')) pass('env template client flags');
  else fail('env template client flags');
}

console.log(`\nProfile adoption verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.error(`  ✗ ${f}`));
  process.exit(1);
}
console.log('PASS');
process.exit(0);
