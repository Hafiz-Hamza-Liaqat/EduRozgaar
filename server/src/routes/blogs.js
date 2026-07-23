import { Router } from 'express';
import { getBlogs, getBlogByIdOrSlug } from '../controllers/blogsController.js';
import { autoGenerateBlog } from '../controllers/blogsAutoGenerateController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireStaff, requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS } from '../config/rbac.js';

export const blogsRouter = Router();

blogsRouter.get('/blogs', getBlogs);
blogsRouter.post('/blogs/auto-generate', requireAuth, requireStaff, requirePermission(PERMISSIONS.CONTENT_BLOGS), autoGenerateBlog);
blogsRouter.get('/blogs/:idOrSlug', getBlogByIdOrSlug);
