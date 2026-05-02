const LOG = (...args) => console.log('[RobloxBgChanger]', ...args);

const STATE = {
  backgroundImage: null,
  blurAmount: 0,
  darknessAmount: 50,
  paddingAmount: 16,
  radiusAmount: 12,
};

const CONTAINER_SELECTORS = [
  '#HomeContainer',
  '#home-container',
  '.home-container',
  '.home-page-container',
  '#game-sort-container',
  '.rbx-game-sort-hub',
  '#Games',
  '#GamesPage',
  '#games-page',
  '.games-page',
  'main[role="main"]',
  '[data-testid="home-container"]',
];

function ensureStyleEl(id) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('style');
    el.id = id;
    (document.head || document.documentElement).appendChild(el);
  }
  return el;
}

function renderBackground() {
  const el = ensureStyleEl('rbx-bg-changer-style');
  if (STATE.backgroundImage) {
    el.textContent = `
      html {
        background-image: url("${STATE.backgroundImage}") !important;
        background-size: cover !important;
        background-position: center !important;
        background-attachment: fixed !important;
        background-repeat: no-repeat !important;
      }
      body, .rbx-body, #content {
        background: transparent !important;
      }
    `;
  } else {
    el.textContent = '';
  }
}

function renderOverlay() {
  const el = ensureStyleEl('rbx-overlay-style');
  const { blurAmount: blur, darknessAmount: dark, paddingAmount: pad, radiusAmount: rad } = STATE;

  // Always emit rules so padding / radius can be applied even with no blur or darkness.
  const bg = dark > 0 ? `rgba(0, 0, 0, ${(dark / 100).toFixed(2)})` : 'transparent';
  const sel = [...CONTAINER_SELECTORS, '.rbx-bg-overlay-target'].join(', ');

  el.textContent = `
    ${sel} {
      background-color: ${bg} !important;
      backdrop-filter: blur(${blur}px) !important;
      -webkit-backdrop-filter: blur(${blur}px) !important;
      padding: ${pad}px !important;
      border-radius: ${rad}px !important;
      overflow: hidden;
    }
  `;
}

function tagFallbackContainer() {
  if (document.getElementById('HomeContainer')) return; // real one exists, no fallback needed
  const candidates = Array.from(document.querySelectorAll('main, #content, [class*="container"], [class*="Container"]'));
  let best = null;
  let bestArea = 0;
  for (const node of candidates) {
    const r = node.getBoundingClientRect();
    const area = r.width * r.height;
    if (area > bestArea && r.width > 600 && r.height > 400 && r.top < window.innerHeight) {
      best = node;
      bestArea = area;
    }
  }
  document.querySelectorAll('.rbx-bg-overlay-target').forEach((n) => n.classList.remove('rbx-bg-overlay-target'));
  if (best) {
    best.classList.add('rbx-bg-overlay-target');
    LOG('Tagged fallback container:', best.tagName, best.id || best.className);
  }
}

function applyAll() {
  renderBackground();
  renderOverlay();
  tagFallbackContainer();
}

chrome.storage.local.get(Object.keys(STATE), (data) => {
  for (const k of Object.keys(STATE)) {
    if (data[k] !== undefined) STATE[k] = data[k];
  }
  LOG('Initial state:', STATE);
  applyAll();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  for (const k of Object.keys(changes)) {
    if (k in STATE) STATE[k] = changes[k].newValue ?? STATE[k];
  }
  applyAll();
});

const observer = new MutationObserver(() => {
  if (!document.getElementById('HomeContainer') && !document.querySelector('.rbx-bg-overlay-target')) {
    tagFallbackContainer();
  }
});
observer.observe(document.documentElement, { childList: true, subtree: true });
