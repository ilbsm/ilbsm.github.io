# Sulkowska Lab — Jekyll Site

Source for the Sulkowska Lab website (Centre of New Technologies, University of Warsaw),
converted from a single-file `index.html` into a Jekyll site.

## Structure

```
_config.yml              site settings
_layouts/
  default.html           wraps every page (head, slideshow, nav, footer)
  page.html              alias for default; used by all .md pages
_includes/
  head.html              <head> block
  slideshow.html         hero with 4 background slides + avatar + bio
  nav.html               sticky top navigation
  footer.html            site footer
assets/
  css/sulkowska.css      full custom CSS (extracted from <style>)
  js/sulkowska.js        full custom JS (extracted from <script>) + Jekyll shim
  images/                background.jpg, profile.jpg, etc.
index.html               Home page (`/`)
group.html               Group page (`/group/`)
research.html            Projects & Software (`/research/`)
publications.html        Publications (`/publications/`)
topics.html              Research / Topics (`/topics/`)
collaboration.html       Collaboration (`/collaboration/`)
media.html               Media (`/media/`)
contact.html             Contact (`/contact/`)
```

## Local development

```bash
bundle install
bundle exec jekyll serve
```

Open http://localhost:4000/

## Deployment

The site is static — push to GitHub Pages, Netlify, or any static host.

For GitHub Pages set `baseurl` in `_config.yml` if hosting from a subpath.
