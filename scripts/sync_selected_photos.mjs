import {readdirSync,readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
export function syncSelectedPhotos(){
 const source=path.join(root,'selected_nomad_objects'),out=path.join(root,'public/nomad-inset');
 if(!existsSync(source))throw new Error('Missing selected_nomad_objects folder');
 const classes={'merchant-ship':'Merchant ship',ferry:'Ferry',tug:'Tug','commercial-fishing-boat':'Commercial fishing boat',sailboat:'Sailboat','personal-watercraft':'Personal watercraft','kayak-canoe':'Kayak / canoe',buoy:'Buoy',lighthouse:'Lighthouse',law_enforcement:'Law enforcement',bird:'Bird','wind-turbine':'Wind turbine',channel_marker:'Channel marker',regulatory_marker:'Regulatory mark',safe_water_marker:'Safe-water marker'};
 const previous=existsSync(path.join(out,'manifest.json'))?JSON.parse(readFileSync(path.join(out,'manifest.json'),'utf8')):[];
 const groups=Object.entries(classes).map(([slug,className])=>{
  const directory=path.join(source,slug);
  const metadataPath=path.join(directory,'photos.json');
  const metadata=existsSync(metadataPath)?JSON.parse(readFileSync(metadataPath,'utf8')):{};
  const photos=(existsSync(directory)?readdirSync(directory):[]).filter(f=>/\.(png|jpe?g|webp)$/i.test(f)).sort().map(name=>{
   const input=path.join(directory,name),hash=createHash('sha256').update(readFileSync(input)).digest('hex');
   const selectedFile=slug+'/'+name;
   const cached=previous.flatMap(g=>g.photos).find(p=>p.selectedFile===selectedFile&&p.sourceHash===hash&&existsSync(path.join(root,'public',p.file)));
   if(cached)return {...cached,...metadata[name]};
   const file='nomad-inset/'+slug+'/'+hash.slice(0,16)+path.extname(name).toLowerCase();
   mkdirSync(path.dirname(path.join(root,'public',file)),{recursive:true});copyFileSync(input,path.join(root,'public',file));
   return {file,crop:[0,0,1,1],...metadata[name],selectedFile,sourceHash:hash};
  });
  return {className,slug,photos};
 });
 mkdirSync(out,{recursive:true});writeFileSync(path.join(out,'manifest.json'),JSON.stringify(groups,null,2)+'\n');
 const active=groups.filter(g=>g.photos.length>0).map(g=>g.className);
 const config=path.join(root,'src/selected-classes.js'),content='// Generated from selected_nomad_objects by sync_selected_photos.mjs.\nexport const SELECTED_CLASSES='+JSON.stringify(active)+';\n';
 if(!existsSync(config)||readFileSync(config,'utf8')!==content)writeFileSync(config,content);
 return groups;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log('Synced',syncSelectedPhotos().reduce((n,g)=>n+g.photos.length,0),'selected photos');
