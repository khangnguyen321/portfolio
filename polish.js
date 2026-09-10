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
