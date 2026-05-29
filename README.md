# Sulkowska Lab Jekyll Site

Source for the Sulkowska Lab website (Centre of New Technologies, University of Warsaw),
maintained as a static Jekyll site.

## Structure

```
_config.yml              site settings
_layouts/
  default.html           wraps every page (head, slideshow, nav, footer)
_includes/
  head.html              <head> block
  slideshow.html         hero with 4 background slides + avatar + bio
  nav.html               sticky top navigation
  footer.html            site footer
assets/
  css/sulkowska.css      shared site shell styles
  js/sulkowska.js        shared navigation, slideshow, and jump-menu behavior
  js/hero-knot.js        home hero knot animation
  img/                   page imagery, logos, people, and project assets
index.html               Home page (`/`)
group.html               Group page (`/group/`)
research.html            Research (`/research/`)
publications.html        Publications (`/publications/`)
topics.html              Projects & Software (`/topics/`)
collaboration.html       Collaboration (`/collaboration/`)
media.html               Media (`/media/`)
contact.html             Contact (`/contact/`)
_data/                   editable content for people, research, news, media, and home sections
```

## Local development

```bash
bundle install
bundle exec jekyll serve
```

Open http://localhost:4000/.

## Deployment

The site is static. Push to GitHub Pages, Netlify, or any static host.

For GitHub Pages set `baseurl` in `_config.yml` if hosting from a subpath.
