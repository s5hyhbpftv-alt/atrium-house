#!/usr/bin/env python3
"""Apply verified business facts and page-specific search data to the static source."""
from pathlib import Path
from html import escape, unescape
from html.parser import HTMLParser
import argparse, json, re, subprocess

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'sheerwood-site'
PAGES = json.loads((ROOT / 'seo/pages.json').read_text())
BUSINESS = json.loads((ROOT / 'seo/business.json').read_text())
ORIGIN = 'https://s5hyhbpftv-alt.github.io/atrium-house'
BLOCK = re.compile(r'\n?<!-- SHEERWOOD search data -->.*?<!-- /SHEERWOOD search data -->\n?', re.S)
NAV = re.compile(r'<!-- SHEERWOOD breadcrumbs -->.*?<!-- /SHEERWOOD breadcrumbs -->', re.S)
BY_ROUTE = {p['route']: p for p in PAGES}

class Media(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.images=[]; self.videos=[]; self.video=None; self.portfolio=False; self.portfolio_text=''; self.feed(text)
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='script' and a.get('id')=='portfolio-data': self.portfolio=True; self.portfolio_text=''
        if tag=='img' and a.get('src','').startswith('/') and a.get('alt') and 'logo' not in a['src']:
            self.images.append(a)
        if tag=='video': self.video=a
        if tag=='source' and self.video is not None: self.video['src']=a.get('src')
    def handle_data(self, text):
        if self.portfolio: self.portfolio_text+=text
    def handle_endtag(self, tag):
        if tag=='script' and self.portfolio:
            for project in json.loads(self.portfolio_text):
                self.images.extend(frame for frame in project.get('frames',[]) if frame.get('src','').startswith('/') and frame.get('alt'))
            self.portfolio=False
        if tag=='video':
            if self.video and 'controls' in self.video and self.video.get('src') and self.video.get('poster'):
                self.videos.append(self.video)
            self.video=None

def crumbs(page):
    result=[page]; seen={page['route']}
    while result[0]['parent'] is not None:
        parent=BY_ROUTE[result[0]['parent']]
        if parent['route'] in seen: raise ValueError('Breadcrumb cycle')
        result.insert(0,parent); seen.add(parent['route'])
    return result

def business():
    b=BUSINESS
    return {'@type':'HomeAndConstructionBusiness','@id':ORIGIN+'/#business','name':b['name'],
      'url':ORIGIN+'/','logo':ORIGIN+'/images/sheerwood-logo.png','telephone':b['telephone'],'email':b['email'],
      'address':{'@type':'PostalAddress',**b['address']},
      'areaServed':[{'@type':'AdministrativeArea','name':name} for name in b['service_regions']],
      'openingHoursSpecification':[{'@type':'OpeningHoursSpecification','dayOfWeek':['https://schema.org/'+d for d in b['hours']['days']], 'opens':b['hours']['opens'],'closes':b['hours']['closes']}]}

def video_data(a):
    path=SITE/a['src'].lstrip('/')
    sec=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(path)],text=True).strip())
    published=subprocess.check_output(['git','log','--follow','--diff-filter=A','--format=%aI','--',str(path.relative_to(ROOT))],cwd=ROOT,text=True).strip().splitlines()
    if not published: raise ValueError('Missing actual video publication history: '+str(path))
    return {'@type':'VideoObject','name':a.get('aria-label','Фильм SHEERWOOD'),
      'description':a.get('aria-label','Фильм SHEERWOOD'),'thumbnailUrl':ORIGIN+a['poster'],
      'contentUrl':ORIGIN+a['src'],'uploadDate':published[-1], 'duration':f'PT{sec:.3f}S'}

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--check',action='store_true');args=parser.parse_args()
    changed=[]
    for page in PAGES:
        path=SITE/page['file']; original=path.read_text(); text=BLOCK.sub('',original);text=NAV.sub('',text)
        # Retire the earlier contact-only Organization markup.
        text=re.sub(r'<script type="application/ld\+json">.*?</script>', '', text, flags=re.S)
        text=re.sub(r'<title>.*?</title>', '<title>'+escape(page['title'])+'</title>',text,count=1,flags=re.S)
        text=re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="'+escape(page['description'],quote=True)+'">',text,count=1)
        url=ORIGIN+page['route']; trail=crumbs(page)
        graph=[business(),{'@type':'WebSite','@id':ORIGIN+'/#website','url':ORIGIN+'/','name':'SHEERWOOD','inLanguage':'ru-RU','publisher':{'@id':ORIGIN+'/#business'}}]
        webpage={'@type':'ContactPage' if page['route']=='/kontakty/' else 'AboutPage' if page['route']=='/o-kompanii/' else 'WebPage', '@id':url+'#webpage','url':url,'name':page['title'],'description':page['description'],'inLanguage':'ru-RU','isPartOf':{'@id':ORIGIN+'/#website'},'about':{'@id':ORIGIN+'/#business'}}
        if len(trail)>1:
            webpage['breadcrumb']={'@id':url+'#breadcrumbs'}
            graph.append({'@type':'BreadcrumbList','@id':url+'#breadcrumbs','itemListElement':[{'@type':'ListItem','position':i+1,'name':'Главная' if p['route']=='/' else p['name'],'item':ORIGIN+p['route']} for i,p in enumerate(trail)]})
        if page['intent']=='service':
            graph.append({'@type':'Service','@id':url+'#service','name':page['name'],'serviceType':page['name'],'description':page['description'],'url':url,'provider':{'@id':ORIGIN+'/#business'},'areaServed':business()['areaServed']})
            webpage['mainEntity']={'@id':url+'#service'}
        media=Media(text)
        if media.videos:webpage['video']=[video_data(v) for v in media.videos]
        graph.append(webpage)
        block='<!-- SHEERWOOD search data -->\n<meta name="robots" content="index,follow,max-image-preview:large,max-video-preview:-1,max-snippet:-1">\n<script type="application/ld+json">'+json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False,separators=(',',':'))+'</script>\n<!-- /SHEERWOOD search data -->'
        text=text.replace('</title>', '</title>\n'+block+'\n', 1)
        if page['route']!='/' and '<footer class="site-footer"' in text:
            parts=[]
            for p in trail:
                label='Главная' if p['route']=='/' else p['name']
                parts.append('<span aria-current="page">'+escape(label)+'</span>' if p==page else '<a href="'+p['route']+'">'+escape(label)+'</a>')
            nav='<!-- SHEERWOOD breadcrumbs --><nav class="page-path" aria-label="Путь по сайту">'+'<span aria-hidden="true">/</span>'.join(parts)+'</nav><!-- /SHEERWOOD breadcrumbs -->'
            text=text.replace('<footer class="site-footer"',nav+'<footer class="site-footer"',1)
        if text!=original:
            changed.append(page['file'])
            if not args.check:path.write_text(text)
    if args.check and changed:raise SystemExit('Search metadata needs refresh: '+', '.join(changed))
    print(f'{len(PAGES)} pages with verified business/search data; {len(changed)} updated.')
if __name__=='__main__':main()
