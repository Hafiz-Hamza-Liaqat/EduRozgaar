# Sprint C.6.3 — Launch UX & Staff Operations

**Date:** 2026-07-12  
**Status:** Implemented  
**Verification:** `cd server && node --env-file=.env ../scripts/verify-sprint-c6-3.mjs` → **8/8 pass**  
**Client build:** Pass

---

## Summary

Sprint C.6.3 delivers shared admin form controls, staff invitation workflow, profile account management, notification/SMTP transparency, temporary password email flow, and dark-mode consistency across admin pages — without touching admin sidebar, slug service, employer redesign, or pricing (deferred to C.6.4+).

---

## 1. Shared Admin Select / Form Fields

**New:** `client/src/components/admin/AdminFormFields.jsx`

| Export | Purpose |
|--------|---------|
| `adminFieldClass` | Canonical input/select/textarea styles (light + dark, focus ring, placeholder, disabled) |
| `AdminSelect` | Labeled select with `id`, `name`, `htmlFor`, optional hint |
| `AdminSelectBare` | Unlabeled select for filter bars (with `aria-label`) |
| `AdminInput` | Labeled text input |
| `AdminTextarea` | Labeled textarea |
| `AdminLabel` | Shared label styling |

**Migration:** All 24 admin page/component files now use `AdminSelectBare` instead of raw `<select>`. `AdminTableFilters` and `AdminCmsFields` updated. Helper scripts: `scripts/migrate-admin-selects.mjs`, `scripts/fix-admin-imports.mjs`.

`AdminImageUrlField.jsx` re-exports form field helpers for backward compatibility.

---

## 2. Dark Mode Fixes

- `adminFieldClass` includes `text-gray-900 dark:text-gray-100`, placeholder colors, focus rings, and border pairs.
- Filter bars and modals use consistent `dark:bg-gray-800`, `dark:border-gray-600` field styling.
- Admin pages with previously minimal select classes (Support, Users, Contact Messages) migrated.

---

## 3. Staff Invitation System

### Database

**Model:** `server/src/models/StaffInvitation.js`

| Field | Type |
|-------|------|
| email | String (unique per pending invite) |
| role | Editor \| Moderator \| Admin |
| tokenHash | SHA-256 hash (select: false) |
| status | pending \| accepted \| expired \| revoked |
| expiresAt | Date (72h) |
| invitedBy | ObjectId → User |
| acceptedAt | Date |

### API

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/admin/invitations` | Staff + `users:manage` |
| GET | `/api/admin/invitations` | Staff + `users:manage` |
| POST | `/api/admin/invitations/:id/resend` | Staff + `users:manage` |
| DELETE | `/api/admin/invitations/:id` | Staff + `users:manage` |
| GET | `/api/auth/accept-invitation?token=` | Public |
| POST | `/api/auth/accept-invitation` | Public |

**RBAC rules:**
- SuperAdmin → invite Admin, Moderator, Editor
- Admin → invite Moderator, Editor only
- Cannot invite existing email (409)
- All actions audit-logged (`invitation.create`, `invitation.resend`, `invitation.revoke`, `invitation.accept`)

**Email:** `staffInvitation` template queued via background job. Returns `emailNotice: "Email queued (SMTP not configured)"` when SMTP absent.

### Frontend

- **Page:** `/admin/invitations` — `AdminInvitations.jsx`
- **Accept:** `/auth/accept-invitation?token=` — `AcceptInvitation.jsx`
- Admin tab: **Invitations** (requires `users:manage`)

---

## 4. Profile Improvements

**File:** `client/src/pages/Profile/Profile.jsx`

| Feature | Implementation |
|---------|----------------|
| Email + verification badge | Read-only block with Verified / Not verified |
| Resend verification | `POST /api/auth/resend-verification` |
| Change password | `POST /api/auth/change-password` (current + new) |
| Hide unsupported channels | Push, WhatsApp, Telegram removed from UI |
| Must-change-password banner | Shown when `user.mustChangePassword` |

**Dashboard:** Removed placeholder push/WhatsApp/Telegram rows.

---

## 5. Accessibility

- Admin form fields use `id`, `name`, `label`/`htmlFor`, `aria-describedby` for hints.
- Profile password and notification inputs have explicit `id` and `name`.
- Accept-invitation form fields labeled.

---

## 6. Notification Verification

**File:** `server/src/controllers/admin/adminNotificationsController.js`

- `sendNow` and immediate `sent` creates now **dispatch** via queue:
  - `in_app` / `push` → `queueNotification` per user in audience
  - `email` → `queueEmail` per user with email notifications enabled
- API response includes `emailMode`, `emailNotice` when SMTP not configured.
- Admin Notifications UI shows notice in toast.

Platform (in-app) notifications continue to work without SMTP.

---

## 7. Temporary Password Flow

**User model additions:** `mustChangePassword`, `tempPasswordExpires` (72h)

**Admin reset:** `POST /api/admin/users/:id/reset-password`
- Sets temp password + `mustChangePassword: true`
- Queues `temporaryPassword` email template
- Audit log includes email mode metadata
- Admin toast shows email notice (no longer exposes password in toast as primary UX)

**Login:** Returns `mustChangePassword: true`; client redirects to Profile.

---

## 8. Environment Documentation

Updated `docs/DEPLOYMENT_GUIDE.md`:
- `MAIL_PORT`, `MAIL_FROM` documented
- Brevo SMTP mapping clarified
- Placeholder mode + admin UI notice documented

---

## 9. Regression

| Area | Status |
|------|--------|
| CMS insert-only persistence | Guard in `cmsCorruption.js` — verified |
| Navbar / user menu (C.6.2) | Unchanged |
| Resume Builder | Unchanged |
| Site CMS admin | Unchanged (selects migrated only) |
| Employer portal | Unchanged |
| C.6.1 verify script | Still 5/5 (from prior sprint) |

---

## Files Changed (key)

### Server (new/modified)
- `server/src/models/StaffInvitation.js` *(new)*
- `server/src/models/User.js`
- `server/src/controllers/admin/invitationsController.js` *(new)*
- `server/src/controllers/admin/usersController.js`
- `server/src/controllers/admin/adminNotificationsController.js`
- `server/src/controllers/authController.js`
- `server/src/routes/admin.js`
- `server/src/routes/auth.js`
- `server/src/templates/emailTemplates.js`
- `server/src/validators/authValidator.js`

### Client (new/modified)
- `client/src/components/admin/AdminFormFields.jsx` *(new)*
- `client/src/components/admin/AdminTableFilters.jsx`
- `client/src/components/admin/AdminCmsFields.jsx`
- `client/src/components/admin/AdminImageUrlField.jsx`
- `client/src/components/admin/adminTableUtils.jsx`
- `client/src/pages/Admin/AdminInvitations.jsx` *(new)*
- `client/src/pages/Admin/Admin.jsx`
- `client/src/pages/Admin/AdminUsers.jsx`
- `client/src/pages/Admin/AdminNotifications.jsx`
- `client/src/pages/Auth/AcceptInvitation.jsx` *(new)*
- `client/src/pages/Auth/Login.jsx`
- `client/src/pages/Profile/Profile.jsx`
- `client/src/pages/Dashboard/Dashboard.jsx`
- `client/src/context/AuthContext.jsx`
- `client/src/services/authService.js`
- `client/src/services/adminContentApi.js`
- `client/src/routes/index.jsx`
- `client/src/constants/index.js`
- 22 admin pages (select migration)

### Scripts & docs
- `scripts/migrate-admin-selects.mjs` *(new)*
- `scripts/fix-admin-imports.mjs` *(new)*
- `scripts/verify-sprint-c6-3.mjs` *(new)*
- `docs/DEPLOYMENT_GUIDE.md`
- `docs/SPRINT_C6_3_IMPLEMENTATION_REPORT.md` *(this file)*

---

## Known Limitations

1. **Screenshots** — Not captured in this environment; verify visually at `/admin/invitations`, Profile, and any admin filter page in dark mode.
2. **Broadcast email scale** — Dispatch loops cap at 5000 users per send (queue handles delivery).
3. **WhatsApp/push admin channels** — Still in Admin Notifications composer enum; user-facing channels hidden only.
4. **Urdu/AR i18n** — New profile/invitation strings added in EN; UR/AR fallbacks use defaults.
5. **Separate Account Settings route** — Still `/profile` (unchanged per scope).

---

## Manual QA Checklist

- [ ] `/admin/invitations` — invite Editor, resend, revoke, filter by status
- [ ] Accept invitation email link → create account → login
- [ ] Profile — change password, resend verification, email-only notifications
- [ ] Admin reset password → email queued toast; login forces profile password change
- [ ] Admin notification send (in_app) → bell shows item
- [ ] Admin notification send (email) without SMTP → toast shows queued notice
- [ ] Dark mode — admin filters readable on Support, Users, Invitations
- [ ] C.6.1 CMS persists after API restart
