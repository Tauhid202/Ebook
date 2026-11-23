import urllib.request
import json
import sys

base = 'http://127.0.0.1:5173'

def run():
    print("Starting Comprehensive ICD-10-CM 2027 System Verification...\n")

    # 1. Test index HTML
    with urllib.request.urlopen(f'{base}/') as res:
        html = res.read().decode('utf-8')
        assert res.status == 200
        assert 'ICD-10-CM 2027 Interactive Digital Codebook' in html
        print("✓ [1/8] Web Reader Root HTML loaded successfully (Status 200)")

    # 2. Test TOC
    with urllib.request.urlopen(f'{base}/data/toc.json') as res:
        toc = json.loads(res.read().decode('utf-8'))
        assert len(toc['chapters']) == 22
        assert len(toc['blocks']) == 297
        assert 'neoplasm' in toc['tables']
        assert 'drugs' in toc['tables']
        print(f"✓ [2/8] Navigation TOC verified (22 Chapters, {len(toc['blocks'])} Sections, {len(toc['index']['letters'])} Index Letters)")

    # 3. Test Chapter 4 & Block E08-E13 (Diabetes)
    with urllib.request.urlopen(f'{base}/data/blocks/E08-E13.json') as res:
        block = json.loads(res.read().decode('utf-8'))
        assert block['id'] == 'E08-E13'
        e11 = next(d for d in block['diags'] if d['code'] == 'E11')
        assert e11['desc'] == 'Type 2 diabetes mellitus'
        assert 'excludes1' in e11
        assert 'includes' in e11
        assert 'useAdditionalCode' in e11
        e11_9 = next(d for d in e11['children'] if d['code'] == 'E11.9')
        assert e11_9['desc'] == 'Type 2 diabetes mellitus without complications'
        assert e11_9['is_leaf'] is True
        print(f"✓ [3/8] Tabular Section E08-E13 (Diabetes) verified with deep hierarchy & instructional notes")

    # 4. Test Search Index
    with urllib.request.urlopen(f'{base}/data/search_index.json') as res:
        sidx = json.loads(res.read().decode('utf-8'))
        assert len(sidx) >= 47000
        e11_9_match = [item for item in sidx if item['code'] == 'E11.9']
        assert len(e11_9_match) == 1
        assert e11_9_match[0]['block_id'] == 'E08-E13'
        print(f"✓ [4/8] Instant Search Index verified ({len(sidx)} indexed codes, E11.9 -> {e11_9_match[0]['block_id']})")

    # 5. Test Alphabetic Index letter D
    with urllib.request.urlopen(f'{base}/data/index/D.json') as res:
        idx_d = json.loads(res.read().decode('utf-8'))
        assert idx_d['letter'] == 'D'
        diabetes_term = next(t for t in idx_d['terms'] if 'Diabetes' in t['title'])
        assert diabetes_term['code'] == 'E11.9'
        print(f"✓ [5/8] Alphabetic Index verified (Letter D, '{diabetes_term['title']}' -> {diabetes_term['code']})")

    # 6. Test Neoplasm Table
    with urllib.request.urlopen(f'{base}/data/tables/neoplasm.json') as res:
        neo = json.loads(res.read().decode('utf-8'))
        assert len(neo['headers']) == 7
        assert len(neo['rows']) == 1940
        print(f"✓ [6/8] Neoplasm Table verified (7 columns, {len(neo['rows'])} rows)")

    # 7. Test Table of Drugs & Chemicals
    with urllib.request.urlopen(f'{base}/data/tables/drugs.json') as res:
        drugs = json.loads(res.read().decode('utf-8'))
        assert len(drugs['headers']) == 7
        assert len(drugs['rows']) == 7436
        print(f"✓ [7/8] Table of Drugs & Chemicals verified (7 columns, {len(drugs['rows'])} rows, {len(drugs['letters'])} sections)")

    # 8. Test Injury block S00-S09 with 7th character extensions
    with urllib.request.urlopen(f'{base}/data/blocks/S00-S09.json') as res:
        s_block = json.loads(res.read().decode('utf-8'))
        s02 = next(d for d in s_block['diags'] if d['code'] == 'S02')
        assert s02['sevenChrDef'] is not None
        assert len(s02['sevenChrDef']['extensions']) >= 6
        s02_0 = s02['children'][0]
        assert s02_0['requires_7th'] is True
        print(f"✓ [8/8] 7th Character Extension Matrix verified on Category S02 ({len(s02['sevenChrDef']['extensions'])} extensions)")

    print("\n=======================================================")
    print("ALL 8 VERIFICATION CHECKS PASSED WITH 100% SUCCESS!")
    print("=======================================================")

if __name__ == '__main__':
    run()
