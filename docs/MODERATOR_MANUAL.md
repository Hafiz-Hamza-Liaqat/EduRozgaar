# Moderator Manual — Strideto

For users with **Moderator** role.

---

## Access

Login → Admin panel (moderation sections only).

Moderators review user-generated content and employer trust signals. They typically **cannot** manage payments, newsletter, or role assignment.

---

## Job moderation

**Path:** Admin → Jobs (pending filter) or Moderation queue

### Approve job
1. Review title, description, employer legitimacy
2. **Approve** → job goes live; employer notified automatically

### Reject job
1. Select reject reason (if prompted)
2. Employer may receive notification depending on workflow

Bulk approve available for trusted batches.

---

## Employer verification

**Path:** Admin → Employers

Review:
- Company name, website, registration docs
- Job history and report count

Actions:
- Set **verification level** (basic → verified → premium)
- **Suspend** account if fraudulent

Verification change triggers employer inbox notification + email.

Bulk verify: select employers → **Bulk verify**

---

## Reports

**Path:** Admin → Reports (if enabled)

Review user reports on jobs/content. Resolve or escalate to Admin.

---

## Content flags

Moderators may hide or flag content pending Admin review depending on permission set (`MODERATE_JOBS`, `MODERATE_EMPLOYERS`).

---

## Audit

All approve/reject/verify actions are logged in audit trail with moderator user ID.

---

## Do not

- Change user roles (Super Admin only)
- Access payment or Stripe settings
- Delete production data without Admin approval

---

## Escalation

| Situation | Action |
|-----------|--------|
| Suspected fraud | Suspend employer → notify Admin |
| Legal concern | Admin + legal review |
| Spam job flood | Bulk reject → Admin enables rate limits |

---

## Related

- Admin manual: `docs/ADMIN_MANUAL.md`
- Security: `docs/SPRINT_C2_SECURITY_IMPLEMENTATION_REPORT.md`
