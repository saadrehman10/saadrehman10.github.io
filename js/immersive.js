const canvas = document.querySelector('canvas');
const progressFill = document.querySelector('.progress-fill');
const sectionLabel = document.querySelector('.section-label b');
const hint = document.querySelector('.hint');
const loader = document.querySelector('.loader');
const loaderPct = document.querySelector('.loader .pct');
const heroCopy = document.querySelector('.hero-copy');
const projects = document.querySelector('.projects');

const sections = [
  { label: 'intro', depth: 0.0 },
  { label: 'about', depth: 0.18 },
  { label: 'focus', depth: 0.46 },
  { label: 'work', depth: 0.72 },
  { label: 'contact', depth: 0.92 }
];

let scrollProgress = 0;
let hasLoaded = false;
let currentSection = 0;
let ticking = false;

function updateProgress() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  scrollProgress = window.scrollY / maxScroll;
  progressFill.style.height = `${Math.min(100, Math.max(0, scrollProgress * 100))}%`;

  const section = sections.reduce((prev, curr) => scrollProgress >= curr.depth ? curr : prev, sections[0]);
  if (section.label !== sections[currentSection].label) {
    currentSection = sections.findIndex((item) => item.label === section.label);
    sectionLabel.textContent = section.label;
  }

  hint.style.opacity = scrollProgress > 0.12 ? '0' : '1';

  const heroRange = 0.15;
  const heroOpacity = Math.max(0, 1 - scrollProgress / heroRange);
  heroCopy.style.opacity = heroOpacity;
  heroCopy.style.transform = `translateY(${(1 - heroOpacity) * 18}px) rotateX(${(1 - heroOpacity) * 6}deg)`;

  if (projects) {
    const projectsOffset = Math.max(0, window.scrollY - window.innerHeight * 0.9);
    projects.style.transform = `translate3d(0, ${projectsOffset * 0.025}px, 0)`;
  }
}

function reveal() {
  if (hasLoaded) return;
  hasLoaded = true;
  let progress = 0;
  const tick = () => {
    progress += 1;
    loaderPct.textContent = `${progress}%`;
    if (progress >= 100) {
      loader.classList.add('done');
      return;
    }
    setTimeout(tick, 10);
  };
  tick();
}

function initFallbackScene() {
  const ctx = canvas.getContext('2d');
  let frameId = 0;
  let lastFrame = performance.now();

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  function draw() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const now = performance.now();
    const delta = (now - lastFrame) / 1000;
    lastFrame = now;
    const time = now * 0.001;
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createRadialGradient(width * 0.35, height * 0.25, 0, width * 0.35, height * 0.25, width * 0.8);
    gradient.addColorStop(0, 'rgba(244, 162, 97, 0.24)');
    gradient.addColorStop(0.5, 'rgba(10, 10, 10, 0.15)');
    gradient.addColorStop(1, 'rgba(6, 6, 6, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width * 0.78, height * 0.2, 0, width * 0.78, height * 0.2, width * 0.32);
    glow.addColorStop(0, 'rgba(98, 180, 208, 0.22)');
    glow.addColorStop(1, 'rgba(98, 180, 208, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width * 0.5, height * 0.5);
    ctx.scale(1 + Math.sin(time * 0.4) * 0.04, 1 + Math.sin(time * 0.3) * 0.04);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 170 + Math.sin(time * 0.8) * 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 240 + Math.sin(time * 0.6) * 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 300 + Math.sin(time * 0.5) * 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    for (let i = 0; i < 110; i += 1) {
      const x = (i * 97 + time * 30) % (width + 120) - 60;
      const y = (height * 0.2) + ((i % 7) * 38) + Math.sin(time + i) * 20;
      ctx.beginPath();
      ctx.arc(x, y, 1.1 + (i % 3) * 0.4 + Math.sin(time * 1.4 + i) * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    const drift = Math.sin(time * 0.4) * 18;
    ctx.save();
    ctx.translate(width * 0.1 + drift, height * 0.16);
    ctx.strokeStyle = 'rgba(244,162,97,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(width * 0.2, height * 0.05 + Math.sin(time) * 20, width * 0.45, height * 0.12);
    ctx.stroke();
    ctx.restore();

    frameId = requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener('resize', resize);
}

async function initScene() {
  try {
    const threeModule = await import('https://unpkg.com/three@0.185.0/build/three.module.js');
    const THREE = threeModule.default || threeModule;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060606, 0.06);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const group = new THREE.Group();
    scene.add(group);

    const material = new THREE.MeshPhysicalMaterial({
      color: 0xe8c59b,
      metalness: 0.2,
      roughness: 0.25,
      transmission: 0.15,
      transparent: true,
      emissive: 0x111111,
      clearcoat: 0.7
    });

    const geometry = new THREE.TorusKnotGeometry(1.3, 0.35, 220, 24);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = 0.6;
    mesh.rotation.y = 0.7;
    group.add(mesh);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.2, 0.01, 24, 180),
      new THREE.MeshBasicMaterial({ color: 0xf4a261, transparent: true, opacity: 0.5 })
    );
    group.add(ring);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    const point = new THREE.PointLight(0xf4a261, 18, 30);
    point.position.set(3, 2, 4);
    scene.add(point);

    const clock = new THREE.Clock();

    const renderFrame = () => {
      const elapsed = clock.getElapsedTime();
      mesh.rotation.y = elapsed * 0.2 + 0.7;
      mesh.rotation.x = 0.5 + Math.sin(elapsed * 0.4) * 0.12;
      group.position.y = Math.sin(elapsed * 0.8) * 0.08;
      ring.rotation.z = elapsed * 0.08;
      renderer.render(scene, camera);
      requestAnimationFrame(renderFrame);
    };

    renderFrame();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  } catch (error) {
    console.warn('Three.js not available, using fallback renderer.', error);
    initFallbackScene();
  }
}

const revealItems = Array.from(document.querySelectorAll('.reveal'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.18 });

revealItems.forEach((item) => observer.observe(item));

window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      updateProgress();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

window.addEventListener('resize', updateProgress);

let pointerX = 0;
let pointerY = 0;

document.addEventListener('pointermove', (event) => {
  pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
  pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
  document.documentElement.style.setProperty('--pointer-x', `${pointerX}`);
  document.documentElement.style.setProperty('--pointer-y', `${pointerY}`);
});

window.addEventListener('load', () => {
  updateProgress();
  reveal();
  initScene();
});

updateProgress();
