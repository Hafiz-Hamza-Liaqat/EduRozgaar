# Admin Manual — EduRozgaar

For users with **Admin** or **Super Admin** role.

---

## Access

URL: `/admin`  
Login required. Unauthorized users are redirected.

Super Admin additionally manages role assignment and cannot be demoted if they are the only Super Admin.

---

## Dashboard overview

| Section | Path | Purpose |
|---------|------|---------|
| Executive Dashboard | `/admin/executive` | Platform KPIs, charts, growth |
| Users | `/admin/users` | Search, suspend, role view |
| Employers | `/admin/employers` | Verify, suspend, bulk actions |
| Jobs | `/admin/jobs` | All listings, moderation |
| Scholarships / Admissions | `/admin/scholarships`, `/admin/admissions` | Content CRUD |
| Blogs / Career | `/admin/blogs`, `/admin/career-articles` | Editorial content |
| Foreign Studies / Institutions | `/admin/foreign-studies`, `/admin/institutions` | Directories |
| Webinars | `/admin/webinars` | Schedule, publish (triggers staff notification) |
| Contact messages | `/admin/contact-messages` | Public contact inbox |
| Support | `/admin/support` | Ticket replies (triggers user email) |
| Newsletter | `/admin/newsletter` | Compose, send, schedule |
| Email templates | `/admin/email-templates` | Preview EN/UR templates |
| Monitoring | `/admin/monitoring` | Health, cache, job queue |
| Platform ops | `/admin/platform-ops` | Env validation, toggles |
| Payments / Ads | `/admin/payments`, `/admin/advertisements` | Revenue ops |

---

## Common workflows

### Verify an employer
1. Admin → Employers → select employer
2. Set verification level → Save  
3. Employer receives inbox notification + email automatically

Bulk: select multiple → **Bulk verify**

### Publish a webinar
1. Admin → Webinars → Create
2. Set status **scheduled** → Save  
3. Staff receive notification

### Reply to support ticket
1. Admin → Support → open ticket
2. Add reply → status updates to `in_progress` or `resolved`  
3. User receives notification + email via queue

### Send newsletter
1. Admin → Newsletter → compose subject + body
2. **Send now** or **Schedule** (background job)  
3. Check Monitoring for queue progress

### Monitor background jobs
1. Admin → Monitoring → Background jobs section  
2. If pending grows: Platform ops → or API `POST /admin/queue/process`  
3. Failed jobs: `POST /admin/queue/retry`

---

## Audit trail

Sensitive actions log to `AuditLog`: role changes, employer verification, bulk operations, content deletes.

---

## Permissions

Admins have broad access but some actions require specific permissions (see RBAC in `server/src/config/rbac.js`). Super Admin bypasses all checks.

---

## Related

- Moderator manual: `docs/MODERATOR_MANUAL.md`
- Monitoring: `docs/MONITORING_GUIDE.md`
