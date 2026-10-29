// Menu das páginas secundárias do site novo (treinadores, parceiros e contato).
(() => {
  'use strict';
  const nav = document.getElementById('main-nav');
  const menuButton = document.querySelector('.menu-button');
  if (!nav || !menuButton) return;

  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuButton.focus(); }
  });
  matchMedia('(min-width: 851px)').addEventListener('change', event => { if (event.matches) setMenu(false); });
})();
