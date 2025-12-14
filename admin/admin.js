// admin.js
// ブラウザだけで clients.json を読み込み・編集・ダウンロードするシンプルな管理UI

const fileInput = document.getElementById('fileInput');
const newBtn = document.getElementById('newBtn');
const downloadBtn = document.getElementById('downloadBtn');
const copyBtn = document.getElementById('copyBtn');
const listEl = document.getElementById('list');

const editor = document.getElementById('editor');
const editorTitle = document.getElementById('editorTitle');
const addBtn = document.getElementById('addBtn');
const updateBtn = document.getElementById('updateBtn');
const resetBtn = document.getElementById('resetBtn');
const validationEl = document.getElementById('validation');

const fields = {
  name: document.getElementById('f_name'),
  short: document.getElementById('f_short'),
  description: document.getElementById('f_description'),
  version: document.getElementById('f_version'),
  author: document.getElementById('f_author'),
  icon: document.getElementById('f_icon'),
  download: document.getElementById('f_download'),
  website: document.getElementById('f_website'),
  youtube: document.getElementById('f_youtube'),
  discord: document.getElementById('f_discord'),
};

let clients = [];
let editIndex = -1;

// ユーティリティ
function renderList(){
  listEl.innerHTML = '';
  if(clients.length === 0){
    listEl.innerHTML = `<div class="empty">クライアントがありません。新規作成またはファイルを読み込んでください。</div>`;
    return;
  }
  clients.forEach((c, i) => {
    const item = document.createElement('div');
    item.className = 'item';
    item.innerHTML = `
      <div class="itemLeft">
        <div class="thumb">${escapeHtml(c.icon || c.name.charAt(0))}</div>
        <div class="itemMeta">
          <div class="itemTitle">${escapeHtml(c.name)}</div>
          <div class="itemShort">${escapeHtml(c.short || '')}</div>
        </div>
      </div>
      <div class="itemActions">
        <button class="iconBtn" data-action="preview" data-i="${i}">プレビュー</button>
        <button class="iconBtn" data-action="edit" data-i="${i}">編集</button>
        <button class="iconBtn" data-action="up" data-i="${i}">↑</button>
        <button class="iconBtn" data-action="down" data-i="${i}">↓</button>
        <button class="iconBtn" data-action="delete" data-i="${i}">削除</button>
      </div>
    `;
    listEl.appendChild(item);
  });
}

// ファイル読み込み
fileInput.addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if(!f) return;
  try{
    const text = await f.text();
    const data = JSON.parse(text);
    if(!Array.isArray(data)) throw new Error('JSON は配列である必要があります');
    clients = data;
    renderList();
    showMessage('ファイルを読み込みました', false);
  }catch(err){
    showMessage('読み込みエラー: ' + err.message, true);
  } finally {
    fileInput.value = '';
  }
});

// 新規リスト
newBtn.addEventListener('click', () => {
  if(!confirm('新しい空のリストを作成します。現在の編集内容は失われます。よろしいですか？')) return;
  clients = [];
  renderList();
  resetEditor();
  showMessage('新しいリストを作成しました', false);
});

// ダウンロード
downloadBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(clients, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'clients.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showMessage('clients.json をダウンロードしました', false);
});

// クリップボードコピー
copyBtn.addEventListener('click', async () => {
  try{
    await navigator.clipboard.writeText(JSON.stringify(clients, null, 2));
    showMessage('JSON をクリップボードにコピーしました', false);
  }catch(e){
    showMessage('コピーに失敗しました', true);
  }
});

// 追加
addBtn.addEventListener('click', () => {
  const obj = readForm();
  const err = validate(obj);
  if(err){ showMessage(err, true); return; }
  clients.push(obj);
  renderList();
  resetEditor();
  showMessage('クライアントを追加しました', false);
});

// 編集開始
listEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if(!btn) return;
  const action = btn.dataset.action;
  const i = Number(btn.dataset.i);
  if(action === 'preview'){
    previewClient(clients[i]);
  } else if(action === 'edit'){
    startEdit(i);
  } else if(action === 'delete'){
    if(confirm(`「${clients[i].name}」を削除しますか？`)){
      clients.splice(i,1);
      renderList();
      resetEditor();
      showMessage('削除しました', false);
    }
  } else if(action === 'up'){
    if(i > 0){ [clients[i-1], clients[i]] = [clients[i], clients[i-1]]; renderList(); }
  } else if(action === 'down'){
    if(i < clients.length - 1){ [clients[i+1], clients[i]] = [clients[i], clients[i+1]]; renderList(); }
  }
});

// 編集モード開始
function startEdit(i){
  editIndex = i;
  const c = clients[i];
  editorTitle.textContent = `編集: ${c.name}`;
  for(const k in fields) fields[k].value = c[k] || '';
  addBtn.hidden = true;
  updateBtn.hidden = false;
  validationEl.textContent = '';
}

// 更新確定
updateBtn.addEventListener('click', () => {
  if(editIndex < 0) return;
  const obj = readForm();
  const err = validate(obj);
  if(err){ showMessage(err, true); return; }
  clients[editIndex] = obj;
  renderList();
  resetEditor();
  showMessage('更新しました', false);
});

// リセット
resetBtn.addEventListener('click', resetEditor);

function resetEditor(){
  editIndex = -1;
  editorTitle.textContent = '新しいクライアントを追加';
  editor.reset();
  addBtn.hidden = false;
  updateBtn.hidden = true;
  validationEl.textContent = '';
}

// フォーム読み取り
function readForm(){
  const out = {};
  for(const k in fields){
    const v = fields[k].value.trim();
    if(v) out[k] = v;
  }
  return out;
}

// バリデーション
function validate(obj){
  if(!obj.name) return '名前は必須です';
  if(!obj.download) return 'ダウンロードURLは必須です';
  // URL の簡易チェック
  try{
    if(obj.download && !obj.download.startsWith('http')) return 'ダウンロードURLは http または https で始めてください';
    if(obj.website && obj.website && !obj.website.startsWith('http')) return '公式サイトは http または https で始めてください';
  }catch(e){}
  return '';
}

// プレビュー（簡易）
function previewClient(c){
  const lines = [
    `名前: ${c.name}`,
    `短い説明: ${c.short || '-'}`,
    `バージョン: ${c.version || '-'}`,
    `作者: ${c.author || '-'}`,
    `ダウンロード: ${c.download || '-'}`,
    `YouTube: ${c.youtube || '-'}`,
    `公式: ${c.website || '-'}`,
    `Discord: ${c.discord || '-'}`
  ];
  alert(lines.join('\n'));
}

// 小さなメッセージ表示
function showMessage(msg, isError){
  validationEl.textContent = msg;
  validationEl.style.color = isError ? '#ffb4b4' : '#bff0d6';
  setTimeout(()=>{ validationEl.textContent = ''; }, 4000);
}

// HTML エスケープ
function escapeHtml(s){ return String(s || '').replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

// 初期レンダリング
renderList();
