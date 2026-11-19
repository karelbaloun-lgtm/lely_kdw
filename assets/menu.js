/* Lely KDW – gemeinsames Menü (Overlay) für ALLE Seiten.
   Der Knopf "Menü" in der Kopfzeile öffnet dieses Fenster direkt auf der aktuellen Seite (man verlässt die Seite nicht):
   Navigation zu den Funktionen + Center/Name, Design, Schrift, Startbildschirm, Bestand zählen, Auto-Bestand sichern.
   Daten (Monteure, Center) kommen aus /assets/data.js (wird aus Zentren.xlsx erzeugt). */
(function(){
  var D = window.KDW_DATA || { people: {}, centers: {} };
  var KEY_NAME = 'kdw_last_einbauer', KEY_CENTER = 'kdw_last_center';
  var ICO = {
    close: '<svg class="ic ic-solo" viewBox="0 0 24 24" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>',
    chev: '<svg class="ic ic-solo" viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 6 15 12 9 18"/></svg>',
    home: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    tool: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    truck: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="4" width="14" height="12" rx="1.5"/><path d="M15 8h4l3 3.4V16h-7z"/><circle cx="5.5" cy="18" r="2.2"/><circle cx="18" cy="18" r="2.2"/></svg>',
    car: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>',
    sun: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    moon: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    contrast: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor"/></svg>',
    phone: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
    box: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>'
  };
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function get(k, d){ try { var v = localStorage.getItem(k); return v == null ? d : v; } catch(e){ return d; } }
  function set(k, v){ try { localStorage.setItem(k, v); } catch(e){} }

  // gespeicherter Monteur -> Lagerort (auch altes Format "Nachname Vorname - LAK")
  function savedLO(){
    var name = get(KEY_NAME, ''), lo = '';
    Object.keys(D.people).forEach(function(k){ if (D.people[k][0] === name) lo = k; });
    if (!lo){ var m = String(name).match(/ - ([A-Z0-9]{2,8})$/); if (m && D.people[m[1]]) lo = m[1]; }
    return lo;
  }
  function whoText(){
    var lo = savedLO(); if (!lo) return 'Noch nicht gewählt';
    var c = D.centers[D.people[lo][2]] || {};
    return (c.short || D.people[lo][2]) + ' · ' + D.people[lo][0];
  }

  var ov = null, box = null, view = 'main';

  function navItem(href, ico, title, sub, active){
    return '<a class="mn-item' + (active ? ' mn-active' : '') + '" href="' + href + '">' + ico + '<span><b>' + title + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span>' + ICO.chev + '</a>';
  }
  function currentNavKey(){
    var p = location.pathname, m = new URLSearchParams(location.search).get('m');
    if (/\/kdw\/?(index\.html)?$/.test(p)) return m === 'kunde' ? 'kunde' : 'kdw';
    if (/\/auto\/?/.test(p)) return 'auto';
    if (/\/bestand\/?/.test(p)) return 'bestand';
    if (/\/statistik\/?/.test(p)) return 'statistik';
    return 'home';
  }

  function renderMain(){
    var cur = currentNavKey();
    var theme = get('kdw_theme', 'auto'), font = get('kdw_font', 'lely') === 'system' ? 'system' : 'lely';
    box.innerHTML =
      '<div class="mn-head"><h3>Menü</h3><button type="button" class="mn-x" id="mn-close" aria-label="Schließen">' + ICO.close + '</button></div>' +
      '<div class="mn-nav">' +
        navItem('/', ICO.home, 'Start', 'Übersicht', cur === 'home') +
        navItem('/kdw/?m=kdw', ICO.tool, 'Einbau + Verbrauchsmaterial', 'LELY, Würth, Berner', cur === 'kdw') +
        navItem('/kdw/?m=kunde', ICO.truck, 'Material für Kunden', 'Fehlendes Material nachbestellen', cur === 'kunde') +
        navItem('/auto/', ICO.car, 'Aus dem Auto abbuchen', 'Entnahme aus dem Auto-Bestand', cur === 'auto') +
      '</div>' +
      '<div class="mn-sec"><h4>Center und Name</h4><div class="mn-who">' + esc(whoText()) + '</div><button type="button" class="mn-btn" id="mn-who">Center / Name ändern</button></div>' +
      '<div class="mn-sec"><h4>Design</h4><div class="mn-seg" id="mn-theme">' +
        '<button type="button" data-v="light"' + (theme === 'light' ? ' class="active"' : '') + '>' + ICO.sun + 'Hell</button>' +
        '<button type="button" data-v="dark"' + (theme === 'dark' ? ' class="active"' : '') + '>' + ICO.moon + 'Dunkel</button>' +
        '<button type="button" data-v="auto"' + (theme !== 'light' && theme !== 'dark' ? ' class="active"' : '') + '>' + ICO.contrast + 'System</button></div></div>' +
      '<div class="mn-sec"><h4>Schrift</h4><div class="mn-seg" id="mn-font">' +
        '<button type="button" data-v="lely"' + (font === 'lely' ? ' class="active"' : '') + '>Lely</button>' +
        '<button type="button" data-v="system"' + (font === 'system' ? ' class="active"' : '') + '>System</button></div></div>' +
      '<div class="mn-sec"><h4>Auf dem Startbildschirm</h4><button type="button" class="mn-btn" id="mn-home">' + ICO.phone + 'Zum Startbildschirm hinzufügen</button></div>' +
      '<div class="mn-sec"><h4>Bestand zählen (in Arbeit)</h4><p>Bestandsliste vom Lager laden, zählen und als Auto-Bestand übernehmen. Wird noch weiterentwickelt.</p>' +
        '<a class="mn-btn" href="/bestand/">' + ICO.box + 'Bestand zählen</a></div>' +
      '<div class="mn-sec"><h4>Auto-Bestand sichern</h4><p>Der Auto-Bestand liegt in deinem Telefon und wird – wenn eine Verbindung besteht – automatisch auf dem Server gespeichert. Zusätzlich kannst du ihn hier als Datei sichern und wiederherstellen.</p>' +
        '<div class="mn-list" id="mn-list"></div><div class="mn-row"><button type="button" class="mn-btn" id="mn-bk-save">Sicherung speichern</button><button type="button" class="mn-btn" id="mn-bk-load">Sicherung wiederherstellen</button></div>' +
        '<input type="file" id="mn-bk-file" accept=".json,application/json" hidden><div class="mn-msg" id="mn-msg"></div></div>';
    $('mn-close').onclick = close;
    $('mn-who').onclick = function(){ view = 'center'; render(); };
    $('mn-home').onclick = function(){ view = 'home'; render(); };
    bindSeg('mn-theme', function(v){ set('kdw_theme', v); document.documentElement.setAttribute('data-theme', v); });
    bindSeg('mn-font', function(v){ set('kdw_font', v); document.documentElement.setAttribute('data-font', v); });
    paintBackupList();
    $('mn-bk-save').onclick = backupSave;
    $('mn-bk-load').onclick = function(){ $('mn-bk-file').value = ''; $('mn-bk-file').click(); };
    $('mn-bk-file').onchange = backupLoad;
  }
  function bindSeg(id, fn){
    var wrap = $(id);
    Array.prototype.forEach.call(wrap.querySelectorAll('button'), function(b){
      b.onclick = function(){ fn(b.dataset.v); Array.prototype.forEach.call(wrap.querySelectorAll('button'), function(x){ x.classList.toggle('active', x === b); }); };
    });
  }

  // --- Center -> Name wählen (danach lädt die Seite neu, damit alles zum neuen Monteur passt) ---
  function renderCenters(){
    var keys = []; Object.keys(D.people).forEach(function(lo){ var c = D.people[lo][2]; if (keys.indexOf(c) < 0) keys.push(c); });
    box.innerHTML = '<div class="mn-head"><h3>Welches Center?</h3><button type="button" class="mn-x" id="mn-close" aria-label="Schließen">' + ICO.close + '</button></div>' +
      '<div class="mn-nav">' + keys.map(function(k){ var c = D.centers[k] || {}; return '<button type="button" class="mn-item" data-c="' + esc(k) + '"><span><b>' + esc(c.short || c.name || k) + '</b>' + (c.name && c.name !== c.short ? '<small>' + esc(c.name) + '</small>' : '') + '</span>' + ICO.chev + '</button>'; }).join('') + '</div>' +
      '<button type="button" class="mn-link" id="mn-back">← zurück</button>';
    $('mn-close').onclick = close; $('mn-back').onclick = function(){ view = 'main'; render(); };
    Array.prototype.forEach.call(box.querySelectorAll('[data-c]'), function(b){ b.onclick = function(){ set(KEY_CENTER, b.dataset.c); view = 'names:' + b.dataset.c; render(); }; });
  }
  function renderNames(center){
    var los = Object.keys(D.people).filter(function(lo){ return D.people[lo][2] === center; });
    box.innerHTML = '<div class="mn-head"><h3>Name wählen</h3><button type="button" class="mn-x" id="mn-close" aria-label="Schließen">' + ICO.close + '</button></div>' +
      '<div class="mn-nav">' + los.map(function(lo){ return '<button type="button" class="mn-item" data-lo="' + esc(lo) + '"><span><b>' + esc(D.people[lo][0]) + '</b></span>' + ICO.chev + '</button>'; }).join('') + '</div>' +
      '<button type="button" class="mn-link" id="mn-back">← anderes Center wählen</button>';
    $('mn-close').onclick = close; $('mn-back').onclick = function(){ view = 'center'; render(); };
    Array.prototype.forEach.call(box.querySelectorAll('[data-lo]'), function(b){
      b.onclick = function(){ var lo = b.dataset.lo; set(KEY_NAME, D.people[lo][0]); set(KEY_CENTER, D.people[lo][2]); location.reload(); };
    });
  }
  function renderHome(){
    box.innerHTML = '<div class="mn-head"><h3>Zum Startbildschirm hinzufügen</h3><button type="button" class="mn-x" id="mn-close" aria-label="Schließen">' + ICO.close + '</button></div>' +
      '<div class="mn-sec"><h4>Android (Google Chrome)</h4><ol class="mn-ol"><li>Oben rechts in Chrome auf <b>⋮</b> (drei Punkte) tippen.</li><li><b>„Installieren und Verknüpfung erstellen“</b> auswählen (heißt je nach Chrome-Version auch „Zum Startbildschirm hinzufügen“).</li><li><b>Hinzufügen</b> bestätigen.</li></ol></div>' +
      '<div class="mn-sec"><h4>iPhone (Safari)</h4><ol class="mn-ol"><li>Auf das <b>Teilen-Symbol</b> tippen (Quadrat mit Pfeil nach oben, bei neueren Versionen unter <b>•••</b>).</li><li>Nach unten scrollen und <b>„Zum Home-Bildschirm“</b> antippen.</li><li><b>Hinzufügen</b> bestätigen.</li></ol></div>' +
      '<button type="button" class="mn-link" id="mn-back">← zurück</button>';
    $('mn-close').onclick = close; $('mn-back').onclick = function(){ view = 'main'; render(); };
  }

  // --- Auto-Bestand sichern / wiederherstellen (liest/schreibt direkt die gespeicherten Datensätze im Telefon) ---
  function localStock(lo){ try { return JSON.parse(localStorage.getItem('kdw_autobestand_' + lo) || 'null'); } catch(e){ return null; } }
  function stamp(ms){ var t = new Date(ms), z = function(n){ return String(n).padStart(2, '0'); }; return z(t.getDate()) + '.' + z(t.getMonth() + 1) + '. ' + z(t.getHours()) + ':' + z(t.getMinutes()); }
  function paintBackupList(){
    var rows = [];
    Object.keys(D.people).forEach(function(lo){ var d = localStock(lo); if (d) rows.push('<div><b>' + esc(lo) + '</b> · ' + esc(D.people[lo][0]) + ' · ' + Object.keys(d.items || {}).length + ' Artikel · Stand ' + stamp(d.updated) + '</div>'); });
    $('mn-list').innerHTML = rows.length ? rows.join('') : '<div class="mn-muted">Noch kein Auto-Bestand im Telefon gespeichert.</div>';
  }
  function msg(t, ok){ var m = $('mn-msg'); if (m){ m.textContent = t; m.className = 'mn-msg ' + (ok ? 'ok' : 'err'); } }
  function backupSave(){
    var all = {}; Object.keys(D.people).forEach(function(lo){ var d = localStock(lo); if (d) all[lo] = d; });
    var blob = new Blob([JSON.stringify({ kdw_autobestand_backup: 1, created: Date.now(), data: all }, null, 1)], { type: 'application/json' });
    var t = new Date(), z = function(n){ return String(n).padStart(2, '0'); };
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'Auto-Bestand_Sicherung_' + t.getFullYear() + '-' + z(t.getMonth() + 1) + '-' + z(t.getDate()) + '.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(a.href); }, 4000);
    msg('Sicherung gespeichert.', true);
  }
  function backupLoad(e){
    var f = e.target.files && e.target.files[0]; if (!f) return;
    if (!confirm('Die Sicherung ersetzt den aktuellen Auto-Bestand der enthaltenen Lagerorte. Fortfahren?')) return;
    f.text().then(function(txt){
      var j = JSON.parse(txt);
      if (!j || !j.kdw_autobestand_backup || !j.data) throw new Error('Das ist keine Datensicherung des Auto-Bestands.');
      var n = 0;
      Object.keys(j.data).forEach(function(lo){ if (!D.people[lo]) return; var d = j.data[lo]; d.lagerort = lo; d.updated = Date.now(); localStorage.setItem('kdw_autobestand_' + lo, JSON.stringify(d)); n++; try { fetch('/api/autobestand/' + encodeURIComponent(lo), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }).catch(function(){}); } catch(e2){} });   // neuer Zeitstempel -> wird beim nächsten Öffnen auch auf den Server übernommen
      msg('Wiederhergestellt: ' + n + ' Lagerort(e).', true); paintBackupList();
    }).catch(function(err){ msg(err.message || 'Die Datei konnte nicht gelesen werden.', false); });
  }

  function render(){
    if (view === 'center') renderCenters();
    else if (view.indexOf('names:') === 0) renderNames(view.slice(6));
    else if (view === 'home') renderHome();
    else renderMain();
    box.scrollTop = 0;
  }
  function open(startView){
    if (!ov){
      ov = document.createElement('div'); ov.className = 'mn-ov'; ov.id = 'mn-ov';
      box = document.createElement('div'); box.className = 'mn-box'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Menü');
      ov.appendChild(box); document.body.appendChild(ov);
      ov.addEventListener('click', function(e){ if (e.target === ov) close(); });
      document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && ov.classList.contains('mn-show')) close(); });
    }
    view = startView || 'main'; render();
    ov.classList.add('mn-show'); document.documentElement.style.overflow = 'hidden';
  }
  function close(){ if (ov) ov.classList.remove('mn-show'); document.documentElement.style.overflow = ''; }

  // Alle "Menü"-Knöpfe der Seite öffnen dieses Fenster (ohne die Seite zu verlassen)
  function wire(){
    Array.prototype.forEach.call(document.querySelectorAll('.topbar-menu'), function(el){
      el.addEventListener('click', function(e){ e.preventDefault(); open(); });
    });
  }
  window.KDWMenu = { open: open, close: close, changeWho: function(){ open('center'); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
