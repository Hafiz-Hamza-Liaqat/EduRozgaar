import { Router } from 'express';
import {
  getPublicHomepage,
  getPublicNavigation,
  getPublicPage,
  listPublicBanners,
} from '../controllers/cmsController.js';
import { getPageLayoutPublished } from '../controllers/pageLayoutController.js';
import { getGlobalBlocksPublic } from '../controllers/globalBlockController.js';

export const cmsRouter = Router();

cmsRouter.get('/site/homepage', getPublicHomepage);
cmsRouter.get('/site/navigation', getPublicNavigation);
cmsRouter.get('/site/banners', listPublicBanners);
cmsRouter.get('/site/pages/:slug', getPublicPage);
cmsRouter.get('/site/page-layouts/:pageKey', getPageLayoutPublished);
cmsRouter.get('/site/global-blocks', getGlobalBlocksPublic);
