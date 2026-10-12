from copy import deepcopy
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from lxml import etree as E

path = Path(__file__).resolve().parent.parent / 'insolvency/stat-demand-and-supporting-affidavit.docx'
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(path) as z:
    files = {i.filename: z.read(i.filename) for i in z.infolist()}
root = E.fromstring(files['word/document.xml'])
def tag(name):
    return '{%s}%s' % (ns['w'], name)

table = next(t for t in root.findall('.//w:tbl', ns) if '{invoice1_description}' in ''.join(t.itertext()))
rows = [r for r in table.findall('w:tr', ns) if any(k in ''.join(r.itertext()) for k in ('{invoice', '{costs_description}'))]
prototype = deepcopy(rows[0])
insert_at = list(table).index(rows[0])
for row in rows:
    table.remove(row)

# Separate physical rows keep each description aligned with its own amount.
keys = [('invoice%d_description' % n, 'invoice%d_amount_display' % n) for n in range(1, 4)]
keys.append(('costs_description', 'costs_amount_display'))
for offset, pair in enumerate(keys):
    row = deepcopy(prototype)
    row.attrib.clear()
    properties = row.find('w:trPr', ns)
    if properties is not None:
        row.remove(properties)
    for column, (cell, key) in enumerate(zip(row.findall('w:tc', ns), pair)):
        for child in list(cell):
            if child.tag != tag('tcPr'):
                cell.remove(child)
        p = E.SubElement(cell, tag('p'))
        props = E.SubElement(p, tag('pPr'))
        E.SubElement(props, tag('spacing'), {tag('after'): '120'})
        E.SubElement(props, tag('jc'), {tag('val'): 'right' if column else 'left'})
        run = E.SubElement(p, tag('r'))
        style = E.SubElement(run, tag('rPr'))
        E.SubElement(style, tag('sz'), {tag('val'): '22'})
        E.SubElement(style, tag('highlight'), {tag('val'): 'yellow'})
        E.SubElement(run, tag('t')).text = '{' + key + '}'
    table.insert(insert_at + offset, row)
files['word/document.xml'] = E.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
with ZipFile(path, 'w', ZIP_DEFLATED) as z:
    for name, content in files.items():
        z.writestr(name, content)
