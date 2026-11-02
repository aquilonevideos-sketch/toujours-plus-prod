const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.matchMedia("(max-width: 860px)").matches;

document.getElementById("year").textContent = new Date().getFullYear();

// --- Amorce de pellicule : 3, 2, 1 (une fois par visite) ---
const leader = document.getElementById("leader");
const startShow = () => {
  leader.classList.add("done");
  document.body.classList.remove("locked");
  document.body.classList.add("intro");
  setTimeout(() => leader.remove(), 700);
};
let seen = false;
try { seen = sessionStorage.getItem("tpp-leader") === "1"; } catch (e) {}

if (seen || reducedMotion) {
  leader.remove();
} else {
  try { sessionStorage.setItem("tpp-leader", "1"); } catch (e) {}
  document.body.classList.add("locked");
  const num = leader.querySelector(".leader-num");
  const sweep = leader.querySelector(".leader-sweep");
  let n = 3;
  const tick = () => {
    if (n === 0) return startShow();
    num.textContent = n;
    sweep.classList.remove("run");
    void sweep.offsetWidth; // relance l'animation
    sweep.classList.add("run");
    n--;
    timer = setTimeout(tick, 800);
  };
  let timer = setTimeout(tick, 200);
  leader.querySelector(".leader-skip").addEventListener("click", () => {
    clearTimeout(timer);
    startShow();
  });
}

// --- Navigation ---
const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector(".nav-links");
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
links.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", false);
  })
);
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// --- Vidéo d'ouverture (muette, en boucle) ---
const heroVideo = document.querySelector(".hero-video");
const heroId = heroVideo.dataset.yt;
heroVideo.style.backgroundImage = `url(https://i.ytimg.com/vi/${heroId}/maxresdefault.jpg)`;
if (!isMobile && !reducedMotion) {
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube-nocookie.com/embed/${heroId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${heroId}&playsinline=1&start=20&rel=0&modestbranding=1`;
  iframe.allow = "autoplay";
  iframe.title = "Extrait de La Fierté des Miens";
  iframe.tabIndex = -1;
  iframe.addEventListener("load", () => setTimeout(() => iframe.classList.add("on"), 1200));
  heroVideo.appendChild(iframe);
}

// --- Timecode du viseur (24 images/seconde) ---
const tc = document.getElementById("timecode");
const t0 = performance.now();
const pad = (v) => String(v).padStart(2, "0");
const runTimecode = () => {
  const ms = performance.now() - t0;
  const s = Math.floor(ms / 1000);
  tc.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(Math.floor((ms % 1000) / (1000 / 24)))}`;
  requestAnimationFrame(runTimecode);
};
if (!reducedMotion) runTimecode();

// --- Lauriers de festival (SVG) ---
const laurelSVG = (() => {
  // Deux branches qui montent le long d'un arc, des paires de feuilles de chaque côté de la tige
  const cx = 100, cy = 70, r = 56, rx = 76; // arc elliptique pour laisser de la place au texte
  const leaf = (x, y, rot, mirror) => {
    const px = mirror ? 200 - x : x;
    const pr = mirror ? -rot : rot;
    return `<ellipse cx="${px.toFixed(1)}" cy="${y.toFixed(1)}" rx="4" ry="10" transform="rotate(${pr.toFixed(0)} ${px.toFixed(1)} ${y.toFixed(1)})"/>`;
  };
  let out = "";
  for (const mirror of [false, true]) {
    for (let deg = 245; deg >= 140; deg -= 15) {
      const a = (deg * Math.PI) / 180;
      const pt = (rad) => [cx + (rad + rx - r) * Math.cos(a), cy - rad * Math.sin(a)];
      const [ox, oy] = pt(r + 7);
      const [ix, iy] = pt(r - 7);
      out += leaf(ox, oy, -deg - 35, mirror) + leaf(ix, iy, -deg + 35, mirror);
    }
    const s = (d) => [cx + rx * Math.cos((d * Math.PI) / 180), cy - r * Math.sin((d * Math.PI) / 180)];
    const [x1, y1] = s(250), [x2, y2] = s(135);
    const m = (x) => (mirror ? 200 - x : x);
    out += `<path d="M${m(x1).toFixed(1)} ${y1.toFixed(1)} A${rx} ${r} 0 0 ${mirror ? 0 : 1} ${m(x2).toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="currentColor" stroke-width="2"/>`;
  }
  return `<svg viewBox="0 0 200 140" aria-hidden="true">${out}</svg>`;
})();
document.querySelectorAll("[data-laurel]").forEach((el) => (el.innerHTML = laurelSVG));

// --- Salle de projection ---
const theater = document.getElementById("theater");
const screen = theater.querySelector(".theater-screen");
const play = (id, external) => {
  // Certaines vidéos n'autorisent pas la lecture hors de YouTube
  if (external) return window.open(`https://www.youtube.com/watch?v=${id}`, "_blank", "noopener");
  screen.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" allow="autoplay; fullscreen" allowfullscreen title="Lecture du film"></iframe>`;
  theater.hidden = false;
  document.body.classList.add("locked");
};
const closeTheater = () => {
  theater.hidden = true;
  screen.innerHTML = "";
  document.body.classList.remove("locked");
};
theater.addEventListener("click", (e) => { if (e.target !== screen.firstChild) closeTheater(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !theater.hidden) closeTheater(); });

document.querySelectorAll(".feature[data-yt], .reel[data-yt]").forEach((el) => {
  const id = el.dataset.yt;
  const img = el.querySelector(".reel-img, .feature-bg");
  img.style.backgroundImage = `url(https://i.ytimg.com/vi/${id}/${el.classList.contains("feature") ? "maxresdefault" : "hqdefault"}.jpg)`;
  const go = () => play(id, el.hasAttribute("data-external"));
  el.addEventListener("click", go);
  el.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
});

// --- Pellicule : boutons de défilement ---
const strip = document.getElementById("strip");
document.querySelectorAll(".strip-nav button").forEach((b) =>
  b.addEventListener("click", () => {
    const step = strip.querySelector(".reel").offsetWidth + 14;
    strip.scrollBy({ left: step * Number(b.dataset.dir), behavior: "smooth" });
  })
);

// --- Apparition au scroll ---
if (!reducedMotion) {
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        observer.unobserve(e.target);
      }
    }),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".section h2, .lead, .split, .pipeline, .feature-inner, .awards, .stills, .cast-card, .trailers, .ticket").forEach((el, i) => {
    el.classList.add("reveal");
    if (el.classList.contains("cast-card")) el.style.transitionDelay = `${(i % 3) * 0.15}s`;
    observer.observe(el);
  });
}

// --- Formulaire de contact : ouvre la messagerie du visiteur ---
document.getElementById("contact-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  const subject = encodeURIComponent("Message de " + f.nom.value);
  const body = encodeURIComponent(f.message.value + "\n\n— " + f.nom.value + " (" + f.email.value + ")");
  window.location.href = "mailto:tjsplusprod@gmail.com?subject=" + subject + "&body=" + body;
});
