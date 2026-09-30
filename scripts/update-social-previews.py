#!/usr/bin/env python3
"""Refresh static sharing metadata from each page's own content and lead photo.

Run before build-github-pages.py. --check verifies the generated metadata without
writing. Legacy redirects inherit their destination's metadata and canonical URL.
Requires Pillow, which is also used by the site's media authoring workflow.
"""
from pathlib import Path
from html import escape
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse, unquote
import argparse
import re

from PIL import Image

SITE = Path(__file__).resolve().parent.parent / 'sheerwood-site'
ORIGIN = 'https://s5hyhbpftv-alt.github.io/atrium-house/'
START = '<!-- SHEERWOOD page preview -->'
END = '<!-- /SHEERWOOD page preview -->'
BLOCK = re.compile(r'\n?' + re.escape(START) + r'.*?' + re.escape(END) + r'\n?', re.S)

TITLES = {
    'index.html': 'Архитектура. Строительство. Интерьеры.',
    'arkhitektura/index.html': 'Архитектура загородного дома',
    'arkhitektura/barnhouse/index.html': 'Барнхаус: свет, объём и дерево',
    'arkhitektura/chalet/index.html': 'Современное шале',
    'arkhitektura/classic/index.html': 'Сдержанная классика',
    'arkhitektura/courtyard/index.html': 'Дом с внутренним двором',
    'arkhitektura/minimalizm/index.html': 'Архитектура минимализма',
    'arkhitektura/scandinavian/index.html': 'Скандинавский дом',
    'craft/index.html': 'Все направления',
    'dizayn-intererov/index.html': 'Дизайн интерьеров. Ваш характер.',
    'doma/index.html': 'Загородный дом начинается с вас',
    'etapy/index.html': 'От проекта до готового пространства',
    'inzheneriya/index.html': 'Инженерные системы для жизни',
    'kommercheskie-pomeshcheniya/index.html': 'Ремонт коммерческих помещений',
    'kontakty/index.html': 'Контакты. Начнём с разговора.',
    'o-kompanii/index.html': 'Подход SHEERWOOD',
    'proektirovanie/index.html': 'Проектирование загородного дома',
    'remont/index.html': 'Ремонт квартир, домов и офисов',
    'remont/kapitalnyy/index.html': 'Капитальный ремонт: шаг за шагом',
    'remont/kosmeticheskiy/index.html': 'Косметический ремонт: обновить пространство',
    'remont/po-dizayn-proektu/index.html': 'Ремонт по дизайн-проекту',
    'remont/vidy/index.html': 'Какой ремонт нужен вашему пространству',
    'servis/index.html': 'Обслуживание инженерных систем',
    'tekhnologii/peregorodki/index.html': 'Перегородки: геометрия и тишина',
    'tekhnologii/podgotovka-sten/index.html': 'Подготовка стен к чистовой отделке',
    'tipy-domov/index.html': 'Из чего строить дом: шесть технологий',
    'tipy-domov/kirpichnye/index.html': 'Кирпичный дом: от первого ряда',
    'tour.html': 'Виртуальный тур по загородному дому',
    'umnyi-dom/index.html': 'Умный дом на Aqara и Алисе',
    'umnyi-dom/aqara-alisa/index.html': 'Aqara и Алиса: как всё соединить',
    'umnyi-dom/bez-interneta/index.html': 'Умный дом без интернета',
    'umnyi-dom/bezopasnost/index.html': 'Умная защита: вода, окна и уведомления',
    'umnyi-dom/dostup/index.html': 'Умный вход: звонок и замок Aqara',
    'umnyi-dom/energiya/index.html': 'Энергия под контролем',
    'umnyi-dom/klimat/index.html': 'Комфортный климат в каждой комнате',
    'umnyi-dom/scenarii/index.html': '12 сценариев умного дома',
    'umnyi-dom/svet-i-shtory/index.html': 'Свет и шторы по вашему сценарию',
    'umnyi-dom/tehnika/index.html': 'Техника, которая работает вместе',
    'umnyi-dom/ustanovka/index.html': 'Умный дом: от идеи до настройки',
}

DESCRIPTIONS = {
    'index.html': 'От первой идеи до пространства для жизни. Загородные дома, интерьеры, ремонт, инженерные системы и умный дом. SHEERWOOD, Москва.',
    'craft/index.html': 'Архитектура, строительство домов, дизайн интерьеров, ремонт, ландшафт, инженерные системы и умный дом — выберите своё направление SHEERWOOD.',
    'dizayn-intererov/index.html': 'Интерьеры с характером: гостиные, кухни, спальни и пространства для работы. Планировка, материалы, свет и путь от концепции до реализации.',
    'kommercheskie-pomeshcheniya/index.html': 'Пространства для бизнеса: планировка, отделка, освещение и инженерные системы. Разбираем задачи помещения и последовательность ремонта.',
    'kontakty/index.html': 'Контакты SHEERWOOD в Москве: +7 926 544 00 74, hello@sheerwood.moscow. Обсудим архитектуру, строительство, интерьер, ремонт и инженерные системы.',
    'o-kompanii/index.html': 'Как SHEERWOOD связывает архитектуру, строительство, интерьер и инженерные системы. Подход к проекту, этапам работ и согласованию решений.',
    'remont/index.html': 'Ремонт квартир, загородных домов, офисов и коммерческих помещений. Выбор объёма работ, подготовка, инженерия, отделка и приёмка.',
    'remont-ofisov/index.html': 'Офис под задачи вашей команды: рабочие места, переговорные, свет и инженерия. Планируем ремонт и согласуем детали до начала отделки.',
    'tipy-domov/index.html': 'Каркас, клеёный брус, газобетон, кирпич, монолит и модули. Сравниваем устройство домов, этапы строительства и важные контрольные точки.',
    'tipy-domov/kirpichnye/index.html': 'Кирпич и керамические блоки: устройство стен, этапы кладки и контроль качества. Фотографии деталей и короткий фильм о работе на площадке.',
    'tour.html': 'Рассмотрите загородный дом с разных сторон в интерактивном туре SHEERWOOD: архитектуру, объём и связь с окружающим пространством.',
}


# Keep social descriptions in sync with the curated search descriptions.
import json
for _page in json.loads((SITE.parent / 'seo/pages.json').read_text()):
    DESCRIPTIONS[_page['file']] = _page['description']


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.title = ''
        self.in_title = False
        self.description = ''
        self.redirect = None
        self.images = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'title':
            self.in_title = True
        if tag == 'meta':
            if a.get('name', '').lower() == 'description':
                self.description = a.get('content', '')
            if a.get('http-equiv', '').lower() == 'refresh':
                match = re.search(r'url=(.+)', a.get('content', ''), re.I)
                if match:
                    self.redirect = match[1].strip(' \"\'')
        if tag == 'img' and a.get('src') and 'logo' not in a['src'].lower():
            self.images.append((a['src'], a.get('alt', '')))
        if tag == 'video' and a.get('poster'):
            self.images.append((a['poster'], a.get('aria-label', '')))

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


def page_url(path):
    return ORIGIN + (path[:-10] if path.endswith('index.html') else path)


def meta(key, value, prop=False):
    return f'<meta {"property" if prop else "name"}="{key}" content="{escape(str(value), quote=True)}">'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    paths = sorted(SITE.rglob('*.html'))
    documents = {p.relative_to(SITE).as_posix(): p.read_text() for p in paths}
    pages = {name: Page(BLOCK.sub('', text)) for name, text in documents.items()}
    metadata = {}
    images = {}

    def get_metadata(name, seen=()):
        if name in metadata:
            return metadata[name]
        if name in seen:
            raise ValueError(f'Redirect cycle: {seen} -> {name}')
        page = pages[name]
        if page.redirect:
            target = urlparse(urljoin(page_url(name), page.redirect)).path
            base = urlparse(ORIGIN).path
            target = target.removeprefix(base).lstrip('/')
            if target.endswith('/'):
                target += 'index.html'
            metadata[name] = get_metadata(target, (*seen, name))
            return metadata[name]

        short_title = TITLES.get(name, re.sub(r'\s*[—|·]\s*Sheerwood\s*$', '', page.title, flags=re.I))
        title = short_title + (' — SHEERWOOD' if 'SHEERWOOD' not in short_title else '')
        description = DESCRIPTIONS.get(name, page.description)
        if not title or not description:
            raise ValueError(f'Missing page-specific title/description: {name}')
        image = ('/og.png', 'SHEERWOOD. Архитектура, строительство и интерьеры. Загородный дом в сосновом лесу.') if name == 'index.html' else next(iter(page.images), None)
        lines = [
            START,
            f'<link rel="canonical" href="{page_url(name)}">',
            meta('og:type', 'website', True),
            meta('og:site_name', 'SHEERWOOD', True),
            meta('og:locale', 'ru_RU', True),
            meta('og:title', title, True),
            meta('og:description', description, True),
            meta('og:url', page_url(name), True),
            meta('twitter:card', 'summary_large_image' if image else 'summary'),
            meta('twitter:title', title),
            meta('twitter:description', description),
        ]
        if image:
            src, alt = image
            relative = src.lstrip('/') if src.startswith('/') else (Path(name).parent / src).as_posix()
            image_file = (SITE / unquote(relative)).resolve()
            if not image_file.is_relative_to(SITE.resolve()) or not image_file.is_file():
                raise ValueError(f'Missing primary image for {name}: {image_file}')
            with Image.open(image_file) as bitmap:
                width, height = bitmap.size
                mime = Image.MIME[bitmap.format]
            if width < 300 or height < 157:
                raise ValueError(f'Primary image too small for sharing: {name}')
            if image_file.stat().st_size > 5_000_000:
                raise ValueError(f'Primary image larger than 5 MB: {name}')
            url = ORIGIN + relative
            alt = alt or short_title
            lines += [
                meta('og:image', url, True),
                meta('og:image:secure_url', url, True),
                meta('og:image:type', mime, True),
                meta('og:image:width', width, True),
                meta('og:image:height', height, True),
                meta('og:image:alt', alt, True),
                meta('twitter:image', url),
                meta('twitter:image:alt', alt),
            ]
            images[name] = relative
        lines.append(END)
        metadata[name] = '\n'.join(lines)
        return metadata[name]

    changed = []
    # Compute every page before writing, so a missing asset cannot cause a partial update.
    for name in documents:
        get_metadata(name)
    for name, text in documents.items():
        original_body = re.search(r'<body\b.*', text, re.I | re.S)
        updated = BLOCK.sub('', text)
        if name in DESCRIPTIONS or not pages[name].description:
            desc = DESCRIPTIONS.get(name)
            if desc is None and pages[name].redirect:
                # The canonical destination's sharing description is also used by crawlers
                # that do not follow HTML refresh redirects.
                m = re.search(r'<meta property="og:description" content="([^"]+)"', metadata[name])
                from html import unescape
                desc = unescape(m[1])
            tag = meta('description', desc)
            pattern = r'<meta\b[^>]*\bname=["\']description["\'][^>]*>'
            updated = re.sub(pattern, lambda m: tag, updated, count=1, flags=re.I) if pages[name].description else updated.replace('</head>', tag + '</head>', 1)
        # Canonical is owned by this block; preserve all other head markup.
        updated = re.sub(r'<link\b[^>]*\brel=["\']canonical["\'][^>]*>\s*', '', updated, flags=re.I)
        updated = updated.replace('</head>', '\n' + metadata[name] + '\n</head>', 1)
        if original_body and not updated.endswith(original_body[0]):
            raise ValueError(f'Body unexpectedly modified: {name}')
        if updated != text:
            changed.append(name)
            if not args.check:
                (SITE / name).write_text(updated)
    if args.check and changed:
        raise SystemExit('Metadata needs refresh: ' + ', '.join(changed))
    real_pages = [name for name, p in pages.items() if not p.redirect]
    if len(set(images.values())) != len(images):
        raise ValueError('Independent pages must not share primary preview images')
    print(f'{len(pages)} pages verified: {len(real_pages)} canonical pages, '
          f'{len(pages)-len(real_pages)} redirects, {len(images)} unique preview images; '
          f'{len(changed)} updated. Body content preserved.')
    for name in real_pages:
        if name not in images:
            print(f'Text preview (no primary content photo): {name}')


if __name__ == '__main__':
    main()
