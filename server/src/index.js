import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import { connectDB } from './config/db.js';
import { startScraperCron } from './scheduler/cron.js';
import { healthRouter, jobsRouter, scholarshipsRouter, admissionsRouter, blogsRouter, foreignStudiesRouter, authRouter, adminRouter, trendingRouter, newsletterRouter, notificationsRouter, monetizationRouter, usersRouter, v1Router, examsRouter, internshipsRouter, chatbotRouter, webinarsRouter, intlScholarshipsRouter, badgesRouter, seoRouter, resumesRouter, employerRouter } from './routes/index.js';
import { getSitemap, getRobots } from './controllers/seoController.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { getCorsOptions } from './config/cors.js';
import { validateProductionEnv } from './config/validateEnv.js';

validateProductionEnv();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors(getCorsOptions()));
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());
app.use(requestLogger);
app.use('/api', apiLimiter);

app.get('/sitemap.xml', getSitemap);
app.get('/robots.txt', getRobots);

app.use('/api', healthRouter);
app.use('/api', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api', jobsRouter);
app.use('/api', scholarshipsRouter);
app.use('/api', admissionsRouter);
app.use('/api', blogsRouter);
app.use('/api', foreignStudiesRouter);
app.use('/api', trendingRouter);
app.use('/api', newsletterRouter);
app.use('/api', notificationsRouter);
app.use('/api', monetizationRouter);
app.use('/api', usersRouter);
app.use('/api', examsRouter);
app.use('/api', internshipsRouter);
app.use('/api', chatbotRouter);
app.use('/api', webinarsRouter);
app.use('/api', intlScholarshipsRouter);
app.use('/api', badgesRouter);
app.use('/api', seoRouter);
app.use('/api', resumesRouter);
app.use('/api', employerRouter);
app.use('/api/v1', v1Router);

app.use(errorHandler);

connectDB()
  .then(async () => {
    const { seedJobPlans } = await import('./seed/jobPlans.js');
    await seedJobPlans().catch((e) => console.warn('Job plans seed:', e.message));
    startScraperCron();
    app.listen(PORT, () => {
      console.log(`EduRozgaar API running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('\n❌ MongoDB connection failed:', err.message);
    console.error('\n👉 Start MongoDB first:');
    console.error('   Windows:  net start MongoDB');
    console.error('   Mac/Linux:  mongod (or sudo systemctl start mongod)\n');
    process.exit(1);
  });
