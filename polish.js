/* Small progressive enhancements; the content and contact links work without them. */
(() => {
  const header = document.getElementById('header');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');
  const close = (restoreFocus = false) => {
    header.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.querySelector('span').textContent = '+';
    if (restoreFocus) toggle.focus();
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('span').textContent = open ? '−' : '+';
  });
  nav.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    close();
    if (matchMedia('(max-width: 920px)').matches) {
      const section = document.querySelector(link.hash);
      section.setAttribute('tabindex', '-1');
      section.focus({ preventScroll: true });
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) close(true);
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) close();
  });
  header.addEventListener('focusout', () => {
    requestAnimationFrame(() => { if (!header.contains(document.activeElement)) close(); });
  });
  matchMedia('(min-width: 921px)').addEventListener('change', () => close());
})();

/* Pointer lighting and physical depth, without another continuous animation loop. */
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  document.querySelectorAll('.svc, .wcard, .step, .appr-row .vis').forEach(card => {
    card.classList.add('depth-card');
    let frame = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      card.style.removeProperty('--rx');
      card.style.removeProperty('--ry');
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
      card.classList.remove('depth-active');
    };
    card.addEventListener('pointermove', event => {
      if (motion.matches || !fine.matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = card.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));
        const y = Math.max(0, Math.min(1, (event.clientY - box.top) / box.height));
        card.style.setProperty('--rx', `${(0.5 - y) * 9}deg`);
        card.style.setProperty('--ry', `${(x - 0.5) * 11}deg`);
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
        card.classList.add('depth-active');
      });
    }, { passive: true });
    card.addEventListener('pointerleave', reset);
    motion.addEventListener('change', reset);
    fine.addEventListener('change', reset);
  });
})();
