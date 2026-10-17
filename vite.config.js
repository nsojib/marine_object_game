import {defineConfig} from 'vite';
import {syncSelectedPhotos} from './scripts/sync_selected_photos.mjs';
export default defineConfig({server:{proxy:{'/api':'http://127.0.0.1:8000'}},preview:{proxy:{'/api':'http://127.0.0.1:8000'}},plugins:[{
 name:'selected-inset-photos',
 buildStart(){syncSelectedPhotos();},
 configureServer(server){
  server.watcher.add('selected_nomad_objects');
  let timer;
  const refresh=file=>{if(!file.replaceAll('\\','/').includes('selected_nomad_objects/'))return;clearTimeout(timer);timer=setTimeout(()=>{try{syncSelectedPhotos();server.ws.send({type:'full-reload'});}catch(error){server.config.logger.error(String(error));}},150);};
  server.watcher.on('add',refresh).on('unlink',refresh).on('change',refresh);
 }
}]});
