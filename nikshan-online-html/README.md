# Nikshan Online: HTML / CSS / JavaScript version

A plain HTML/CSS/JS copy of the Nikshan Online storefront. It needs no React, no Node and
no server code: open `index.html` in a browser, or upload the folder to any web host.

## Files
```
index.html          Home page: 3-slide hero banner, deal tiles, categories, 7 category sections
                    with colour banners, 3 feature banners, brand marquee, trust band, footer
shop.html           Shop page: category sidebar, sort menu, search results, brand/offer filters
success.html        Order confirmation page
cancel.html         Checkout cancelled page
assets/css/styles.css   All styles (compiled Tailwind CSS + animations)
assets/js/data.js       Product catalogue: 55 products, 8 categories, brands (edit prices/products here)
assets/js/app.js        All interactions: hero slider, All Categories + More menus, product cards,
                        cart drawer, shop filters, checkout
```

## What works
- Hero banner slider: auto-plays every 6 seconds, with arrows and dots
- "All Categories" menu (hover a category to preview it) and the "More" menu; Esc or a click outside closes them
- Add to cart: opens the cart drawer and shows a confirmation message; change quantities, remove items.
  The cart is saved in the browser, so it survives a page reload.
- Search box, category / brand / offer links, sorting on the Shop page
- Checkout goes to the order confirmation page

## How to use
- **View it:** double-click `index.html`, or upload the whole folder to your web host.
- **Edit text and layout:** edit the `.html` files. Product sections, category banners and the menus
  are built by `assets/js/app.js`. The category banner text and colours are in the `BANNERS` list there.
- **Edit products:** change `assets/js/data.js` (name, price, MRP, image, category, tags).
  Tags: `featured`, `premium`, `under299`.

## Notes
- Needs an internet connection for images, fonts (Google Fonts) and icons (Lucide, loaded from unpkg).
- Checkout is a **DEMO**: no payment is taken, and the order is only saved in the visitor's browser.
  Real payments need a payment provider (e.g. Razorpay or Stripe) and a server.
- `styles.css` contains only the Tailwind classes used in these files. If you add new Tailwind
  class names, rebuild it from this folder with:
  `npx tailwindcss@3 -c tailwind.config.js -i assets/css/tailwind-input.css -o assets/css/styles.css --minify`
  (or just write normal CSS in a separate file).
