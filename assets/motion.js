/* Movimento de apresentação apenas. Não lê nem altera planos, cadastro ou catálogo. */
(() => {
  'use strict';
  window.createEonEditorialMotion = ({ enabled = true } = {}) => {
    const units = [];
    let observer;
    const narrow = matchMedia('(max-width: 600px)');
    const canObserve = 'IntersectionObserver' in window;

    function show(unit) {
      unit.element.classList.remove('eon-motion-pending');
      unit.element.classList.add('eon-motion-shown');
      if (unit.copy) {
        unit.copy.classList.remove('eon-motion-pending');
        unit.copy.classList.add('eon-motion-shown');
      }
      unit.shown = true;
      observer?.unobserve(unit.element);
    }
    function register(element, copy = null) {
      const unit = { element, copy, shown: false };
      units.push(unit);
      if (!enabled || !canObserve) { show(unit); return; }
      element.classList.add('eon-motion-pending');
      copy?.classList.add('eon-motion-pending');
    }
    function wrapLines(heading) {
      const existing = [...heading.querySelectorAll(':scope > .statement-line')];
      if (existing.length) return existing;
      const fragment = document.createDocumentFragment();
      let line = document.createElement('span');
      fragment.append(line);
      for (const node of [...heading.childNodes]) {
        if (node.nodeName === 'BR') {
          fragment.append(document.createTextNode(' '));
          line = document.createElement('span');
          fragment.append(line);
        } else line.append(node);
      }
      heading.replaceChildren(fragment);
      return [...heading.children];
    }
    function support(copy, selector) {
      [...copy.querySelectorAll(selector)].forEach((element, index) => {
        element.classList.add('eon-motion-support');
        element.style.setProperty('--eon-support-delay', `${Math.min(160 + index * 110, 490)}ms`);
      });
    }

    // As linhas são nós de texto normais, sem duplicação para leitores de tela.
    const headingIds = ['hero-title', 'community-title', 'method-title', 'coaches-title', 'race-title', 'stories-title'];
    headingIds.forEach(id => {
      const heading = document.getElementById(id);
      if (!heading) return;
      heading.classList.add('eon-motion-heading');
      wrapLines(heading).forEach((line, index) => {
        line.classList.add('eon-motion-line');
        line.style.setProperty('--eon-line-order', index);
      });
      const copy = heading.closest('.hero-copy, .community-copy, .section-heading, .coaches-head, .race-copy, .stories-header');
      if (copy) {
        copy.classList.add('eon-motion-copy');
        support(copy, '.eyebrow, .hero-kicker, p, a.button, a.text-link, small');
      }
      register(heading, copy);
    });

    document.querySelectorAll('[data-motion-scene]').forEach(scene => {
      [...scene.querySelectorAll('.floating-photo')].forEach((frame, index) => {
        const shell = frame.querySelector(':scope > .float-shell');
        if (!shell) return;
        const layer = document.createElement('div');
        layer.className = 'eon-frame-entry';
        layer.style.setProperty('--eon-entry-delay', `${index * (narrow.matches ? 45 : 90)}ms`);
        shell.before(layer);
        layer.append(shell);
        register(layer);
      });
    });
    ['.coach-grid', '.method-grid'].forEach(selector => {
      document.querySelectorAll(selector).forEach(grid => {
        const columns = getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length;
        [...grid.children].forEach((card, index) => {
          card.classList.add('eon-card-entry');
          // Índice da ordem já sorteada; não privilegia um treinador fixo.
          card.style.setProperty('--eon-entry-delay', `${(index % columns) * (narrow.matches ? 45 : 75)}ms`);
          register(card);
        });
      });
    });

    if (enabled && canObserve) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const unit = units.find(item => item.element === entry.target);
          if (unit) show(unit);
        });
      }, { threshold: .08, rootMargin: '0px 0px -3% 0px' });
      units.forEach(unit => observer.observe(unit.element));
      // O foco sempre prevalece sobre a decoração, inclusive numa navegação rápida.
      document.addEventListener('focusin', event => {
        units.forEach(unit => {
          if (!unit.shown && (unit.copy || unit.element).contains(event.target)) show(unit);
        });
      });
    }
    return {
      setEnabled(value) {
        enabled = value;
        if (!enabled) {
          units.forEach(show);
          observer?.disconnect();
        }
      }
    };
  };
})();
