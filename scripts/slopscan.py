#!/usr/bin/env python3
"""Compte les signes « fait par IA » dans le code (heuristique simple, relançable). Usage : python3 scripts/slopscan.py"""
import re, sys, pathlib
SIGNS = {
 'sur-titres/pastilles (.eyebrow, tracking large)': r'class="[^"]*\beyebrow\b|tracking-\[0\.(1[0-9]|2)em\]',
 'halos / flous décoratifs (blur-xl, radial-gradient, glow)': r'blur-(xl|2xl|3xl)|radial-gradient|data-play-glow|glow',
 'dégradés décoratifs (bg-gradient-to)': r'bg-gradient-to-',
 'effet brillant sur texte (ShinyText)': r'<ShinyText',
 'plusieurs accents (hot / amber / cyan hors erreurs)': r'bg-hot|text-hot|bg-amber|text-amber|text-cyan|bg-cyan|text-sky|text-blue',
 'verre dépoli (glass / backdrop-blur)': r'\bglass\b|backdrop-blur',
 'rayons de coins hors échelle (≠ 20 px / 12 px)': r'rounded-\[(?!20px\])\d+px\]',
 'slogans/phrases génériques': r'Envie de quoi ce soir|Tous tes jeux\. Un seul endroit|Astuce :|en vrai logiciel|Chill|Adrénaline|Avec des potes',
 'animations « tic » (Magnet, SplitText sur chaque titre)': r'<Magnet|<SplitText|<BlurText',
 'cartes (classe .card / SpotlightCard)': r'class="[^"]*\bcard\b|<SpotlightCard',
}
files = [p for p in pathlib.Path('src').rglob('*') if p.suffix in ('.vue', '.css', '.js') and 'data' not in p.parts]
files += [pathlib.Path('index.html')]
total, rows = 0, []
for name, rx in SIGNS.items():
    n = 0; where = {}
    for f in files:
        c = len(re.findall(rx, f.read_text(errors='ignore')))
        if c: where[f.name] = c; n += c
    rows.append((name, n, where)); total += n
for name, n, where in rows:
    top = ', '.join(f'{k}×{v}' for k, v in sorted(where.items(), key=lambda x: -x[1])[:4])
    print(f'{n:4d}  {name}   [{top}]')
print(f'\nSCORE = {total}  (plus bas = moins de signes)')
