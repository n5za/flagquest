let canvas = null;
let ctx2d = null;
let particles = [];
let rafId = 0;

const COLORS = ['#58cc02', '#1cb0f6', '#ffc800', '#ff4b4b', '#ce82ff', '#ff9600'];

function ensureCanvas() {
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.style.cssText =
      'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);
    ctx2d = canvas.getContext('2d');
    const resize = () => {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      ctx2d.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
  }
  return ctx2d;
}

function loop() {
  ctx2d.clearRect(0, 0, window.innerWidth, window.innerHeight);
  particles = particles.filter((p) => p.life > 0);
  for (const p of particles) {
    p.x += p.vx * 0.016;
    p.y += p.vy * 0.016;
    p.vy += p.g * 0.016;
    p.vx *= 0.99;
    p.rot += p.vr * 0.016;
    p.life -= p.decay;
    ctx2d.save();
    ctx2d.globalAlpha = Math.max(0, p.life);
    ctx2d.translate(p.x, p.y);
    ctx2d.rotate(p.rot);
    ctx2d.fillStyle = p.color;
    if (p.shape === 'rect') ctx2d.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    else {
      ctx2d.beginPath();
      ctx2d.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx2d.fill();
    }
    ctx2d.restore();
  }
  if (particles.length) rafId = requestAnimationFrame(loop);
  else {
    rafId = 0;
    ctx2d.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

export function burst(x = window.innerWidth / 2, y = window.innerHeight / 2, { count = 70, power = 6, colors = COLORS } = {}) {
  ensureCanvas();
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.6;
    const v = (Math.random() * 0.8 + 0.3) * power * 12;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      g: 320,
      size: 5 + Math.random() * 6,
      color: colors[(Math.random() * colors.length) | 0],
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 14,
      life: 1,
      decay: 0.006 + Math.random() * 0.008,
      shape: Math.random() < 0.5 ? 'rect' : 'circle',
    });
  }
  if (!rafId) loop();
}
