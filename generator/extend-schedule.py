from copy import deepcopy
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from lxml import etree as E

path = Path(__file__).resolve().parent.parent / 'insolvency/stat-demand-and-supporting-affidavit.docx'
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(path) as z:
    files = {i.filename: z.read(i.filename) for i in z.infolist()}
root = E.fromstring(files['word/document.xml'])
if b'{costs_description}' not in files['word/document.xml']:
    table = next(t for t in root.findall('.//w:tbl', ns) if '{invoice1_description}' in ''.join(t.itertext()))
    row = deepcopy(table.find('w:tr', ns))
    for cell, key in zip(row.findall('w:tc', ns), ['costs_description', 'costs_amount_display']):
        paragraph = deepcopy(cell.find('w:p', ns))
        for child in list(paragraph):
            if child.tag != '{%s}pPr' % ns['w']:
                paragraph.remove(child)
        run = E.SubElement(paragraph, '{%s}r' % ns['w'])
        E.SubElement(run, '{%s}t' % ns['w']).text = '{' + key + '}'
        for child in list(cell):
            if child.tag != '{%s}tcPr' % ns['w']:
                cell.remove(child)
        cell.append(paragraph)
    table.insert(1 + list(table).index(table.find('w:tr', ns)), row)
    files['word/document.xml'] = E.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
    with ZipFile(path, 'w', ZIP_DEFLATED) as z:
        for name, content in files.items():
            z.writestr(name, content)
