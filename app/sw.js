/* VotaBrasil SW v9 - instalacao resiliente (1 falha nao mata o cache) */
const CACHE='votabrasil-v9';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(CACHE);await Promise.allSettled(ASSETS.map(u=>c.add(u).catch(()=>null)));self.skipWaiting();})());});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const ks=await caches.keys();await Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)));self.clients.claim();})());});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith((async()=>{const c=await caches.open(CACHE);const hit=await c.match(e.request,{ignoreSearch:true});const net=fetch(e.request).then(r=>{try{if(r&&r.ok&&new URL(e.request.url).origin===location.origin){c.put(e.request,r.clone());}}catch(_){}return r;}).catch(()=>hit||c.match('./index.html'));return hit||net;})());});
