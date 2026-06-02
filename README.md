# Sulkowska Lab Website

Static Jekyll source for the Interdisciplinary Laboratory of Biological Systems Modelling at the Centre of New Technologies, University of Warsaw. The site is for lab members, collaborators, applicants, funders, press, and scientific visitors who need current information about the group, research, software, publications, and contact details.

## Quick Start

Requirements:

- Ruby 3.4.1, pinned in `.ruby-version`
- Bundler

```bash
bundle install
bundle exec jekyll serve
```

Open `http://127.0.0.1:4000/`.

## Build

```bash
bundle exec jekyll build
```

The static output is written to `_site/`. Do not edit `_site/` directly; it is generated.

## Deploy

The repository remote is `https://github.com/ilbsm/ilbsm.github.io.git`. The expected host is GitHub Pages from the `main` branch because this is an organization pages repo. Confirm the Pages settings in GitHub before handoff.

No env vars are required for the Jekyll build. Publication data is stored locally in `_data/publications.json`; the browser does not fetch OpenAlex directly.

## Structure

```text
_config.yml                 Site settings and Jekyll build options
_layouts/default.html       Shared page shell
_layouts/news_item.html     News article layout
_includes/head.html         Metadata, fonts, shared CSS
_includes/nav.html          Primary navigation
_includes/slideshow.html    Shared top banner
_includes/footer.html       Site footer
_includes/jump_nav.html     Reusable section jump menu
_data/                      Editable YAML/JSON content
_news/                      News collection items
assets/css/sulkowska.css    Shared CSS
assets/js/sulkowska.js      Shared banner and jump-menu behavior
assets/js/hero-knot.js      Home-page Three.js animation
assets/images/                 Images, logos, portraits, gallery media
scripts/                    Maintenance scripts
```

There are no Sass partials at handoff. If future work adds Sass, put partials in `_sass/` and keep compiled site assets under `assets/`.

## Editing Guide

Most content changes should happen in `_data/`:

- Group members: `_data/group.yml`
- Home sections: `_data/home.yml`
- Research topics: `_data/topics.yml`
- Funded projects: `_data/research_projects.yml`
- Projects and software: `_data/projects.yml`
- Media lists and gallery data: `_data/media/*`
- News summaries: `_data/news.yml`

Long-form news items live in `_news/` and use `layout: news_item`.

Publication data and figure metadata live in `_data/publications.json` and `_data/publication_figures.yml`. They can be rebuilt with:

```bash
python3 scripts/update_publication_figures.py
```

Review the generated diff before committing because the script pulls live OpenAlex and PubMed Central data.

## Config Notes

- `baseurl` is empty for root-domain hosting.
- `url` is the production origin.
- The `news` collection outputs pages under `/news/:path/`.
- `plugins` is empty to keep the GitHub Pages build path simple.
- `Gemfile.lock` should be committed so future installs resolve the same dependency set.

## Ownership And Attribution

The repo history does not identify a third-party theme, upstream source URL, or license file. Treat the site code and content as lab-owned with all rights reserved until the owners add a license. Jekyll and bundled gems keep their own licenses through RubyGems.

If a reused upstream source is later confirmed, add its URL, license, and any required file headers before public handoff.

## Domain And DNS

The production URL in `_config.yml` is `https://jsulkowska.cent.uw.edu.pl`.

The repo does not contain DNS ownership records, registrar access notes, or SSL renewal details. Add those to the private handoff packet, not to this public repository.

## Known Issues

- Several pages still keep page-specific CSS in their HTML files. This is workable for handoff, but a future style pass should move repeated rules to shared CSS or Sass partials.
- Publication data is local, so the page continues to render if OpenAlex is temporarily unavailable. Refresh `_data/publications.json` periodically with the maintenance script.
- `Gemfile.lock` exists locally and `.gitignore` now allows it to be tracked; include it in the next commit.
