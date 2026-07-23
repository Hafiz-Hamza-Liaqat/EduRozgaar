/**
 * Run government job scraper every 6 hours. Disable with DISABLE_SCRAPER_CRON=1.
 */
import cron from 'node-cron';
import { runGovernmentJobScraper } from './jobScraper.js';
import { generateBlogFromListings } from '../services/blogAutoGenerateService.js';
import { processQueue } from '../services/jobQueueService.js';
import { processDueScheduledWorkflows } from '../services/workflow/workflowSchedulerService.js';
import {
  runScholarshipDeadlineReminders,
  runAdmissionDeadlineReminders,
  runSubscriptionExpiryReminders,
} from './reminderJobs.js';

const CRON_SCHEDULE = '0 */6 * * *'; // every 6 hours at minute 0
const QUEUE_SCHEDULE = '* * * * *'; // every minute
const REMINDER_SCHEDULE = '0 8 * * *'; // daily 8am

let task = null;
let queueTask = null;
let reminderTask = null;

export function startScraperCron() {
  if (process.env.DISABLE_SCRAPER_CRON === '1') {
    console.log('[Cron] Scraper cron disabled (DISABLE_SCRAPER_CRON=1)');
  } else {
    task = cron.schedule(CRON_SCHEDULE, async () => {
      console.log('[Cron] Starting government job scraper...');
      try {
        const result = await runGovernmentJobScraper();
        console.log('[Cron] Government scraper done:', result.jobsAdded, 'jobs added');
        if (result.jobsAdded > 0) {
          try {
            await generateBlogFromListings();
            console.log('[Cron] Auto blog generated');
          } catch (e) {
            console.error('[Cron] Auto blog error:', e.message);
          }
        }
      } catch (err) {
        console.error('[Cron] Scraper error:', err.message);
      }
    });
    console.log('[Cron] Government job scraper scheduled every 6 hours');
  }

  if (process.env.DISABLE_QUEUE_CRON !== '1') {
    queueTask = cron.schedule(QUEUE_SCHEDULE, async () => {
      try {
        const result = await processQueue();
        if (result.processed > 0) {
          console.log('[Cron] Queue processed:', result);
        }
        const wf = await processDueScheduledWorkflows();
        if (wf.processed > 0) {
          console.log('[Cron] Workflow scheduler:', wf);
        }
      } catch (err) {
        console.error('[Cron] Queue error:', err.message);
      }
    });
    console.log('[Cron] Background job queue processor every minute');
  }

  if (process.env.DISABLE_REMINDER_CRON !== '1') {
    reminderTask = cron.schedule(REMINDER_SCHEDULE, async () => {
      try {
        const [sch, adm, sub] = await Promise.all([
          runScholarshipDeadlineReminders(),
          runAdmissionDeadlineReminders(),
          runSubscriptionExpiryReminders(),
        ]);
        console.log('[Cron] Reminders:', { sch, adm, sub });
      } catch (err) {
        console.error('[Cron] Reminder error:', err.message);
      }
    });
    console.log('[Cron] Deadline/subscription reminders daily at 8:00');
  }
}

export function stopScraperCron() {
  if (task) { task.stop(); task = null; }
  if (queueTask) { queueTask.stop(); queueTask = null; }
  if (reminderTask) { reminderTask.stop(); reminderTask = null; }
}
