const root = document.documentElement;

const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  themeToggle.checked = root.dataset.theme === 'dark';
  themeToggle.addEventListener('change', () => {
    const theme = themeToggle.checked ? 'dark' : 'light';
    root.dataset.theme = theme;
    try {
      localStorage.setItem('nesharem-theme', theme);
    } catch (error) {
      /* ignore */
    }
  });
}

const counter = document.getElementById('visit-count');
if (counter) {
  const today = new Date().toISOString().slice(0, 10);
  let counted = false;
  try {
    counted = localStorage.getItem('nesharem-visit-day') === today;
  } catch (error) {
    /* ignore */
  }

  const endpoint = `${counter.dataset.endpoint ?? '/api/visits'}${counted ? '?mode=get' : '?mode=hit'}`;

  fetch(endpoint, { headers: { accept: 'application/json' } })
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
    .then((data) => {
      if (typeof data.value === 'number') {
        counter.textContent = String(data.value).padStart(4, '0');
        try {
          localStorage.setItem('nesharem-visit-day', today);
        } catch (error) {
          /* ignore */
        }
      }
    })
    .catch(() => {
      counter.textContent = '—';
    });
}

document.querySelectorAll('.footer-bottom [data-year]').forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

document.querySelectorAll('[data-filter-root]').forEach((filterRoot) => {
  const cards = Array.from(
    filterRoot.querySelectorAll('[data-media-card], [data-post-card], [data-gallery-card]')
  );
  const controls = Array.from(filterRoot.querySelectorAll('[data-filter]'));
  const empty = filterRoot.querySelector('.no-results');
  const count = filterRoot.querySelector('[data-filter-count]');

  if (cards.length === 0) return;

  const apply = () => {
    const search = (filterRoot.querySelector('[data-filter="search"]')?.value ?? '')
      .toLowerCase()
      .trim();
    const status = filterRoot.querySelector('[data-filter="status"]')?.value ?? '';
    const year = filterRoot.querySelector('[data-filter="year"]')?.value ?? '';
    const tag = filterRoot.querySelector('[data-filter="tag"]')?.value ?? '';
    const author = filterRoot.querySelector('[data-filter="author"]')?.value ?? '';
    const favorites = filterRoot.querySelector('[data-filter="favorite"]')?.checked ?? false;

    let visible = 0;

    cards.forEach((card) => {
      const haystack = (card.dataset.title ?? card.textContent ?? '').toLowerCase();
      const cardYear = String(card.dataset.year ?? '');
      const cardTags = card.dataset.tags ?? '';
      const matches =
        (!search || haystack.includes(search)) &&
        (!status || card.dataset.status === status) &&
        (!year || cardYear === year) &&
        (!tag || cardTags.split(',').includes(tag)) &&
        (!author || card.dataset.author === author) &&
        (!favorites || card.dataset.favorite === '1');

      card.hidden = !matches;
      if (matches) visible += 1;
    });

    if (count) count.textContent = `${visible} / ${cards.length}`;
    if (empty) empty.classList.toggle('is-visible', visible === 0);
  };

  controls.forEach((control) => {
    control.addEventListener('input', apply);
    control.addEventListener('change', apply);
  });

  apply();
});

window.addEventListener('load', () => {
  const loader = document.querySelector('.page-loader');
  if (loader) {
    window.setTimeout(() => loader.remove(), 500);
  }
});
