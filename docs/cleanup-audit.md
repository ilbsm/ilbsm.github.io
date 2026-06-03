# Cleanup Audit

Date: 2026-06-03

This is the first-pass audit before any broad structural cleanup. No files were deleted during this audit.

## Current Shape

- The site builds successfully with `bundle exec jekyll build`.
- The source already has the major Jekyll folders: `_layouts`, `_includes`, `_data`, `_news`, `assets`, and `scripts`.
- Root page templates are now relatively thin: `collaboration.html`, `contact.html`, `group.html`, `index.html`, `media.html`, `publications.html`, `research.html`, and `topics.html`.
- Large inline page `<style>` and page behavior scripts have mostly been moved out of page files.
- Remaining page-level script tags are the home page's external Three.js dependency and `assets/js/hero-knot.js`.
- Primary navigation, footer social/contact content, and slideshow slide metadata are now data-driven.
- `_site`, `.jekyll-cache`, and `.claude` are ignored and not tracked by Git.

Approximate source sizes:

- `assets/css/sulkowska.css`: 5047 lines
- `assets/js/sulkowska.js`: 1445 lines
- `_data/publications.json`: 5744 lines
- `_data/news.yml`: 511 lines
- `_data/group.yml`: 382 lines
- `_includes`: 10 includes
- `_layouts`: 2 layouts

## Main Problems

1. CSS is no longer inline, but it is now a single large stylesheet.
   - Page CSS is separated by comments, but every page loads all page-specific CSS.
   - This is better than inline CSS, but still hard to maintain.
   - A future pass should split it into `_sass` partials or page/component CSS modules.

2. JavaScript is centralized but monolithic.
   - `assets/js/sulkowska.js` contains global behavior plus page initializers for publications, media, home, group, contact, and research.
   - Each initializer is guarded by page IDs, so it works, but the file is harder to review and test.
   - A future pass should split shared behavior from page-specific behavior.

3. Some data-driven styling is still inline.
   - Examples: dynamic accent colors, fallback colors, animation index variables, and slideshow background image variables.
   - This is not the same as giant inline CSS, but it still requires `style-src 'unsafe-inline'` in the CSP.

4. Data path conventions are inconsistent.
   - Some image fields are full asset paths.
   - Some logo fields are basenames resolved by templates.
   - Group portraits use `slug + ".jpg"` in JavaScript instead of an explicit image path.
   - This makes asset audits unreliable and future editing less obvious.

5. The contact form is a mailto helper, not a real form backend.
   - It is functional, but it can look like a normal submitted web form.
   - The UI should make the mail-client behavior clearer, or the site should use a real form endpoint.

6. News exists in two places.
   - `_news/*.md` contains long-form article pages.
   - `_data/news.yml` contains homepage/news summaries.
   - This can drift unless carefully maintained.

7. External links need a proper link audit.
   - Several project and collaborator URLs still use `http://`.
   - Some old lab server URLs may be intentionally HTTP-only, so do not bulk-rewrite without checking.

8. There is no automated regression check.
    - Build passes, but there is no link checker, HTML validator, or screenshot regression workflow.

## Completed In This Pass

- Added `_data/navigation.yml` for primary navigation labels, URLs, and active paths.
- Added `_data/slideshow.yml` for banner slides, avatar, lab title, and PI label.
- Added `_data/footer.yml` for footer address, social links, and copyright text.
- Updated `_includes/nav.html`, `_includes/slideshow.html`, and `_includes/footer.html` to read from those data files.
- Updated `README.md` to point at this audit and describe the current CSS/JS state.

## Delete Candidates

Do not delete these blindly. These are candidates for review, not confirmed removals.

- Local generated folders:
  - `_site/`
  - `.jekyll-cache/`
  - `.claude/`
- Potentially stale media/gallery files if not referenced by `_data/media/gallery.json`.
- Potentially stale team photos, but only after normalizing group image paths. A simple filename scan gives false positives because team photos are currently loaded from slugs at runtime.
- `inactive_collaborators` in `_data/collaborators.yml` should stay unless the lab confirms those records are no longer needed.

## Proposed Target Structure

```text
/
├── _config.yml
├── _data/
│   ├── navigation.yml
│   ├── slideshow.yml
│   ├── social.yml
│   ├── home.yml
│   ├── group.yml
│   ├── topics.yml
│   ├── projects.yml
│   ├── research_projects.yml
│   ├── collaborators.yml
│   ├── publication_figures.yml
│   ├── publications.json
│   └── media/
├── _includes/
│   ├── shell/
│   ├── components/
│   ├── cards/
│   └── pages/
├── _layouts/
├── _news/
├── _sass/
│   ├── _tokens.scss
│   ├── _base.scss
│   ├── _shell.scss
│   ├── components/
│   └── pages/
├── assets/
│   ├── css/
│   ├── js/
│   │   ├── site.js
│   │   └── pages/
│   └── images/
├── scripts/
├── docs/
├── index.html
└── page files
```

## Include Candidates

Already useful includes:

- `head.html`
- `nav.html`
- `footer.html`
- `slideshow.html`
- `jump_nav.html`
- `research_figure.html`
- `research_project_card.html`
- `topic_card_media.html`
- `topic_icon.html`

Recommended new includes:

- `cards/member_card.html`
- `cards/alumni_card.html`
- `cards/collaborator_card.html`
- `cards/home_grant_card.html`
- `cards/media_link_item.html`
- `components/section_header.html`
- `components/media_logo.html`
- `components/modal.html`
- `components/social_link.html`

## Data To Move Or Normalize

- Move contact address, email, phone, map URL, and Facebook URL into `_data/contact.yml`.
- Normalize image keys across data files:
  - Prefer `image`, `image_alt`, `logo`, `logo_alt`, `fallback_text`, `fallback_color`.
  - Avoid hidden runtime conventions like `slug + ".jpg"` when an explicit `image` key would be clearer.
- Move the group section order currently embedded in `group.html` into data.

## Risk List

- Splitting CSS can change cascade order. Do this page by page and compare screenshots.
- Splitting JS can break modal, gallery, publication, jump-menu, or banner behavior if initializers are loaded in the wrong order.
- Tightening the CSP can break YouTube, Facebook, Google Maps, CDN-hosted Three.js, or data-driven inline styles.
- Deleting assets is risky until all runtime image conventions are normalized.
- Changing old HTTP links may break old lab servers that do not support HTTPS.
- Replacing the mailto form with a real form endpoint requires a service decision.

## Completed In Pass 2 (2026-06-03)

- Created `_data/contact.yml` with address, email, phone, Facebook URL, Google Maps embed src, and form settings.
- Updated `contact.html` to read all contact details from `site.data.contact`. No hardcoded values remain.
- Added `group_sections` key to `_data/page_sections.yml` with key/label/anchor entries for each active group section.
- Replaced the hardcoded pipe-delimited `{% assign sections = "..." %}` string in `group.html` with `{% for sec in site.data.page_sections.group_sections %}`.
- Split `assets/css/sulkowska.css` (5047 lines) into 9 `_sass/` partials: `_shell.scss`, `_research.scss`, `_projects.scss`, `_publications.scss`, `_media.scss`, `_home.scss`, `_group.scss`, `_contact.scss`, `_collaboration.scss`.
- Created `assets/css/sulkowska.scss` (front-matter manifest, `@use` for each partial). Jekyll/dart-sass compiles it to `assets/css/sulkowska.css` at the same public URL.
- Deleted `assets/css/sulkowska.css` (replaced by the compiled output from the Sass manifest).
- Created `scripts/verify.sh` — runs `bundle exec jekyll build` and checks 9 key output paths.
- Build verified: 9/9 pages and assets present, no Sass errors.

Note: Dart-sass compiles with expanded style (each property on its own line), so the compiled `_site/assets/css/sulkowska.css` is ~7145 lines vs the original 5047. Content is identical; only formatting differs. Add `sass: style: compressed` to `_config.yml` to minify if needed.

## Suggested Refactor Order

1. ~~Update documentation and keep build green.~~ ✓ Done in Pass 1.
2. ~~Move contact details into `_data/contact.yml`.~~ ✓ Done in Pass 2.
3. Normalize group/collaboration image data.
4. ~~Split CSS into Sass partials while preserving compiled output.~~ ✓ Done in Pass 2.
5. Split JavaScript into shared and page-specific files.
6. ~~Add a small verification script for build, root page checks, and key generated pages.~~ ✓ Done in Pass 2.
7. Only then review assets for deletion.
