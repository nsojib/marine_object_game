"""Fetch five licensed Commons reference photographs for each game class.
Requires Pillow only for reducing images to browser-sized WebP files.
"""
import concurrent.futures, html, io, json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public'/'reference-photos'
OUT.mkdir(parents=True,exist_ok=True)
CLASSES=[('Merchant ship','merchant-ship','container ship'),('Ferry','ferry','passenger ferry ship'),('Tug','tug','tugboat'),('Barge','barge','cargo barge'),('Dredger','dredger','dredger ship'),('Commercial fishing boat','fishing-boat','fishing trawler boat'),('Pleasure craft','pleasure-craft','motor yacht'),('Sailboat','sailboat','sailing yacht'),('Personal watercraft','personal-watercraft','jet ski watercraft'),('Kayak / canoe','kayak-canoe','kayak canoe paddling'),('Buoy','buoy','navigation buoy sea'),('Lighthouse','lighthouse','lighthouse coast'),('Wind turbine','wind-turbine','offshore wind turbine')]
overrides={'tug':'intitle:tugboat -Ottman','buoy':'intitle:buoy navigation -intitle:sea -intitle:esplanade -intitle:colwyn','sailboat':'intitle:sailboat sailing water','personal-watercraft':'intitle:jetski watercraft','lighthouse':'intitle:lighthouse -intitle:coast -intitle:path -intitle:near','wind-turbine':'offshore wind farm turbines','fishing-boat':'fishing vessel trawler','kayak-canoe':'kayak paddling water'}
CLASSES=[(n,s,overrides.get(s,q)) for n,s,q in CLASSES]
existing={g['slug']:g for g in json.loads((OUT/'manifest.json').read_text(encoding='utf8'))} if (OUT/'manifest.json').exists() else {}
CURATED={'merchant-ship': ['2021-11-19 Damaged container ship, MV ZIM KINGSTON - IMO 9389693.jpg', 'MSC HARMONY III (container ship, 2006) in Port Koper (SIKOP, 2024).jpg', 'Container ship in Kronstadt.jpg', 'Container ship exiting Mombasa port.jpg', 'Container ship exiting Mombasa port, Kenya 01.jpg'], 'ferry': ['Liinsand F Hamburg 09-05-2202 (1).jpg', 'MV Renfrew Rose.jpg', 'MS S Andrea.jpg', 'Tyne Passenger Ferry - geograph.org.uk - 590504.jpg', 'Liinsand F Hamburg 09-05-2202 (2).jpg'], 'tug': ['2025-05-24 01 Tugboat, CHARLES H. CATES IV - MMSI 316005724.jpg', 'Comet Tugboat at Mississippi River, New Orleans; September 2019.jpg', 'Jerry G. Tugboat (49923773377).jpg', 'Sentosa (tugboat, 2001) - Lekhaven - Port of Rotterdam - moored - 2019 - pic1.jpg', 'Tugboat Crosby Skipper.jpg'], 'barge': ['Liquid Cargo Barge Novum.JPG', 'Yangzhou-Modern-Grand-Canal-barge-3358.JPG', 'Cargo barge on the Aire and Calder Navigation Canal - geograph.org.uk - 7114926.jpg', 'Tankmotorschiff Stanley.JPG', 'Tankmotorschiff Dettmer Tank 130.JPG'], 'dredger': ['Alexander von Humboldt (empty).jpg', '2022-10-06 01 Dredger PROVINCIA DE EL ORO NO I, III & IV.jpg', 'Sudging dredger Tuk87-47-10.jpg', '1987 sucker-dredger Beaufort Sea.jpg', 'ENI 03802628 - Electrically-powered dredger - Statensingel - Blijdorp - Noord - Rotterdam - 2024 - pic3.jpg'], 'fishing-boat': ['Colby Lee Fishing Vessel Docked in Salmon Harbor Marina.jpg', 'Fishing Vessels Docked in Early May at Salmon Harbor Marina.jpg', 'Docked Fishing Vessels Ready for Action in Salmon Harbor Marina.jpg', 'Cap Eliza & Mystic Fishing Vessels in Salmon Harbor Marina.jpg', 'Deep Sea Fishing Vessels Docked at Salmon Harbor Marina.jpg'], 'pleasure-craft': ['Lady Lau super-yacht IMO 1010674 Bonifacio.jpg', "Motor yacht 'Davina' in Sozopol port.jpg", 'Paradiso Yacht Near Newport Beach.jpg', 'Triplete, Zadar (P1080748).jpg', 'Motor Yacht in Ocean Reef Bay Freeport Grand Bahama.jpg'], 'sailboat': ['City tour, Nacka ( 1090796).jpg', 'Express 27 sailboat Aqua-Pensee 1341.jpg', 'Sailboats on Zaslavl Water Reservoir 6 September 2014.jpg', 'Sailing boat at sunset, Ionian Sea, Albania.jpg', 'Sailing on Lake Constance (1X7A9998).jpg'], 'personal-watercraft': ['JetSki.jpg', 'Jet Ski Dolphin Tours Lagoon Pontoons.jpg', 'Jet Ski Race Coordination (48919265422).jpg', 'Jetboot Jetski DM 2007 Krautsand 2.jpg', 'Zwei Jetski auf der Adria bei Istrien, 2023.jpg'], 'kayak-canoe': ['Greenland kayak seal hunter 2006.jpg', 'Man kayaking on a lake.jpg', 'Sea Kayak.JPG', 'Sea Kayak Kealakekua.jpg', 'Sea Kayakers Lake Michigan Wisconsin.JPG'], 'buoy': ['Navigation Buoy.jpg', 'USCG 55 foot aid to navigation vessel and buoy.jpg', '750mm Navigation Buoy.jpg', '750mm Navigation Buoy with Marine Lantern.jpg', 'Kaliningrad - World Ocean Museum - Navigation Buoys.jpg'], 'lighthouse': ['Chanonry Lighthouse.JPG', 'Lighthouse at the Island of Texel (NL) (48693778228).jpg', 'Louisbourg lighthouse.jpg', 'Peggys Cove - NS - Leuchtturm.jpg', 'Portland-Head-Lighthouse.jpg'], 'wind-turbine': ['Barrow Offshore wind turbines NR.jpg', 'Block Island offshore wind farm P6290638m.jpg', 'European Offshore Wind Deployment Centre (from Newburgh beach).jpg', 'Middelgrunden wind farm 2009-07-01 edit filtered.jpg', 'Offshore wind farms photographed at the Port of Noshiro, at sunset 20220728.jpg']}
UA='MarineObjectGame/1.0 (educational game reference photos; github.com/nsojib/marine_object_game)'
def get(url):
 for attempt in range(4):
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':UA}),timeout=45) as r:return r.read()
  except Exception:
   if attempt==3:raise
   time.sleep(2*(attempt+1))
def clean(s):return html.unescape(re.sub('<[^>]+>','',s)).strip()
def collect(entry):
 name,slug,query=entry
 if len(sys.argv)>1 and slug not in sys.argv[1:] and slug in existing:return existing[slug]
 records=[];directory=OUT/slug;directory.mkdir(exist_ok=True)
 params={'action':'query','format':'json','generator':'search','gsrsearch':query+' filetype:bitmap -drawing -painting -model -diagram -geograph -icon -flag -shipwreck -sunken','gsrnamespace':6,'gsrlimit':35,'prop':'imageinfo','iiprop':'url|extmetadata|size|mime','iiurlwidth':960}
 if slug in CURATED:
  params={k:v for k,v in params.items() if not k.startswith('gsr') and k!='generator'}
  params['titles']='|'.join('File:'+t for t in CURATED[slug])
 data=json.loads(get('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params)))
 for p in sorted(data.get('query',{}).get('pages',{}).values(),key=lambda x:x.get('index',99)):
  info=p.get('imageinfo',[{}])[0];meta=info.get('extmetadata',{});val=lambda k:clean(str(meta.get(k,{}).get('value','')))
  license=val('LicenseShortName');licenseurl=val('LicenseUrl')
  if not (license.startswith(('CC BY','CC0')) or license=='Public domain'):continue
  if 'NC' in license or 'ND' in license:continue
  if info.get('mime') not in ['image/jpeg','image/png']:continue
  if info.get('width',0)<500 or info.get('height',0)<300:continue
  title=p['title'];low=title.lower()
  if any(word in low for word in ['model','drawing','painting','diagram','logo','stamp','map of','interior','flag','icon','potential','parts','eb1911','shipwreck','sunken','livery','canada.png']):continue
  if not info.get('thumburl'):continue
  try:
   image=ImageOps.exif_transpose(Image.open(io.BytesIO(get(info['thumburl'])))).convert('RGB')
   image.thumbnail((800,600))
   filename=f'{len(records)+1:02}.webp';image.save(directory/filename,'WEBP',quality=82,method=6)
   records.append({'file':f'reference-photos/{slug}/{filename}','title':title.removeprefix('File:'),'author':val('Artist'),'license':license,'licenseUrl':licenseurl or 'https://creativecommons.org/publicdomain/mark/1.0/','source':info['descriptionurl'],'original':info['url'].split('?')[0],'description':val('ImageDescription'),'modifications':'Resized and converted to WebP; no semantic edits.'})
   print(f'{slug} {len(records)}/5: {title}',flush=True)
   if len(records)==5:break
  except Exception as e: print(f'Skipping {title}: {e}',flush=True)
 if len(records)!=5:raise RuntimeError(f'{name}: only {len(records)} reusable photos')
 return {'className':name,'slug':slug,'photos':records}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool: groups=list(pool.map(collect,CLASSES))
(OUT/'manifest.json').write_text(json.dumps(groups,ensure_ascii=False,indent=2),encoding='utf8')
lines=['# Reference photograph credits','','These 65 real photographs are bundled locally for the game inset. Each image retains its individual license. Resizing and WebP conversion are the only modifications. CC BY-SA images remain available under their listed license.','']
for group in groups:
 lines+=['## '+group['className'],'']
 for photo in group['photos']:lines += [f"- [{photo['title']}]({photo['source']}) — {photo['author']}. [{photo['license']}]({photo['licenseUrl']}). Local file: `{photo['file']}`."]
 lines+=['']
(ROOT/'PHOTO-CREDITS.md').write_text('\n'.join(lines),encoding='utf8')
qa=ROOT/'.runtime'/'photo-review';qa.mkdir(parents=True,exist_ok=True)
for group in groups:
 sheet=Image.new('RGB',(1000,420),'white');draw=ImageDraw.Draw(sheet)
 for i,photo in enumerate(group['photos']):
  im=Image.open(ROOT/'public'/photo['file']);im.thumbnail((320,175));x=(i%3)*333;y=(i//3)*210
  sheet.paste(im,(x,y+20));draw.text((x+4,y+3),f"{i+1}: {group['className']}",fill='black')
 sheet.save(qa/(group['slug']+'.jpg'))
print('COMPLETE: 65 photos, manifest, credits and review sheets.',flush=True)


