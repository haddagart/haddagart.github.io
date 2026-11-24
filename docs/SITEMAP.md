# Sitemap and structure — haddagart.github.io

Built for GitHub Pages (Jekyll, no build step needed). Home page first, then the pages you asked for plus **About**.

## Sitemap

```
/                          Home                      (built)
/about/                    Bio, CV, press kit
/research/                 Overview: themes, three entry cards, active projects, latest contributions
  /research/projects/      Projects (status: ongoing = green ripple, ended = red ripple), collection _research_projects
    /research/projects/<slug>/       One page per project (summary, approach, related contributions, collaborate CTA)
  /research/contributions/ Publications grouped by type with filters
    /research/contributions/<slug>/  One page per publication (abstract, keywords, DOI, BibTeX, Scholar meta)
  /research/calls/         Open calls (positions, students, collaborations, co-authors, funding), collection _calls
    /research/calls/<slug>/          One page per call (set status: open | closed, optional deadline)
/teaching/                 Overview of both audiences
  /teaching/courses/       Academic courses: syllabus, level, materials
  /teaching/training/      Professional training: formats, durations, outcomes
/projects/                 Gallery
  /projects/<name>/        One page per project: problem, approach, result, links
/news/                     Short dated items (built from the _news folder)
/blog/                     Longer posts (built from the _posts folder)
  /blog/<post-title>/
/work-with-me/             Offers, who each is for, next step, contact
/404.html  /sitemap.xml  /feed.xml  /robots.txt
```

**Menu:** Research · Teaching · Projects · Blog · About · **Work with me** (button).
News is shown on Home and in the footer so the menu stays short.

## Home page sections (in order)

1. Hero: name, tagline, short intro, two calls to action, portrait in an arch frame
2. "Many roles, one curiosity": Research / Teaching & training / Projects
3. Values strip (Minimalism, Craftsmanship, Creativity, Technology, Polymath)
4. Latest news and latest blog posts
5. "Work with me" band with the 3D avatar and the offers list
6. Footer

## Folder structure

```
_config.yml           site settings, plugins (SEO tag, sitemap, feed)
_data/                nav.yml · offers.yml · social.yml  (edit here, not in HTML)
_layouts/             default · page · post
_includes/            header · footer · logo.svg (full logo, theme-aware) · mark.svg (wing mark alone, unused) · person-jsonld
_news/                one Markdown file per news item
_posts/               blog posts: YYYY-MM-DD-title.md
assets/css/main.css   all styles (brand tokens at the top)
assets/img/brand/     logo-on-dark.svg · logo-on-light.svg · mark.svg · pattern-*.svg · favicon.svg
assets/img/           photos, 3D avatar, papyrus texture, OG image, favicons
docs/                 this file (not published)
```

## Design system (from the brand book)

| Token | Value | Use |
|---|---|---|
| Obsidian Black | `#101010` | Header, hero, work-with-me band, footer |
| Honey Brown | `#B18558` | Accents, buttons, outlines |
| Desert Peach | `#D8B99C` | Taglines on dark, hover states |
| Pastel Tan | `#EBD3BE` | Values strip |
| Pastel Apricot | `#F5E0CF` | Page background |
| Honey ink | `#7A5429` | Darkened honey for text on light backgrounds (readable contrast) |

Type: Nunito Sans for body and interface, Noto Serif for headings and quotes.

Themes: light and dark. The site follows the visitor's system setting at first, and the sun/moon button in the header overrides it (the choice is remembered). Colors are defined once as tokens at the top of `assets/css/main.css`. The "Work with me" band and the footer stay dark in both themes.

Heritage motifs: the wing mark and its mirrored pattern (Pharaonic), arch frames (doorway), and the zigzag and diamond rows (Amazigh weaving and tattoo geometry). The pattern is `assets/img/brand/pattern-*.svg`: two wing marks reflected across their flat bases, which makes a diamond where they meet. On the page it is drawn as rows (built in `assets/js/site.js`): alternate rows slide in opposite directions as the mouse moves, and stay still for visitors who prefer reduced motion. Its size and opacity are set in the `.pattern` rules in `main.css`.

## SEO setup already in place

- Unique `<title>` and meta description per page, canonical URL, Open Graph and Twitter cards (jekyll-seo-tag)
- `sitemap.xml` and `feed.xml` generated automatically
- `Person` structured data (JSON-LD) on Home and About, with `sameAs` links from `_data/social.yml`
- Semantic HTML, one H1 per page, alt text, skip link, keyboard-friendly menu
- Placeholder pages are `noindex` and left out of the sitemap until you remove `stub: true` and `sitemap: false` from their front matter

## To do next

1. Add real content page by page (About first, then Research and Work with me)
2. Add public contact email in `_config.yml` and more profiles in `_data/social.yml`
3. Self-host the two fonts (currently loaded from Google Fonts)
4. Add search (Pagefind needs a GitHub Actions workflow)
5. Submit `sitemap.xml` in Google Search Console


## Icons and micro-interactions (Home)
- Icons: Tabler (MIT), stored in `_includes/icons/*.svg`; use `{% include icon.html name="arrow-right" %}`. Add an icon by dropping a Tabler SVG there.
- Interactions (assets/js/site.js, all off under reduced motion): scroll reveal (`data-reveal`, `--d` delay), card spotlight (`data-spotlight`), magnetic CTAs (`data-magnetic`), scroll progress bar, back-to-top, portrait parallax, theme-toggle icon swap.

## 3D clay objects and depth (Home)
- Objects live in `assets/img/clay/*.svg` (pyramid, sphere, cube, obelisk, ring) and are placed with `{% include clay.html name="pyramid" x="53%" y="58%" s="9rem" r="8" d="0.9" %}` inside a `.clay-layer` of a `.clay-host` section. `d` is depth: bigger = moves more.
- Rendering: when WebGL is available the shapes are drawn as real 3D (ray-marched rounded solids, lit like clay) on a canvas per section; the SVGs are the fallback for browsers without WebGL. The object list and positions still come from the `clay.html` includes.
- JS (assets/js/site.js) gives each object layered mouse parallax, real rotation toward the cursor, a spin kick when the cursor sweeps past, soft repulsion when it gets close, and scroll parallax; CSS adds a slow idle float. Touch devices get scroll parallax only; reduced motion shows them still.


## Research data (imported from Owlstown /publications)
- Add a paper: create `_publications/<slug>.md` (copy an existing one). Front matter: `type` (journal, conference, symposium, preprint, presentation, thesis; see `_data/publication_types.yml`), `date` (sorting), `when` (display), `authors`, `venue`, `doi`, `abstract`, `keywords`, `bibtex`, optional `link`/`linklabel`, `note`.
- `/research/` groups by type, filters client-side, and every paper page emits Google Scholar `citation_*` meta tags plus schema.org JSON-LD.
