#!/usr/bin/env python3
"""Regenera a pasta publicada a partir dos hubs.

Uso: python3 study-hubs/build.py [pasta-dos-hubs]   (padrão: /mnt/project-files/hubs)

Para cada <slug>/hub.html copia para study-hubs/hubs/<slug>.html e monta o
index.html com uma aba por matéria. Metadados (código, nome, cor) vêm de
<slug>/<slug>.json. Rode de novo sempre que um hub mudar.
"""
import json, os, re, shutil, sys

here = os.path.dirname(os.path.abspath(__file__))
src = sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/hubs'
out = os.path.join(here, 'hubs')
os.makedirs(out, exist_ok=True)

tabs = []
for slug in sorted(os.listdir(src)):
    if slug.startswith('_') or not os.path.isfile(os.path.join(src, slug, 'hub.html')):
        continue
    html = open(os.path.join(src, slug, 'hub.html'), encoding='utf8').read()
    if not html.lstrip().lower().startswith('<!doctype') or '<meta charset' not in html[:300].lower():
        html = '<meta charset="utf-8">\n' + html
    open(os.path.join(out, slug + '.html'), 'w', encoding='utf8').write(html)
    meta = {}
    jp = os.path.join(src, slug, slug + '.json')
    if os.path.isfile(jp):
        meta = json.load(open(jp, encoding='utf8'))
    tabs.append({'slug': slug, 'codigo': meta.get('codigo', slug.upper()),
                 'nome': meta.get('nome', ''), 'cor': meta.get('cor', '#7C5CFF')})

# remove hubs que sumiram da origem
keep = {t['slug'] + '.html' for t in tabs}
for f in os.listdir(out):
    if f.endswith('.html') and f not in keep:
        os.remove(os.path.join(out, f))

tpl = open(os.path.join(here, 'index.tpl.html'), encoding='utf8').read()
data = json.dumps(tabs, ensure_ascii=False).replace('</', '<\\/')
open(os.path.join(here, 'index.html'), 'w', encoding='utf8').write(tpl.replace('/*__TABS__*/[]', data))
print(f'{len(tabs)} hubs: ' + ', '.join(t['slug'] for t in tabs))
