let stream = null;
const video = document.getElementById('preview-video');
const overlay = document.getElementById('selection-overlay');
const rect = document.getElementById('selection-rect');
const canvas = document.getElementById('portal-canvas');
const ctx = canvas.getContext('2d');

let sel = { x: 0, y: 0, w: 0, h: 0 };
let drawing = false, dragType = null, dragStart = {};
let animFrame = null;

// --- Button wiring ---

document.getElementById('start-btn').addEventListener('click', startCapture);
document.getElementById('lock-btn').addEventListener('click', lockRegion);
document.getElementById('cancel-btn').addEventListener('click', stopCapture);
document.getElementById('adjust-btn').addEventListener('click', adjustRegion);
document.getElementById('stop-btn').addEventListener('click', stopCapture);

// --- Core functions ---

async function startCapture() {
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: false });
    video.srcObject = stream;
    stream.getVideoTracks()[0].addEventListener('ended', stopCapture);
    show('setup-screen');
    rect.style.display = 'none';
    document.getElementById('lock-btn').style.display = 'none';
  } catch (e) {
    console.error(e);
  }
}

function stopCapture() {
  if (animFrame) cancelAnimationFrame(animFrame);
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  video.srcObject = null;
  show('start-screen');
}

function show(id) {
  ['start-screen', 'setup-screen', 'portal-screen'].forEach(s => {
    const el = document.getElementById(s);
    if (s === 'setup-screen') {
      // Keep video decoding when portal is active (display:none stops decoding)
      if (id === 'portal-screen') {
        el.style.position = 'absolute';
        el.style.width = '1px';
        el.style.height = '1px';
        el.style.overflow = 'hidden';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        el.style.display = 'block';
      } else {
        el.style.position = '';
        el.style.width = '';
        el.style.height = '';
        el.style.overflow = '';
        el.style.opacity = '';
        el.style.pointerEvents = '';
        el.style.display = s === id ? 'block' : 'none';
      }
    } else {
      el.style.display = s === id ? (s === 'portal-screen' ? 'block' : 'flex') : 'none';
    }
  });
}

// --- Drawing the selection rectangle ---

overlay.addEventListener('mousedown', (e) => {
  const r = overlay.getBoundingClientRect();
  sel = { x: e.clientX - r.left, y: e.clientY - r.top, w: 0, h: 0 };
  drawing = true;
  rect.style.display = 'block';
  rect.style.pointerEvents = 'none';
  updateRect();

  const onMove = (ev) => {
    if (!drawing) return;
    const r = overlay.getBoundingClientRect();
    sel.w = (ev.clientX - r.left) - sel.x;
    sel.h = (ev.clientY - r.top) - sel.y;
    updateRect();
  };
  const onUp = () => {
    drawing = false;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    normalizeSel();
    if (sel.w > 20 && sel.h > 20) {
      document.getElementById('lock-btn').style.display = 'inline-block';
      enableHandles();
    }
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
});

// --- Handle dragging (move + resize) ---

rect.addEventListener('mousedown', (e) => {
  if (drawing) return;
  const cls = e.target.classList;
  if (cls.contains('move')) dragType = 'move';
  else if (cls.contains('tl')) dragType = 'tl';
  else if (cls.contains('tr')) dragType = 'tr';
  else if (cls.contains('bl')) dragType = 'bl';
  else if (cls.contains('br')) dragType = 'br';
  else return;
  e.stopPropagation();
  dragStart = { mx: e.clientX, my: e.clientY, ...sel };

  const onMove = (ev) => {
    const dx = ev.clientX - dragStart.mx, dy = ev.clientY - dragStart.my;
    if (dragType === 'move') {
      sel.x = dragStart.x + dx; sel.y = dragStart.y + dy;
    } else if (dragType === 'br') {
      sel.w = dragStart.w + dx; sel.h = dragStart.h + dy;
    } else if (dragType === 'tl') {
      sel.x = dragStart.x + dx; sel.y = dragStart.y + dy;
      sel.w = dragStart.w - dx; sel.h = dragStart.h - dy;
    } else if (dragType === 'tr') {
      sel.y = dragStart.y + dy;
      sel.w = dragStart.w + dx; sel.h = dragStart.h - dy;
    } else if (dragType === 'bl') {
      sel.x = dragStart.x + dx;
      sel.w = dragStart.w - dx; sel.h = dragStart.h + dy;
    }
    updateRect();
  };
  const onUp = () => {
    dragType = null;
    normalizeSel();
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
});

// --- Helpers ---

function normalizeSel() {
  if (sel.w < 0) { sel.x += sel.w; sel.w = -sel.w; }
  if (sel.h < 0) { sel.y += sel.h; sel.h = -sel.h; }
}

function updateRect() {
  const x = sel.w >= 0 ? sel.x : sel.x + sel.w;
  const y = sel.h >= 0 ? sel.y : sel.y + sel.h;
  rect.style.left = x + 'px';
  rect.style.top = y + 'px';
  rect.style.width = Math.abs(sel.w) + 'px';
  rect.style.height = Math.abs(sel.h) + 'px';
}

function enableHandles() {
  rect.style.pointerEvents = 'auto';
}

// --- Lock and render portal ---

function lockRegion() {
  const oRect = overlay.getBoundingClientRect();
  const vw = video.videoWidth, vh = video.videoHeight;

  const scale = Math.min(oRect.width / vw, oRect.height / vh);
  const rw = vw * scale, rh = vh * scale;
  const rx = (oRect.width - rw) / 2, ry = (oRect.height - rh) / 2;

  const sx = Math.max(0, (sel.x - rx) / scale);
  const sy = Math.max(0, (sel.y - ry) / scale);
  const sw = Math.min(vw - sx, sel.w / scale);
  const sh = Math.min(vh - sy, sel.h / scale);

  show('portal-screen');
  renderPortal(sx, sy, sw, sh);
}

function renderPortal(sx, sy, sw, sh) {
  canvas.width = Math.round(sw);
  canvas.height = Math.round(sh);

  function draw() {
    if (!stream) return;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    animFrame = requestAnimationFrame(draw);
  }
  draw();
}

function adjustRegion() {
  if (animFrame) cancelAnimationFrame(animFrame);
  show('setup-screen');
}
