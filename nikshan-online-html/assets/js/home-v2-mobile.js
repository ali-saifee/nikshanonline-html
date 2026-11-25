(() => {
  const mobile = matchMedia('(max-width: 767px)');
  const search = document.querySelector('#product-search');
  const field = search.querySelector('input');
  const suggestions = search.querySelector('ul');
  const title = search.querySelector('h3');
  const template = search.querySelector('template');
  const products = [...window.NIKSHAN.products].sort((a, b) => b.reviews - a.reviews);
  const prices = new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  });

  function suggest() {
    const query = field.value.trim().toLowerCase();
    const matches = products.filter(product => [product.name, product.brand, product.category]
      .some(value => value.toLowerCase().includes(query))).slice(0, 6);
    title.textContent = !query ? 'Top products' : matches.length ? 'Matching products' : 'No products found';
    suggestions.replaceChildren(...matches.map(product => {
      const row = template.content.cloneNode(true);
      row.querySelector('a').href = 'shop.html?search=' + encodeURIComponent(product.name);
      row.querySelector('img').src = product.image;
      row.querySelector('b').textContent = product.name;
      row.querySelector('small').textContent = product.category;
      row.querySelector('strong').textContent = prices.format(product.price);
      return row;
    }));
  }
  document.querySelector('#open-search').addEventListener('click', () => {
    field.value = '';
    suggest();
    search.showModal();
    field.focus();
  });
  field.addEventListener('input', suggest);
  mobile.addEventListener('change', () => {
    if (!mobile.matches && search.open) search.close();
  });

  const offers = document.querySelector('#featured-offers');
  const pages = [...document.querySelectorAll('.offer-pages button')];
  const slides = [...offers.children];
  function slideOffset(slide) {
    return slide.offsetLeft - slides[0].offsetLeft;
  }
  function markPage() {
    if (!mobile.matches) return;
    const nearest = slides.reduce((best, slide) =>
      Math.abs(slideOffset(slide) - offers.scrollLeft) < Math.abs(slideOffset(best) - offers.scrollLeft) ? slide : best);
    pages.forEach((page, index) => {
      if (slides[index] === nearest) page.setAttribute('aria-current', 'true');
      else page.removeAttribute('aria-current');
    });
  }
  pages.forEach((page, index) => page.addEventListener('click', () => {
    offers.scrollTo({ left: slideOffset(slides[index]) });
  }));
  offers.addEventListener('scroll', markPage, { passive: true });
  new ResizeObserver(markPage).observe(offers);
})();
