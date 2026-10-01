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

def rewrite_urls(content, base):
    def project_path(path):
        return path if path.startswith(base) else base + path.lstrip('/')

    def project_url(match):
        quote, path = match.groups()
        return quote + project_path(path)

    content = re.sub(r'''(["'`])(/(?!/)[^\s"'`<>]*)''', project_url, content)
    # Every responsive candidate needs the prefix, including candidates after
    # a comma. Rewriting only the first one breaks cold loads on larger screens.
    def responsive_urls(match):
        value = match['value']
        for start, end, path in reversed(list(srcset_candidates(value))):
            if path.startswith('/') and not path.startswith('//'):
                value = value[:start] + project_path(path) + value[end:]
        return match['start'] + value + match['quote']

    content = re.sub(r'''(?P<start>\b(?:srcset|imagesrcset)\s*=\s*(?P<quote>["']))(?P<value>.*?)(?P=quote)''',
                     responsive_urls, content, flags=re.I | re.S)
    content = re.sub(r'url\(/(?!/)([^)]+)\)', lambda m: 'url('+base+m[1]+')', content)
    content = content.replace('https://sheerwood.mboger777.chatgpt.site', 'https://s5hyhbpftv-alt.github.io'+base.rstrip('/'))
    return content


def srcset_candidates(value):
    """Yield URL spans; commas inside a URL (including data URLs) stay intact."""
    position = 0
    while position < len(value):
        position += len(re.match(r'[\s,]*', value[position:])[0])
        token = re.match(r'\S+', value[position:])
        if not token:
            break
        path = token[0].rstrip(',')
        yield position, position + len(path), path
        position += len(token[0])
        if not token[0].endswith(','):
            separator = value.find(',', position)
            if separator < 0:
                break
            position = separator + 1


class Links(HTMLParser):
    def __init__(self, current, output, base):
        super().__init__()
        self.current, self.output, self.base = current, output, base
        self.errors = []

    def handle_starttag(self, tag, attributes):
        for key, value in attributes:
            if key not in {'src','href','poster','srcset','imagesrcset'} or not value:
                continue
            values = (path for _, _, path in srcset_candidates(value)) if key in {'srcset','imagesrcset'} else [value]
            for candidate in values:
                self.check_url(candidate)

    def check_url(self, value):
        current, output, base, errors = self.current, self.output, self.base, self.errors
        url = urlparse(value)
        if url.scheme or url.netloc:
            return
        path = unquote(url.path)
        if path.startswith('/'):
            if not path.startswith(base):
                errors.append(f'{current.relative_to(output)}: outside project path {value}')
                return
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

def main():
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
    for file in output.rglob('*'):
        if file.suffix not in {'.html', '.css', '.js'}:
            continue
        content = rewrite_urls(file.read_text(), base)
        # This legacy decoration is resolved relative to its stylesheet.
        if file.name == 'hero-original.css':
            content = content.replace('url("images/door-leaf.webp")', 'url("../images/door-leaf.webp")')
        file.write_text(content)
    (output / '.nojekyll').write_text('')
    errors = []
    pages = list(output.rglob('*.html'))
    for current in pages:
        links = Links(current, output, base)
        links.feed(current.read_text())
        errors.extend(links.errors)
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'Ready: {len(pages)} HTML pages at {base}; all local links and responsive image candidates verified.')


if __name__ == '__main__':
    main()
