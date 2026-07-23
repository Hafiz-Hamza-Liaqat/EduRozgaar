# Sprint C.6.4.1 — Admin Sidebar & Navigation

**Date:** 2026-07-12  
**Status:** Implemented  
**Scope:** Admin navigation shell only (`/admin/*`)  
**Client build:** Pass (`npm run build`)  
**Server start:** Pass (MongoDB connected; port 5000 already in use from existing dev instance)

---

## Summary

Replaced the 33-item horizontal `scroll-tabs` navigation in the admin panel with a **grouped left sidebar** and **mobile drawer**. All route paths, RBAC permissions, and admin page content remain unchanged. Public navbar, footer, employer portal, student dashboard, and all non-admin layouts were **not modified**.

---

## Architecture

```
MainLayout (unchanged — Navbar + Footer)
└── /admin → Admin.jsx
    ├── AdminSidebar (desktop: fixed left | mobile: drawer)
    │   └── reads adminNavConfig.js + usePermissions().can()
    └── <Outlet /> — existing admin pages (unchanged)
```

### New files

| File | Purpose |
|------|---------|
| `client/src/config/adminNavConfig.js` | Single source of truth for sidebar groups, paths, permissions, icons |
| `client/src/components/admin/AdminSidebar.jsx` | Sidebar UI: collapsible groups, mobile drawer, settings footer |

### Modified files

| File | Change |
|------|--------|
| `client/src/pages/Admin/Admin.jsx` | Removed `TAB_DEFS` and horizontal tabs; integrated sidebar + content layout |
| `client/src/i18n/locales/en/admin.json` | Nav group labels and sidebar strings |
| `client/src/i18n/locales/ur/admin.json` | Urdu nav group labels |
| `client/src/i18n/locales/ar/admin.json` | Arabic nav group labels |

### Untouched (per constraints)

- `Navbar.jsx`, `Footer.jsx`, `DrawerMenu.jsx`, `UserAccountMenu.jsx`
- `EmployerLayout.jsx` and all employer routes
- `Dashboard.jsx`, `Profile.jsx`, `ResumeBuilder/*`
- `client/src/routes/index.jsx` — no route path changes
- `client/src/config/rbac.js`, `server/src/config/rbac.js`
- All admin CRUD page components

---

## Navigation Structure

Navigation is defined in `ADMIN_NAV_GROUPS` with **5 permission-filtered groups** plus a **Settings footer**:

### Dashboard
| Label | Path | Permission |
|-------|------|------------|
| Executive Dashboard | `/admin` | `analytics:read` |
| Analytics | `/admin/analytics` | `analytics:read` |
| Monitoring | `/admin/monitoring` | `analytics:read` |
| Platform health | `/admin/platform-ops` | `analytics:read` |
| Platform operations | `/admin/growth-dashboard` | `analytics:read` |

### Content
| Label | Path | Permission |
|-------|------|------------|
| Jobs | `/admin/jobs` | `content:jobs` OR `moderate:jobs` |
| Scholarships | `/admin/scholarships` | `content:scholarships` |
| Admissions | `/admin/admissions` | `content:admissions` |
| Blogs | `/admin/blogs` | `content:blogs` |
| Career articles | `/admin/career-guidance` | `content:career` |
| Foreign studies | `/admin/foreign-studies` | `content:foreign` |
| Internships | `/admin/internships` | `content:jobs` |
| Universities | `/admin/universities` | `content:universities` |
| Intl scholarships | `/admin/international-scholarships` | `content:scholarships` |
| Schools & Colleges | `/admin/institutions` | `content:admissions` |
| Companies | `/admin/companies` | `content:companies` |
| Webinars | `/admin/webinars` | `content:blogs` |
| Exam preparation | `/admin/exam-preparation` | `content:mcqs` |
| Site CMS | `/admin/site-cms` | `content:site` OR `content:navigation` OR `content:pages` |

### Users
| Label | Path | Permission |
|-------|------|------------|
| Users | `/admin/users` | `users:read` |
| Employers | `/admin/employers` | `users:read` |
| Contact messages | `/admin/contact-messages` | `users:read` |
| Support tickets | `/admin/support` | `users:read` |
| Notifications | `/admin/notifications` | `system:notifications` |
| Alerts | `/admin/alerts` | `system:notifications` |
| Invitations | `/admin/invitations` | `users:manage` |
| Moderation | `/admin/moderation` | `moderate:jobs` OR `moderate:employers` |

### Revenue
| Label | Path | Permission |
|-------|------|------------|
| Payments | `/admin/payments` | `payments:read` |
| Advertisements | `/admin/advertisements` | `moderate:ads` |
| Newsletter | `/admin/newsletter` | `system:notifications` |

### Tools
| Label | Path | Permission |
|-------|------|------------|
| AI Job Generator | `/admin/ai-job-generator` | `content:jobs` |
| Import | `/admin/import` | `content:import` |
| Activity Log | `/admin/audit` | `audit:read` |

### Settings (footer — always visible for staff)
| Label | Action |
|-------|--------|
| Profile | Link to `/profile` |
| Logout | `AuthContext.logout()` |

**Legacy route:** `/admin/activity` (still registered) highlights **Activity Log** in the sidebar via path alias in `adminNavConfig.js`.

**Total navigable admin routes:** 33 tabs preserved + legacy `/admin/activity` alias.

---

## Permission Handling

- **Unchanged RBAC:** Same permission strings and `usePermissions().can()` hook as before.
- **Filtering:** `filterAdminNavGroups(groups, can)` hides individual items and entire empty groups.
- **SuperAdmin bypass:** Inherited from existing `usePermissions` implementation.
- **Page guards:** `AdminRouteGuard` on individual pages unchanged — direct URL access still enforced at page level.
- **No server changes.**

Permission logic mirrors the former `TAB_DEFS` filter:

```javascript
if (Array.isArray(item.perm)) return item.perm.some((p) => can(p));
return can(item.perm);
```

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| **Desktop (`lg+`)** | Fixed left sidebar (`w-60` / `xl:w-64`), sticky, independent vertical scroll, content area scrolls separately |
| **Tablet / Mobile (`< lg`)** | Horizontal tabs **removed**; sticky admin bar with hamburger opens left drawer overlay |
| **Mobile drawer** | Backdrop dismiss, Escape key close, body scroll lock, focus on first control |

### Desktop layout

```
┌──────────────┬─────────────────────────────┐
│  Sidebar     │  Admin panel header + role  │
│  (scroll)    │  ─────────────────────────  │
│              │  <Outlet /> page content    │
│  Settings    │  (max-w-6xl preserved)      │
└──────────────┴─────────────────────────────┘
```

### Collapsible groups

- Section headers toggle expand/collapse with `aria-expanded` / `aria-controls`
- State persisted in `localStorage` key `admin-nav-expanded`
- Group containing the active route auto-expands on navigation

---

## Accessibility

| Feature | Implementation |
|---------|----------------|
| Keyboard | All nav links and group toggles focusable; `focus-visible` ring styles |
| ARIA | `aria-label` on nav regions; `aria-current="page"` on active link |
| Drawer | `role="dialog"`, `aria-modal="true"`, Escape to close |
| Touch targets | `min-h-[44px]` on links and buttons |
| Icons | Decorative SVGs with `aria-hidden` |
| Screen readers | Group buttons label associated panels via `aria-labelledby` |

---

## Visual Design

- Matches existing Tailwind theme: `primary` / `mint` active states, gray scale for light/dark
- Reuses employer portal sidebar patterns (rounded links, `bg-primary/10` active state)
- Admin page content styling **unchanged** — only the tab strip was removed
- “Back to site” link in sidebar header returns to public home

---

## Verification Results

| Check | Result |
|-------|--------|
| Client build | **Pass** |
| Server bootstrap | **Pass** (DB connect + seed; EADDRINUSE expected — dev server already on :5000) |
| Route paths | **Unchanged** — all `/admin/*` paths identical |
| RBAC config | **Unchanged** |
| Public Navbar | **Unchanged** (not edited in this sprint) |
| Employer layout | **Unchanged** |
| Lint (edited files) | **No errors** |

### Screenshots

Not captured in this automated implementation pass. Manual QA should capture desktop, tablet, and mobile sidebar states.

---

## Manual QA Checklist

### Desktop (`≥ 1024px`)

- [ ] Log in as Admin — sidebar visible with all permitted groups
- [ ] Click each Dashboard item — correct page loads, active highlight works
- [ ] Collapse/expand a group — state persists after refresh
- [ ] Navigate to `/admin/jobs` — CRUD, filters, pagination work
- [ ] Navigate to `/admin/site-cms` — CMS tabs and publish work
- [ ] Navigate to `/admin/invitations` — invitation table loads
- [ ] Profile link opens `/profile`; Logout clears session
- [ ] Public navbar identical to pre-change (Home, Jobs, bell, user menu)
- [ ] No horizontal admin tab scroll bar
- [ ] No console errors

### Tablet (`768px – 1023px`)

- [ ] Hamburger visible; sidebar hidden by default
- [ ] Drawer opens/closes; backdrop and Escape work
- [ ] Content readable; no horizontal page overflow

### Mobile (`< 768px`)

- [ ] Admin bar shows title + menu button
- [ ] Drawer navigation reaches all permitted routes
- [ ] Touch targets adequate; body scroll locked when drawer open

### Permission matrix

- [ ] **Editor** — sees Content group items only (no Users/Revenue if lacking perms)
- [ ] **Moderator** — sees Moderation; limited content
- [ ] **Admin** — full sidebar minus SuperAdmin-only items
- [ ] Direct URL to forbidden page — `AdminRouteGuard` still shows access denied

### Regression spot-checks

- [ ] `/admin/activity` loads audit log; sidebar highlights Activity Log
- [ ] Employer portal `/employer` unchanged
- [ ] Student `/dashboard` unchanged
- [ ] Resume builder unchanged

---

## Known Limitations / Follow-ups (C.6.4.2+)

1. **Admin still inside MainLayout** — site Navbar + Footer remain on admin pages (per constraint). Future slice may optionally isolate admin chrome.
2. **4 pages without `AdminRouteGuard`** — unchanged from pre-sprint (`AIJobGenerator`, `GrowthDashboard`, `AlertsAdmin`, `AdminImport`); recommend guard alignment in C.6.4.4.
3. **Role badge hidden on mobile** — visible on desktop header only; consider adding to mobile bar if needed.
4. **Growth dashboard label** — mapped to “Platform operations” per sprint spec; i18n key `platformOperations` used for `/admin/growth-dashboard`.

---

## Next Step

Proceed to **Sprint C.6.4.2 — SlugService** only after manual QA sign-off on this checklist.
