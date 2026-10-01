#!/usr/bin/env python3
"""Render the lightweight house tour from its reviewed photo descriptions."""
from pathlib import Path
from html import escape
import json,re
ROOT=Path(__file__).resolve().parent.parent;SITE=ROOT/'sheerwood-site'
scenes=json.loads((ROOT/'seo/tour.json').read_text());first=scenes[0]
path=SITE/'tour.html';old=path.read_text();head=old.split('</head>')[0]
head=re.sub(r'<style>.*?</style>','',head,flags=re.S)
head=re.sub(r'<link[^>]+(?:refinements\.css|film-player\.css|clear-labels\.css|tour\.css)[^>]*>','',head)
head=re.sub(r'<link rel="preload" as="(?:image|video)"[^>]+>','',head)
head+='\n<link rel="stylesheet" href="/assets/tour.css?v=20261001d">\n</head>'
def picture(s):
 return f'<img src="{s["src"]}" srcset="{s["small"]} {s["smallWidth"]}w, {s["src"]} {s["width"]}w" sizes="100vw" width="{s["width"]}" height="{s["height"]}" alt="{escape(s["alt"])}" decoding="async" fetchpriority="high">'
cards=''.join(f'<button type="button" class="tour-stop" data-stop="{i}" data-group="{s["group"]}" aria-label="{escape(s["label"])}" aria-current="{str(i==0).lower()}"><img src="{s["thumb"]}" width="320" height="180" alt="" loading="lazy" decoding="async"><span>{escape(s["label"])}</span></button>' for i,s in enumerate(scenes))
fallback=''.join(f'<article><h2>{escape(s["label"])}</h2><img src="{s["small"]}" alt="{escape(s["alt"])}" loading="lazy"><p>{escape(s["lead"])}</p><p>{escape(s["paragraphs"][0])}</p><p>{escape(s["paragraphs"][1])}</p></article>' for s in scenes)
body=f'''
<body>
<main class="tour-shell" data-tour>
  <header class="tour-header"><a class="tour-brand" href="/" aria-label="SHEERWOOD — главная">SHEERWOOD</a><span class="tour-heading">Дом среди сосен · Виртуальный тур</span><a class="tour-back" href="/doma/#nashi-proekty">Все проекты ↗</a></header>
  <section class="tour-stage" aria-label="Виды дома и интерьера" aria-roledescription="слайдшоу" tabindex="0">
    <div class="tour-visual"><div class="tour-shot">{picture(first)}</div></div>
    <div class="tour-copy" data-swipe-ignore><p class="tour-eyebrow">{escape(first['label'])}</p><h1>{escape(first['title'])}</h1><p class="tour-lead">{escape(first['lead'])}</p><button type="button" class="tour-detail-link" data-tour-details>О пространстве <span aria-hidden="true">↗</span></button></div>
    <p class="tour-status" role="status"></p>
    <video class="tour-video" muted playsinline preload="none" hidden aria-label="Кинематографический маршрут к дому"></video>
    <button type="button" class="tour-video-skip" data-tour-skip hidden>Перейти к фотографиям →</button>
  </section>
  <footer class="tour-navigation">
    <div class="tour-toolbar">
      <div class="tour-playback"><button class="tour-button tour-arrow" type="button" data-tour-prev aria-label="Предыдущий ракурс">←</button><button class="tour-button" type="button" data-tour-play aria-pressed="false">Смотреть тур</button><button class="tour-button tour-arrow" type="button" data-tour-next aria-label="Следующий ракурс">→</button></div>
      <nav class="tour-filters" aria-label="Части дома"><button type="button" data-tour-filter="all" aria-pressed="true">Весь дом</button><button type="button" data-tour-filter="outside" aria-pressed="false">Снаружи</button><button type="button" data-tour-filter="inside" aria-pressed="false">Внутри</button></nav>
      <div class="tour-films"><button type="button" data-tour-intro>Подлёт к дому</button><button type="button" data-tour-enter>Войти в дом ↗</button></div>
    </div>
    <nav class="tour-stops" aria-label="Выберите пространство">{cards}</nav>
    <div class="tour-progress"><label for="tour-position" class="tour-sr">Положение в туре</label><input id="tour-position" type="range" min="0" max="{len(scenes)-1}" value="0" step="1" aria-valuetext="{escape(first['label'])}"><span data-tour-count>1 / {len(scenes)}</span><span class="tour-gesture-hint">Листайте свайпом или стрелками</span></div>
  </footer>
  <dialog class="tour-description" aria-labelledby="tour-description-title"><header><p class="tour-eyebrow" data-detail-label></p><button type="button" data-detail-close aria-label="Закрыть описание">Закрыть ×</button></header><h2 id="tour-description-title"></h2><div data-detail-copy></div><h3>В этом пространстве</h3><ul data-detail-features></ul><button type="button" class="tour-button" data-detail-return>Вернуться к туру</button></dialog>
</main>
<noscript><style>.tour-shell{{display:none}}.tour-static{{padding:30px;max-width:1000px;margin:auto}}.tour-static img{{width:100%;height:auto}}.tour-static article{{margin:40px 0}}.tour-static p{{margin:16px 0;line-height:1.7}}</style><main class="tour-static"><h1>Дом среди сосен</h1>{fallback}<a href="/doma/">Вернуться к домам</a></main></noscript>
<script type="application/json" id="tour-data">{json.dumps(scenes,ensure_ascii=False,separators=(',',':'))}</script>
<script src="/assets/gallery-core.js?v=20261001d" defer></script>
<script src="/assets/tour.js?v=20261001d" defer></script>
</body></html>'''
path.write_text(head+body)
print(f'Rendered {len(scenes)} tour scenes with reviewed descriptions.')
