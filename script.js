// ============================================
// WEDDING LANDING PAGE — SCRIPT.JS
// ============================================

document.addEventListener('DOMContentLoaded', () => {



  // ── PARALLAX HERO ──────────────────────────
  const heroBg = document.querySelector('.hero-bg');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight && heroBg) {
      heroBg.style.transform = `scale(1.05) translateY(${y * 0.25}px)`;
    }
  }, { passive: true });

  // ── COUNTDOWN TIMER ────────────────────────
  const weddingDate = new Date('2026-04-06T10:00:00');
  const pad = n => String(n).padStart(2, '0');

  function updateCountdown() {
    const now = new Date();
    const diff = weddingDate - now;
    if (diff <= 0) {
      document.getElementById('days').textContent = '00';
      document.getElementById('hours').textContent = '00';
      document.getElementById('mins').textContent = '00';
      document.getElementById('secs').textContent = '00';
      return;
    }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);

    document.getElementById('days').textContent = pad(days);
    const daysLarge = document.getElementById('days-large');
    if (daysLarge) daysLarge.textContent = pad(days);
    document.getElementById('hours').textContent = pad(hours);
    document.getElementById('mins').textContent = pad(mins);
    document.getElementById('secs').textContent = pad(secs);
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ── SCROLL REVEAL (Intersection Observer) ──
  const revealGroups = [
    { selector: '.reveal' },
    { selector: '.timeline-item' },
    { selector: '.detail-card', delay: true },
    { selector: '.gallery-item', delay: true },
  ];

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const baseDelay = parseFloat(el.dataset.delay || 0);
        setTimeout(() => el.classList.add('visible'), baseDelay);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.15 });

  revealGroups.forEach(({ selector, delay }) => {
    document.querySelectorAll(selector).forEach((el, i) => {
      if (delay) el.dataset.delay = i * 120;
      observer.observe(el);
    });
  });

  // ── GALLERY LIGHTBOX ───────────────────────
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const src = item.querySelector('img').src;
      lightboxImg.src = src;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

  // ── FLOATING WISHES TICKER ─────────────────
  // ── BACKEND CONFIG (Google Sheets) ─────────
  // Sau khi bạn triển khai Google Apps Script, hãy dán URL vào đây
  const API_URL = "https://script.google.com/macros/s/AKfycbz_iRErJs9y8159IaqAFXMw1m-w-xr2b46Zvct_fNcuLT_vvBiak7ijBQfmkEbsSqpR/exec";

  const WISHES_KEY = 'wedding_wishes';

  async function fetchWishes() {
    if (!API_URL) return getStoredWishes(); // Fallback to local if no API
    try {
      const res = await fetch(API_URL);
      const remoteWishes = await res.json();
      // Sync local with remote if needed, or just return remote
      return remoteWishes;
    } catch (err) {
      console.warn("Lỗi tải lời chúc từ server:", err);
      return getStoredWishes();
    }
  }

  function getStoredWishes() {
    try { return JSON.parse(localStorage.getItem(WISHES_KEY)) || []; }
    catch { return []; }
  }

  async function saveWish(wish) {
    // 1. Lưu cục bộ trước để hiện thị ngay
    const all = getStoredWishes();
    const newEntry = { ...wish, time: Date.now() };
    all.push(newEntry);
    localStorage.setItem(WISHES_KEY, JSON.stringify(all));

    // 2. Gửi lên Google Sheets nếu có API_URL
    if (API_URL) {
      try {
        await fetch(API_URL, {
          method: 'POST',
          mode: 'no-cors', // Apps Script thường yêu cầu no-cors khi POST từ domain khác
          body: JSON.stringify(wish)
        });
      } catch (err) {
        console.error("Lỗi gửi lời chúc lên server:", err);
      }
    }
  }

  // Build ticker DOM
  const ticker = document.createElement('div');
  ticker.className = 'wishes-ticker';
  ticker.setAttribute('aria-label', 'Lời chúc mừng');
  document.body.appendChild(ticker);

  const tickerInner = document.createElement('div');
  tickerInner.className = 'wishes-ticker-inner';
  ticker.appendChild(tickerInner);


  // Empty state
  const emptyState = document.createElement('div');
  emptyState.className = 'wishes-empty';
  emptyState.innerHTML = `
    <span class="wishes-empty-icon">✨</span>
    <p>Hãy là người đầu tiên gửi lời chúc!</p>
    <a href="#rsvp">Gửi ngay →</a>
  `;
  ticker.appendChild(emptyState);

  // ─ RENDER WISHES
  async function renderWishes() {
    // 1. Loading from local cache immediately for 'Instant' feel
    const localWishes = getStoredWishes();
    if (localWishes.length > 0) {
      displayWishes(localWishes);
    }

    // 2. Fetch fresh data from API in background
    try {
      const wishes = await fetchWishes();
      if (wishes && wishes.length > 0) {
        displayWishes(wishes);
      } else if (localWishes.length === 0) {
        emptyState.style.display = 'flex';
        ticker.classList.add('ticker-empty');
      }
    } catch (err) {
      console.warn("Background fetch failed.");
    }
  }

  function displayWishes(wishes) {
    tickerInner.innerHTML = '';
    
    if (wishes.length === 0) {
      emptyState.style.display = 'flex';
      ticker.classList.add('ticker-empty');
      return;
    }

    emptyState.style.display = 'none';
    ticker.classList.remove('ticker-empty');

    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'wishes-scroll-container';
    tickerInner.appendChild(scrollContainer);

    const sortedWishes = [...wishes].reverse();
    
    const renderList = (container, isClone = false) => {
      sortedWishes.forEach((wish) => {
        const el = document.createElement('div');
        el.className = 'wish-bubble' + (isClone ? ' clone' : '');
        el.style.animationDelay = `${Math.random() * -10}s`; 
        
        el.innerHTML = `
          <span class="wish-name">${wish.name}</span>
          <p class="wish-text">${wish.message || wish.text || ''}</p>
          <div class="wish-heart" data-id="${wish.id}">
            <span class="wish-heart-btn">❤️</span>
            <span class="wish-heart-count">${wish.likes || 0}</span>
          </div>
        `;

        const heartZone = el.querySelector('.wish-heart');
        heartZone.addEventListener('click', (e) => {
          e.stopPropagation();
          handleLike(wish.id, heartZone);
        });

        container.appendChild(el);
      });
    };

    renderList(scrollContainer);
    
    if (sortedWishes.length > 2) {
      renderList(scrollContainer, true);
      const speed = Math.max(15, sortedWishes.length * 4.5);
      scrollContainer.style.animationDuration = `${speed}s`;
    } else {
      scrollContainer.style.animation = 'none';
    }
  }

  async function handleLike(id, element) {
    if (element.classList.contains('active')) return;
    
    // 1. Optimistic UI
    element.classList.add('active');
    const countEl = element.querySelector('.wish-heart-count');
    countEl.textContent = parseInt(countEl.textContent) + 1;

    // 2. Flying heart animation
    const rect = element.getBoundingClientRect();
    const flyer = document.createElement('div');
    flyer.className = 'flying-heart';
    flyer.innerHTML = '❤️';
    flyer.style.left = `${rect.left}px`;
    flyer.style.top = `${rect.top}px`;
    document.body.appendChild(flyer);
    setTimeout(() => flyer.remove(), 1500);

    // 3. Sync to API
    if (API_URL) {
      try {
        await fetch(API_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ action: 'like', id: id })
        });
      } catch (err) { console.error("Like error:", err); }
    }
  }

  renderWishes();

  // ─ Add new wish
  function addNewWishToTicker(wish) {
    renderWishes(); 
  }


  // ── RSVP FORM ──────────────────────────────
  const form = document.getElementById('rsvp-form');
  const successMsg = document.getElementById('form-success');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit');

    const nameInput = document.getElementById('name');
    const nameGroup = nameInput.closest('.form-group');
    const name = nameInput.value.trim();

    nameGroup.classList.remove('has-error');

    if (!name) {
      nameGroup.classList.add('has-error');
      nameInput.focus();
      nameInput.addEventListener('input', () => {
        nameGroup.classList.remove('has-error');
      }, { once: true });
      return;
    }

    const formData = {
      name: name,
      guests: document.getElementById('guests').value,
      attend: document.getElementById('attend').value,
      message: document.getElementById('message').value
    };

    btn.textContent = '✓ Đang gửi...';
    btn.disabled = true;

    setTimeout(() => {
      form.style.display = 'none';
      successMsg.style.display = 'block';

      if (formData.message) {
        saveWish(formData);
        addNewWishToTicker({ name: formData.name, text: formData.message });
      } else {
        saveWish(formData);
      }
    }, 1200);
  });


  // ── FALLING PETALS ─────────────────────────
  const container = document.querySelector('.petals-container');
  const petalShapes = ['🌸', '🌺', '🌷', '✿', '❀'];

  function createPetal() {
    const petal = document.createElement('div');
    petal.className = 'petal';
    petal.textContent = petalShapes[Math.floor(Math.random() * petalShapes.length)];
    petal.style.cssText = `
      left: ${Math.random() * 100}%;
      font-size: ${0.6 + Math.random() * 0.8}rem;
      animation-duration: ${5 + Math.random() * 8}s;
      animation-delay: ${-Math.random() * 10}s;
      opacity: ${0.4 + Math.random() * 0.5};
    `;
    container.appendChild(petal);
    petal.addEventListener('animationiteration', () => {
      petal.style.left = `${Math.random() * 100}%`;
    });
  }

  for (let i = 0; i < 12; i++) createPetal();

  // ── SMOOTH SCROLL ──────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ── AUDIO & MUSIC CONTROL ──────────────────
  // Ưu tiên 1: File chuẩn bạn vừa thêm vào thư mục assets
  const primaryMusic = './assets/Beautiful%20In%20White.mp3'; 
  const externalMusic = 'https://archive.org/download/ShaneFilanBeautifulInWhite/Shane%20Filan%20-%20Beautiful%20In%20White.mp3';
  const fallbackMusic = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'; 
  
  const audio = new Audio(primaryMusic);
  audio.loop = true;

  // Tự động chuyển link nếu link hiện tại lỗi
  audio.addEventListener('error', () => {
    if (audio.src.includes('Beautiful%20In%20White.mp3')) {
      console.log("Không tìm thấy file trong assets, chuyển sang link Archive.org...");
      audio.src = externalMusic;
      if (isPlaying) audio.play();
    } else if (audio.src === externalMusic) {
      console.warn("Link Archive.org gặp sự cố, dùng nhạc Piano dự phòng.");
      audio.src = fallbackMusic;
      if (isPlaying) audio.play();
    }
  });

  const musicControl = document.getElementById('music-control');
  let isPlaying = false;

  const toggleMusic = () => {
    if (isPlaying) {
      audio.pause();
      musicControl.classList.remove('playing');
    } else {
      audio.play().then(() => {
        musicControl.classList.add('playing');
      }).catch(e => {
        console.log("Play blocked/failed:", e);
        // Try fallback immediately if primary play fails (could be CORS)
        if (audio.src !== fallbackMusic) {
          audio.src = fallbackMusic;
          audio.play().then(() => musicControl.classList.add('playing'));
        }
      });
    }
    isPlaying = !isPlaying;
  };

  musicControl.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMusic();
  });

  const startMusic = () => {
    if (!isPlaying) {
      audio.play().then(() => {
        isPlaying = true;
        musicControl.classList.add('playing');
        console.log("Music started via guest interaction");
      }).catch(e => {
        console.log("Autoplay still blocked, waiting for more interaction.");
      });
    }
    // We keep listening until it actually plays successfully
    if (isPlaying) {
      ['click', 'scroll', 'touchstart'].forEach(type => 
        document.removeEventListener(type, startMusic)
      );
    }
  };

  ['click', 'scroll', 'touchstart'].forEach(type => 
    document.addEventListener(type, startMusic, { once: false }) // Keep until success
  );

});
