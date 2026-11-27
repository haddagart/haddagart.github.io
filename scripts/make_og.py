#!/usr/bin/env python3
"""
Generate the branded social preview images (1200x630 PNG) used by the share button and the
og:image / twitter:image tags.

How it works
  1. Build the site (`bundle exec jekyll build`).
  2. Run `python3 scripts/make_og.py` from the repository root.
  The script scans _site for pages that carry the share button (they expose data-title, data-kind,
  data-when and data-og), draws one card per page into assets/img/og/<data-og>.png and also makes
  assets/img/og/default.png for every other page. Cards are only redrawn when their text changed
  (use --force to redraw all). Commit the PNGs: GitHub Pages cannot run this step for you.

Needs: Python 3.9+, `pip install playwright pyyaml` and a Chromium (`playwright install chromium`,
or pass --chrome /path/to/chrome).
"""
import argparse, hashlib, html, json, pathlib, re, sys, tempfile
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONT = ROOT / "scripts" / "og-fonts" / "fraunces-latin-600-normal.woff2"

ZIG = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='20' viewBox='0 0 36 20'%3E%3Cpath d='M13 4 L23 16 M23 4 L13 16 M18 1.5 L18 18.5 M13 4 L11.5 2.5 M23 4 L24.5 2.5 M13 16 L11.5 17.5 M23 16 L24.5 17.5' fill='none' stroke='%23B18558' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")


class Cards(HTMLParser):
    def __init__(self):
        super().__init__(); self.found = None
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "div" and "data-share-card" in a and self.found is None:
            self.found = {"title": a.get("data-title", ""), "kind": a.get("data-kind", ""), "when": a.get("data-when", ""), "slug": a.get("data-og", "")}


def card_html(title, kind, when, domain, mark_svg, font_url):
    eyebrow = html.escape(" · ".join(x for x in (kind, when) if x).upper())
    return f"""<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:"Fraunces";font-weight:600;src:url("{font_url}") format("woff2")}}
*{{box-sizing:border-box;margin:0}}
html,body{{width:1200px;height:630px;overflow:hidden}}
body{{position:relative;background:#F5E0CF;color:#101010;font-family:"Nunito Sans","DM Sans","Helvetica Neue",Arial,sans-serif}}
.frame{{position:absolute;inset:26px 26px 100px;border:2px dotted rgba(177,133,88,.55);border-radius:22px}}
.wm{{position:absolute;right:-60px;bottom:40px;width:620px;color:#B18558;opacity:.13}}
.wm svg{{width:100%;height:auto;display:block}}
.brand{{position:absolute;left:78px;top:66px;display:flex;align-items:center;gap:18px;font-weight:800;font-size:30px;letter-spacing:.01em}}
.brand svg{{width:92px;height:auto;display:block;color:#B18558}}
.eyebrow{{position:absolute;left:78px;top:182px;display:flex;align-items:center;gap:16px;font-weight:800;font-size:25px;letter-spacing:.2em;color:#7a5429}}
.eyebrow::before{{content:"";width:54px;height:3px;background:#B18558;border-radius:2px}}
.title{{position:absolute;left:78px;top:236px;width:900px;height:250px;font-family:"Fraunces",Georgia,serif;font-weight:600;line-height:1.1;letter-spacing:-.02em;text-wrap:balance;overflow:hidden}}
.band{{position:absolute;left:0;right:0;bottom:0;height:82px;background:#101010;color:#F5E0CF;display:flex;align-items:center;justify-content:space-between;padding:0 78px;font-size:27px;font-weight:700;letter-spacing:.02em}}
.band::before{{content:"";position:absolute;left:0;right:0;top:-10px;height:20px;background:url("{ZIG}") repeat-x center/36px 20px}}
.band span:last-child{{color:#D8B99C;font-weight:600}}
</style>
<div class="frame"></div><div class="wm">{mark_svg}</div>
<div class="brand">{mark_svg}<span>Abdelkader Haddag</span></div>
<div class="eyebrow">{eyebrow}</div>
<div class="title" id="t">{html.escape(title)}</div>
<div class="band"><span>{html.escape(domain)}</span><span>Research · Teaching · Projects</span></div>
<script>
(async()=>{{await document.fonts.ready;const t=document.getElementById('t');let s=78;t.style.fontSize=s+'px';
while(s>34&&(t.scrollHeight>t.clientHeight+1)){{s-=2;t.style.fontSize=s+'px'}}document.title='ready'}})();
</script>"""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--site", default=str(ROOT / "_site")); ap.add_argument("--out", default=str(ROOT / "assets/img/og"))
    ap.add_argument("--force", action="store_true"); ap.add_argument("--only", default=""); ap.add_argument("--chrome", default="")
    args = ap.parse_args()
    import yaml
    from playwright.sync_api import sync_playwright
    cfg = yaml.safe_load((ROOT / "_config.yml").read_text())
    domain = re.sub(r"^https?://", "", cfg.get("url", "")).rstrip("/") or "haddagart.github.io"
    mark = re.sub(r"<svg ", '<svg fill="currentColor" ', (ROOT / "_includes/mark.svg").read_text(), count=1)
    site = pathlib.Path(args.site); out = pathlib.Path(args.out); out.mkdir(parents=True, exist_ok=True)
    cards = {"default": {"title": cfg.get("title", "Abdelkader Haddag"), "kind": "Researcher & aspiring polymath", "when": "", "slug": "default"}}
    if not site.is_dir(): sys.exit(f"{site} not found: build the site first (bundle exec jekyll build)")
    for f in sorted(site.rglob("*.html")):
        p = Cards()
        try: p.feed(f.read_text(errors="ignore"))
        except Exception: continue
        if p.found and p.found["slug"]: cards[p.found["slug"]] = p.found
    manifest_f = out / ".manifest.json"; manifest = json.loads(manifest_f.read_text()) if manifest_f.exists() else {}
    todo = []
    for slug, c in cards.items():
        if args.only and args.only not in slug: continue
        h = hashlib.sha1(json.dumps([c["title"], c["kind"], c["when"], domain], ensure_ascii=False).encode()).hexdigest()[:12]
        if args.force or manifest.get(slug) != h or not (out / f"{slug}.png").exists(): todo.append((slug, c, h))
    print(f"{len(cards)} cards found, {len(todo)} to draw")
    if not todo: return
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=args.chrome or None, args=["--no-sandbox"])
        pg = b.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
        tmp = pathlib.Path(tempfile.mkdtemp()) / "card.html"
        for slug, c, h in todo:
            tmp.write_text(card_html(c["title"], c["kind"], c["when"], domain, mark, FONT.as_uri()), encoding="utf-8")
            pg.goto(tmp.as_uri(), wait_until="load")
            pg.wait_for_function("document.title==='ready'")
            pg.screenshot(path=str(out / f"{slug}.png"), type="png"); manifest[slug] = h; print("  drew", slug)
        b.close()
    manifest_f.write_text(json.dumps(manifest, indent=1, sort_keys=True))


if __name__ == "__main__":
    main()
