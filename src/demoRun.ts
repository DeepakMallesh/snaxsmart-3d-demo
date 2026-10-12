// @ts-nocheck
import { createMachine } from './machine';
import logoUrl from './assets/logo.png';
import machineUrl from './assets/machine.png';
import rack from './photos/rack.jpg';
import g1 from './photos/g1.jpg'; import g2 from './photos/g2.jpg'; import g3 from './photos/g3.jpg';
import g4 from './photos/g4.jpg'; import g5 from './photos/g5.jpg'; import g6 from './photos/g6.jpg';
import blog1 from './photos/blog1.jpg'; import blog2 from './photos/blog2.jpg';

const ASSETS = { logo: logoUrl, machine: machineUrl, rack, g1, g2, g3, g4, g5, g6, blog1, blog2 };
let ioSeen = false;
let revealIO = null;

export function initPage() {
  document.querySelectorAll('[data-asset]').forEach(function (i) { var u = ASSETS[i.getAttribute('data-asset')]; if (u && i.getAttribute('src') !== u) i.src = u; });
  var sel = '.fc,.dcard,.ts,.bcard,.irow,.sp,.job,.news,.gi,.mapbox,.maplist,.ic,.enq,.svcgrid,.tl';
  if (!('IntersectionObserver' in window)) { document.querySelectorAll(sel).forEach(function (e) { e.classList.add('rv', 'in'); }); return; }
  if (!revealIO) revealIO = new IntersectionObserver(function (es) { ioSeen = true; es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } }); }, { threshold: .12 });
  document.querySelectorAll(sel).forEach(function (e) {
    if (e.classList.contains('rv')) return;
    if (e.classList.contains('svcgrid') || e.classList.contains('tl')) { if (e.classList.contains('tl')) { e.classList.add('rv0'); revealIO.observe(e); } return; }
    e.classList.add('rv'); revealIO.observe(e);
  });
  setTimeout(function () { if (!ioSeen) document.querySelectorAll('.rv,.tl').forEach(function (e) { e.classList.add('in'); }); }, 2500);
}

var delegated = false;
function delegate() {
  if (delegated) return; delegated = true;
  var cur = null;
  function reset(el) { if (!el) return; el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); }
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var el = e.target.closest ? e.target.closest('.tilt') : null;
    if (cur && cur !== el) reset(cur);
    cur = el; if (!el) return;
    var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
    var big = el.classList.contains('dcard') || el.classList.contains('mstage');
    el.style.setProperty('--rx', (-py * (big ? 7 : 9)).toFixed(2) + 'deg'); el.style.setProperty('--ry', (px * (big ? 9 : 11)).toFixed(2) + 'deg');
  });
  document.addEventListener('pointerleave', function () { reset(cur); cur = null; }, true);
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('.tb') : null;
    if (t) { var w = t.closest('.wrap'); w.querySelectorAll('.tb').forEach(function (b) { b.classList.toggle('on', b === t); }); w.querySelectorAll('.tp').forEach(function (p) { p.classList.toggle('on', p.dataset.pane === t.dataset.tab); }); setTimeout(initPage, 30); }
    var c = e.target.closest ? e.target.closest('[data-city]') : null;
    if (c) { var on = !c.classList.contains('hl'); document.querySelectorAll('[data-city].hl').forEach(function (x) { x.classList.remove('hl'); }); if (on) document.querySelectorAll('[data-city="' + c.dataset.city + '"]').forEach(function (x) { x.classList.add('hl'); }); }
  });
  document.addEventListener('pointerover', function (e) {
    var c = e.target.closest ? e.target.closest('[data-city]') : null; if (!c || e.pointerType === 'touch') return;
    document.querySelectorAll('[data-city="' + c.dataset.city + '"]').forEach(function (x) { x.classList.add('hl'); });
  });
  document.addEventListener('pointerout', function (e) {
    var c = e.target.closest ? e.target.closest('[data-city]') : null; if (!c || e.pointerType === 'touch') return;
    document.querySelectorAll('[data-city="' + c.dataset.city + '"]').forEach(function (x) { x.classList.remove('hl'); });
  });
}

function story() {
  var host = document.getElementById('m2'), fl = document.getElementById('sfloat'), stage = document.getElementById('stage');
  var rows = Array.prototype.slice.call(document.querySelectorAll('#story .srow'));
  if (!host || !fl || !stage) return;
  var m = null, activeK = -1, dropRaf = 0, dropV = 0, dropTo = 0;
  try { m = createMachine(host, { logo: logoUrl, rest: -0.22 }); m.setGlow(false); } catch (e) {
    var im = document.createElement('img'); im.src = machineUrl; im.alt = 'SnaxSmart vending machine';
    im.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block'; host.appendChild(im);
  }
  var lastD = 0;
  function dropTick(now) {
    var dt = Math.min(.25, (now - (lastD || now)) / 1000); lastD = now;
    dropV += (dropTo - dropV) * (1 - Math.exp(-dt * 2.2)); if (Math.abs(dropTo - dropV) < .004) dropV = dropTo;
    if (m) m.setDrop(dropV);
    if (dropV !== dropTo) dropRaf = requestAnimationFrame(dropTick); else lastD = 0;
  }
  function drop(to) { dropTo = to; cancelAnimationFrame(dropRaf); lastD = 0; dropRaf = requestAnimationFrame(dropTick); }
  var copy = [null,
    ['Pick a snack', 'Choose from healthy bars, nuts, chips, juices and more.'],
    ['Pay with UPI or card', '100% cashless. Scan the QR, tap your card or use a wallet.'],
    ['Dispensed. We handle the rest.', 'Vend sensors confirm the drop. Our team monitors stock and refills it for you.']];
  var card = document.getElementById('sfcard'), views = ['full', 'products', 'qr', 'tray'], timers = [];
  function place() {
    var fr = fl.firstElementChild, fh = fr.offsetHeight, r = rows[Math.max(activeK, 0)], mob = innerWidth <= 900;
    stage.style.setProperty('--fh', fh + 'px');
    var y = mob ? r.offsetTop : r.offsetTop + (r.offsetHeight - fh) / 2;
    fl.style.transform = 'translateY(' + Math.max(0, y).toFixed(0) + 'px)';
    var cy = mob ? r.offsetTop + fh + 18 : r.offsetTop + (r.offsetHeight - card.offsetHeight) / 2;
    card.style.transform = 'translateY(' + Math.max(0, cy).toFixed(0) + 'px)';
  }
  function fill(k) {
    if (!copy[k]) return;
    document.getElementById('sfn').textContent = k; document.getElementById('sft').textContent = copy[k][0]; document.getElementById('sfp').textContent = copy[k][1];
    Array.prototype.forEach.call(card.querySelectorAll('.sdots b'), function (b, i) { b.className = i === k - 1 ? 'on' : ''; });
  }
  function T(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function go(k) {
    var first = activeK < 0; activeK = k; timers.forEach(clearTimeout); timers = [];
    rows.forEach(function (r, i) { r.classList.toggle('act', i === k); });
    if (k === 0) { card.classList.remove('show'); } else {
      if (card.classList.contains('show')) { card.classList.add('sw'); T(function () { fill(k); card.classList.remove('sw'); }, 220); } else { fill(k); card.classList.add('show'); }
    }
    place();
    if (!m) return;
    var scr = [['SNAX', 'Pick a snack', 'Rack A1 - D5'], ['SNAX', 'Pick a snack', 'Rack A1 - D5'], ['C1', 'Pay with UPI', 'Scan QR or tap card'], ['ENJOY!', 'Snack dispensed', 'Take from tray', true]][k];
    m.setScreen.apply(m, scr); m.setPaid(k === 3); m.setView('full', -0.22); drop(0);
    if (k === 0) return;
    // zoom out, zoom in on the part, hold, zoom back out
    T(function () { m.setView(views[k], -0.22); if (k === 3) drop(1); }, first ? 200 : 700);
    T(function () { m.setView('full', -0.22); }, (first ? 200 : 700) + 3200);
  }
  go(0);
  window.addEventListener('resize', place);
  setTimeout(place, 600);
  if ('IntersectionObserver' in window) {
    var ratio = [0, 0, 0, 0];
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { ratio[+e.target.dataset.k] = e.intersectionRatio; });
      var best = 0, br = -1;
      ratio.forEach(function (r, k) { if (r >= br - 0.001 && r > .45) { br = r; best = k; } });
      if (br < 0) best = 0;
      if (best !== activeK) go(best);
    }, { threshold: [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1] });
    rows.forEach(function (r) { io.observe(r); });
  }
}

export function runDemo() {
  initPage(); delegate();
  var h1 = document.getElementById('m1'), c1 = document.getElementById('card1');
  var hideT = 0;
  function show(v) { clearTimeout(hideT); if (v) c1.classList.add('on'); else hideT = setTimeout(function () { c1.classList.remove('on'); }, 220); }
  try {
    createMachine(h1, { logo: logoUrl, spin: true, onHover: show });
  } catch (e) {
    var im = document.createElement('img'); im.src = machineUrl; im.alt = 'SnaxSmart vending machine';
    im.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block'; h1.appendChild(im);
  }
  story();
}
