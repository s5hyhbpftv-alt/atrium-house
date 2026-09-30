#!/usr/bin/env python3
"""Build a self-contained root-domain upload for Jino, separate from GitHub Pages."""
from pathlib import Path
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
from datetime import datetime, timezone
import argparse, csv, hashlib, importlib.util, json, re, shutil, subprocess, sys, zipfile
import xml.etree.ElementTree as ET

sys.dont_write_bytecode = True
ROOT=Path(__file__).resolve().parent.parent
SITE=ROOT/'sheerwood-site'
PAGES=json.loads((ROOT/'seo/pages.json').read_text())
BUSINESS=json.loads((ROOT/'seo/business.json').read_text())
ORIGIN=BUSINESS['origin'].rstrip('/')
if ORIGIN!='https://sheerwood.moscow':raise SystemExit('Review domain redirects before changing the canonical origin.')
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output',type=Path,required=True)
parser.add_argument('--zip',type=Path)
args=parser.parse_args();output=args.output.resolve()
if output.exists() or output==SITE or SITE in output.parents or output in SITE.parents:raise SystemExit('Choose a new output directory outside the source.')
for script in ['prepare-search.py','update-social-previews.py']:
    subprocess.run([sys.executable,str(ROOT/'scripts'/script),'--check'],check=True)
shutil.copytree(SITE,output,ignore=shutil.ignore_patterns('README.md','.DS_Store','.openai','.git','*.map'))
OLD='https://s5hyhbpftv-alt.github.io/atrium-house'
redirects={}
for f in output.rglob('*'):
    if not f.is_file() or f.suffix not in {'.html','.css','.js','.svg','.json','.txt'}:continue
    text=f.read_text()
    if f.suffix=='.html':
        m=re.search(r'http-equiv="refresh"[^>]*content="0;\s*url=([^\"]+)"',text,re.I)
        if m:redirects['/'+f.relative_to(output).as_posix()]=m[1]
    text=text.replace(OLD,ORIGIN).replace('https://sheerwood.mboger777.chatgpt.site',ORIGIN)
    # Older texture path was relative to the HTML document instead of its CSS.
    if f.name=='hero-original.css':text=text.replace('url("images/door-leaf.webp")','url("../images/door-leaf.webp")')
    f.write_text(text)
# Verification tokens remain blank until supplied by the property owner.
verify=''.join('<meta name="'+kind+'" content="'+escape(BUSINESS[key],quote=True)+'">\n' for key,kind in [('google_site_verification','google-site-verification'),('yandex_verification','yandex-verification')] if BUSINESS.get(key))
if verify:
    f=output/'index.html';f.write_text(f.read_text().replace('</head>',verify+'</head>'))
htaccess='''# SHEERWOOD — Apache/Jino. Install at the domain document root.
Options -Indexes
DirectoryIndex index.html
AddDefaultCharset UTF-8
ErrorDocument 404 /404.html

<IfModule mod_rewrite.c>
RewriteEngine On
'''
for old,target in sorted(redirects.items()):
    target=target.replace(ORIGIN,'')
    if not target.startswith('/'):raise ValueError('Unexpected redirect: '+target)
    htaccess+='RewriteRule ^'+re.escape(old.lstrip('/'))+'$ '+ORIGIN+target+' [R=301,L,NE]\n'
htaccess+='''# Former GitHub Pages project paths.
RewriteRule ^atrium-house/?$ https://sheerwood.moscow/ [R=301,L,NE]
RewriteRule ^atrium-house/(.+)$ https://sheerwood.moscow/$1 [R=301,L,NE]
# Remove only index.html explicitly requested by the visitor.
RewriteCond %{THE_REQUEST} \\s/+[^?\\ ]*index\\.html(?:[?\\ ]|$) [NC]
RewriteRule ^(.*)index\\.html$ https://sheerwood.moscow/$1 [R=301,L,NE]
# One public host. Never build a redirect destination from an untrusted host.
RewriteCond %{HTTP_HOST} !^sheerwood\\.moscow(?::443)?$ [NC]
RewriteRule ^ https://sheerwood.moscow%{REQUEST_URI} [R=301,L,NE]
# Jino terminates TLS upstream and documents X-Forwarded-Protocol.
RewriteCond %{HTTPS} !=on
RewriteCond %{HTTP:X-Forwarded-Protocol} !=https [NC]
RewriteRule ^ https://sheerwood.moscow%{REQUEST_URI} [R=301,L,NE]
# Keep directory canonical redirects on HTTPS behind the hosting proxy.
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^(.+[^/])$ https://sheerwood.moscow/$1/ [R=301,L,NE]
</IfModule>

<FilesMatch "^(\\.|.*(?:\\.bak|\\.old|\\.sql|\\.log|\\.env))">
Require all denied
</FilesMatch>
<IfModule mod_mime.c>
AddType image/webp .webp
AddType image/svg+xml .svg
AddType video/mp4 .mp4
AddType font/woff2 .woff2
AddType application/xml .xml
</IfModule>
<IfModule mod_headers.c>
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
<FilesMatch "\\.html$">
Header set Cache-Control "public, max-age=0, must-revalidate"
</FilesMatch>
<FilesMatch "\\.(css|js)$">
Header set Cache-Control "public, max-age=3600, must-revalidate"
</FilesMatch>
<FilesMatch "\\.(jpg|jpeg|png|webp|svg|mp4|woff2)$">
Header set Cache-Control "public, max-age=604800"
</FilesMatch>
</IfModule>
<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json application/xml image/svg+xml
</IfModule>
'''
(output/'.htaccess').write_text(htaccess)
(output/'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: '+ORIGIN+'/sitemap.xml\n')
(output/'404.html').write_text('''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Страница не найдена — SHEERWOOD</title><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/assets/site.css"><style>body{min-height:100svh;display:grid;place-items:center;padding:8vw;background:#142b21;color:#f0eadc}main{max-width:800px}h1{font-size:clamp(52px,8vw,100px)}p{margin:30px 0}nav{display:flex;gap:30px;flex-wrap:wrap}a{border-bottom:1px solid;padding:12px 0}</style></head><body><main><p>SHEERWOOD</p><h1>Здесь пока<br>нет страницы.</h1><p>Адрес мог измениться. Вернитесь к направлениям или напишите нам — поможем найти нужное.</p><nav><a href="/">На главную</a><a href="/craft/">Все направления</a><a href="/kontakty/">Контакты</a></nav></main></body></html>''')
# The sitemap includes real canonical pages, their photos and actual embedded films.
SM='http://www.sitemaps.org/schemas/sitemap/0.9'; IM='http://www.google.com/schemas/sitemap-image/1.1'; VI='http://www.google.com/schemas/sitemap-video/1.1'
for prefix,ns in [('',SM),('image',IM),('video',VI)]:ET.register_namespace(prefix,ns)
urlset=ET.Element('{'+SM+'}urlset')
spec=importlib.util.spec_from_file_location('search',ROOT/'scripts/prepare-search.py');search=importlib.util.module_from_spec(spec);spec.loader.exec_module(search)
image_count=video_count=0
for p in PAGES:
    f=output/p['file'];text=f.read_text();url=ET.SubElement(urlset,'{'+SM+'}url')
    ET.SubElement(url,'{'+SM+'}loc').text=ORIGIN+p['route']
    # Actual source modification, never a fabricated daily update.
    ET.SubElement(url,'{'+SM+'}lastmod').text=datetime.fromtimestamp((SITE/p['file']).stat().st_mtime,timezone.utc).isoformat(timespec='seconds')
    for src in dict.fromkeys(i['src'] for i in search.Media(text).images):
        el=ET.SubElement(url,'{'+IM+'}image');ET.SubElement(el,'{'+IM+'}loc').text=ORIGIN+src;image_count+=1
    schema=json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',text,re.S)[1])
    for node in schema['@graph']:
        for v in node.get('video',[]):
            el=ET.SubElement(url,'{'+VI+'}video');video_count+=1
            for tag,val in [('thumbnail_loc',v['thumbnailUrl']),('title',v['name']),('description',v['description']),('content_loc',v['contentUrl']),('publication_date',v['uploadDate']),('duration',str(max(1,round(float(v['duration'][2:-1])))))]:ET.SubElement(el,'{'+VI+'}'+tag).text=val
ET.ElementTree(urlset).write(output/'sitemap.xml',encoding='utf-8',xml_declaration=True)
# Validate links, metadata, schema, canonical inventory and absence of old hosts.
errors=[];titles=set();descs=set()
class Audit(HTMLParser):
    def __init__(self):super().__init__();self.h1=0
    def handle_starttag(self,tag,attrs):
        if tag=='h1':self.h1+=1
        a=dict(attrs)
        for key in ['href','src','poster']:
            value=a.get(key,'');u=urlsplit(value)
            if not value or u.scheme or u.netloc:continue
            path=unquote(u.path);target=output/path.lstrip('/') if path.startswith('/') else file.parent/path if path else file
            if target.is_dir():target/='index.html'
            if not target.exists():errors.append(f'{file.relative_to(output)} missing {value}')
            elif u.fragment and target.suffix=='.html' and not re.search(r'\bid=["\']'+re.escape(unquote(u.fragment))+r'["\']',target.read_text()):errors.append(f'Missing fragment {value}')
for file in output.rglob('*.html'):
    text=file.read_text();audit=Audit();audit.feed(text)
    if OLD in text or 'chatgpt.site' in text:errors.append('Old hostname: '+str(file))
for p in PAGES:
    text=(output/p['file']).read_text();a=Audit();file=output/p['file'];a.feed(text)
    if a.h1!=1:errors.append(f'{p["file"]}: expected one h1, got {a.h1}')
    if f'rel="canonical" href="{ORIGIN+p["route"]}"' not in text:errors.append('Canonical: '+p['file'])
    if p['title'] in titles or p['description'] in descs:errors.append('Duplicate metadata: '+p['file'])
    titles.add(p['title']);descs.add(p['description'])
for f in output.rglob('*.css'):
    for value in re.findall(r'url\(["\']?([^\s\)"\']+)',f.read_text()):
        u=urlsplit(value)
        if u.scheme or u.netloc or value.startswith('#'):continue
        target=output/unquote(u.path).lstrip('/') if u.path.startswith('/') else f.parent/unquote(u.path)
        if not target.exists():errors.append(f'{f.relative_to(output)} missing CSS resource {value}')
if errors:raise SystemExit('\n'.join(errors))
report={'origin':ORIGIN,'canonical_pages':len(PAGES),'legacy_redirects':len(redirects),'sitemap_image_entries':image_count,'sitemap_video_entries':video_count,'html_files':len(list(output.rglob('*.html'))),'files':len([p for p in output.rglob('*') if p.is_file()]),'bytes':sum(p.stat().st_size for p in output.rglob('*') if p.is_file()),'checks':'links, fragments, one H1 per canonical page, unique titles/descriptions, canonical URLs, CSS resources, JSON-LD and sitemap passed'}
report_path=output.parent/(output.name+'-validation.json');report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
if args.zip:
    zip_path=args.zip.resolve();zip_path.parent.mkdir(parents=True,exist_ok=True)
    # Include directories explicitly: hosting extractors must not infer their
    # traversal permissions from a server-specific umask.
    output.chmod(0o755)
    for f in output.rglob('*'):
        f.chmod(0o755 if f.is_dir() else 0o644)
    with zipfile.ZipFile(zip_path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for f in sorted(output.rglob('*')):
            z.write(f,f.relative_to(output).as_posix())
    checksum=hashlib.sha256(zip_path.read_bytes()).hexdigest();zip_path.with_suffix('.sha256').write_text(checksum+'  '+zip_path.name+'\n')
    print('Upload ZIP:',zip_path)
print(json.dumps(report,ensure_ascii=False,indent=2))
