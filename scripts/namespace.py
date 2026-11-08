# Prefixes app class names that clash with the page's own CSS (static/assets), in src/lib/ported. Safe to re-run.
import glob, os, re
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
PORTED = os.path.join(ROOT, "src/lib/ported")
kit = set()
for f in glob.glob(os.path.join(ROOT, "static/assets/**/*.css"), recursive=True):
    text = re.sub(r"url\([^)]*\)|/\*.*?\*/", "", open(f).read(), flags=re.S)
    kit |= set(re.findall(r"\.(-?[a-zA-Z_][\w-]*)", text))
pages = glob.glob(PORTED + "/*.html")
used = set()
for f in pages:
    for value in re.findall(r'class="([^"]*)"', open(f).read()):
        used |= set(value.split())
clash = kit & used
FIXES = {"Claude Sonnet 5 5": "Claude Sonnet 5.5"}  # capture quirks in visible text
def fix_html(match):
    return 'class="' + " ".join("yk-" + c if c in clash else c for c in match.group(1).split()) + '"'
for f in pages:
    s = open(f).read()
    s = re.sub(r'class="([^"]*)"', fix_html, s)
    # a picture of the app adds no headings to the page; the tag stays in a class so its CSS still targets it alone
    s = re.sub(r'<h([1-6]) class="', r'<div class="yk-h\1 ', s)
    s = re.sub(r"<h([1-6])>", r'<div class="yk-h\1">', s)
    s = re.sub(r"</h[1-6]>", "</div>", s)
    for a, b in FIXES.items():
        s = s.replace(a, b)
    open(f, "w").write(s)
css = os.path.join(PORTED, "ported.css")
s = open(css).read()
for c in sorted(clash):
    s = re.sub(r"\." + re.escape(c) + r"(?![\w-])", ".yk-" + c, s)
s = re.sub(r"(?<![\w.#-])h([1-6])(?=[.:\s,{>])", r".yk-h\1", s)
open(css, "w").write(s)
print(sorted(clash))
