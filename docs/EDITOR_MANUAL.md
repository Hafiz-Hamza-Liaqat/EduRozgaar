# Editor Manual — Strideto

For users with **Editor** role.

---

## Access

Login at `/auth/login` → navigate to content areas assigned by Admin.

Editors **cannot** access user management, payments, employer verification, or platform settings.

---

## Responsibilities

- Write and publish blog posts
- Maintain career guidance articles
- Optional: foreign studies entries (if granted)

---

## Blog posts

**Path:** `/admin/blogs` (if linked in your nav) or Admin panel → Blogs

1. **New post** — title, slug, excerpt, body (Markdown/rich text)
2. Set **status**: `draft` → `published`
3. SEO fields: meta title, description, featured image
4. Preview on `/blog/:slug` after publish

### Best practices
- Unique slug per post
- Featured image via upload (Cloudinary)
- Set `publishedAt` for scheduling display order

---

## Career articles

**Path:** Admin → Career articles

Same workflow as blogs. Public URL: `/career-guidance/:slug`

Articles appear on Career Guidance listing with category filters.

---

## Foreign studies (if enabled)

**Path:** Admin → Foreign studies

Fields: country, visa info, language tests, intakes, deadlines, SEO.

Public: `/foreign-studies/:slug`

---

## Media uploads

Use the image upload control in forms. Supported: JPG, PNG, WebP. Max size enforced server-side.

---

## Notifications

Editors do not receive employer/job moderation alerts unless also assigned Moderator/Admin role.

---

## Escalation

| Issue | Contact |
|-------|---------|
| Cannot publish | Admin — check account status |
| Upload fails | Admin — Cloudinary config |
| SEO / sitemap | Admin — Platform ops |

---

## Related

- Admin manual: `docs/ADMIN_MANUAL.md`
