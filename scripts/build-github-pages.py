#!/usr/bin/env python3
"""Package the static Sheerwood site for a GitHub Pages project URL."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote
import argparse
import re
import shutil
import subprocess
import sys

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, default=Path('dist/github-pages'))
parser.add_argument('--base', default='/atrium-house/')
args = parser.parse_args()
source = Path(__file__).resolve().parent.parent / 'sheerwood-site'
output = args.output.resolve()
base = '/' + args.base.strip('/') + '/'
if output == source or source in output.parents or output in source.parents:
    raise SystemExit('Output must be separate from the site source.')
if output.exists():
    raise SystemExit('Output already exists. Choose a new empty output directory.')
subprocess.run([sys.executable, str(Path(__file__).with_name('update-social-previews.py')), '--check'], check=True)
shutil.copytree(source, output)

def project_url(match):
    quote, path = match.groups()
    return quote + (path if path.startswith(base) else base + path.lstrip('/'))

for file in output.rglob('*'):
    if file.suffix not in {'.html', '.css', '.js'}:
        continue
    content = file.read_text()
    content = re.sub(r'''(["'`])(/(?!/)[^\s"'`<>]*)''', project_url, content)
    content = re.sub(r'url\(/(?!/)([^)]+)\)', lambda m: 'url('+base+m[1]+')', content)
    content = content.replace('https://sheerwood.mboger777.chatgpt.site', 'https://s5hyhbpftv-alt.github.io'+base.rstrip('/'))
    # This legacy decoration is resolved relative to its stylesheet.
    if file.name == 'hero-original.css':
        content = content.replace('url("images/door-leaf.webp")', 'url("../images/door-leaf.webp")')
    file.write_text(content)
(output / '.nojekyll').write_text('')

errors = []
class Links(HTMLParser):
    def handle_starttag(self, tag, attributes):
        for key, value in attributes:
            if key not in {'src','href','poster'} or not value:
                continue
            url = urlparse(value)
            if url.scheme or url.netloc:
                continue
            path = unquote(url.path)
            if path.startswith('/'):
                if not path.startswith(base):
                    errors.append(f'{current.relative_to(output)}: outside project path {value}')
                    continue
                target = output / path[len(base):]
            else:
                target = current.parent / path if path else current
            if target.is_dir():
                target /= 'index.html'
            if not target.exists():
                errors.append(f'{current.relative_to(output)}: missing {value}')
            elif url.fragment and target.suffix == '.html':
                if not re.search(r'\bid=["\']'+re.escape(url.fragment)+r'["\']',target.read_text()):
                    errors.append(f'{current.relative_to(output)}: missing fragment {value}')

pages = list(output.rglob('*.html'))
for current in pages:
    Links().feed(current.read_text())
if errors:
    raise SystemExit('\n'.join(errors))
print(f'Ready: {len(pages)} HTML pages at {base}; all local links and assets verified.')
