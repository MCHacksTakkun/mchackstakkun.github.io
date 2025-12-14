// script.js for Java edition
const DATA_URL = 'clients.json';
const cardsEl = document.getElementById('cards');
const detailEl = document.getElementById('detail');
const detailContentEl = document.getElementById('detailContent');
const closeDetailBtn = document.getElementById('closeDetail');
const searchInput = document.getElementById('search');
const refreshBtn = document.getElementById('refreshBtn');

let clients = [];
let filtered = [];

async function loadClients(){
  try{
    const res = await fetch(DATA_URL, {cache: "no-store"});
    if(!res.ok) throw new Error('読み込み失敗');
    clients = await res.json();
    filtered = clients;
    renderCards(filtered);
  }catch(err){
    cardsEl.innerHTML = `<div class="error">クライアントデータの読み込みに失敗しました。</div>`;
    console.error(err);
  }
}

function renderCards(list){
  cardsEl.innerHTML = '';
  if(list.length === 0){
    cardsEl.innerHTML = `<div class="empty">該当するクライアントがありません。</div>`;
    return;
  }
  list.forEach((c) => {
    const btn = document.createElement('button');
    btn.className = 'card';
    btn.type = 'button';
    btn.setAttribute('role','listitem');
    btn.setAttribute('aria-label', `${c.name} の詳細を表示`);
    btn.innerHTML = `
      <div class="cardHeader">
        <div class="thumb">${c.icon || c.name.charAt(0)}</div>
        <div>
          <h3 class="cardTitle">${c.name}</h3>
          <p class="cardDesc">${c.short || ''}</p>
        </div>
      </div>
      <div class="badges">
        ${c.version ? `<span class="badge">バージョン ${c.version}</span>` : ''}
        ${c.author ? `<span class="badge">作者 ${c.author}</span>` : ''}
      </div>
    `;
    btn.addEventListener('click', () => openDetail(c));
    btn.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
    });
    cardsEl.appendChild(btn);
  });
}

function openDetail(client){
  detailEl.setAttribute('aria-hidden','false');
  detailContentEl.innerHTML = buildDetailHtml(client);
  if(client.youtube){
    const ytWrap = document.createElement('div');
    ytWrap.className = 'youtubeEmbed';
    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.src = `https://www.youtube.com/embed/${extractYouTubeId(client.youtube)}`;
    iframe.title = `${client.name} YouTube`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.style.border = '0';
    ytWrap.appendChild(iframe);
    detailContentEl.appendChild(ytWrap);
  }
  closeDetailBtn.focus();
}

function buildDetailHtml(c){
  const desc = `<p>${escapeHtml(c.description || '')}</p>`;
  const links = [];
  if(c.download) links.push(`<a class="linkBtn" href="${escapeAttr(c.download)}" target="_blank" rel="noopener">ダウンロード</a>`);
  if(c.website) links.push(`<a class="linkBtn secondary" href="${escapeAttr(c.website)}" target="_blank" rel="noopener">公式サイト</a>`);
  if(c.youtube) links.push(`<a class="linkBtn secondary" href="${escapeAttr(c.youtube)}" target="_blank" rel="noopener">YouTube</a>`);
  if(c.discord) links.push(`<a class="linkBtn secondary" href="${escapeAttr(c.discord)}" target="_blank" rel="noopener">Discord</a>`);
  return `
    <h2>${escapeHtml(c.name)}</h2>
    ${desc}
    <div class="links">${links.join('')}</div>
  `;
}

function extractYouTubeId(url){
  try{
    const u = new URL(url);
    if(u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    if(u.searchParams.has('v')) return u.searchParams.get('v');
    const parts = u.pathname.split('/');
    return parts.pop() || parts.pop();
  }catch(e){
    return '';
  }
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
function escapeAttr(s){ return String(s).replace(/"/g,'&quot;'); }

closeDetailBtn.addEventListener('click', () => {
  detailEl.setAttribute('aria-hidden','true');
  detailContentEl.innerHTML = '';
});

searchInput.addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  filtered = clients.filter(c => (c.name + ' ' + (c.short||'') + ' ' + (c.description||'')).toLowerCase().includes(q));
  renderCards(filtered);
});

refreshBtn.addEventListener('click', () => loadClients());

loadClients();
