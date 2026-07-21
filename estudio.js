/* ==========================================================================
   Fight Lab — Estúdio de personalização (Fabric.js)
   Experiência de editor: Produto · Imagem · Estampas · Texto · Camadas.
   ========================================================================== */
(function () {
  'use strict';
  var WHATSAPP = '5511979690880';
  var stage = document.getElementById('stage');
  var garment = document.getElementById('garment');
  var model = 'homem', color = 'branco', txtColor = '#d61f34';

  /* ---------- Palco + canvas ---------- */
  function stageSize() {
    var wrap = stage.parentElement;
    var maxW = Math.min(460, wrap.clientWidth - 32);
    var maxH = wrap.clientHeight - 32;
    var w = maxW, h = w * 4 / 3;
    if (h > maxH) { h = maxH; w = h * 3 / 4; }
    return { w: Math.round(w), h: Math.round(h) };
  }
  var sz = stageSize();
  stage.style.width = sz.w + 'px';
  stage.style.height = sz.h + 'px';

  var canvas = new fabric.Canvas('c', {
    width: sz.w, height: sz.h, backgroundColor: 'transparent', preserveObjectStacking: true
  });

  // Guia da área de estampa (CSS, não faz parte das camadas)
  var zone = document.createElement('div');
  zone.style.cssText = 'position:absolute;left:28%;top:20%;width:44%;height:40%;border:1.5px dashed rgba(255,255,255,.35);border-radius:6px;pointer-events:none';
  stage.insertBefore(zone, stage.querySelector('.stage-actions'));
  var PZ = { x: 0.28, y: 0.20, w: 0.44, h: 0.40 }; // fração do palco

  /* ---------- Abas ---------- */
  var tools = document.querySelectorAll('.tool');
  tools.forEach(function (t) {
    t.addEventListener('click', function () {
      tools.forEach(function (x) { x.classList.remove('active'); });
      t.classList.add('active');
      document.querySelectorAll('.panel').forEach(function (p) { p.hidden = true; });
      document.getElementById('panel-' + t.dataset.tab).hidden = false;
      if (t.dataset.tab === 'camadas') renderLayers();
    });
  });

  /* ---------- Produto: modelo, cor, tamanho ---------- */
  var COLOR_FILTER = {
    branco: 'none',
    azul: 'brightness(.7) sepia(1) hue-rotate(175deg) saturate(4)',
    preto: 'brightness(.28) contrast(1.15)',
    verde: 'brightness(.5) sepia(1) hue-rotate(55deg) saturate(2.5)'
  };
  // Recolor incide SÓ no tecido do kimono (pixels claros e pouco saturados)
  var COLOR_RGB = { azul: [40, 92, 176], preto: [26, 26, 28], verde: [44, 74, 42] };
  var recolorCache = {};
  function baseSrc() { return model === 'mulher' ? 'assets/mulher.png' : 'assets/homem.png'; }
  function applyGarment() {
    garment.style.filter = 'none';
    if (color === 'branco') { garment.src = baseSrc(); return; }
    var base = baseSrc(), key = base + '|' + color;
    if (recolorCache[key]) { garment.src = recolorCache[key]; return; }
    var img = new Image();
    img.onload = function () {
      var W = img.naturalWidth, H = img.naturalHeight;
      var c = document.createElement('canvas'); c.width = W; c.height = H;
      var x = c.getContext('2d'); x.drawImage(img, 0, 0);
      var im; try { im = x.getImageData(0, 0, W, H); } catch (e) { garment.src = base; garment.style.filter = COLOR_FILTER[color]; return; }
      var d = im.data, tc = COLOR_RGB[color] || [40, 92, 176];
      for (var k = 0; k < d.length; k += 4) {
        if (d[k + 3] < 20) continue;                 // ignora transparência (fundo)
        var r = d[k], g = d[k + 1], b = d[k + 2];
        var lum = (r + g + b) / 3, sat = Math.max(r, g, b) - Math.min(r, g, b);
        // tecido do gi: claro E neutro (r-b baixo). Pele é quente (r-b alto) → fica de fora
        if (lum > 135 && sat < 50 && (r - b) < 40) {
          var t = 0.35 + 0.65 * (lum / 255);         // preserva o sombreado do tecido
          d[k] = Math.round(tc[0] * t); d[k + 1] = Math.round(tc[1] * t); d[k + 2] = Math.round(tc[2] * t);
        }
      }
      x.putImageData(im, 0, 0);
      var url = c.toDataURL('image/png'); recolorCache[key] = url; garment.src = url;
    };
    img.onerror = function () { garment.src = base; garment.style.filter = COLOR_FILTER[color]; };
    img.src = base;
  }
  document.querySelectorAll('[data-model]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('[data-model]').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active'); model = b.dataset.model; applyGarment();
    });
  });
  document.querySelectorAll('[data-color]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('[data-color]').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active'); color = b.dataset.color; applyGarment();
    });
  });

  // Presets de tendência 2026 (aplicam cor + trama num toque)
  var PRESETS = { preto:{c:'preto',t:0}, ultralight:{c:'branco',t:3}, verde:{c:'verde',t:2}, royal:{c:'azul',t:1}, classico:{c:'branco',t:0} };
  document.querySelectorAll('.trend').forEach(function (tb) {
    tb.addEventListener('click', function () {
      document.querySelectorAll('.trend').forEach(function (x) { x.classList.remove('active'); });
      tb.classList.add('active');
      var p = PRESETS[tb.dataset.preset]; if (!p) return;
      var sw = document.querySelector('[data-color="' + p.c + '"]'); if (sw) sw.click();
      var tec = document.getElementById('tecido'); if (tec) tec.selectedIndex = p.t;
    });
  });
  function tecidoVal() { var t = document.getElementById('tecido'); return t ? t.value : '-'; }
  function detalhesVal() { var ds = Array.prototype.slice.call(document.querySelectorAll('.detalhe:checked')).map(function (c) { return c.value; }); return ds.length ? ds.join(', ') : 'nenhum'; }
  var altura = document.getElementById('altura'), peso = document.getElementById('peso'), sizeLabel = document.getElementById('sizeLabel');
  var SIZE_ORDER = ['A0', 'A1', 'A2', 'A2H', 'A3', 'A4', 'A5'];
  function calcSize() {
    var h = parseFloat(altura.value) || 1.70;
    var w = parseInt(peso.value) || 0;
    // Média das tabelas de gi de BJJ (altura em m) — não há A1 universal, então usamos a média das marcas
    var s;
    if (h < 1.56) s = 'A0';
    else if (h < 1.65) s = 'A1';
    else if (h < 1.74) s = 'A2';
    else if (h < 1.83) s = 'A2H';   // A2 alto/longo
    else if (h < 1.91) s = 'A3';
    else if (h < 1.99) s = 'A4';
    else s = 'A5';
    // Refino por peso (robustez): IMC alto sobe meio tamanho
    if (w) {
      var bmi = w / (h * h);
      if (bmi > 28) s = SIZE_ORDER[Math.min(SIZE_ORDER.length - 1, SIZE_ORDER.indexOf(s) + 1)];
    }
    sizeLabel.textContent = s;
  }
  altura.addEventListener('input', calcSize); peso.addEventListener('input', calcSize); calcSize();

  /* ---------- Adicionar objeto na área de estampa ---------- */
  function placeCenter(obj, targetFrac) {
    var zx = PZ.x * sz.w, zy = PZ.y * sz.h, zw = PZ.w * sz.w, zh = PZ.h * sz.h;
    var scale = (zw * (targetFrac || 0.7)) / (obj.width || 100);
    obj.scale(scale);
    obj.set({ left: zx + zw / 2, top: zy + zh / 2, originX: 'center', originY: 'center' });
    canvas.add(obj); canvas.setActiveObject(obj); canvas.requestRenderAll(); renderLayers();
  }

  /* ---------- Imagem (upload) ---------- */
  var imgInput = document.getElementById('imgInput');
  var dz = document.querySelector('.dropzone');
  imgInput.addEventListener('change', function (e) { if (e.target.files[0]) loadImage(e.target.files[0]); });
  ['dragover', 'dragenter'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.style.borderColor = 'var(--primary)'; }); });
  dz.addEventListener('drop', function (e) { e.preventDefault(); dz.style.borderColor = ''; if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]); });
  function loadImage(file) {
    var r = new FileReader();
    r.onload = function (ev) {
      fabric.Image.fromURL(ev.target.result, function (img) { img.set({ _flname: 'Imagem' }); placeCenter(img, 0.8); });
    };
    r.readAsDataURL(file);
  }

  /* ---------- Estampas (biblioteca) ---------- */
  function svgURL(svg) { return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))); }
  var R = '#d61f34';
  var ESTAMPAS = [
    { n: 'Escudo FL', s: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="140" viewBox="0 0 120 140"><path d="M60 4 8 24v46c0 34 24 52 52 66 28-14 52-32 52-66V24z" fill="#111" stroke="'+R+'" stroke-width="5"/><text x="60" y="82" font-family="Arial" font-weight="bold" font-size="44" fill="'+R+'" text-anchor="middle">FL</text></svg>' },
    { n: 'Patch redondo', s: '<svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 130 130"><circle cx="65" cy="65" r="60" fill="#f1c40f" stroke="#111" stroke-width="6"/><text x="65" y="58" font-family="Arial" font-weight="bold" font-size="22" fill="#111" text-anchor="middle">FIGHT</text><text x="65" y="84" font-family="Arial" font-weight="bold" font-size="22" fill="#111" text-anchor="middle">LAB</text></svg>' },
    { n: 'Faixa', s: '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60" viewBox="0 0 180 60"><rect x="4" y="18" width="172" height="24" rx="4" fill="#111"/><rect x="130" y="18" width="34" height="24" fill="'+R+'"/><rect x="136" y="18" width="4" height="24" fill="#fff"/><rect x="144" y="18" width="4" height="24" fill="#fff"/></svg>' },
    { n: 'Estrela', s: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><path d="M60 6l15 34 37 3-28 24 9 36-33-20-33 20 9-36-28-24 37-3z" fill="'+R+'" stroke="#111" stroke-width="3"/></svg>' },
    { n: 'Ossu', s: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="70" viewBox="0 0 160 70"><text x="80" y="50" font-family="Arial" font-weight="900" font-size="44" fill="'+R+'" text-anchor="middle">OSSU</text></svg>' },
    { n: 'Laurel', s: '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="120" viewBox="0 0 140 120"><g fill="none" stroke="'+R+'" stroke-width="5"><path d="M40 110C10 80 12 40 40 14"/><path d="M100 110c30-30 28-70 0-96"/></g><text x="70" y="72" font-family="Arial" font-weight="bold" font-size="30" fill="#fff" text-anchor="middle">FL</text></svg>' }
  ];
  var grid = document.getElementById('estampasGrid');
  ESTAMPAS.forEach(function (e) {
    var url = svgURL(e.s);
    var d = document.createElement('div'); d.className = 'estampa'; d.title = e.n;
    d.innerHTML = '<img src="' + url + '" alt="' + e.n + '">';
    d.addEventListener('click', function () {
      fabric.Image.fromURL(url, function (img) { img.set({ _flname: e.n }); placeCenter(img, 0.5); });
    });
    grid.appendChild(d);
  });

  /* ---------- Texto ---------- */
  document.querySelectorAll('[data-txtcolor]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('[data-txtcolor]').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active'); txtColor = b.dataset.txtcolor;
    });
  });
  document.getElementById('addTextBtn').addEventListener('click', function () {
    var v = document.getElementById('txtValue').value.trim() || 'OSS';
    var font = document.getElementById('txtFont').value;
    var t = new fabric.IText(v, { fontFamily: font.replace(/'/g, ''), fill: txtColor, fontWeight: 'bold', _flname: 'Texto: ' + v });
    placeCenter(t, 0.6);
  });

  /* ---------- Camadas ---------- */
  var layersList = document.getElementById('layersList');
  function renderLayers() {
    var objs = canvas.getObjects();
    if (!objs.length) { layersList.innerHTML = '<p class="empty">Nenhum elemento ainda.</p>'; return; }
    layersList.innerHTML = '';
    objs.slice().reverse().forEach(function (o) {
      var row = document.createElement('div');
      row.className = 'layer' + (o === canvas.getActiveObject() ? ' sel' : '');
      var name = o._flname || (o.type === 'i-text' ? 'Texto' : 'Elemento');
      row.innerHTML = '<span class="lname">' + name + '</span>'
        + '<button title="Subir" data-a="up"><i class="fa-solid fa-arrow-up"></i></button>'
        + '<button title="Descer" data-a="down"><i class="fa-solid fa-arrow-down"></i></button>'
        + '<button title="Excluir" data-a="del"><i class="fa-solid fa-trash"></i></button>';
      row.querySelector('.lname').addEventListener('click', function () { canvas.setActiveObject(o); canvas.requestRenderAll(); renderLayers(); });
      row.querySelector('[data-a="up"]').addEventListener('click', function () { o.bringForward(); canvas.requestRenderAll(); renderLayers(); });
      row.querySelector('[data-a="down"]').addEventListener('click', function () { o.sendBackwards(); canvas.requestRenderAll(); renderLayers(); });
      row.querySelector('[data-a="del"]').addEventListener('click', function () { canvas.remove(o); renderLayers(); });
      layersList.appendChild(row);
    });
  }
  canvas.on('selection:created', renderLayers);
  canvas.on('selection:updated', renderLayers);
  canvas.on('selection:cleared', renderLayers);
  canvas.on('object:added', renderLayers);
  canvas.on('object:removed', renderLayers);

  /* ---------- Ações do palco ---------- */
  document.getElementById('delBtn').addEventListener('click', function () {
    var o = canvas.getActiveObject(); if (o) { canvas.remove(o); renderLayers(); }
  });
  document.getElementById('dupBtn').addEventListener('click', function () {
    var o = canvas.getActiveObject(); if (!o) return;
    o.clone(function (c) { c.set({ left: o.left + 20, top: o.top + 20, _flname: o._flname }); canvas.add(c); canvas.setActiveObject(c); canvas.requestRenderAll(); renderLayers(); });
  });
  document.getElementById('clearBtn').addEventListener('click', function () {
    if (confirm('Remover todos os elementos?')) { canvas.clear(); renderLayers(); }
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Delete' || e.key === 'Backspace') && canvas.getActiveObject() && document.activeElement.tagName !== 'INPUT') {
      canvas.remove(canvas.getActiveObject()); renderLayers();
    }
  });

  /* ---------- Concluir: prévia composta + download + WhatsApp ---------- */
  function composite() {
    var out = document.createElement('canvas'); out.width = sz.w; out.height = sz.h;
    var ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, sz.w, sz.h);
    // desenha o kimono com object-fit contain
    var iw = garment.naturalWidth || sz.w, ih = garment.naturalHeight || sz.h;
    var scale = Math.min(sz.w / iw, sz.h / ih), dw = iw * scale, dh = ih * scale;
    ctx.filter = garment.style.filter && garment.style.filter !== 'none' ? garment.style.filter : 'none';
    ctx.drawImage(garment, (sz.w - dw) / 2, (sz.h - dh) / 2, dw, dh);
    ctx.filter = 'none';
    ctx.drawImage(canvas.lowerCanvasEl, 0, 0);
    return out.toDataURL('image/png');
  }
  function summary() {
    var els = canvas.getObjects().map(function (o) { return o._flname || 'Elemento'; });
    return 'Kimono personalizado — Fight Lab 🥋\n'
      + '• Modelo: ' + (model === 'mulher' ? 'Feminino' : 'Masculino') + '\n'
      + '• Cor: ' + color + '\n'
      + '• Tecido: ' + tecidoVal() + '\n'
      + '• Academia: ' + document.getElementById('academia').value + '\n'
      + '• Altura/Peso: ' + altura.value + ' m / ' + peso.value + ' kg\n'
      + '• Tamanho sugerido: ' + sizeLabel.textContent + ' (a confirmar)\n'
      + '• Detalhes premium: ' + detalhesVal() + '\n'
      + '• Personalizações: ' + (els.length ? els.join(', ') : 'nenhuma') + '\n\nPodem seguir com minha cotação? OSS';
  }
  var CONTACT_EMAIL = 'cauesashihara@gmail.com';
  var FORM_ENDPOINT = (window.FIGHTLAB && window.FIGHTLAB.formEndpoint) || '';
  // Web3Forms: entrega o e-mail COM anexo (grátis). Gere a chave em web3forms.com (só e-mail, sem senha).
  var WEB3_KEY = (window.FIGHTLAB && window.FIGHTLAB.web3formsKey) || '';
  var lastOrderText = '', hiResURL = '', hiResName = 'fightlab-kimono.jpg';

  function dataUrlBytes(u) { var i = u.indexOf(','); return Math.floor((u.length - i - 1) * 3 / 4); }
  function dataUrlToBlob(u) {
    var p = u.split(','), mime = p[0].match(/:(.*?);/)[1], bin = atob(p[1]), n = bin.length, arr = new Uint8Array(n);
    while (n--) arr[n] = bin.charCodeAt(n); return new Blob([arr], { type: mime });
  }
  // Prévia composta em ALTA RESOLUÇÃO, garantindo < 5 MB (reduz qualidade/escala se preciso)
  function makeHiRes(cb) {
    var factor = 3;
    var fabURL = canvas.toDataURL({ format: 'png', multiplier: factor });
    var fimg = new Image();
    fimg.onload = function () {
      var W = Math.round(sz.w * factor), H = Math.round(sz.h * factor);
      var out = document.createElement('canvas'); out.width = W; out.height = H;
      var ctx = out.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
      var iw = garment.naturalWidth || sz.w, ih = garment.naturalHeight || sz.h;
      var s = Math.min(W / iw, H / ih), dw = iw * s, dh = ih * s;
      ctx.filter = (garment.style.filter && garment.style.filter !== 'none') ? garment.style.filter : 'none';
      ctx.drawImage(garment, (W - dw) / 2, (H - dh) / 2, dw, dh); ctx.filter = 'none';
      ctx.drawImage(fimg, 0, 0, W, H);
      var q = 0.92, url = out.toDataURL('image/jpeg', q);
      while (dataUrlBytes(url) > 5 * 1024 * 1024 && q > 0.4) { q -= 0.1; url = out.toDataURL('image/jpeg', q); }
      cb(url);
    };
    fimg.onerror = function () { cb(composite()); };
    fimg.src = fabURL;
  }

  document.getElementById('finishBtn').addEventListener('click', function () {
    canvas.discardActiveObject(); canvas.requestRenderAll();
    document.getElementById('finishSummary').textContent = summary();
    document.getElementById('orderStep').hidden = false;
    document.getElementById('orderDone').hidden = true;
    openModal('finishModal');
    makeHiRes(function (url) {
      hiResURL = url;
      document.getElementById('finishPreview').src = url;
      var dl = document.getElementById('downloadBtn'); dl.href = url; dl.setAttribute('download', hiResName);
    });
  });

  function buildOrder() {
    var name = (document.getElementById('ordName').value || '').trim();
    var email = (document.getElementById('ordEmail').value || '').trim();
    var phone = (document.getElementById('ordPhone').value || '').trim();
    var notes = (document.getElementById('ordNotes').value || '').trim();
    var sleeve = (document.getElementById('ordSleeve').value || '').trim();
    var pants = (document.getElementById('ordPants').value || '').trim();
    var num = 'FL-' + Date.now().toString().slice(-6);
    var els = canvas.getObjects().map(function (o) { return o._flname || 'Elemento'; });
    var body = 'NOVO PEDIDO (DEMO) — Fight Lab\n'
      + 'Pedido: ' + num + '\n\n'
      + 'CLIENTE\n• Nome: ' + name + '\n• E-mail: ' + email + '\n• Telefone/WhatsApp: ' + phone + '\n\n'
      + 'KIMONO\n'
      + '• Modelo: ' + (model === 'mulher' ? 'Feminino' : 'Masculino') + '\n'
      + '• Cor: ' + color + '\n'
      + '• Tecido: ' + tecidoVal() + '\n'
      + '• Academia: ' + document.getElementById('academia').value + '\n'
      + '• Altura/Peso: ' + altura.value + ' m / ' + peso.value + ' kg\n'
      + '• Tamanho sugerido: ' + sizeLabel.textContent + ' (a confirmar)\n'
      + '• Detalhes premium: ' + detalhesVal() + '\n'
      + '• Personalizações: ' + (els.length ? els.join(', ') : 'nenhuma') + '\n\n'
      + 'AJUSTES\n• Manga: ' + (sleeve ? sleeve + ' cm' : 'sem ajuste') + '\n• Calça: ' + (pants ? pants + ' cm' : 'sem ajuste') + '\n\n'
      + 'COMENTÁRIOS DO CLIENTE\n' + (notes || '(nenhum)') + '\n\n'
      + '— Pedido de demonstração; checkout em construção.';
    return { num: num, name: name, email: email, body: body, ok: !!(name && email && phone) };
  }

  document.getElementById('orderForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.target;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var o = buildOrder();
    lastOrderText = o.body;

    // 1) Mostra a confirmação (demo) primeiro — não depende da entrega
    document.getElementById('orderNumber').textContent = 'Pedido ' + o.num + ' registrado';
    document.getElementById('orderStep').hidden = true;
    document.getElementById('orderDone').hidden = false;

    // 2) Entrega com ANEXO em alta resolução
    var blob = hiResURL ? dataUrlToBlob(hiResURL) : null;
    if (WEB3_KEY) {
      // Web3Forms: e-mail com anexo, automático
      var fd = new FormData();
      fd.append('access_key', WEB3_KEY);
      fd.append('subject', 'Novo pedido (demo) ' + o.num + ' - Fight Lab');
      fd.append('from_name', o.name || 'Cliente Fight Lab');
      fd.append('email', o.email || CONTACT_EMAIL);
      fd.append('message', o.body);
      if (blob) fd.append('attachment', blob, hiResName);
      fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd }).catch(function () {});
    } else if (FORM_ENDPOINT) {
      var fd2 = new FormData();
      fd2.append('pedido', o.num); fd2.append('nome', o.name); fd2.append('email', o.email); fd2.append('detalhes', o.body);
      if (blob) fd2.append('anexo', blob, hiResName);
      fetch(FORM_ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' }, body: fd2 }).catch(function () {});
    } else {
      // Sem backend: baixa a imagem em alta resolução e abre o e-mail pra anexar
      if (hiResURL) { var a = document.createElement('a'); a.href = hiResURL; a.download = hiResName; document.body.appendChild(a); a.click(); a.remove(); }
      var mailto = 'mailto:' + encodeURIComponent(CONTACT_EMAIL) + '?cc=' + encodeURIComponent(o.email)
        + '&subject=' + encodeURIComponent('Novo pedido (demo) ' + o.num + ' - Fight Lab')
        + '&body=' + encodeURIComponent(o.body + '\n\n[Anexe a imagem "' + hiResName + '" que acabou de ser baixada no seu dispositivo.]');
      setTimeout(function () { var w = window.open(mailto); if (!w) location.href = mailto; }, 500);
    }
  });

  document.getElementById('waBtn').addEventListener('click', function () {
    window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(lastOrderText || summary()), '_blank');
  });

  applyGarment();
})();
