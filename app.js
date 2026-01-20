
(async function(){
  const qListEl = document.getElementById('qList');
  const searchEl = document.getElementById('search');
  const qContentEl = document.getElementById('qContent');
  const crumbEl = document.getElementById('crumb');
  const backBtn = document.getElementById('backBtn');
  const statusEl = document.getElementById('offlineStatus');

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

  let questions = [];
  try{
    const res = await fetch('./data/questions.json', {cache:'no-cache'});
    questions = await res.json();
  }catch(e){
    qListEl.innerHTML = '<li class="hint">Не удалось загрузить список вопросов.</li>';
    return;
  }

  function renderList(filter){
    const f = (filter||'').trim().toLowerCase();
    qListEl.innerHTML = '';
    const filtered = questions.filter(q => (q.num + '. ' + q.title).toLowerCase().includes(f));
    if (!filtered.length){
      qListEl.innerHTML = '<li class="hint">Ничего не найдено.</li>';
      return;
    }
    for (const q of filtered){
      const li = document.createElement('li');
      li.className = 'q-item';
      li.dataset.id = q.id;
      li.innerHTML = `<div class="q-num">Вопрос ${q.num}</div><div class="q-title">${escapeHtml(q.title)}</div>`;
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
    }catch(e){
      qContentEl.innerHTML = '<div class="empty"><h2>Не удалось загрузить ответ</h2><p>Проверь, что файлы доступны и закэшированы.</p></div>';
    }
    highlightActive();
    // Mobile: show content
    document.body.classList.add('show-content');
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
  const initial = (location.hash || '').replace('#','');
  if (initial) openQuestion(initial);

  // PWA install hint (optional UX)
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    deferredPrompt = e;
    // don't show custom UI; browser will handle.
  });
})();
