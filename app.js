
(async function(){
  const qListEl = document.getElementById('qList');
  const searchEl = document.getElementById('search');
  const qContentEl = document.getElementById('qContent');
  const crumbEl = document.getElementById('crumb');
  const backBtn = document.getElementById('backBtn');
  const statusEl = document.getElementById('offlineStatus');
  const progressFillEl = document.getElementById('progressFill');
  const progressCountEl = document.getElementById('progressCount');
  const filterFavBtn = document.getElementById('filterFavBtn');

  const STORAGE_KEYS = {
    read: 'exam_read_questions',
    fav: 'exam_fav_questions'
  };

  let questions = [];
  let readSet = loadSet(STORAGE_KEYS.read);
  let favSet = loadSet(STORAGE_KEYS.fav);
  let favoriteOnly = false;

  function setStatus(text, cls){
    statusEl.textContent = text;
    statusEl.className = 'status ' + (cls||'');
  }

  // Service worker
  if ('serviceWorker' in navigator){
    try{
      await navigator.serviceWorker.register('./sw.js');
      setStatus('Оффлайн-режим включён (SW зарегистрирован)', 'ok');
    }catch(e){
      setStatus('SW не зарегистрирован: оффлайн может не работать', 'warn');
    }
  } else {
    setStatus('Service Worker не поддерживается', 'warn');
  }

  try{
    const res = await fetch('./data/questions.json', {cache:'no-cache'});
    questions = await res.json();
  }catch(e){
    qListEl.innerHTML = '<li class="hint">Не удалось загрузить список вопросов.</li>';
    return;
  }

  function loadSet(key){
    try{
      const raw = JSON.parse(localStorage.getItem(key) || '[]');
      return new Set(Array.isArray(raw) ? raw : []);
    }catch(e){
      return new Set();
    }
  }

  function persistSet(key, set){
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  }

  function updateProgress(){
    const total = questions.length || 0;
    const readCount = Math.min(readSet.size, total);
    const pct = total ? Math.round((readCount / total) * 100) : 0;
    progressCountEl.textContent = `${readCount}/${total}`;
    progressFillEl.style.width = `${pct}%`;
    progressFillEl.title = `Прочитано ${pct}%`;
  }

  function toggleRead(id){
    if (readSet.has(id)) readSet.delete(id);
    else readSet.add(id);
    persistSet(STORAGE_KEYS.read, readSet);
    updateProgress();
  }

  function toggleFavorite(id){
    if (favSet.has(id)) favSet.delete(id);
    else favSet.add(id);
    persistSet(STORAGE_KEYS.fav, favSet);
  }

  filterFavBtn.addEventListener('click', () => {
    favoriteOnly = !favoriteOnly;
    filterFavBtn.classList.toggle('active', favoriteOnly);
    filterFavBtn.setAttribute('aria-pressed', favoriteOnly ? 'true' : 'false');
    filterFavBtn.textContent = favoriteOnly ? 'Только избранные: вкл' : 'Только избранные: выкл';
    renderList(searchEl.value);
  });

  function renderList(filter){
    const f = (filter||'').trim().toLowerCase();
    qListEl.innerHTML = '';
    const filtered = questions.filter(q => {
      const matchesSearch = (q.num + '. ' + q.title).toLowerCase().includes(f);
      const matchesFav = favoriteOnly ? favSet.has(q.id) : true;
      return matchesSearch && matchesFav;
    });
    if (!filtered.length){
      const msg = favoriteOnly ? 'Здесь появятся избранные вопросы.' : 'Ничего не найдено.';
      qListEl.innerHTML = `<li class="hint">${msg}</li>`;
      return;
    }
    for (const q of filtered){
      const li = document.createElement('li');
      li.className = 'q-item';
      li.dataset.id = q.id;
      if (readSet.has(q.id)) li.classList.add('read');
      if (favSet.has(q.id)) li.classList.add('fav');
      li.innerHTML = `
        <div class="q-top">
          <div>
            <div class="q-num">Вопрос ${q.num}</div>
            <div class="q-title">${escapeHtml(q.title)}</div>
          </div>
          <button class="fav-btn ${favSet.has(q.id)?'active':''}" aria-label="${favSet.has(q.id)?'Убрать из избранного':'Добавить в избранное'}" type="button">${favSet.has(q.id)?'★':'☆'}</button>
        </div>
        <div class="q-flags">
          <span class="flag ${readSet.has(q.id)?'read':'unread'}">${readSet.has(q.id)?'Прочитано':'Не прочитано'}</span>
          ${favSet.has(q.id)?'<span class="flag fav">Избранное</span>':''}
        </div>`;
      const favBtn = li.querySelector('.fav-btn');
      favBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        toggleFavorite(q.id);
        renderList(searchEl.value);
        updateProgress();
      });
      li.addEventListener('click', () => {
        location.hash = q.id;
      });
      qListEl.appendChild(li);
    }
    highlightActive();
  }

  function highlightActive(){
    const id = (location.hash || '').replace('#','');
    document.querySelectorAll('.q-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });
  }

  async function openQuestion(id){
    const q = questions.find(x => x.id === id);
    if (!q){
      qContentEl.innerHTML = '<div class="empty"><h2>Вопрос не найден</h2></div>';
      crumbEl.textContent = '';
      highlightActive();
      return;
    }
    crumbEl.textContent = `Вопрос ${q.num}`;
    try{
      const res = await fetch('./' + q.file);
      const html = await res.text();
      qContentEl.innerHTML = html;
      renderQuestionActions(q);
    }catch(e){
      qContentEl.innerHTML = '<div class="empty"><h2>Не удалось загрузить ответ</h2><p>Проверь, что файлы доступны и закэшированы.</p></div>';
    }
    highlightActive();
    // Mobile: show content
    document.body.classList.add('show-content');
  }

  function renderQuestionActions(q){
    const actions = document.createElement('div');
    actions.className = 'q-actions';
    const readBtn = document.createElement('button');
    readBtn.className = 'action-btn primary';
    const favBtn = document.createElement('button');
    favBtn.className = 'action-btn fav';
    function sync(){
      const isRead = readSet.has(q.id);
      readBtn.textContent = isRead ? 'Отмечено как прочитанное' : 'Я дочитал(а) ответ';
      readBtn.classList.toggle('active', isRead);
      const isFav = favSet.has(q.id);
      favBtn.textContent = isFav ? 'В избранном' : 'Добавить в избранное';
      favBtn.classList.toggle('active', isFav);
    }
    readBtn.addEventListener('click', () => {
      toggleRead(q.id);
      sync();
      renderList(searchEl.value);
      highlightActive();
    });
    favBtn.addEventListener('click', () => {
      toggleFavorite(q.id);
      sync();
      renderList(searchEl.value);
      highlightActive();
    });
    actions.appendChild(readBtn);
    actions.appendChild(favBtn);
    qContentEl.appendChild(actions);
    sync();
  }

  function escapeHtml(s){
    return (s||'').replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  searchEl.addEventListener('input', () => renderList(searchEl.value));
  backBtn.addEventListener('click', () => {
    document.body.classList.remove('show-content');
    // keep hash, so it stays selected
  });

  window.addEventListener('hashchange', () => {
    const id = (location.hash || '').replace('#','');
    if (id) openQuestion(id);
    else {
      document.body.classList.remove('show-content');
      qContentEl.innerHTML = '<div class="empty"><h2>Выбери вопрос слева</h2><p>Здесь откроется текст ответа с картинками.</p></div>';
      crumbEl.textContent = '';
      highlightActive();
    }
  });

  renderList('');
  updateProgress();
  const initial = (location.hash || '').replace('#','');
  if (initial) openQuestion(initial);

  // PWA install hint (optional UX)
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    deferredPrompt = e;
    // don't show custom UI; browser will handle.
  });
})();
