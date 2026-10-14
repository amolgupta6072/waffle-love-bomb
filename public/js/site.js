// Mobile navigation
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    document.body.classList.toggle('nav-open', !open);
  });
}

// Filter forms submit as soon as a select changes.
document.querySelectorAll('form[data-autosubmit] select').forEach((select) => {
  select.addEventListener('change', () => select.form.submit());
});

// Header gains a solid background once the page scrolls.
const header = document.querySelector('.site-header');
const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Prevent double submissions.
document.querySelectorAll('form[method="post"]').forEach((form) => {
  form.addEventListener('submit', () => {
    form.querySelectorAll('button[type="submit"]').forEach((b) => { b.disabled = true; });
  });
});

// ---------- Bag ----------
// Stored in this browser only. The server re-checks items and prices at checkout.
const BAG_KEY = 'lynq-bag-v1';
const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const readBag = () => { try { return JSON.parse(localStorage.getItem(BAG_KEY)) || []; } catch { return []; } };
const writeBag = (items) => { try { localStorage.setItem(BAG_KEY, JSON.stringify(items)); } catch { /* storage unavailable */ } renderBag(); };
const bagTotal = (items) => items.reduce((sum, i) => sum + Number(i.price || 0), 0);

function itemRow(i, removable = true) {
  const li = document.createElement('li');
  li.className = 'bag-item';
  const thumb = document.createElement('a');
  thumb.className = 'bag-thumb';
  thumb.href = i.url;
  if (i.image) {
    const img = document.createElement('img');
    img.src = i.image;
    img.alt = '';
    thumb.append(img);
  }
  const info = document.createElement('div');
  info.className = 'bag-info';
  const brand = document.createElement('span');
  brand.className = 'eyebrow';
  brand.textContent = i.brand;
  const name = document.createElement('a');
  name.className = 'bag-name';
  name.href = i.url;
  name.textContent = i.name;
  const price = document.createElement('span');
  price.className = 'bag-price';
  price.textContent = inr(i.price);
  info.append(brand, name, price);
  li.append(thumb, info);
  if (removable) {
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'bag-remove';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => writeBag(readBag().filter((x) => x.slug !== i.slug)));
    info.append(remove);
  }
  return li;
}

function fillList(list, items, removable) {
  if (!list) return;
  list.replaceChildren(...items.map((i) => itemRow(i, removable)));
}

function renderBag() {
  const items = readBag();
  document.querySelectorAll('[data-bag-count]').forEach((el) => { el.textContent = items.length; el.hidden = !items.length; });
  document.querySelectorAll('[data-bag-total]').forEach((el) => { el.textContent = inr(bagTotal(items)); });
  document.querySelectorAll('[data-bag-list]').forEach((list) => fillList(list, items, list.dataset.bagList !== 'static'));
  document.querySelectorAll('[data-bag-empty]').forEach((el) => { el.hidden = items.length > 0; });
  document.querySelectorAll('[data-bag-full]').forEach((el) => { el.hidden = items.length === 0; });
  document.querySelectorAll('[data-add-to-bag]').forEach((btn) => {
    const inBag = items.some((x) => x.slug === btn.dataset.bagSlug);
    btn.textContent = inBag ? 'In your bag' : 'Add to bag';
  });
  // Checkout: hidden list of slugs, and PAN required above ₹2 lakh.
  const itemsField = document.querySelector('input[name="items"]');
  if (itemsField) itemsField.value = items.map((i) => i.slug).join(',');
  const pan = document.querySelector('[data-pan]');
  if (pan) {
    const needed = bagTotal(items) > 200000;
    pan.hidden = !needed;
    const input = pan.querySelector('input');
    if (input) input.required = needed;
  }
}

const drawer = document.querySelector('.bag-drawer');
const openDrawer = () => { if (!drawer) return; drawer.hidden = false; requestAnimationFrame(() => drawer.classList.add('open')); };
const closeDrawer = () => { if (!drawer) return; drawer.classList.remove('open'); setTimeout(() => { drawer.hidden = true; }, 300); };
document.querySelectorAll('[data-open-bag]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); openDrawer(); }));
document.querySelectorAll('[data-close-bag]').forEach((el) => el.addEventListener('click', closeDrawer));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

document.querySelectorAll('[data-add-to-bag]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const d = btn.dataset;
    const items = readBag();
    if (!items.some((x) => x.slug === d.bagSlug)) {
      items.push({ slug: d.bagSlug, name: d.bagName, brand: d.bagBrand, price: Number(d.bagPrice), image: d.bagImage || '', url: d.bagUrl });
      writeBag(items);
    }
    openDrawer();
  });
});

// Checkout: remember the order for the confirmation page, then clear the bag.
const checkoutForm = document.querySelector('form[data-checkout]');
if (checkoutForm) {
  checkoutForm.addEventListener('submit', () => {
    try { sessionStorage.setItem('lynq-last-order', JSON.stringify(readBag())); } catch { /* ignore */ }
  });
  checkoutForm.querySelectorAll('input[name="payment"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      checkoutForm.querySelectorAll('[data-pay-panel]').forEach((p) => { p.hidden = p.dataset.payPanel !== radio.value; });
    });
  });
}

const confirmed = document.querySelector('[data-order-confirmed]');
if (confirmed) {
  let order = [];
  try { order = JSON.parse(sessionStorage.getItem('lynq-last-order')) || []; } catch { /* ignore */ }
  if (order.length) {
    fillList(confirmed.querySelector('[data-order-list]'), order, false);
    const total = confirmed.querySelector('[data-order-total]');
    if (total) total.textContent = inr(bagTotal(order));
    confirmed.querySelectorAll('[data-order-has-items]').forEach((el) => { el.hidden = false; });
  }
  try { localStorage.removeItem(BAG_KEY); } catch { /* ignore */ }
}

renderBag();
