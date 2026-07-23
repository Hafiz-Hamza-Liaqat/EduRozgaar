# Sprint C.5 — Final Launch Preparation

**Status:** Checklist (manual + automated)  
**Date:** 2026-07-12  
**Prerequisite:** Sprint C.4 complete

Deploy to production **only after every section below is signed off**.

---

## Automated checks

```bash
# Start API locally
cd server && npm run dev

# C.4 automation
node scripts/verify-sprint-c4.mjs

# C.5 readiness (docs + health + SEO files)
node scripts/verify-sprint-c5.mjs
```

---

## 1. Complete QA — run every flow

### Student
- [ ] Register → receive welcome + verification email
- [ ] Verify email via `/auth/verify-email?token=…`
- [ ] Login / logout / refresh token
- [ ] Browse jobs, scholarships, admissions; save items
- [ ] Apply for job → confirmation email + inbox notification
- [ ] Dashboard shows applications and saved items
- [ ] Resume builder → download PDF → analytics event
- [ ] Resume analyzer → completion notification
- [ ] Support ticket → reply notification + email
- [ ] Contact form → acknowledgement email

### Employer
- [ ] Register / login
- [ ] Post job → moderation queue
- [ ] Receive application notification + email
- [ ] Update application status (shortlist, interview, hire)
- [ ] Payment flow (Stripe test mode) → success notification
- [ ] Verification change notification

### Editor
- [ ] Login with Editor role
- [ ] Create/edit blog post, career article
- [ ] Cannot access admin-only routes (users, payments)

### Moderator
- [ ] Approve/reject jobs
- [ ] Verify employers
- [ ] View reports queue

### Admin
- [ ] Executive dashboard metrics load
- [ ] Queue status (`/admin/monitoring`, queue API)
- [ ] Newsletter compose + schedule
- [ ] Webinar publish → staff notification
- [ ] Contact inbox, support tickets, platform ops

### Super Admin
- [ ] Assign roles
- [ ] Env validation view
- [ ] Cannot demote last Super Admin

---

## 2. Production security audit

| Item | Verify | How |
|------|--------|-----|
| CSP | [ ] | Check response headers on production/staging |
| CORS | [ ] | `FRONTEND_URL` matches Vercel origin |
| JWT expiry | [ ] | Access token TTL in env; expired token rejected |
| Refresh tokens | [ ] | Rotation + revocation in Redis |
| Rate limiting | [ ] | Auth, contact, support endpoints throttled |
| File uploads | [ ] | MIME/size limits; Cloudinary in prod |
| XSS | [ ] | User HTML sanitized; React escapes by default |
| CSRF | [ ] | JWT in Authorization header (SPA); cookies httpOnly for refresh |
| Secrets | [ ] | No secrets in repo; `validateProductionEnv()` passes |
| Environment variables | [ ] | All required vars set on Render/Vercel |

Reference: `docs/SPRINT_C2_SECURITY_IMPLEMENTATION_REPORT.md`

---

## 3. SEO final audit

| Item | Verify |
|------|--------|
| `sitemap.xml` | [ ] |
| `robots.txt` | [ ] |
| hreflang (EN/UR) | [ ] |
| Canonical URLs | [ ] |
| Structured data (JobPosting, Article, etc.) | [ ] |
| OpenGraph tags | [ ] |
| Twitter Cards | [ ] |
| Breadcrumbs | [ ] |
| Page titles unique | [ ] |
| Meta descriptions | [ ] |
| Custom 404 page | [ ] |

---

## 4. Accessibility

- [ ] Keyboard navigation on nav, forms, modals
- [ ] Screen reader labels on icon buttons
- [ ] Color contrast WCAG AA
- [ ] Mobile responsiveness (320px–1440px)
- [ ] Touch targets ≥ 44px

---

## 5. Performance — Lighthouse targets

Run Lighthouse on staging for: Home, Jobs, Job detail, Blog post.

| Category | Target |
|----------|--------|
| Performance | > 90 |
| Accessibility | > 95 |
| Best Practices | > 95 |
| SEO | > 95 |

---

## 6. Backup verification

| Service | Verify |
|---------|--------|
| MongoDB Atlas | [ ] Automated backups enabled |
| Restore drill | [ ] Restore to test cluster documented |
| Cloudinary | [ ] Folder backup/export policy |
| Brevo | [ ] Template copies in repo |
| Stripe | [ ] Webhook secrets + test/live keys separated |
| Environment variables | [ ] Exported securely (1Password / vault) |

---

## 7. Deployment documentation

| Document | Path |
|----------|------|
| Production deployment | `docs/DEPLOYMENT_GUIDE.md` |
| Rollback | `docs/ROLLBACK_GUIDE.md` |
| Monitoring | `docs/MONITORING_GUIDE.md` |
| Incident recovery | `docs/INCIDENT_RECOVERY.md` |
| Admin manual | `docs/ADMIN_MANUAL.md` |
| Editor manual | `docs/EDITOR_MANUAL.md` |
| Moderator manual | `docs/MODERATOR_MANUAL.md` |

---

## 8. Deploy (after C.5 passes)

Order of operations:

1. MongoDB Atlas — production cluster + backups
2. Render — API service (`server/`)
3. Vercel — client SPA (`client/`)
4. Cloudinary — production folder
5. Brevo — domain authentication + templates
6. Stripe — live keys + webhook URL
7. Custom domain — DNS → Vercel + API subdomain → Render
8. Google Search Console — submit sitemap
9. Google Analytics — production property
10. Bing Webmaster Tools — submit sitemap

**Then:** Full staging QA → promote to public.

---

## Sign-off

| Role | Name | Date | Pass |
|------|------|------|------|
| Developer | | | |
| QA | | | |
| Product | | | |
