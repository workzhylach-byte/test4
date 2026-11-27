// Shared behaviour for inner pages: lead modal, image fallbacks, Revika tabs, code copy, blog filter, reading progress
(function(){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- lead modal ----------
  // Set window.ITSME_LEAD_ENDPOINT = 'https://…' (before this script) to POST leads as JSON. Without it the form only shows the thank-you screen.
  const VIA={telegram:['Telegram','@username'],whatsapp:['WhatsApp','+375 29 000-00-00'],viber:['Viber','+375 29 000-00-00'],email:['Почта','name@mail.com'],call:['Телефон','+375 29 000-00-00']};
  const viaHtml=Object.entries(VIA).map(([k,v],i)=>`<label><input type="radio" name="via" value="${k}"${i?'':' checked'}><span>${v[0]}</span></label>`).join('');
  const formHtml=id=>`
    <input type="hidden" name="service">
    <label>Как вас зовут<input name="name" autocomplete="name" placeholder="Имя" required></label>
    <div><div style="font-size:13px;color:var(--muted);margin-bottom:8px">Как с вами связаться</div><div class="lm-via">${viaHtml}</div></div>
    <label><span class="lm-cl">Ваш Telegram</span><input name="contact" placeholder="@username" required></label>
    <label>Пара слов о задаче<textarea name="msg" placeholder="Например: нужен сайт для кофейни с меню и онлайн-заказом"></textarea></label>
    <label class="lm-agree"><input type="checkbox" name="agree"><span>Соглашаюсь на обработку персональных данных согласно <a href="privacy.html" target="_blank">Политике конфиденциальности</a></span></label>
    <p class="lm-note" aria-live="polite"></p>
    <button class="btn lm-send" type="submit">Отправить заявку <span aria-hidden="true">→</span></button>`;

  function wireForm(form,onDone){
    const cl=form.querySelector('.lm-cl'),ci=form.querySelector('[name=contact]');
    form.querySelectorAll('[name=via]').forEach(r=>r.addEventListener('change',()=>{const v=VIA[r.value];cl.textContent=r.value==='email'?'Ваша почта':r.value==='call'?'Ваш телефон':'Ваш '+v[0];ci.placeholder=v[1];ci.type=r.value==='email'?'email':r.value==='telegram'?'text':'tel';}));
    form.addEventListener('submit',async e=>{
      e.preventDefault();const note=form.querySelector('.lm-note');
      const d=Object.fromEntries(new FormData(form));
      if(!d.name.trim()){note.textContent='Напишите, как к вам обращаться';return;}
      if(!d.contact.trim()){note.textContent='Укажите, как с вами связаться';return;}
      if(d.via==='email'&&!/^\S+@\S+\.\S+$/.test(d.contact)){note.textContent='Проверьте адрес почты';return;}
      if(!d.agree){note.textContent='Нужно согласие на обработку данных';return;}
      note.textContent='';d.page=location.pathname;
      if(window.ITSME_LEAD_ENDPOINT){try{await fetch(window.ITSME_LEAD_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});}catch(err){}}
      onDone(d);form.reset();form.querySelector('[name=via]').dispatchEvent(new Event('change'));
    });
  }

  const dlg=document.createElement('dialog');dlg.className='lm';dlg.setAttribute('aria-labelledby','lm-t');
  dlg.innerHTML=`<div class="lm-box"><button class="lm-x" type="button" aria-label="Закрыть"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13"/></svg></button>
    <div class="lm-step"><div class="lm-head"><h3 id="lm-t">Обсудим проект?</h3><p class="lm-sub">Расскажите о задаче — ответим в течение рабочего дня с идеями и оценкой.</p></div><form novalidate>${formHtml()}</form></div>
    <div class="lm-done" hidden><div class="big">🎉</div><h3>Заявка отправлена!</h3><p class="lm-done-t"></p><button class="btn lm-send lm-ok" type="button">Отлично</button></div></div>`;
  document.body.append(dlg);
  const step=dlg.querySelector('.lm-step'),done=dlg.querySelector('.lm-done'),form=dlg.querySelector('form');
  function open(service){
    step.hidden=false;done.hidden=true;form.querySelector('.lm-note').textContent='';
    form.service.value=service||'';
    dlg.querySelector('#lm-t').textContent=service?service+': обсудим?':'Обсудим проект?';
    const msg=form.querySelector('[name=msg]');if(service&&!msg.value)msg.value='Интересует: '+service+'. ';
    dlg.showModal();setTimeout(()=>form.querySelector('[name=name]').focus(),60);
  }
  function close(){if(!dlg.open)return;if(reduce){dlg.close();return;}dlg.classList.add('closing');setTimeout(()=>{dlg.classList.remove('closing');dlg.close();},220);}
  dlg.querySelector('.lm-x').addEventListener('click',close);dlg.querySelector('.lm-ok').addEventListener('click',close);
  dlg.addEventListener('click',e=>{if(e.target===dlg)close();});
  dlg.addEventListener('cancel',e=>{e.preventDefault();close();});
  wireForm(form,d=>{dlg.querySelector('.lm-done-t').textContent=`${d.name.trim()}, спасибо! Мы свяжемся с вами в течение рабочего дня.`;step.hidden=true;done.hidden=false;});
  window.itsmeLead=open;
  // any "discuss / leave a request" link opens the modal instead of jumping to the home page
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href="./#contact"],a[href="index.html#contact"],a[href="#contact"],[data-lead]');
    if(!a)return;e.preventDefault();
    document.getElementById('mnav')?.setAttribute('hidden','');
    open(a.dataset.pre||a.dataset.lead||'');
  });
  // inline forms (contacts page)
  document.querySelectorAll('form.lead-inline').forEach(f=>{f.innerHTML=formHtml();wireForm(f,d=>{
    const box=f.closest('.ct-form');box.innerHTML=`<div class="lm-done"><div class="big">🎉</div><h3>Заявка отправлена!</h3><p>${d.name.trim().replace(/[<>&]/g,'')}, спасибо! Мы свяжемся с вами в течение рабочего дня.</p></div>`;});});

  // ---------- photos: graceful fallback if an image cannot load ----------
  document.querySelectorAll('.ph img').forEach(img=>{const f=()=>img.closest('.ph').classList.add('noimg');if(img.complete&&!img.naturalWidth)f();else img.addEventListener('error',f);});

  // ---------- Revika screenshot tabs ----------
  document.querySelectorAll('.rv-tabs').forEach(tabs=>{const stage=tabs.nextElementSibling;tabs.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
    tabs.querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected',x===b));
    stage.querySelectorAll('.rv-slide').forEach(s=>s.classList.toggle('on',s.dataset.rv===b.dataset.rv));}));});

  // ---------- copy code ----------
  document.querySelectorAll('.code-box button').forEach(btn=>btn.addEventListener('click',()=>{
    const pre=btn.closest('.code-box').querySelector('pre');
    const ok=()=>{btn.textContent='Скопировано';setTimeout(()=>btn.textContent='Скопировать',1600);};
    if(navigator.clipboard)navigator.clipboard.writeText(pre.innerText).then(ok).catch(()=>{});else{const r=document.createRange();r.selectNodeContents(pre);const s=getSelection();s.removeAllRanges();s.addRange(r);}
  }));

  // ---------- blog filter ----------
  const bf=document.querySelector('.bfilter');
  if(bf)bf.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
    bf.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));
    document.querySelectorAll('.post-grid .pcard').forEach(c=>c.hidden=b.dataset.f!=='all'&&c.dataset.cat!==b.dataset.f);
  }));

  // ---------- reading progress (article) ----------
  const rp=document.querySelector('.read-progress'),art=document.querySelector('.article');
  if(rp&&art){const u=()=>{const r=art.getBoundingClientRect(),t=r.height-innerHeight;rp.style.transform=`scaleX(${Math.min(1,Math.max(0,t>0?-r.top/t:1))})`;};addEventListener('scroll',u,{passive:true});u();}
})();

// custom cursor lives under the page, so it cannot draw over an open <dialog> (top layer): show the normal cursor while any dialog is open
(function(){
  const root=document.documentElement;
  const sync=()=>{const open=!!document.querySelector('dialog[open]');root.classList.toggle('dlg-open',open);if(window.__cursorOn)root.classList.toggle('has-cursor',!open);};
  const mo=new MutationObserver(sync);
  const watch=()=>document.querySelectorAll('dialog').forEach(d=>{if(!d.__w){d.__w=1;mo.observe(d,{attributes:true,attributeFilter:['open']});}});
  watch();new MutationObserver(watch).observe(document.body,{childList:true});
})();
