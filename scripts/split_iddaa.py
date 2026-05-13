import json, os

data = json.load(open('C:/Users/AyberkEylülKemal/Desktop/TahminApp/oddsy-data/oran data/iddaagecmis.json', 'r', encoding='utf-8'))

leagues = {}
for d in data:
    lig = d.get('Lig', 'Bilinmeyen')
    if lig not in leagues:
        leagues[lig] = []
    leagues[lig].append(d)

out_dir = 'C:/Users/AyberkEylülKemal/Desktop/TahminApp/oddsy-data/iddaa_ligler_json'
os.makedirs(out_dir, exist_ok=True)

for lig, matches in leagues.items():
    safe_name = lig.replace('/', '_').replace('\\', '_')
    filepath = os.path.join(out_dir, f'{safe_name}.json')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(matches, f, ensure_ascii=False)
    print(f'{len(matches):>6} | {safe_name}.json')

print(f'\nToplam {len(leagues)} dosya oluşturuldu -> {out_dir}')
