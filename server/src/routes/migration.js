import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireStaff } from '../middleware/rbac.js';
import {
  getMigrationFlags,
  getMigrationReconcile,
  runMigrationPipeline,
  runApplicationMigration,
  runDocumentMigration,
  runCredentialHydration,
  requireMigrationJobs,
} from '../controllers/career/migrationController.js';

export const migrationRouter = Router();

const staff = [requireAuth, requireStaff];
const staffMigrate = [...staff, requireMigrationJobs];

migrationRouter.get('/admin/career/migration/flags', ...staff, getMigrationFlags);
migrationRouter.get('/admin/career/migration/reconcile', ...staff, getMigrationReconcile);
migrationRouter.post('/admin/career/migration/run', ...staffMigrate, runMigrationPipeline);
migrationRouter.post('/admin/career/migration/applications', ...staffMigrate, runApplicationMigration);
migrationRouter.post('/admin/career/migration/documents', ...staffMigrate, runDocumentMigration);
migrationRouter.post('/admin/career/migration/credentials', ...staffMigrate, runCredentialHydration);
