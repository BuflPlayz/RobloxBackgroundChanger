const LOG = (...args) => console.log('[RobloxBgChanger]', ...args);

const STATE = {
  backgroundImage: null,
  backgroundType: 'image',  // 'image' | 'video'
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

const VIDEO_EL_ID = 'rbx-bg-video';
const VIDEO_STYLE_ID = 'rbx-bg-video-style';

function ensureStyleEl(id) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('style');
    el.id = id;
    (document.head || document.documentElement).appendChild(el);
  }
  return el;
}

function removeVideoBackground() {
  document.getElementById(VIDEO_EL_ID)?.remove();
  document.getElementById(VIDEO_STYLE_ID)?.remove();
}

function applyVideoBackground(dataUrl) {
  // Style for the fixed video element + ensure body/html are transparent so it shows through.
  const style = ensureStyleEl(VIDEO_STYLE_ID);
  style.textContent = `
    html, body, .rbx-body, #content {
      background: transparent !important;
    }
    #${VIDEO_EL_ID} {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      object-fit: cover !important;
      z-index: -1 !important;
      pointer-events: none !important;
      border: none !important;
    }
  `;

  let video = document.getElementById(VIDEO_EL_ID);
  if (!video) {
    video = document.createElement('video');
    video.id = VIDEO_EL_ID;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    (document.body || document.documentElement).appendChild(video);
  }
  if (video.src !== dataUrl) {
    video.src = dataUrl;
    video.play().catch((e) => LOG('Autoplay blocked:', e));
  }
}

function renderBackground() {
  const styleEl = ensureStyleEl('rbx-bg-changer-style');

  if (!STATE.backgroundImage) {
    styleEl.textContent = '';
    removeVideoBackground();
    return;
  }

  if (STATE.backgroundType === 'video') {
    styleEl.textContent = '';  // CSS image rule cleared
    applyVideoBackground(STATE.backgroundImage);
  } else {
    removeVideoBackground();
    styleEl.textContent = `
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
  }
}

function renderOverlay() {
  const el = ensureStyleEl('rbx-overlay-style');
  const { blurAmount: blur, darknessAmount: dark, paddingAmount: pad, radiusAmount: rad } = STATE;
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
  if (document.getElementById('HomeContainer')) return;
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
  LOG('Initial state:', { ...STATE, backgroundImage: STATE.backgroundImage ? '<dataUrl>' : null });
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
  // Re-attach the video element if Roblox's React tree replaces body children
  if (STATE.backgroundType === 'video' && STATE.backgroundImage && !document.getElementById(VIDEO_EL_ID)) {
    applyVideoBackground(STATE.backgroundImage);
  }
  if (!document.getElementById('HomeContainer') && !document.querySelector('.rbx-bg-overlay-target')) {
    tagFallbackContainer();
  }
});
observer.observe(document.documentElement, { childList: true, subtree: true });
