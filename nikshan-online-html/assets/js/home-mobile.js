// Use the same cart button and badge in both layouts.
(() => {
  const phone = matchMedia('(max-width: 767px)');
  const cart = document.querySelector('#cart-button');
  const desktopPosition = document.createComment('Header cart');
  cart.before(desktopPosition);
  const profileButton = document.querySelector('#mobile-profile-button');
  const profile = document.querySelector('#mobile-profile');

  const categories = document.querySelector('#mobile-categories');
  const categoriesButton = document.querySelector('#mobile-categories-button');
  const desktopMenu = document.querySelector('#allcat-panel');
  const menuContent = desktopMenu.firstElementChild;

  categoriesButton.addEventListener('click', () => {
    categories.append(menuContent);
    categories.showModal();
    categoriesButton.setAttribute('aria-expanded', 'true');
  });
  categories.addEventListener('close', () => {
    desktopMenu.append(menuContent);
    categoriesButton.setAttribute('aria-expanded', 'false');
    if (phone.matches) categoriesButton.focus({ preventScroll: true });
  });
  categories.addEventListener('click', event => {
    if (event.target === categories && event.clientX >= categories.getBoundingClientRect().right) {
      categories.close();
    }
  });

  function placeCart() {
    if (phone.matches) {
      profileButton.before(cart);
    } else {
      desktopPosition.after(cart);
      if (profile.open) profile.close();
      if (categories.open) categories.close();
    }
  }
  placeCart();
  phone.addEventListener('change', placeCart);

  profileButton.addEventListener('click', () => {
    let orders = [];
    try {
      orders = Object.values(JSON.parse(localStorage.getItem('nikshan_orders') || '{}'))
        .filter(order => order && typeof order.id === 'string' && Number.isFinite(order.amount))
        .sort((a, b) => b.created - a.created);
    } catch { /* Storage may be unavailable in private browsing. */ }
    const list = document.querySelector('#profile-orders');
    list.replaceChildren();
    if (!orders.length) list.textContent = 'No orders on this device yet.';
    for (const order of orders) {
      const link = document.createElement('a');
      link.href = 'success.html?session_id=' + encodeURIComponent(order.id);
      link.textContent = 'View order · ₹' + order.amount.toLocaleString('en-IN');
      list.append(link);
    }
    profile.showModal();
  });

  // Keep the existing carousel controls and timer in sync with a horizontal swipe.
  const hero = document.querySelector('.hero-band');
  let origin;
  hero.addEventListener('touchstart', event => {
    const touch = event.touches[0];
    origin = phone.matches && event.touches.length === 1 ? [touch.clientX, touch.clientY] : null;
  }, { passive: true });
  hero.addEventListener('touchcancel', () => { origin = null; });
  hero.addEventListener('touchend', event => {
    if (!origin) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - origin[0], dy = touch.clientY - origin[1];
    origin = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > 2 * Math.abs(dy)) {
      document.querySelector(dx < 0 ? '#hero-next' : '#hero-prev').click();
    }
  }, { passive: true });
})();
