#!/usr/bin/env python3
"""Render the project gallery from public, curated data (no source filenames)."""
from pathlib import Path
from html import escape
import json,re

ROOT=Path(__file__).resolve().parent.parent
SITE=ROOT/'sheerwood-site'
projects=json.loads((ROOT/'seo/portfolio.json').read_text())
def image(f, size='main', alt=True):
    sizes='(max-width: 600px) 90vw, 68vw' if size=='main' else '(max-width: 600px) 44vw, 23vw'
    return f'<img src="{f["src"]}" srcset="{f["small"]} {f["smallWidth"]}w, {f["src"]} {f["width"]}w" sizes="{sizes}" width="{f["width"]}" height="{f["height"]}" alt="{escape(f["alt"] if alt else "",quote=True)}" loading="lazy" decoding="async">'
def arrow(direction):
    points='14 5 7 12 14 19' if direction=='previous' else '10 5 17 12 10 19'
    return f'<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="{points}"/></svg>'
first=projects[0];f=first['frames'][0]
cards=''.join(f'<a class="portfolio-project" href="{p["frames"][0]["src"]}" data-project="{i}" aria-current="{str(i==0).lower()}"><img src="{p["frames"][0]["thumb"]}" alt="" width="400" height="216" loading="lazy" decoding="async"><span>{escape(p["title"])}</span></a>' for i,p in enumerate(projects))
fallback=''.join('<details class="portfolio-fallback"><summary>'+escape(p['title'])+'</summary><nav aria-label="'+escape(p['title'])+'">'+''.join('<a href="'+f['src']+'">'+escape(f['caption'])+'</a>' for f in p['frames']+p['plans'])+'</nav></details>' for p in projects)
block=f'''<!-- SHEERWOOD portfolio -->
<section class="portfolio" id="nashi-proekty" data-portfolio aria-labelledby="portfolio-heading">
  <div class="portfolio-heading"><div><span class="portfolio-eyebrow">Проекты SHEERWOOD</span><h2 id="portfolio-heading">Дома<br><em>с характером.</em></h2></div><p>От силуэта среди деревьев до пространства внутри. Рассмотрите архитектуру, интерьер и планировки каждого дома.</p></div>
  <div class="portfolio-cinema">
    <div class="portfolio-stage" role="region" aria-roledescription="слайдшоу" aria-label="Ракурсы выбранного дома" tabindex="0">
      <div class="portfolio-scene"><button type="button" class="portfolio-scene-main" aria-label="Открыть фото: {escape(f['caption'])}">{image(f)}<span class="portfolio-frame-caption"><span>{escape(f['caption'])}</span><span class="portfolio-enlarge" aria-hidden="true">+</span></span></button><div class="portfolio-scene-details" aria-hidden="true"><div class="portfolio-scene-detail">{image(first['frames'][1],'detail',False)}</div><div class="portfolio-scene-detail">{image(first['frames'][2],'detail',False)}</div></div></div>
    </div>
    <div class="portfolio-bar"><div><h3 class="portfolio-title">{escape(first['title'])}</h3><p class="portfolio-facts">{escape(first['facts'])}</p></div><div class="portfolio-controls portfolio-js-only" aria-label="Управление слайдшоу"><button class="portfolio-control" type="button" data-action="play" aria-pressed="false">Смотреть</button><button class="portfolio-control portfolio-arrow" type="button" data-action="previous" aria-label="Предыдущий кадр">{arrow('previous')}</button><button class="portfolio-control portfolio-arrow" type="button" data-action="next" aria-label="Следующий кадр">{arrow('next')}</button><button class="portfolio-control" type="button" data-action="open">На весь экран</button></div></div>
  </div>
  <div class="portfolio-meta"><p class="portfolio-description">{escape(first['description'])}</p><div class="portfolio-views portfolio-js-only" aria-label="Посмотреть дом"><button class="portfolio-view" type="button" data-view="exterior" aria-pressed="true">Архитектура</button><button class="portfolio-view" type="button" data-view="interior" aria-pressed="false">Интерьер</button><button class="portfolio-view" type="button" data-action="plans">Планировки</button></div></div>

  <p class="portfolio-rail-label">Выберите дом</p><nav class="portfolio-projects" aria-label="Наши проекты">{cards}</nav>
  <div class="portfolio-story"><div><span class="portfolio-story-kicker">История дома</span><h4 class="portfolio-story-heading">{escape(first['story']['heading'])}</h4><p class="portfolio-story-note">{escape(first['story']['note'])}</p></div><div class="portfolio-story-copy"><p class="portfolio-story-lead">{escape(first['story']['paragraphs'][0])}</p><details><summary>Читать историю</summary><div class="portfolio-story-body">{''.join('<p>'+escape(p)+'</p>' for p in first['story']['paragraphs'][1:])}</div></details></div></div>
  <p class="portfolio-status" role="status"></p><p class="portfolio-sr portfolio-live" aria-live="polite" aria-atomic="true"></p>
  <noscript>{fallback}</noscript>
  <dialog class="portfolio-dialog" aria-labelledby="portfolio-dialog-title"><header class="portfolio-dialog-header"><h3 class="portfolio-dialog-title" id="portfolio-dialog-title">{escape(first['title'])}</h3><button type="button" class="portfolio-dialog-close" data-modal-close autofocus>Закрыть</button></header><div class="portfolio-dialog-viewport" aria-label="Фото. Свайп влево или вправо для перелистывания"><img alt="" decoding="async"></div><footer class="portfolio-dialog-footer"><p class="portfolio-dialog-caption" aria-live="polite"></p><div class="portfolio-dialog-tools"><span data-modal-count class="portfolio-dialog-caption"></span><button class="portfolio-control" type="button" data-modal-prev aria-label="Предыдущее изображение">{arrow('previous')}</button><button class="portfolio-control" type="button" data-modal-next aria-label="Следующее изображение">{arrow('next')}</button><button class="portfolio-control" type="button" data-modal-zoom aria-pressed="false">Увеличить</button><a class="portfolio-control" data-modal-download href="{f['src']}" download>Скачать</a></div></footer></dialog>
</section>
<script type="application/json" id="portfolio-data">{json.dumps(projects,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')}</script>
<!-- /SHEERWOOD portfolio -->'''
path=SITE/'doma/index.html';html=path.read_text()
if '<!-- SHEERWOOD portfolio -->' in html:
    html=re.sub(r'<!-- SHEERWOOD portfolio -->.*?<!-- /SHEERWOOD portfolio -->',lambda _:block,html,flags=re.S)
else:
    html=html.replace('<section class="house-pair">',block+'\n<section class="house-pair">',1)
if '/assets/gallery-core.js' not in html: html=html.replace('<script src="/assets/portfolio.js', '<script src="/assets/gallery-core.js?v=20261001d" defer></script><script src="/assets/portfolio.js') if '/assets/portfolio.js' in html else html.replace('</body>','<script src="/assets/gallery-core.js?v=20261001d" defer></script></body>')
if '/assets/portfolio.css' not in html: html=html.replace('</head>','<link rel="stylesheet" href="/assets/portfolio.css">\n</head>')
if '/assets/portfolio.js' not in html: html=html.replace('</body>','<script src="/assets/portfolio.js" defer></script></body>')
path.write_text(html)
print(f'Rendered {len(projects)} projects, {sum(len(p["frames"]) for p in projects)} views and {sum(len(p["plans"]) for p in projects)} plans.')
