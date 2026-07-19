/* ==========================================================================
   Fight Lab — v2 · JS compartilhado
   Navegação mobile, modais acessíveis, vídeo de intro sob demanda,
   e envio de formulários (Formspree com fallback para e-mail/WhatsApp).
   ========================================================================== */
(function () {
  'use strict';

  // >>> Configure aqui: crie um formulário grátis em https://formspree.io
  //     e cole o endpoint (ex.: https://formspree.io/f/abcdwxyz).
  //     Enquanto estiver vazio, os formulários caem no fallback e-mail/WhatsApp.
  window.FIGHTLAB = window.FIGHTLAB || {};
  var FORM_ENDPOINT = window.FIGHTLAB.formEndpoint || '';
  var CONTACT_EMAIL = 'cauesashihara@gmail.com';
  var WHATSAPP = '5511979690880';

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initModals();
    initIntroVideo();
    initForms();
  });

  /* ---------- Navegação mobile ---------- */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); });
    });
  }

  /* ---------- Modais acessíveis (ESC, clique fora, foco) ---------- */
  var lastFocus = null;
  window.openModal = function (id) {
    var m = document.getElementById(id);
    if (!m) return;
    lastFocus = document.activeElement;
    m.classList.add('open');
    var f = m.querySelector('input,select,textarea,button');
    if (f) f.focus();
  };
  window.closeModal = function (id) {
    var m = document.getElementById(id);
    if (!m) return;
    m.classList.remove('open');
    if (lastFocus) lastFocus.focus();
    var v = m.querySelector('video'); if (v) v.pause();
  };
  function initModals() {
    document.querySelectorAll('.modal').forEach(function (m) {
      m.addEventListener('click', function (e) { if (e.target === m) closeModal(m.id); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var open = document.querySelector('.modal.open');
        if (open) closeModal(open.id);
      }
    });
    document.querySelectorAll('[data-close-modal]').forEach(function (b) {
      b.addEventListener('click', function () { closeModal(b.getAttribute('data-close-modal')); });
    });
    document.querySelectorAll('[data-open-modal]').forEach(function (b) {
      b.addEventListener('click', function () { openModal(b.getAttribute('data-open-modal')); });
    });
  }

  /* ---------- Vídeo de introdução (sob demanda, sem autoplay intrusivo) ---------- */
  function initIntroVideo() {
    var openers = document.querySelectorAll('[data-play-intro]');
    var modal = document.getElementById('videoModal');
    if (!openers.length || !modal) return;
    var video = modal.querySelector('video');
    openers.forEach(function (o) {
      o.addEventListener('click', function () {
        openModal('videoModal');
        if (video) { video.currentTime = 0; var p = video.play(); if (p && p.catch) p.catch(function(){}); }
      });
    });
    if (video) video.addEventListener('ended', function () { closeModal('videoModal'); });
  }

  /* ---------- Formulários (Formspree -> fallback e-mail/WhatsApp) ---------- */
  function initForms() {
    document.querySelectorAll('form[data-fightlab-form]').forEach(function (form) {
      var status = form.querySelector('.form-status');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        var data = collect(form);
        if (FORM_ENDPOINT) {
          submitFormspree(form, data, status);
        } else {
          fallback(form, data, status);
        }
      });
    });
  }
  function collect(form) {
    var out = {};
    new FormData(form).forEach(function (v, k) { out[k] = v; });
    return out;
  }
  function submitFormspree(form, data, status) {
    setStatus(status, '', 'Enviando…');
    fetch(FORM_ENDPOINT, {
      method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form)
    }).then(function (r) {
      if (r.ok) { setStatus(status, 'ok', 'Recebido! Em breve retornamos. 🙏'); form.reset(); }
      else { fallback(form, data, status); }
    }).catch(function () { fallback(form, data, status); });
  }
  function fallback(form, data, status) {
    var subject = form.getAttribute('data-subject') || 'Contato Fight Lab';
    var lines = Object.keys(data).map(function (k) { return k + ': ' + data[k]; });
    var body = lines.join('\n');
    var email = data.email || data.Email || '';
    var recipients = CONTACT_EMAIL + (email ? ',' + email : '');
    var mailto = 'mailto:' + encodeURIComponent(recipients) + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    window.open(mailto, '_blank');
    var wa = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(subject + '\n\n' + body);
    window.open(wa, '_blank');
    setStatus(status, 'ok', 'Abrimos seu e-mail e o WhatsApp com os dados. 👍');
    form.reset();
  }
  function setStatus(el, cls, msg) {
    if (!el) return;
    el.className = 'form-status ' + (cls || '');
    el.textContent = msg;
    el.style.display = 'block';
  }
})();
