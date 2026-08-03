/* ============================================================
   SONORA v2 — player de música estilo streaming (PWA)
   Novidades: importação de músicas do aparelho (IndexedDB),
   biblioteca hospedada no repositório (musicas/biblioteca.json),
   leitura automática de tags ID3.
   ============================================================ */

/* ---------- Catálogo de demonstração ---------- */
const MP3 = n => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;

const ALBUMS = [
  { id:'al1', title:'Cidade Elétrica',    artist:'Aurora Neon',  genre:'Eletrônica', c1:'#7b2ff7', c2:'#f107a3', glyph:'⚡' },
  { id:'al2', title:'Horizonte',          artist:'Mar Aberto',   genre:'Indie',      c1:'#0f7ec2', c2:'#63e2b7', glyph:'🌊' },
  { id:'al3', title:'Noites do Interior', artist:'Vila Lunar',   genre:'MPB',        c1:'#1a2a6c', c2:'#b21f1f', glyph:'🌙' },
  { id:'al4', title:'Groove Study',       artist:'Kilo Beats',   genre:'Lo-fi',      c1:'#e08d3c', c2:'#6b3b13', glyph:'📻' },
  { id:'al5', title:'Poeira e Cromo',     artist:'Estrada 77',   genre:'Rock',       c1:'#434343', c2:'#b31217', glyph:'🏍️' },
  { id:'al6', title:'Frequência',         artist:'Ondas Curtas', genre:'Eletrônica', c1:'#02aab0', c2:'#00cdac', glyph:'📡' },
];

const TRACKS = [
  { id:'t1',  title:'Letreiro de Neon',      album:'al1', n:1 },
  { id:'t2',  title:'Avenida 2099',          album:'al1', n:2 },
  { id:'t3',  title:'Coração Sintético',     album:'al1', n:3 },
  { id:'t4',  title:'Maré Alta',             album:'al2', n:4 },
  { id:'t5',  title:'Vento Sul',             album:'al2', n:5 },
  { id:'t6',  title:'Farol Apagado',         album:'al2', n:6 },
  { id:'t7',  title:'Serenata da Varanda',   album:'al3', n:7 },
  { id:'t8',  title:'Lua sobre o Rio',       album:'al3', n:8 },
  { id:'t9',  title:'Estrada de Terra',      album:'al3', n:9 },
  { id:'t10', title:'Café das Três',         album:'al4', n:10 },
  { id:'t11', title:'Chuva na Janela',       album:'al4', n:11 },
  { id:'t12', title:'Página em Branco',      album:'al4', n:12 },
  { id:'t13', title:'Motor Quente',          album:'al5', n:13 },
  { id:'t14', title:'Última Curva',          album:'al5', n:14 },
  { id:'t15', title:'Sinal Fantasma',        album:'al6', n:15 },
  { id:'t16', title:'Modulação',             album:'al6', n:16 },
  { id:'t17', title:'Antena Interna',        album:'al6', n:17 },
];
TRACKS.forEach(t => { t.url = MP3(t.n); const a = ALBUMS.find(x=>x.id===t.album); t.artist=a.artist; t.albumTitle=a.title; t.genre=a.genre; t.c1=a.c1; t.c2=a.c2; t.glyph=a.glyph; });

/* Suas músicas: importadas do aparelho (IndexedDB) + do repositório (musicas/biblioteca.json) */
let LOCAL = [];   // {id,title,artist,albumTitle,genre,c1,c2,glyph, blob? , url?, source:'device'|'repo'}

const CURATED = [
  { id:'pl_top',   name:'Top Hits Sonora',    desc:'As mais tocadas do momento, tudo num lugar só.', c1:'#8E2DE2', c2:'#4A00E0', glyph:'🔥', tracks:['t1','t4','t13','t15','t7','t10'] },
  { id:'pl_foco',  name:'Foco Total',         desc:'Beats calmos para estudar e trabalhar.',          c1:'#355C7D', c2:'#6C5B7B', glyph:'🎯', tracks:['t10','t11','t12','t5','t16'] },
  { id:'pl_treino',name:'Treino Pesado',      desc:'Energia máxima para o seu treino.',               c1:'#cb2d3e', c2:'#ef473a', glyph:'💪', tracks:['t13','t14','t1','t2','t15','t17'] },
  { id:'pl_dom',   name:'Domingo de Manhã',   desc:'Comece o dia com leveza.',                        c1:'#F2994A', c2:'#F2C94C', glyph:'☕', tracks:['t7','t8','t9','t4','t6'] },
];

const GENRES = [
  { name:'Eletrônica', c1:'#7b2ff7', c2:'#f107a3', glyph:'🎛️' },
  { name:'Indie',      c1:'#0f7ec2', c2:'#63e2b7', glyph:'🎸' },
  { name:'MPB',        c1:'#1a2a6c', c2:'#b21f1f', glyph:'🎻' },
  { name:'Lo-fi',      c1:'#e08d3c', c2:'#6b3b13', glyph:'🎧' },
  { name:'Rock',       c1:'#434343', c2:'#b31217', glyph:'🤘' },
];

const PALETTE = [
  ['#7b2ff7','#3b0d63'],['#0f7ec2','#083b5c'],['#cb2d3e','#5c1017'],['#F2994A','#7a4718'],
  ['#02aab0','#01565a'],['#8E2DE2','#3b1170'],['#e08d3c','#6b3b13'],['#1a6c2a','#0b3313'],
  ['#b21f8f','#4d0d3d'],['#355C7D','#16283a'],
];
const GLYPHS = ['🎵','🎶','🎧','🎤','🎷','🎹','🎺','🥁','🪕','🎻'];
function styleFor(str){
  let h=0; for(const ch of String(str)) h=(h*31+ch.codePointAt(0))>>>0;
  const [c1,c2]=PALETTE[h%PALETTE.length];
  return { c1, c2, glyph:GLYPHS[(h>>4)%GLYPHS.length] };
}

/* ---------- Persistência segura (preferências) ---------- */
const store = {
  mem:{},
  get(k,f){ try{ const v=localStorage.getItem('sonora_'+k); return v?JSON.parse(v):f; }catch(e){ return this.mem[k]??f; } },
  set(k,v){ try{ localStorage.setItem('sonora_'+k, JSON.stringify(v)); }catch(e){ this.mem[k]=v; } }
};

/* ---------- IndexedDB (arquivos de música importados) ---------- */
const idb = {
  db:null,
  open(){ return new Promise((res)=>{
    if(!('indexedDB' in window)) return res(false);
    const r=indexedDB.open('sonora-media',1);
    r.onupgradeneeded=e=>e.target.result.createObjectStore('tracks',{keyPath:'id'});
    r.onsuccess=e=>{ idb.db=e.target.result; res(true); };
    r.onerror=()=>res(false);
  });},
  tx(mode){ return idb.db.transaction('tracks',mode).objectStore('tracks'); },
  put(rec){ return new Promise((res,rej)=>{ const q=idb.tx('readwrite').put(rec); q.onsuccess=res; q.onerror=rej; }); },
  all(){ return new Promise((res)=>{ if(!idb.db) return res([]); const q=idb.tx('readonly').getAll(); q.onsuccess=()=>res(q.result||[]); q.onerror=()=>res([]); }); },
  del(id){ return new Promise((res)=>{ const q=idb.tx('readwrite').delete(id); q.onsuccess=res; q.onerror=res; }); }
};

/* ---------- Leitor de tags ID3 (título/artista/álbum) ---------- */
async function readTags(file){
  const guess = () => {
    const base=file.name.replace(/\.[^.]+$/,'');
    const m=base.split(' - ');
    return m.length>=2 ? {artist:m[0].trim(), title:m.slice(1).join(' - ').trim()} : {title:base.trim(), artist:'Artista desconhecido'};
  };
  try{
    const head=new DataView(await file.slice(0,10).arrayBuffer());
    if(head.getUint8(0)===0x49 && head.getUint8(1)===0x44 && head.getUint8(2)===0x33){ // "ID3"
      const ver=head.getUint8(3);
      const size=((head.getUint8(6)&0x7f)<<21)|((head.getUint8(7)&0x7f)<<14)|((head.getUint8(8)&0x7f)<<7)|(head.getUint8(9)&0x7f);
      const buf=new DataView(await file.slice(10, 10+Math.min(size, 512*1024)).arrayBuffer());
      const out={};
      let p=0;
      const dec=(enc,bytes)=>{
        try{
          if(enc===0) return new TextDecoder('iso-8859-1').decode(bytes);
          if(enc===3) return new TextDecoder('utf-8').decode(bytes);
          return new TextDecoder('utf-16').decode(bytes); // 1 e 2 (com BOM)
        }catch(e){ return ''; }
      };
      while(p+10 <= buf.byteLength){
        let id=''; for(let i=0;i<4;i++) id+=String.fromCharCode(buf.getUint8(p+i));
        if(!/^[A-Z0-9]{4}$/.test(id)) break;
        let fsize;
        if(ver>=4){ fsize=((buf.getUint8(p+4)&0x7f)<<21)|((buf.getUint8(p+5)&0x7f)<<14)|((buf.getUint8(p+6)&0x7f)<<7)|(buf.getUint8(p+7)&0x7f); }
        else { fsize=buf.getUint32(p+4); }
        if(fsize<=0 || p+10+fsize>buf.byteLength) break;
        if(['TIT2','TPE1','TALB'].includes(id)){
          const enc=buf.getUint8(p+10);
          const bytes=new Uint8Array(buf.buffer, buf.byteOffset+p+11, fsize-1);
          const txt=dec(enc,bytes).replace(/\0+$/,'').replace(/^\uFEFF/,'').trim();
          if(txt){ if(id==='TIT2') out.title=txt; if(id==='TPE1') out.artist=txt; if(id==='TALB') out.album=txt; }
        }
        p+=10+fsize;
        if(out.title&&out.artist&&out.album) break;
      }
      if(out.title||out.artist) return {...guess(), ...out};
    }
    // ID3v1 (fim do arquivo)
    if(file.size>128){
      const tail=new Uint8Array(await file.slice(file.size-128).arrayBuffer());
      if(tail[0]===0x54&&tail[1]===0x41&&tail[2]===0x47){ // "TAG"
        const s=(a,b)=>new TextDecoder('iso-8859-1').decode(tail.slice(a,b)).replace(/\0.*$/,'').trim();
        const t=s(3,33), ar=s(33,63), al=s(63,93);
        if(t||ar) return {...guess(), ...(t&&{title:t}), ...(ar&&{artist:ar}), ...(al&&{album:al})};
      }
    }
  }catch(e){}
  return guess();
}

/* ---------- Estado ---------- */
const S = {
  likes: new Set(store.get('likes', [])),
  userPlaylists: store.get('playlists', []),
  recents: store.get('recents', []),
  queue: [], qIndex: -1, shuffleOrder: null,
  shuffle: false, repeat: 'off',
  volume: store.get('volume', .8), muted:false,
  view: { name:'home' }, history: [],
  ctxName: 'Sonora',
};

const $ = s => document.querySelector(s);
const audio = $('#audio');
audio.volume = S.volume;

/* ---------- Utilidades ---------- */
const fmt = s => { if(!isFinite(s)) return '0:00'; s=Math.floor(s); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; };
const trk = id => TRACKS.find(t=>t.id===id) || LOCAL.find(t=>t.id===id);
const allTracks = () => TRACKS.concat(LOCAL);
const esc = s => String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2200); }
function coverHTML(o, extra=''){ return `<div class="cover ${extra}" style="--c1:${o.c1};--c2:${o.c2}"><span class="glyph">${o.glyph}</span></div>`; }
function saveLikes(){ store.set('likes',[...S.likes]); }
function savePls(){ store.set('playlists', S.userPlaylists); }

function collection(id){
  if(id==='liked') return { id:'liked', name:'Músicas Curtidas', desc:'Tudo que você curtiu 💜', kind:'Playlist', c1:'#4527d8', c2:'#8fd3f4', glyph:'💜', tracks:[...S.likes] };
  if(id==='local') return { id:'local', name:'Suas Músicas', desc:'Importadas do aparelho e da sua pasta musicas/ no GitHub.', kind:'Biblioteca', c1:'#0ba360', c2:'#053d24', glyph:'📂', tracks:LOCAL.map(t=>t.id) };
  if(String(id).startsWith('rpl_')){
    const p=REPO_PLS.find(x=>x.id===id); if(!p) return null;
    const st=styleFor(p.name);
    return { id, name:p.name, kind:'Playlist', desc:'Compartilhada na nuvem — igual em todos os aparelhos', c1:st.c1, c2:st.c2, glyph:'☁️',
      tracks:p.files.map(fileToId).filter(x=>LOCAL.some(t=>t.id===x)) };
  }
  const cur = CURATED.find(p=>p.id===id); if(cur) return {...cur, kind:'Playlist'};
  const al = ALBUMS.find(a=>a.id===id);
  if(al) return { ...al, name:al.title, kind:'Álbum', desc:al.artist, tracks:TRACKS.filter(t=>t.album===id).map(t=>t.id) };
  const up = S.userPlaylists.find(p=>p.id===id);
  if(up) return { ...up, kind:'Playlist', desc:'Criada por você', c1:up.c1||'#535353', c2:up.c2||'#2b2b2b', glyph:up.glyph||'🎵' };
  return null;
}

/* ---------- Importação de músicas do aparelho ---------- */
async function importFiles(fileList){
  const files=[...fileList].filter(f=>f.type.startsWith('audio/')||/\.(mp3|m4a|ogg|wav|flac|aac)$/i.test(f.name));
  if(!files.length){ toast('Nenhum arquivo de áudio selecionado'); return; }
  toast(`Importando ${files.length} música${files.length>1?'s':''}…`);
  let ok=0;
  for(const f of files){
    try{
      const tags=await readTags(f);
      const id='loc_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);
      const st=styleFor(tags.album||tags.artist||f.name);
      const rec={ id, title:tags.title, artist:tags.artist, albumTitle:tags.album||'Importadas', genre:'Suas músicas',
                  c1:st.c1, c2:st.c2, glyph:st.glyph, blob:f, source:'device' };
      if(idb.db) await idb.put({ id, title:rec.title, artist:rec.artist, albumTitle:rec.albumTitle, c1:rec.c1, c2:rec.c2, glyph:rec.glyph, blob:f });
      LOCAL.push(rec); ok++;
    }catch(e){}
  }
  toast(ok?`${ok} música${ok>1?'s':''} adicionada${ok>1?'s':''} 🎉`:'Não consegui importar');
  if(ok && !idb.db) toast('Atenção: sem IndexedDB, elas somem ao fechar');
  render();
}
const fileInput=$('#fileImport');
if(fileInput) fileInput.addEventListener('change',()=>{ importFiles(fileInput.files); fileInput.value=''; });
function askImport(){ if(fileInput) fileInput.click(); }

async function removeLocal(id){
  LOCAL=LOCAL.filter(t=>t.id!==id);
  if(idb.db) await idb.del(id);
  S.userPlaylists.forEach(p=>p.tracks=p.tracks.filter(x=>x!==id)); savePls();
  if(S.likes.delete(id)) saveLikes();
  S.queue=S.queue.filter(x=>x!==id);
  toast('Música removida'); render();
}

/* ---------- Biblioteca hospedada no repositório ---------- */
let REPO_PLS = []; // playlists compartilhadas definidas no biblioteca.json
const fileToId = f => 'rep_'+String(f).replace(/[^a-z0-9]/gi,'_');
async function loadRepoLibrary(){
  try{
    const r=await fetch('musicas/biblioteca.json',{cache:'no-cache'});
    if(!r.ok) return;
    const data=await r.json();
    const faixas=data.faixas||data.tracks||[];
    LOCAL=LOCAL.filter(t=>t.source!=='repo');
    for(const f of faixas){
      const file=f.arquivo||f.file; if(!file) continue;
      const id=fileToId(file);
      if(LOCAL.some(t=>t.id===id)) continue;
      const st=styleFor(f.album||f.artista||file);
      LOCAL.push({ id, title:f.titulo||f.title||file.split('/').pop().replace(/\.[^.]+$/,''),
        artist:f.artista||f.artist||'Artista desconhecido', albumTitle:f.album||'Minha Biblioteca',
        genre:'Suas músicas', c1:f.cor1||st.c1, c2:f.cor2||st.c2, glyph:f.emoji||st.glyph, url:file, source:'repo' });
    }
    REPO_PLS=(data.playlists||[]).map(p=>({ id:'rpl_'+String(p.nome||'').replace(/[^a-z0-9]/gi,'_'), name:p.nome||'Compartilhada', files:p.faixas||[] }));
    render();
  }catch(e){ /* sem biblioteca.json — tudo bem */ }
}
/* Atualização automática: o aparelho da loja pega músicas novas sozinho */
setInterval(loadRepoLibrary, 5*60*1000);

/* ---------- Nuvem: enviar músicas pelo app (API do GitHub) ---------- */
S_cloud_init();
function S_cloud_init(){ S.cloud = store.get('cloud', null); }
const fileToB64 = f => new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(',')[1]); r.onerror=rej; r.readAsDataURL(f); });
function b64decode(s){ const b=Uint8Array.from(atob(String(s).replace(/\s/g,'')),c=>c.charCodeAt(0)); return new TextDecoder().decode(b); }
function b64encode(s){ const b=new TextEncoder().encode(s); let bin=''; b.forEach(x=>bin+=String.fromCharCode(x)); return btoa(bin); }
const sanitizeName = n => n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'_');

async function gh(path, method='GET', body=null){
  const c=S.cloud; const br=c.branch||'main';
  const url=`https://api.github.com/repos/${c.user}/${c.repo}/contents/${path}`+(method==='GET'?`?ref=${br}`:'');
  const r=await fetch(url,{ method,
    headers:{ 'Authorization':'Bearer '+c.token, 'Accept':'application/vnd.github+json' },
    body: body?JSON.stringify({...body, branch:br}):null });
  if(method==='GET' && r.status===404) return null;
  if(!r.ok) throw new Error('GitHub respondeu '+r.status);
  return r.json();
}

let _pendingUpload=null;
function startCloudSend(files){
  const list=[...files].filter(f=>f.type.startsWith('audio/')||/\.(mp3|m4a|ogg|wav|flac|aac)$/i.test(f.name));
  if(!list.length){ toast('Nenhum arquivo de áudio selecionado'); return; }
  _pendingUpload=list;
  // escolher playlist compartilhada de destino
  const lst=$('#sendToList');
  lst.innerHTML=[
    `<button data-target="">📂 Só na biblioteca (sem playlist)</button>`,
    ...REPO_PLS.map(p=>`<button data-target="${esc(p.name)}">☁️ ${esc(p.name)} <small style="color:var(--text-sub)">(${p.files.length})</small></button>`)
  ].join('');
  lst.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
    $('#ovSendTo').classList.remove('open');
    uploadFiles(_pendingUpload, b.dataset.target||null);
  }));
  $('#inpNewShared').value='';
  $('#ovSendTo').classList.add('open');
}
$('#btnSendNew').addEventListener('click',()=>{
  const name=$('#inpNewShared').value.trim();
  if(!name){ toast('Digite o nome da playlist'); return; }
  $('#ovSendTo').classList.remove('open');
  uploadFiles(_pendingUpload, name);
});

async function uploadFiles(files, targetPl){
  if(!S.cloud){ openCloudModal(); return; }
  const total=files.length; const newEntries=[];
  try{
    for(let i=0;i<total;i++){
      const f=files[i];
      toast(`Enviando ${i+1}/${total}: ${f.name}…`);
      const tags=await readTags(f);
      let name='musicas/'+sanitizeName(f.name);
      if(await gh(name)) name=name.replace(/(\.[^.]+)$/, '-'+Date.now()+'$1'); // já existe → renomeia
      const b64=await fileToB64(f);
      await gh(name,'PUT',{ message:'Sonora: adicionar '+tags.title, content:b64 });
      newEntries.push({ titulo:tags.title, artista:tags.artist, album:tags.album||'Nuvem', arquivo:name });
    }
    toast('Atualizando a biblioteca…');
    const cur=await gh('musicas/biblioteca.json');
    let data={faixas:[]}, sha=undefined;
    if(cur){ sha=cur.sha; try{ data=JSON.parse(b64decode(cur.content)); }catch(e){ data={faixas:[]}; } }
    data.faixas=(data.faixas||[]).concat(newEntries);
    if(targetPl){
      data.playlists=data.playlists||[];
      let p=data.playlists.find(x=>x.nome===targetPl);
      if(!p){ p={nome:targetPl, faixas:[]}; data.playlists.push(p); }
      p.faixas.push(...newEntries.map(e=>e.arquivo));
    }
    await gh('musicas/biblioteca.json','PUT',{ message:'Sonora: atualizar biblioteca', content:b64encode(JSON.stringify(data,null,2)), ...(sha?{sha}:{}) });
    toast(`${total} música${total>1?'s':''} na nuvem! Aparece em todos os aparelhos em alguns minutos 🎉`);
    setTimeout(loadRepoLibrary, 90*1000); // GitHub Pages leva ~1 min para publicar
  }catch(e){
    toast('Falha no envio: '+e.message+' — confira usuário/repositório/token');
  }
}

function openCloudModal(){
  const c=S.cloud||{};
  $('#inpGhUser').value=c.user||''; $('#inpGhRepo').value=c.repo||'';
  $('#inpGhBranch').value=c.branch||''; $('#inpGhToken').value=c.token||'';
  $('#ovCloud').classList.add('open');
}
$('#btnSaveCloud').addEventListener('click',()=>{
  const user=$('#inpGhUser').value.trim(), repo=$('#inpGhRepo').value.trim(),
        branch=$('#inpGhBranch').value.trim(), token=$('#inpGhToken').value.trim();
  if(!user||!repo||!token){ toast('Preencha usuário, repositório e token'); return; }
  S.cloud={user,repo,branch,token}; store.set('cloud',S.cloud);
  $('#ovCloud').classList.remove('open'); toast('Nuvem configurada ✅');
});
const upInput=$('#fileUpload');
if(upInput) upInput.addEventListener('change',()=>{ startCloudSend(upInput.files); upInput.value=''; });
function askCloudSend(){ if(!S.cloud){ openCloudModal(); toast('Configure a nuvem primeiro'); return; } upInput.click(); }

/* ---------- Player ---------- */
function trackURL(t){
  if(t.url) return t.url;
  if(t.blob){ t.url=URL.createObjectURL(t.blob); return t.url; }
  return '';
}
function playCollection(colId, startTrackId){
  const col = collection(colId); if(!col || !col.tracks.length){ toast('Playlist vazia'); return; }
  S.queue = [...col.tracks]; S.ctxName = col.name; S.shuffleOrder = null;
  if(S.shuffle) buildShuffle();
  let idx = startTrackId ? S.queue.indexOf(startTrackId) : 0; if(idx<0) idx=0;
  addRecent(colId);
  playAt(idx);
}
function buildShuffle(){
  const order=[...S.queue.keys()];
  for(let i=order.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [order[i],order[j]]=[order[j],order[i]]; }
  S.shuffleOrder=order;
}
function currentOrder(){ return S.shuffle && S.shuffleOrder ? S.shuffleOrder : [...S.queue.keys()]; }
function playAt(qIdx){
  S.qIndex=qIdx; const t=trk(S.queue[qIdx]); if(!t) return;
  const u=trackURL(t); if(!u){ toast('Arquivo indisponível'); return; }
  audio.src=u; audio.play().catch(()=>{});
  updateNowPlaying();
}
function togglePlay(){
  if(!audio.src){ playCollection(LOCAL.length?'local':'pl_top'); return; }
  audio.paused ? audio.play() : audio.pause();
}
function step(dir){
  if(S.qIndex<0) return;
  const order=currentOrder(); const pos=order.indexOf(S.qIndex);
  let np=pos+dir;
  if(np<0){ np=order.length-1; }
  if(np>=order.length){
    if(S.repeat==='all'){ np=0; } else { audio.pause(); audio.currentTime=0; return; }
  }
  playAt(order[np]);
}
audio.addEventListener('ended', ()=>{
  if(S.repeat==='one'){ audio.currentTime=0; audio.play(); return; }
  const order=currentOrder(); const pos=order.indexOf(S.qIndex);
  if(pos===order.length-1 && S.repeat!=='all'){ updatePlayIcons(); return; }
  step(1);
});
audio.addEventListener('error', ()=>{ if(audio.src) toast('Não consegui tocar essa faixa'); });
audio.addEventListener('play', updatePlayIcons);
audio.addEventListener('pause', updatePlayIcons);
audio.addEventListener('timeupdate', ()=>{
  const p = audio.duration ? (audio.currentTime/audio.duration*100) : 0;
  $('#seekFill').style.width=p+'%'; $('#seekKnob').style.left=p+'%';
  $('#fsSeekFill').style.width=p+'%'; $('#fsKnob').style.left=p+'%';
  $('#mpProg').style.width=p+'%';
  $('#tCur').textContent=fmt(audio.currentTime); $('#tDur').textContent=fmt(audio.duration);
  $('#fsTCur').textContent=fmt(audio.currentTime); $('#fsTDur').textContent=fmt(audio.duration);
});

function updatePlayIcons(){
  const playing=!audio.paused && audio.src;
  for(const [p,q] of [['#icPlay','#icPause'],['#mpIcPlay','#mpIcPause'],['#fsIcPlay','#fsIcPause']]){
    $(p).style.display=playing?'none':'block'; $(q).style.display=playing?'block':'none';
  }
  document.body.classList.toggle('paused', !playing);
  renderViewSoft();
}
function updateNowPlaying(){
  const t=trk(S.queue[S.qIndex]); if(!t) return;
  for(const id of ['#pbCover','#mpCover','#fsCover']){
    const el=$(id); el.style.setProperty('--c1',t.c1); el.style.setProperty('--c2',t.c2);
    el.querySelector('.glyph').textContent=t.glyph;
  }
  $('#pbTitle').textContent=t.title; $('#pbArtist').textContent=t.artist;
  $('#mpTitle').textContent=t.title; $('#mpArtist').textContent=t.artist;
  $('#fsTitle').textContent=t.title; $('#fsArtist').textContent=t.artist;
  $('#fsCtx').textContent=S.ctxName;
  $('#fsPlayer').style.setProperty('--c1', t.c1);
  updateLikeButtons(); updateMediaSession(t); renderViewSoft(); renderSidebar();
}
function updateLikeButtons(){
  const t=trk(S.queue[S.qIndex]); const on=t && S.likes.has(t.id);
  for(const id of ['#pbLike','#mpLike','#fsLike']){
    const el=$(id); el.classList.toggle('on', !!on);
    el.querySelector('path').setAttribute('fill', on ? 'currentColor' : 'none');
  }
}
function toggleLike(id){
  if(S.likes.has(id)){ S.likes.delete(id); toast('Removida das Curtidas'); }
  else { S.likes.add(id); toast('Adicionada às Curtidas 💜'); }
  saveLikes(); updateLikeButtons(); renderViewSoft(); renderSidebar();
}

/* MediaSession → controles na tela de bloqueio do celular */
function updateMediaSession(t){
  if(!('mediaSession' in navigator)) return;
  const art = makeArtwork(t);
  navigator.mediaSession.metadata = new MediaMetadata({ title:t.title, artist:t.artist, album:t.albumTitle, artwork:[{src:art,sizes:'512x512',type:'image/png'}] });
  navigator.mediaSession.setActionHandler('play', ()=>audio.play());
  navigator.mediaSession.setActionHandler('pause', ()=>audio.pause());
  navigator.mediaSession.setActionHandler('previoustrack', ()=>step(-1));
  navigator.mediaSession.setActionHandler('nexttrack', ()=>step(1));
  try{ navigator.mediaSession.setActionHandler('seekto', d=>{ if(d.seekTime!=null) audio.currentTime=d.seekTime; }); }catch(e){}
}
const _artCache={};
function makeArtwork(t){
  const key=t.albumTitle+t.c1;
  if(_artCache[key]) return _artCache[key];
  const c=document.createElement('canvas'); c.width=c.height=512; const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,512,512); g.addColorStop(0,t.c1); g.addColorStop(1,t.c2);
  x.fillStyle=g; x.fillRect(0,0,512,512);
  x.font='260px serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(t.glyph,256,276);
  return _artCache[key]=c.toDataURL('image/png');
}

/* ---------- Barras arrastáveis ---------- */
function makeDraggable(barEl, onRatio){
  const go = e => {
    const r=barEl.getBoundingClientRect();
    const cx=(e.touches?e.touches[0].clientX:e.clientX);
    onRatio(Math.min(1,Math.max(0,(cx-r.left)/r.width)));
  };
  const move=e=>{ e.preventDefault(); go(e); };
  const up=()=>{ window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up); window.removeEventListener('touchmove',move); window.removeEventListener('touchend',up); };
  barEl.addEventListener('mousedown', e=>{ go(e); window.addEventListener('mousemove',move); window.addEventListener('mouseup',up); });
  barEl.addEventListener('touchstart', e=>{ go(e); window.addEventListener('touchmove',move,{passive:false}); window.addEventListener('touchend',up); },{passive:true});
}
makeDraggable($('#seekBar'), r=>{ if(audio.duration) audio.currentTime=r*audio.duration; });
makeDraggable($('#fsSeekBar'), r=>{ if(audio.duration) audio.currentTime=r*audio.duration; });
makeDraggable($('#volBar'), r=>{ S.volume=r; S.muted=false; audio.volume=r; audio.muted=false; $('#volFill').style.width=(r*100)+'%'; $('#volKnob').style.left=(r*100)+'%'; store.set('volume',r); });
$('#volFill').style.width=(S.volume*100)+'%';

/* ---------- Navegação / views ---------- */
function navigate(view, push=true){
  if(push && S.view) S.history.push(S.view);
  S.view=view; render();
  $('#main').scrollTop=0;
}
$('#btnBack').addEventListener('click', ()=>{ const v=S.history.pop(); if(v){ S.view=v; render(); } });
document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('[data-nav]').forEach(x=>x.classList.toggle('active', x.dataset.nav===b.dataset.nav));
  navigate({name:b.dataset.nav});
}));

function addRecent(id){
  S.recents=[id, ...S.recents.filter(x=>x!==id)].slice(0,8);
  store.set('recents',S.recents);
}

function render(){
  const root=$('#viewRoot'); const v=S.view;
  $('#searchWrap').classList.toggle('show', v.name==='search');
  document.querySelectorAll('[data-nav]').forEach(x=>x.classList.toggle('active', x.dataset.nav===v.name));
  if(v.name==='home') root.innerHTML=viewHome();
  else if(v.name==='search') { root.innerHTML=viewSearch($('#searchInput').value); $('#searchInput').focus(); }
  else if(v.name==='library') root.innerHTML=viewLibrary();
  else if(v.name==='col') root.innerHTML=viewCollection(v.id);
  else if(v.name==='queue') root.innerHTML=viewQueue();
  bindView(root);
  renderSidebar();
}
function renderViewSoft(){
  const cur=S.queue[S.qIndex];
  document.querySelectorAll('.tl-row').forEach(r=>r.classList.toggle('current', r.dataset.track===cur));
}

/* ---------- Views ---------- */
function greet(){ const h=new Date().getHours(); return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'; }

function viewHome(){
  const recents = S.recents.map(collection).filter(Boolean);
  const shelf = (recents.length?recents:CURATED.map(c=>collection(c.id))).slice(0,6);
  const localCard = LOCAL.length
    ? cardHTML({...collection('local'), desc:`${LOCAL.length} música${LOCAL.length>1?'s':''} suas`})
    : `<div class="card" id="homeImport">
         <div class="cover" style="--c1:#0ba360;--c2:#053d24"><span class="glyph">➕</span></div>
         <div class="t">Importar suas músicas</div><div class="s">Toque aqui e escolha MP3s do seu aparelho.</div>
       </div>`;
  return `
    <h1 class="greet">${greet()} 👋</h1>
    <div class="shelf">
      ${shelf.map(c=>`<div class="tile" data-open="${c.id}">${coverHTML(c)}<span>${esc(c.name)}</span></div>`).join('')}
      <div class="tile" data-open="liked">${coverHTML(collection('liked'))}<span>Músicas Curtidas</span></div>
    </div>
    <h2 class="sec">Sua coleção</h2>
    <div class="grid">${REPO_PLS.map(p=>cardHTML(collection(p.id))).join('')}${localCard}${cardHTML({...collection('liked'), desc:`${S.likes.size} curtidas`})}</div>
    <h2 class="sec">Feito para você</h2>
    <div class="grid">${CURATED.map(cardHTML).join('')}</div>
    <h2 class="sec">Álbuns em destaque</h2>
    <div class="grid">${ALBUMS.map(a=>cardHTML({...a, name:a.title, desc:a.artist})).join('')}</div>`;
}
function cardHTML(c){
  return `<div class="card" data-open="${c.id}">
    ${coverHTML(c, c.id==='liked'?'liked-cover':'')}
    <div class="t">${esc(c.name||c.title)}</div><div class="s">${esc(c.desc||'')}</div>
    <button class="playfab" data-playcol="${c.id}" title="Tocar"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z"/></svg></button>
  </div>`;
}

function viewSearch(q){
  q=(q||'').trim().toLowerCase();
  if(!q){
    return `<h2 class="sec" style="margin-top:6px">Navegar por gêneros</h2>
      <div class="grid">
        ${GENRES.map(g=>`<div class="genrecard" data-genre="${g.name}" style="--c1:${g.c1};--c2:${g.c2}">${g.name}<span>${g.glyph}</span></div>`).join('')}
        ${LOCAL.length?`<div class="genrecard" data-genre="Suas músicas" style="--c1:#0ba360;--c2:#053d24">Suas músicas<span>📂</span></div>`:''}
      </div>`;
  }
  const res = allTracks().filter(t=>[t.title,t.artist,t.albumTitle,t.genre].join(' ').toLowerCase().includes(q));
  if(!res.length) return `<div class="empty">Nada encontrado para “${esc(q)}”.<br>Tente outro termo.</div>`;
  return `<h2 class="sec" style="margin-top:6px">Resultados</h2>${tracklistHTML(res.map(t=>t.id), {showAlbum:true})}`;
}

function viewLibrary(){
  const items=[collection('local'), ...REPO_PLS.map(p=>collection(p.id)), collection('liked'), ...S.userPlaylists.map(p=>collection(p.id)), ...CURATED.map(c=>collection(c.id))];
  return `
    <h1 class="greet">Sua Biblioteca</h1>
    <div style="margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn primary" id="libImport">⬆️ Importar (só neste aparelho)</button>
      <button class="btn primary" id="libSend" style="background:#4fc3f7">☁️ Enviar p/ todos os aparelhos</button>
      <button class="btn primary" id="libNewPl" style="background:#fff">+ Criar playlist</button>
      <button class="btn ghost" id="libCloud" title="Configurar nuvem">⚙️ Nuvem</button>
    </div>
    <div class="grid">${items.map(c=>cardHTML({...c, desc:(c.kind||'Playlist') + (c.tracks?` • ${c.tracks.length} músicas`:'')})).join('')}</div>`;
}

function viewCollection(id){
  const c=collection(id); if(!c) return '<div class="empty">Não encontrado.</div>';
  const totalKnown = c.tracks.length;
  const isUser = S.userPlaylists.some(p=>p.id===id);
  return `
    <div class="hero" style="--c1:${c.c1};--c2:${c.c2}">
      ${coverHTML(c, id==='liked'?'liked-cover':'')}
      <div>
        <div class="kind">${c.kind||'Playlist'}</div>
        <h1>${esc(c.name)}</h1>
        <div class="desc">${esc(c.desc||'')}</div>
        <div class="stats"><b>Sonora</b> • ${totalKnown} música${totalKnown===1?'':'s'}</div>
      </div>
    </div>
    <div class="actionrow">
      <button class="bigplay" data-playcol="${c.id}"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z"/></svg></button>
      <button class="iconbtn ${S.shuffle?'on':''}" data-act="shuffle" title="Aleatório"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 4h5v5h-2V7.4l-4.2 4.2-1.4-1.4L18.6 6H17V4zM2 6h4.6l3.1 3.1-1.4 1.4L5.8 8H2V6zm16.6 10H17v2h5v-5h-2v1.6l-4.3-4.3-1.4 1.4 4.3 4.3zM2 16h3.8l3.5-3.5 1.4 1.4L6.6 18H2v-2z"/></svg></button>
      ${id==='local'?`<button class="btn primary" id="colImport">⬆️ Importar mais</button>`:''}
      ${isUser?`<button class="iconbtn" data-delpl="${c.id}" title="Excluir playlist"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 3h6l1 2h4v2H4V5h4l1-2zm-3 6h12l-1 12H7L6 9zm4 2v8h2v-8h-2zm4 0v8h-2v-8h2z" fill-rule="evenodd"/></svg></button>`:''}
    </div>
    ${c.tracks.length ? tracklistHTML(c.tracks,{colId:c.id, showAlbum:true, removable:isUser}) : (id==='local'
      ? '<div class="empty">Nenhuma música sua por aqui ainda.<br>Toque em <b>Importar</b> e escolha os MP3s do seu aparelho — ou crie a pasta <b>musicas/</b> no seu repositório (veja o LEIA-ME).</div>'
      : '<div class="empty">Essa playlist ainda está vazia.<br>Busque músicas e use “Adicionar à playlist”.</div>')}`;
}

function viewQueue(){
  if(!S.queue.length) return '<h1 class="greet">Fila</h1><div class="empty">Nada na fila. Toque alguma coisa!</div>';
  const order=currentOrder(); const pos=order.indexOf(S.qIndex);
  const upcoming=order.slice(pos).map(i=>S.queue[i]);
  return `<h1 class="greet">Fila</h1>
    <div class="desc" style="color:var(--text-sub);margin-bottom:8px">Tocando de: <b style="color:#fff">${esc(S.ctxName)}</b></div>
    ${tracklistHTML(upcoming,{queueMode:true, showAlbum:true})}`;
}

function tracklistHTML(ids, opt={}){
  const rows=ids.map((id,i)=>{
    const t=trk(id); if(!t) return '';
    const liked=S.likes.has(id); const cur=S.queue[S.qIndex]===id;
    return `<div class="tl-row ${cur?'current':''}" data-track="${id}" ${opt.colId?`data-col="${opt.colId}"`:''}>
      <div class="num"><span class="n">${cur?'<span class="eq"><i></i><i></i><i></i></span>':i+1}</span><span class="pl">▶</span></div>
      <div class="who">${coverHTML(t)}<div style="min-width:0"><div class="t">${esc(t.title)}</div><div class="a">${esc(t.artist)}</div></div></div>
      <div class="alb">${esc(t.albumTitle)}</div>
      <button class="likebtn ${liked?'on':''}" data-like="${id}" title="Curtir"><svg viewBox="0 0 24 24" fill="${liked?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2.6 4.5 6.4 4.5c2.2 0 3.8 1.2 5.6 3.3 1.8-2.1 3.4-3.3 5.6-3.3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"/></svg></button>
      <div class="dur"><button class="iconbtn" data-more="${id}" ${opt.colId?`data-morecol="${opt.colId}"`:''} title="Mais opções" style="padding:4px"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg></button></div>
    </div>`;
  }).join('');
  return `<div class="tracklist">
    <div class="tl-head"><div style="text-align:center">#</div><div>Título</div><div>Álbum</div><div></div><div></div></div>
    ${rows}</div>`;
}

/* ---------- Ligações de eventos das views ---------- */
function bindView(root){
  root.querySelectorAll('[data-open]').forEach(el=>el.addEventListener('click',e=>{
    if(e.target.closest('[data-playcol]')) return;
    navigate({name:'col', id:el.dataset.open});
  }));
  root.querySelectorAll('[data-playcol]').forEach(el=>el.addEventListener('click',e=>{ e.stopPropagation(); playCollection(el.dataset.playcol); }));
  root.querySelectorAll('.tl-row').forEach(el=>el.addEventListener('click',e=>{
    if(e.target.closest('button')) return;
    const col=el.dataset.col;
    if(col) playCollection(col, el.dataset.track);
    else {
      const ids=[...el.parentElement.querySelectorAll('.tl-row')].map(r=>r.dataset.track);
      S.queue=ids; S.ctxName=S.view.name==='queue'?S.ctxName:'Busca'; S.shuffleOrder=null; if(S.shuffle) buildShuffle();
      playAt(ids.indexOf(el.dataset.track));
    }
  }));
  root.querySelectorAll('[data-like]').forEach(el=>el.addEventListener('click',e=>{ e.stopPropagation(); toggleLike(el.dataset.like); }));
  root.querySelectorAll('[data-more]').forEach(el=>el.addEventListener('click',e=>{ e.stopPropagation(); openCtxMenu(e, el.dataset.more, el.dataset.morecol); }));
  root.querySelectorAll('[data-genre]').forEach(el=>el.addEventListener('click',()=>{ $('#searchInput').value=el.dataset.genre; renderSearchResults(); }));
  root.querySelectorAll('[data-act="shuffle"]').forEach(el=>el.addEventListener('click',()=>toggleShuffle()));
  root.querySelectorAll('[data-delpl]').forEach(el=>el.addEventListener('click',()=>{
    S.userPlaylists=S.userPlaylists.filter(p=>p.id!==el.dataset.delpl); savePls();
    toast('Playlist excluída'); navigate({name:'library'},false);
  }));
  const lib=root.querySelector('#libNewPl'); if(lib) lib.addEventListener('click',()=>openModal('#ovNewPlaylist'));
  for(const sel of ['#libImport','#colImport','#homeImport']){
    const b=root.querySelector(sel); if(b) b.addEventListener('click',askImport);
  }
  const snd=root.querySelector('#libSend'); if(snd) snd.addEventListener('click',askCloudSend);
  const cld=root.querySelector('#libCloud'); if(cld) cld.addEventListener('click',openCloudModal);
}

/* ---------- Busca ao vivo ---------- */
function renderSearchResults(){
  const q=$('#searchInput').value;
  $('#viewRoot').innerHTML=viewSearch(q);
  bindView($('#viewRoot'));
}
$('#searchInput').addEventListener('input', ()=>{ if(S.view.name==='search') renderSearchResults(); });

/* ---------- Sidebar ---------- */
function renderSidebar(){
  const el=$('#sbPlaylists'); if(!el) return;
  const items=[collection('local'), ...REPO_PLS.map(p=>collection(p.id)), collection('liked'), ...S.userPlaylists.map(p=>collection(p.id)), ...CURATED.map(c=>collection(c.id)), ...ALBUMS.map(a=>collection(a.id))];
  el.innerHTML=items.map(c=>{
    const playing = S.ctxName===c.name && audio.src && !audio.paused;
    return `<button class="sb-item ${playing?'playing':''}" data-open="${c.id}">
      ${coverHTML(c, c.id==='liked'?'liked-cover':'')}
      <div class="meta"><div class="sb-name">${esc(c.name)}</div><div class="sb-sub">${c.kind||'Playlist'}${c.kind==='Álbum'?' • '+esc(c.artist):''}</div></div>
    </button>`;
  }).join('');
  el.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>navigate({name:'col',id:b.dataset.open})));
}

/* ---------- Menu de contexto ---------- */
function openCtxMenu(e, trackId, fromCol){
  const m=$('#ctxMenu'); const t=trk(trackId); const liked=S.likes.has(trackId);
  const removable = fromCol && S.userPlaylists.some(p=>p.id===fromCol);
  const isDevice = t && t.source==='device';
  m.innerHTML=`
    <button data-c="like">${liked?'💔 Remover das Curtidas':'💜 Curtir'}</button>
    <button data-c="addpl">➕ Adicionar à playlist</button>
    <button data-c="next">⏭️ Tocar em seguida</button>
    ${removable?'<button data-c="rem">🗑️ Remover desta playlist</button>':''}
    ${isDevice?'<button data-c="delloc">❌ Apagar do app</button>':''}`;
  m.classList.add('open');
  const r=e.target.getBoundingClientRect();
  const mw=240, mh=m.offsetHeight||180;
  m.style.left=Math.min(r.left, innerWidth-mw-10)+'px';
  m.style.top=Math.min(r.bottom+4, innerHeight-mh-10)+'px';
  m.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
    const c=b.dataset.c; m.classList.remove('open');
    if(c==='like') toggleLike(trackId);
    if(c==='addpl') openAddTo(trackId);
    if(c==='next'){ if(S.qIndex<0){ S.queue=[trackId]; S.ctxName='Fila'; playAt(0); } else { S.queue.splice(S.qIndex+1,0,trackId); S.shuffleOrder=null; if(S.shuffle) buildShuffle(); toast('Vai tocar em seguida'); } }
    if(c==='rem'){ const p=S.userPlaylists.find(p=>p.id===fromCol); p.tracks=p.tracks.filter(x=>x!==trackId); savePls(); toast('Removida da playlist'); render(); }
    if(c==='delloc') removeLocal(trackId);
  }));
}
document.addEventListener('click', e=>{ if(!e.target.closest('#ctxMenu') && !e.target.closest('[data-more]')) $('#ctxMenu').classList.remove('open'); });

/* ---------- Modais ---------- */
function openModal(sel){ $(sel).classList.add('open'); const i=$(sel).querySelector('input'); if(i){ i.value=''; setTimeout(()=>i.focus(),50); } }
document.querySelectorAll('.overlay').forEach(ov=>{
  ov.addEventListener('click', e=>{ if(e.target===ov || e.target.closest('[data-close]')) ov.classList.remove('open'); });
});
$('#btnNewPlaylist').addEventListener('click',()=>openModal('#ovNewPlaylist'));
$('#btnImportSb').addEventListener('click',askImport);
$('#btnCreatePl').addEventListener('click',createPlaylist);
$('#inpPlName').addEventListener('keydown',e=>{ if(e.key==='Enter') createPlaylist(); });
function createPlaylist(){
  const name=$('#inpPlName').value.trim(); if(!name){ toast('Dê um nome à playlist'); return; }
  const st=styleFor(name);
  const p={ id:'u'+Date.now(), name, tracks:[], c1:st.c1, c2:st.c2, glyph:'🎵' };
  S.userPlaylists.push(p); savePls();
  $('#ovNewPlaylist').classList.remove('open');
  toast('Playlist criada!'); navigate({name:'col', id:p.id});
}
function openAddTo(trackId){
  if(!S.userPlaylists.length){ toast('Crie uma playlist primeiro'); openModal('#ovNewPlaylist'); return; }
  const list=$('#addToList');
  list.innerHTML=S.userPlaylists.map(p=>`<button data-pl="${p.id}">${coverHTML(collection(p.id))}<span>${esc(p.name)}<br><small style="color:var(--text-sub);font-weight:500">${p.tracks.length} músicas</small></span></button>`).join('');
  list.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
    const p=S.userPlaylists.find(x=>x.id===b.dataset.pl);
    if(p.tracks.includes(trackId)){ toast('Já está nessa playlist'); }
    else { p.tracks.push(trackId); savePls(); toast(`Adicionada a “${p.name}”`); }
    $('#ovAddTo').classList.remove('open'); renderSidebar();
  }));
  $('#ovAddTo').classList.add('open');
}

/* ---------- Controles globais ---------- */
function toggleShuffle(){ S.shuffle=!S.shuffle; if(S.shuffle) buildShuffle(); syncCtrlStates(); toast(S.shuffle?'Aleatório ativado':'Aleatório desativado'); render(); }
function cycleRepeat(){ S.repeat=S.repeat==='off'?'all':S.repeat==='all'?'one':'off'; syncCtrlStates(); toast(S.repeat==='off'?'Repetição desativada':S.repeat==='all'?'Repetir tudo':'Repetir uma'); }
function syncCtrlStates(){
  $('#btnShuffle').classList.toggle('on',S.shuffle); $('#fsShuffle').classList.toggle('on',S.shuffle);
  $('#btnRepeat').classList.toggle('on',S.repeat!=='off'); $('#fsRepeat').classList.toggle('on',S.repeat!=='off');
  $('#repeatOne').style.display=S.repeat==='one'?'inline':'none';
}
$('#btnPlay').addEventListener('click',togglePlay);
$('#mpPlay').addEventListener('click',e=>{e.stopPropagation();togglePlay();});
$('#fsPlay').addEventListener('click',togglePlay);
$('#btnPrev').addEventListener('click',()=>{ if(audio.currentTime>3){audio.currentTime=0;} else step(-1); });
$('#fsPrev').addEventListener('click',()=>{ if(audio.currentTime>3){audio.currentTime=0;} else step(-1); });
$('#btnNext').addEventListener('click',()=>step(1));
$('#fsNext').addEventListener('click',()=>step(1));
$('#btnShuffle').addEventListener('click',toggleShuffle);
$('#fsShuffle').addEventListener('click',toggleShuffle);
$('#btnRepeat').addEventListener('click',cycleRepeat);
$('#fsRepeat').addEventListener('click',cycleRepeat);
$('#btnQueue').addEventListener('click',()=>navigate({name:'queue'}));
$('#btnMute').addEventListener('click',()=>{ S.muted=!S.muted; audio.muted=S.muted; $('#btnMute').style.opacity=S.muted?.5:1; });
const likeNow=()=>{ const t=trk(S.queue[S.qIndex]); if(t) toggleLike(t.id); };
$('#pbLike').addEventListener('click',likeNow);
$('#mpLike').addEventListener('click',e=>{e.stopPropagation();likeNow();});
$('#fsLike').addEventListener('click',likeNow);
$('#pbCover').addEventListener('click',()=>{ const t=trk(S.queue[S.qIndex]); if(t) navigate({name:'col',id: t.album || 'local'}); });

/* Mini player abre o fullscreen */
$('#miniPlayer').addEventListener('click',e=>{ if(e.target.closest('button')) return; if(S.qIndex>=0) $('#fsPlayer').classList.add('open'); });
$('#fsClose').addEventListener('click',()=>$('#fsPlayer').classList.remove('open'));

/* Atalhos de teclado */
document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT') return;
  if(e.code==='Space'){ e.preventDefault(); togglePlay(); }
  if(e.code==='ArrowRight' && e.shiftKey) step(1);
  if(e.code==='ArrowLeft' && e.shiftKey) step(-1);
  if(e.code==='ArrowRight' && !e.shiftKey && audio.duration) audio.currentTime=Math.min(audio.duration,audio.currentTime+5);
  if(e.code==='ArrowLeft' && !e.shiftKey) audio.currentTime=Math.max(0,audio.currentTime-5);
});

/* Topbar sólida ao rolar */
$('#main').addEventListener('scroll',()=>$('#topbar').classList.toggle('solid', $('#main').scrollTop>40));

/* ---------- Service worker (instalação PWA) ---------- */
if('serviceWorker' in navigator && location.protocol==='https:'){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}

/* ---------- Boot ---------- */
(async function boot(){
  render(); syncCtrlStates();
  await idb.open();
  const saved=await idb.all();
  for(const r of saved) LOCAL.push({...r, genre:'Suas músicas', source:'device'});
  loadRepoLibrary();
  if(saved.length) render();
})();
