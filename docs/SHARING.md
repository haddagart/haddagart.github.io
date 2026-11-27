# Sharing and social previews

## What visitors get
A round **Share** button floats at the bottom right, directly above the back-to-top button (it drops into the corner when that one is hidden). It opens a panel with a preview of
the branded card, links for LinkedIn, X, Facebook, WhatsApp, Telegram, Bluesky and Email, a copy-link
field and, on phones and tablets, the system share sheet. It respects the Motion switch and prints nothing.

## Where it appears (automatic)
`_layouts/default.html` includes `_includes/share.html`, which shows the button on:
news items, blog posts, and the detail layouts `publication`, `project`, `work`, `course` and `call`.

Per page front matter:
- `share: false` hides it, `share: true` shows it on any other page (for example an about page);
- `share_kind: "Talk"` changes the small label on the card (otherwise it is derived from the layout);
- `image: /path.png` uses your own picture and skips the generated card.

## Branded preview images
Every page gets `og:image` and `twitter:image` (large card, 1200x630). The image is
`assets/img/og/<url-with-dashes>.png` when it exists, for example `/news/my-news/` is
`assets/img/og/news-my-news.png`; otherwise the branded `default.png` is used.

GitHub Pages cannot draw images while it builds, so draw them on your computer and commit them:

    bundle exec jekyll build
    python3 scripts/make_og.py            # draws only new or changed cards
    python3 scripts/make_og.py --force    # redraw everything
    git add assets/img/og && git commit

One-time setup: `pip install playwright pyyaml && playwright install chromium`
(or `--chrome /path/to/chrome`). The cards use Fraunces (SIL OFL, in `scripts/og-fonts/`).
Social networks cache previews: after changing a card, refresh it with the platform's debugger
(for example the LinkedIn Post Inspector or the Facebook Sharing Debugger).

## Changing the look
Card design: `card_html()` in `scripts/make_og.py`. Panel and button: the "Share" block at the end
of `assets/css/main.css` and `assets/js/site.js`. Networks: the list in `_includes/share.html`.
