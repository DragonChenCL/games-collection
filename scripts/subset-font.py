"""Regenerate the shared UI font: python3 scripts/subset-font.py /path/to/NotoSerifSC.ttf"""
import sys
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

root = Path(__file__).resolve().parent.parent
sources = [root / 'index.html', *[p for p in (root / 'games/qingming').rglob('*') if p.suffix in {'.js', '.css', '.html', '.svg'}]]
text = ''.join(p.read_text() for p in sources)
font = TTFont(sys.argv[1])
missing = {c for c in text if '\u4e00' <= c <= '\u9fff' and ord(c) not in font.getBestCmap()}
if missing:
    raise ValueError('Source font lacks Chinese glyphs: ' + ''.join(sorted(missing)))
options = subset.Options()
options.hinting = False
options.layout_features = []
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=text)
subsetter.subset(font)
if 'fvar' in font:
    instantiateVariableFont(font, {'wght': 400}, inplace=True)
font.flavor = 'woff2'
target = root / 'games/qingming/src/song.woff2'
font.save(target)
print(f'{target.name}: {target.stat().st_size:,} bytes, {len(font.getBestCmap())} glyphs')
