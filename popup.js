const preview = document.getElementById('preview');
const fileInput = document.getElementById('fileInput');
const pickBtn = document.getElementById('pickBtn');
const clearBtn = document.getElementById('clearBtn');
const status = document.getElementById('status');

const sliders = [
  { key: 'blurAmount',     input: 'blurSlider',     value: 'blurValue',     unit: 'px', def: 0 },
  { key: 'darknessAmount', input: 'darknessSlider', value: 'darknessValue', unit: '%',  def: 50 },
  { key: 'paddingAmount',  input: 'paddingSlider',  value: 'paddingValue',  unit: 'px', def: 16 },
  { key: 'radiusAmount',   input: 'radiusSlider',   value: 'radiusValue',   unit: 'px', def: 12 },
];

function setStatus(msg, color = '#7ec47e') {
  status.style.color = color;
  status.textContent = msg;
  setTimeout(() => { status.textContent = ''; }, 2500);
}

function showPreview(dataUrl, type) {
  preview.innerHTML = '';
  if (type === 'video') {
    const v = document.createElement('video');
    v.src = dataUrl;
    v.autoplay = true;
    v.loop = true;
    v.muted = true;
    v.playsInline = true;
    preview.appendChild(v);
  } else {
    const img = document.createElement('img');
    img.src = dataUrl;
    preview.appendChild(img);
  }
}

function clearPreview() {
  preview.innerHTML = '<span>Click "Choose Image"<br>or video to set background</span>';
}

const keys = ['backgroundImage', 'backgroundType', ...sliders.map((s) => s.key)];
chrome.storage.local.get(keys, (data) => {
  if (data.backgroundImage) showPreview(data.backgroundImage, data.backgroundType || 'image');

  for (const s of sliders) {
    const value = data[s.key] ?? s.def;
    const input = document.getElementById(s.input);
    const label = document.getElementById(s.value);
    input.value = value;
    label.textContent = `${value}${s.unit}`;
  }
});

pickBtn.addEventListener('click', () => fileInput.click());
preview.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;

  const isVideo = file.type.startsWith('video/');
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > 50) {
    setStatus(`File is ${sizeMB.toFixed(1)}MB — too large.`, '#ff6b6b');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const type = isVideo ? 'video' : 'image';
    chrome.storage.local.set({ backgroundImage: dataUrl, backgroundType: type }, () => {
      showPreview(dataUrl, type);
      setStatus(`${isVideo ? 'Video' : 'Image'} applied!`);
    });
  };
  reader.onerror = () => setStatus('Failed to read file.', '#ff6b6b');
  reader.readAsDataURL(file);
});

clearBtn.addEventListener('click', () => {
  chrome.storage.local.remove(['backgroundImage', 'backgroundType'], () => {
    clearPreview();
    setStatus('Background removed.', '#aaa');
  });
});

for (const s of sliders) {
  const input = document.getElementById(s.input);
  const label = document.getElementById(s.value);
  input.addEventListener('input', () => {
    const n = parseInt(input.value, 10);
    label.textContent = `${n}${s.unit}`;
    chrome.storage.local.set({ [s.key]: n });
  });
}
