# RC-2 — Security Report

**Date:** 22 July 2026  
**Scope:** Hardening fixes only — no security redesign  

---

## Final security checklist

| Control | Status | Notes |
|---------|--------|-------|
| Helmet + CSP | **PASS** | Wired in `server/src/index.js` / `config/security.js` |
| Rate limiting | **PASS** | API, auth, refresh, employer auth, upload, contact |
| JWT access expiration | **PASS** | `JWT_EXPIRES_IN` (default 1h); `jti` on access tokens |
| Refresh rotation (User) | **PASS** | Existing auth refresh |
| Refresh rotation (Employer) | **PASS** | **RC-2** — parity with user lifecycle |
| Logout / session revoke (User) | **PASS** | Refresh + access revoke (RC-1) |
| Logout / session revoke (Employer) | **PASS** | **RC-2** |
| Password reset revoke | **PASS** | RC-1 |
| CORS | **PASS** | Origin from `SITE_URL` / config |
| CSRF | **PASS (strategy)** | Bearer tokens in `Authorization` (not cookie session CSRF surface) |
| Mongo sanitize | **PASS** | `express-mongo-sanitize` |
| Environment validation | **PASS** | JWT_SECRET required path |
| Secrets | **PASS** | No secrets committed in RC-2; `.env` local |
| Cookies | **N/A / OK** | Auth primarily Bearer + localStorage |
| Authorization middleware | **PASS** | `requireAuth`, `requireUserAuth`, `requireEmployerAuth`, `requireRole` |
| RBAC (Admin / SuperAdmin / Moderator / Editor) | **PASS** | Server RBAC + client mirrors; AdminRouteGuard coverage expanded |
| Audit logging | **PASS** | Employer logout audited; actorId accepts employerId |
| Role escalation | **PASS** | Role changes admin-gated (existing) |
| IDOR / broken access | **PASS (mitigated)** | Employer routes require employer auth; candidate routes now `requireUserAuth` |
| Privilege escalation | **PASS** | Employer JWT cannot call user-only resume/chatbot/badge routes |
| AI Budget | **PASS** | No paid AI; deterministic fallbacks |

---

## RC-2 auth changes (detail)

### Employer session lifecycle

1. Register/Login issues `accessToken` + `refreshToken`.  
2. Refresh validates stored hash under `refresh:employer:{id}`, rotates refresh, issues new access.  
3. Logout revokes refresh store entry and blacklists access `jti` hash.  
4. Client interceptor mirrors student axios refresh behavior.

### Candidate route hardening

`requireUserAuth` added to:

- `/resumes/*`
- `/chatbot/*` (authenticated)
- `/badges/me`, `/badges/rank`

### Admin UI guards

Fixed ineffective `perm` prop on Page Builder. Added `AdminRouteGuard` to previously unguarded admin surfaces (search, growth, import, alerts, AI generator, executive, audit).

---

## Redis note

Access/refresh revoke storage uses the Redis cache abstraction. With Redis **disabled**, behavior is single-process / memory-backed depending on config — acceptable for Beta single instance; **enable Redis before multi-instance production**.

---

## Staging / production ops still required

| Item | Owner |
|------|-------|
| Strong unique `JWT_SECRET` / `REFRESH` settings | Ops |
| SMTP for real email verification / password reset | Ops |
| TLS termination + DNS | Ops |
| MongoDB Atlas backups + monitoring alerts | Ops |

These are operational conditions, not code P0/P1 defects.

---

## verify:security

```
Security verification: 9 passed, 0 failed
```

Includes employer refresh/logout static gates and candidate `requireUserAuth`.

---

**End of RC-2 Security Report.**
