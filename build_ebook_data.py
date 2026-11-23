import os
import sys
import json
import time
import re
import xml.etree.ElementTree as ET
from pathlib import Path

def get_text(elem):
    if elem is None:
        return ''
    return ''.join(elem.itertext()).strip()

def clean_title_and_nemod(title_elem):
    if title_elem is None:
        return '', ''
    nemod_elem = title_elem.find('nemod')
    nemod = ''
    if nemod_elem is not None:
        nemod = (nemod_elem.text or '').strip()
    title = (title_elem.text or '').strip()
    if not title:
        title = get_text(title_elem)
        if nemod and nemod in title:
            title = title.replace(nemod, '').strip()
    return title, nemod

def extract_notes_from_parent(elem):
    notes_data = {}
    note_tags = [
        'includes', 'inclusionTerm', 'excludes1', 'excludes2',
        'codeFirst', 'codeAlso', 'useAdditionalCode', 'notes',
        'sevenChrNote'
    ]
    for tag in note_tags:
        items = []
        for container in elem.findall(tag):
            for n in container.findall('note'):
                t = get_text(n)
                if t:
                    items.append(t)
            if not items and container.text and container.text.strip():
                items.append(get_text(container))
        if items:
            notes_data[tag] = items

    seven_def = elem.find('sevenChrDef')
    if seven_def is not None:
        extensions = []
        for ext in seven_def.findall('extension'):
            char = ext.attrib.get('char', '').strip()
            desc = get_text(ext)
            if char:
                extensions.append({'char': char, 'desc': desc})
        notes = [get_text(n) for n in seven_def.findall('note') if get_text(n)]
        notes_data['sevenChrDef'] = {
            'extensions': extensions,
            'notes': notes
        }

    return notes_data

def parse_diag_tree(diag_elem, inherited_seven_def=None, inherited_seven_note=None, depth=0):
    code = diag_elem.findtext('name', '').strip()
    desc = diag_elem.findtext('desc', '').strip()
    placeholder = diag_elem.attrib.get('placeholder') == 'true'

    notes_data = extract_notes_from_parent(diag_elem)

    active_seven_def = notes_data.get('sevenChrDef') or inherited_seven_def
    active_seven_note = notes_data.get('sevenChrNote') or inherited_seven_note

    child_diags = diag_elem.findall('diag')
    is_leaf = len(child_diags) == 0

    clean_code = code.replace('.', '')
    requires_7th = bool(active_seven_def and active_seven_def.get('extensions')) and len(clean_code) < 7

    node = {
        'code': code,
        'desc': desc,
        'placeholder': placeholder,
        'is_leaf': is_leaf,
        'level': depth,
        'requires_7th': requires_7th
    }

    for k, v in notes_data.items():
        if k != 'sevenChrDef':
            node[k] = v
        else:
            node['sevenChrDef'] = v

    if active_seven_def and 'sevenChrDef' not in node and requires_7th:
        node['sevenChrDef'] = active_seven_def

    if child_diags:
        node['children'] = [
            parse_diag_tree(c, active_seven_def, active_seven_note, depth + 1)
            for c in child_diags
        ]

    return node

def flatten_for_search(node, block_id, chapter_num, search_list):
    search_list.append({
        'code': node['code'],
        'desc': node['desc'],
        'block_id': block_id,
        'chapter': chapter_num,
        'is_leaf': 1 if node['is_leaf'] else 0,
        'requires_7th': 1 if node.get('requires_7th') else 0
    })
    for child in node.get('children', []):
        flatten_for_search(child, block_id, chapter_num, search_list)

def parse_index_term(elem, level=0):
    title, nemod = clean_title_and_nemod(elem.find('title'))
    code = get_text(elem.find('code'))
    see = get_text(elem.find('see'))
    see_also = get_text(elem.find('seeAlso'))
    seecat = get_text(elem.find('seecat'))
    subcat = get_text(elem.find('subcat'))
    manif = get_text(elem.find('manif'))

    item = {'title': title, 'level': level}
    if nemod: item['nemod'] = nemod
    if code: item['code'] = code
    if see: item['see'] = see
    if see_also: item['seeAlso'] = see_also
    if seecat: item['seecat'] = seecat
    if subcat: item['subcat'] = subcat
    if manif: item['manif'] = manif

    child_terms = elem.findall('term')
    if child_terms:
        item['terms'] = [
            parse_index_term(t, int(t.attrib.get('level', level + 1)))
            for t in child_terms
        ]
    return item

def parse_table_terms(elem, level=0, letter=''):
    rows = []
    title, nemod = clean_title_and_nemod(elem.find('title'))
    cells = [get_text(c) for c in elem.findall('cell')]
    see = get_text(elem.find('see'))
    see_also = get_text(elem.find('seeAlso'))

    row = {'title': title, 'level': level}
    if nemod: row['nemod'] = nemod
    if letter: row['letter'] = letter
    if cells: row['cells'] = cells
    if see: row['see'] = see
    if see_also: row['seeAlso'] = see_also
    rows.append(row)

    for child in elem.findall('term'):
        child_level = int(child.attrib.get('level', level + 1))
        rows.extend(parse_table_terms(child, child_level, letter))
    return rows

def find_xml_dir():
    candidates = [
        Path(r'E:\icd10cm-table-and-index-2027\icd10cm-table-and-index-2027'),
        Path(r'E:\icd10cm-table-and-index-2027\Ebook\icd10cm-table-and-index-2027'),
        Path('./icd10cm-table-and-index-2027')
    ]
    for c in candidates:
        if c.exists() and (c / 'icd10cm-index-2027.xml').exists():
            return c
    raise FileNotFoundError("Could not locate XML directory")

def main():
    start_time = time.time()
    xml_dir = find_xml_dir()
    print(f"Loading official XML files from: {xml_dir}")

    output_dir = Path('./public/data')
    blocks_dir = output_dir / 'blocks'
    index_dir = output_dir / 'index'
    eindex_dir = output_dir / 'eindex'
    tables_dir = output_dir / 'tables'

    for d in [blocks_dir, index_dir, eindex_dir, tables_dir]:
        d.mkdir(parents=True, exist_ok=True)

    tabular_xml_name = 'icd10cm-tabular_-2027.xml'
    if not (xml_dir / tabular_xml_name).exists():
        tabular_xml_name = 'icd10cm-tabular-2027.xml'
    tabular_path = xml_dir / tabular_xml_name
    print(f"Parsing Tabular XML: {tabular_path}")

    tab_tree = ET.parse(tabular_path)
    tab_root = tab_tree.getroot()

    chapters_toc = []
    search_index = []
    all_blocks_meta = []

    chapters = tab_root.findall('chapter')
    print(f"Found {len(chapters)} Chapters in Tabular XML.")

    for ch_idx, ch in enumerate(chapters, start=1):
        ch_num = ch.findtext('name', str(ch_idx)).strip()
        ch_desc = ch.findtext('desc', '').strip()
        ch_notes = extract_notes_from_parent(ch)

        ch_sections = ch.findall('section')
        sections_meta = []

        m = re.search(r'\(([A-Z0-9]+-[A-Z0-9]+)\)', ch_desc)
        code_range = m.group(1) if m else ''

        for sec in ch_sections:
            sec_id = sec.attrib.get('id', '').strip()
            sec_desc = sec.findtext('desc', '').strip()
            sec_notes = extract_notes_from_parent(sec)

            diag_categories = []
            block_diags = []

            for d in sec.findall('diag'):
                parsed_diag = parse_diag_tree(d)
                block_diags.append(parsed_diag)
                diag_categories.append({
                    'code': parsed_diag['code'],
                    'desc': parsed_diag['desc']
                })
                flatten_for_search(parsed_diag, sec_id, ch_num, search_index)

            sec_first = diag_categories[0]['code'] if diag_categories else ''
            sec_last = diag_categories[-1]['code'] if diag_categories else ''

            sec_info = {
                'id': sec_id,
                'desc': sec_desc,
                'first': sec_first,
                'last': sec_last,
                'categories': diag_categories
            }
            sections_meta.append(sec_info)
            all_blocks_meta.append({
                'id': sec_id,
                'desc': sec_desc,
                'chapter_num': ch_num,
                'chapter_desc': ch_desc
            })

            block_payload = {
                'id': sec_id,
                'desc': sec_desc,
                'chapter_num': ch_num,
                'chapter_desc': ch_desc,
                'notes': sec_notes,
                'diags': block_diags
            }
            block_file = blocks_dir / f"{sec_id}.json"
            with open(block_file, 'w', encoding='utf-8') as f:
                json.dump(block_payload, f, separators=(',', ':'))

        chapters_toc.append({
            'num': ch_num,
            'desc': ch_desc,
            'code_range': code_range,
            'notes': ch_notes,
            'sections': sections_meta
        })

    print(f"Generated {len(all_blocks_meta)} tabular block JSON files.")

    print("Parsing Alphabetic Index (icd10cm-index-2027.xml)...")
    idx_path = xml_dir / 'icd10cm-index-2027.xml'
    idx_tree = ET.parse(idx_path)
    idx_root = idx_tree.getroot()
    index_meta = {'letters': [], 'counts': {}}

    for l in idx_root.findall('letter'):
        letter_title = l.findtext('title', '').strip()
        if not letter_title:
            continue
        mterms = [parse_index_term(m, 0) for m in l.findall('mainTerm')]
        index_meta['letters'].append(letter_title)
        index_meta['counts'][letter_title] = len(mterms)

        with open(index_dir / f"{letter_title}.json", 'w', encoding='utf-8') as f:
            json.dump({'letter': letter_title, 'terms': mterms}, f, separators=(',', ':'))

    print(f"Generated {len(index_meta['letters'])} Alphabetic Index letter files.")

    print("Parsing External Cause Index (icd10cm-eindex-2027.xml)...")
    eidx_path = xml_dir / 'icd10cm-eindex-2027.xml'
    eidx_tree = ET.parse(eidx_path)
    eidx_root = eidx_tree.getroot()
    eindex_meta = {'letters': [], 'counts': {}}

    for l in eidx_root.findall('letter'):
        letter_title = l.findtext('title', '').strip()
        if not letter_title:
            continue
        mterms = [parse_index_term(m, 0) for m in l.findall('mainTerm')]
        eindex_meta['letters'].append(letter_title)
        eindex_meta['counts'][letter_title] = len(mterms)

        with open(eindex_dir / f"{letter_title}.json", 'w', encoding='utf-8') as f:
            json.dump({'letter': letter_title, 'terms': mterms}, f, separators=(',', ':'))

    print(f"Generated {len(eindex_meta['letters'])} External Cause Index letter files.")

    print("Parsing Neoplasm Table (icd10cm-neoplasm-2027.xml)...")
    neo_path = xml_dir / 'icd10cm-neoplasm-2027.xml'
    neo_tree = ET.parse(neo_path)
    neo_root = neo_tree.getroot()

    neo_heading = neo_root.find('indexHeading')
    neo_headers = [get_text(h) for h in neo_heading.findall('head')] if neo_heading is not None else []
    neo_rows = []
    neo_letter = neo_root.find('letter')
    if neo_letter is not None:
        neo_main = neo_letter.find('mainTerm')
        if neo_main is not None:
            neo_rows = parse_table_terms(neo_main, 0)

    with open(tables_dir / 'neoplasm.json', 'w', encoding='utf-8') as f:
        json.dump({
            'title': 'Table of Neoplasms',
            'headers': neo_headers,
            'rows': neo_rows
        }, f, separators=(',', ':'))

    print(f"Generated Neoplasm table with {len(neo_rows)} rows.")

    print("Parsing Drug & Chemical Table (icd10cm-drug-2027.xml)...")
    drug_path = xml_dir / 'icd10cm-drug-2027.xml'
    drug_tree = ET.parse(drug_path)
    drug_root = drug_tree.getroot()

    drug_heading = drug_root.find('indexHeading')
    drug_headers = [get_text(h) for h in drug_heading.findall('head')] if drug_heading is not None else []
    drug_rows = []
    drug_letters = []

    for l in drug_root.findall('letter'):
        letter_title = l.findtext('title', '').strip()
        if letter_title:
            drug_letters.append(letter_title)
        for m in l.findall('mainTerm'):
            drug_rows.extend(parse_table_terms(m, 0, letter_title))

    with open(tables_dir / 'drugs.json', 'w', encoding='utf-8') as f:
        json.dump({
            'title': 'Table of Drugs and Chemicals',
            'headers': drug_headers,
            'letters': drug_letters,
            'rows': drug_rows
        }, f, separators=(',', ':'))

    print(f"Generated Drug table with {len(drug_rows)} rows across {len(drug_letters)} sections.")

    toc_payload = {
        'version': '2027',
        'title': 'ICD-10-CM 2027 Official Digital Codebook',
        'chapters': chapters_toc,
        'blocks': all_blocks_meta,
        'index': index_meta,
        'eindex': eindex_meta,
        'tables': {
            'neoplasm': {'title': 'Table of Neoplasms', 'rows': len(neo_rows)},
            'drugs': {'title': 'Table of Drugs and Chemicals', 'rows': len(drug_rows), 'letters': drug_letters}
        }
    }
    with open(output_dir / 'toc.json', 'w', encoding='utf-8') as f:
        json.dump(toc_payload, f, separators=(',', ':'))
    print("Generated toc.json.")

    with open(output_dir / 'search_index.json', 'w', encoding='utf-8') as f:
        json.dump(search_index, f, separators=(',', ':'))
    print(f"Generated search_index.json with {len(search_index)} searchable codes.")

    elapsed = time.time() - start_time
    print(f"\nETL completed successfully in {elapsed:.2f} seconds.")

if __name__ == '__main__':
    main()
