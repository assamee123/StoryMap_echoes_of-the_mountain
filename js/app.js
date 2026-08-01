/* ============================================
   Echoes of the Rockies — Interactive Logic
   Leaflet Maps, Audio Players, Navigation
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollAnimations();
  initMapTour();
  initCubLakeMap();
  initTrialKanusMap();
  initAudioPlayers();
});

/* ============ NAVIGATION ============ */
function initNavigation() {
  const topHeader = document.querySelector('.top-header');
  const sectionNav = document.querySelector('.section-nav');
  const navLinks = document.querySelectorAll('.section-nav__link');
  const sections = document.querySelectorAll('section[id]');
  const heroSection = document.getElementById('hero');

  // Show/hide section nav after hero
  const heroObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) {
        sectionNav.classList.add('visible');
      } else {
        sectionNav.classList.remove('visible');
      }
    },
    { threshold: 0.1 }
  );
  heroObserver.observe(heroSection);

  // Header shadow on scroll
  window.addEventListener('scroll', () => {
    topHeader.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // Active nav link tracking
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { rootMargin: '-30% 0px -60% 0px' }
  );

  sections.forEach((section) => sectionObserver.observe(section));

  // Smooth scroll on nav click
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        const offset = 100; // account for fixed header + nav
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // Hero scroll arrow
  const scrollArrow = document.querySelector('.hero__scroll-arrow');
  if (scrollArrow) {
    scrollArrow.addEventListener('click', () => {
      const intro = document.getElementById('introduction');
      if (intro) {
        const top = intro.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  }
}

/* ============ SCROLL ANIMATIONS ============ */
function initScrollAnimations() {
  const animElements = document.querySelectorAll('.fade-in-up');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  animElements.forEach((el) => observer.observe(el));
}

/* ============ MAP TOUR (SIDECAR #1) ============ */
function initMapTour() {
  const mapContainer = document.getElementById('map-tour-map');
  if (!mapContainer) return;

  // Approximate GPS coordinates for the 4 stops
  const stops = [
    {
      name: 'Moraine Park',
      lat: 40.3583,
      lng: -105.5875,
      zoom: 14,
    },
    {
      name: 'Cub Lake Loop',
      lat: 40.3550,
      lng: -105.6150,
      zoom: 14,
    },
    {
      name: 'Ouzel Falls',
      lat: 40.2075,
      lng: -105.5750,
      zoom: 14,
    },
    {
      name: 'Sprague Lake',
      lat: 40.3200,
      lng: -105.6100,
      zoom: 14,
    },
  ];

  // Initialize Leaflet map with OpenTopoMap
  const map = L.map('map-tour-map', {
    center: [40.3430, -105.6836],
    zoom: 11,
    zoomControl: false,
    attributionControl: true,
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Add scale bar
  L.control.scale({ position: 'bottomright', imperial: true, metric: true }).addTo(map);

  // OpenStreetMap tile layer (No contour lines)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Add numbered markers
  const markers = stops.map((stop, index) => {
    const icon = L.divIcon({
      className: 'numbered-marker',
      html: `<span>${index + 1}</span>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const marker = L.marker([stop.lat, stop.lng], { icon })
      .addTo(map)
      .bindTooltip(stop.name, {
        permanent: false,
        direction: 'right',
        className: 'map-tooltip',
        offset: [20, 0],
      });

    return marker;
  });

  // Card click/scroll interaction
  const cards = document.querySelectorAll('.sidecar-map-tour__card');
  const counterCurrent = document.querySelector('.sidecar-map-tour__counter-current');

  function activateStop(index) {
    // Update cards
    cards.forEach((card, i) => {
      card.classList.toggle('active', i === index);
    });

    // Update counter
    if (counterCurrent) {
      counterCurrent.textContent = String(index + 1).padStart(2, '0');
    }

    // Fly map to stop
    const stop = stops[index];
    map.flyTo([stop.lat, stop.lng], stop.zoom, { duration: 1.2 });

    // Highlight marker
    markers.forEach((marker, i) => {
      const el = marker.getElement();
      if (el) {
        const inner = el.querySelector('.numbered-marker');
        if (inner) {
          inner.classList.toggle('active', i === index);
        }
      }
    });

    // Open tooltip
    markers[index].openTooltip();
  }

  // Click handlers
  cards.forEach((card, index) => {
    card.addEventListener('click', () => activateStop(index));
  });

  // Scroll-based activation using IntersectionObserver on cards
  const cardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.dataset.stopIndex, 10);
          activateStop(index);
        }
      });
    },
    {
      root: document.querySelector('.sidecar-map-tour__panel'),
      threshold: 0.6,
    }
  );

  cards.forEach((card) => cardObserver.observe(card));

  // Activate first stop
  activateStop(0);

  // Home button control
  const HomeControl = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd: function () {
      const btn = L.DomUtil.create('div', 'leaflet-bar');
      btn.innerHTML = '<a class="leaflet-home-btn" href="#" title="Reset view">⌂</a>';
      btn.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        map.flyTo([40.3430, -105.6836], 11, { duration: 1.2 });
      });
      return btn;
    },
  });
  new HomeControl().addTo(map);
}

/* ============ CUB LAKE SIDECAR (#2) ============ */
function initCubLakeMap() {
  const mapContainer = document.getElementById('cub-lake-map');
  if (!mapContainer) return;

  // 6 waypoints along the Cub Lake Loop trail
  const waypoints = [
    {
      name: 'Cub Lake Trailhead',
      lat: 40.3563,
      lng: -105.6027,
      zoom: 15,
    },
    {
      name: 'Changing Weather',
      lat: 40.3530,
      lng: -105.6180,
      zoom: 15,
    },
    {
      name: 'A Chorus of Frogs',
      lat: 40.3490,
      lng: -105.6260,
      zoom: 15,
    },
    {
      name: 'Western Terrestrial Garter Snake',
      lat: 40.3510,
      lng: -105.6100,
      zoom: 15,
    },
    {
      name: 'Dusky Grouse',
      lat: 40.3545,
      lng: -105.6050,
      zoom: 15,
    },
    {
      name: 'Wildfire Recovery',
      lat: 40.3580,
      lng: -105.6210,
      zoom: 15,
    },
  ];

  // Initialize map
  const map = L.map('cub-lake-map', {
    center: [40.3530, -105.6140],
    zoom: 13,
    zoomControl: false,
    attributionControl: true,
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.control.scale({ position: 'bottomright', imperial: true, metric: true }).addTo(map);

  // OpenStreetMap (No contour lines)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Red pin markers
  const redIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const markers = waypoints.map((wp) => {
    return L.marker([wp.lat, wp.lng], { icon: redIcon })
      .addTo(map)
      .bindPopup(`<strong>${wp.name}</strong>`);
  });

  // Panel item interaction
  const items = document.querySelectorAll('.sidecar-cub__item');

  function activateWaypoint(index) {
    items.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });

    const wp = waypoints[index];
    map.flyTo([wp.lat, wp.lng], wp.zoom, { duration: 1.0 });
    markers[index].openPopup();
  }

  items.forEach((item, index) => {
    item.addEventListener('click', () => activateWaypoint(index));
    item.addEventListener('mouseenter', () => activateWaypoint(index));
  });

  // Scroll-based activation using IntersectionObserver on items
  const itemObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.dataset.waypointIndex, 10);
          activateWaypoint(index);
        }
      });
    },
    {
      root: document.querySelector('.sidecar-cub__panel'),
      threshold: 0.6,
    }
  );

  items.forEach((item) => itemObserver.observe(item));

  // Activate first waypoint
  activateWaypoint(0);

  // Home button
  const HomeControl = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd: function () {
      const btn = L.DomUtil.create('div', 'leaflet-bar');
      btn.innerHTML = '<a class="leaflet-home-btn" href="#" title="Reset view">⌂</a>';
      btn.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        map.flyTo([40.3530, -105.6140], 13, { duration: 1.0 });
      });
      return btn;
    },
  });
  new HomeControl().addTo(map);
}

/* ============ AUDIO PLAYERS ============ */
function initAudioPlayers() {
  const players = document.querySelectorAll('.audio-player');

  players.forEach((playerEl) => {
    const audio = playerEl.querySelector('audio');
    const playBtn = playerEl.querySelector('.audio-player__play-btn');
    const progressBar = playerEl.querySelector('.audio-player__progress-bar');
    const progressFill = playerEl.querySelector('.audio-player__progress-fill');
    const currentTimeEl = playerEl.querySelector('.audio-player__current');
    const durationEl = playerEl.querySelector('.audio-player__duration');
    const volumeSlider = playerEl.querySelector('.audio-player__volume-slider');
    const playIcon = playBtn.querySelector('.play-icon');
    const pauseIcon = playBtn.querySelector('.pause-icon');

    if (!audio) return;

    function formatTime(seconds) {
      if (isNaN(seconds)) return '0:00';
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    }

    // Play/Pause toggle
    playBtn.addEventListener('click', () => {
      if (audio.paused) {
        // Pause all other players first
        document.querySelectorAll('.audio-player audio').forEach((a) => {
          if (a !== audio) {
            a.pause();
            const otherPlayer = a.closest('.audio-player');
            if (otherPlayer) {
              otherPlayer.querySelector('.play-icon').style.display = '';
              otherPlayer.querySelector('.pause-icon').style.display = 'none';
            }
          }
        });
        audio.play();
        playIcon.style.display = 'none';
        pauseIcon.style.display = '';
      } else {
        audio.pause();
        playIcon.style.display = '';
        pauseIcon.style.display = 'none';
      }
    });

    // Time update
    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        const pct = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = pct + '%';
        currentTimeEl.textContent = formatTime(audio.currentTime);
      }
    });

    // Duration loaded
    audio.addEventListener('loadedmetadata', () => {
      durationEl.textContent = formatTime(audio.duration);
    });

    // Seek on progress bar click
    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      audio.currentTime = pct * audio.duration;
    });

    // Volume
    if (volumeSlider) {
      volumeSlider.addEventListener('input', () => {
        audio.volume = volumeSlider.value;
      });
    }

    // Reset on end
    audio.addEventListener('ended', () => {
      playIcon.style.display = '';
      pauseIcon.style.display = 'none';
      progressFill.style.width = '0%';
      currentTimeEl.textContent = '0:00';
    });

    // Set initial display
    if (pauseIcon) pauseIcon.style.display = 'none';

    // Handle case where audio file doesn't exist
    audio.addEventListener('error', () => {
      durationEl.textContent = '--:--';
    });
  });
}


/* ============ TRIAL KANUS (SIDECAR #3) ============ */
function initTrialKanusMap() {
  const mapContainer = document.getElementById('trial-kanus-map');
  if (!mapContainer) return;

  const stations = [
    {
        "name": "Wohldorfer Schleuse",
        "lat": 53.7047532,
        "lng": 10.1177042
    },
    {
        "name": "Haselknick",
        "lat": 53.6934928,
        "lng": 10.117893
    },
    {
        "name": "Trillup - Quellmoor",
        "lat": 53.6832639,
        "lng": 10.1165752
    },
    {
        "name": "Mellingburger Schleuse",
        "lat": 53.6702024,
        "lng": 10.09866
    },
    {
        "name": "Poppenbütteler Schleuse",
        "lat": 53.6574434,
        "lng": 10.0878693
    },
    {
        "name": "Alsterwiesen",
        "lat": 53.6324983,
        "lng": 10.0376061
    },
    {
        "name": "Rathenau-Str.",
        "lat": 53.6170894,
        "lng": 10.0219383
    },
    {
        "name": "Eppendorfer Mühlenteich",
        "lat": 53.5981166666667,
        "lng": 9.98883333333333
    },
    {
        "name": "Heiligwigstr./ Eichenpark",
        "lat": 53.5805833333333,
        "lng": 9.99665
    },
    {
        "name": "Stadtpark",
        "lat": 53.5922333333333,
        "lng": 10.0310833333333
    },
    {
        "name": "Isebekkanal",
        "lat": 53.5758542,
        "lng": 9.9700873
    },
    {
        "name": "Kennedybrücke",
        "lat": 53.55895,
        "lng": 9.99591666666667
    },
    {
        "name": "Kajüte",
        "lat": 53.5611,
        "lng": 10.0127666666667
    },
    {
        "name": "Barcastr.",
        "lat": 53.5627229,
        "lng": 10.017216
    },
    {
        "name": "Hammerbrook",
        "lat": 53.5463,
        "lng": 10.0186833333333
    },
    {
        "name": "Rothenburgsort",
        "lat": 53.5437746,
        "lng": 10.0436583
    },
    {
        "name": "Bille Schleuse / A1",
        "lat": 53.5197586,
        "lng": 10.1222893
    },
    {
        "name": "Boberger Dünen",
        "lat": 53.5062026,
        "lng": 10.1338067
    },
    {
        "name": "Tatenberger Schleuse",
        "lat": 53.4977333333333,
        "lng": 10.0821666666667
    },
    {
        "name": "Fährhaus",
        "lat": 53.4966,
        "lng": 10.0868166666667
    },
    {
        "name": "Eichbaumsee",
        "lat": 53.4824,
        "lng": 10.1094381
    },
    {
        "name": "DRV - Regattastrecke",
        "lat": 53.4815666666667,
        "lng": 10.1144
    },
    {
        "name": "Allermöher Deich I",
        "lat": 53.4814833333333,
        "lng": 10.1184
    },
    {
        "name": "Allermöher Deich II",
        "lat": 53.4720666666667,
        "lng": 10.1691666666667
    },
    {
        "name": "Gose-Elbe",
        "lat": 53.4440333333333,
        "lng": 10.1643166666667
    },
    {
        "name": "Bauhaus",
        "lat": 53.4833,
        "lng": 10.2048166666667
    },
    {
        "name": "Serrahn",
        "lat": 53.4887666666667,
        "lng": 10.20965
    },
    {
        "name": "Schloss Bergedorf",
        "lat": 53.4891333333333,
        "lng": 10.2104833333333
    },
    {
        "name": "Chrysanderstr.",
        "lat": 53.49305,
        "lng": 10.2140166666667
    },
    {
        "name": "Schloss Reinbek",
        "lat": 53.5065833333333,
        "lng": 10.2526333333333
    },
    {
        "name": "Pönitzerwiek",
        "lat": 53.9516333333333,
        "lng": 10.8882666666667
    },
    {
        "name": "Kanuhelden-Neustadt",
        "lat": 54.1022833333333,
        "lng": 10.8123166666667
    },
    {
        "name": "Klein Borstel",
        "lat": 53.6296327,
        "lng": 10.0313295
    }
];

  // Center map around Hamburg / Alster region
  const map = L.map('trial-kanus-map', {
    center: [53.6000, 10.0500],
    zoom: 11,
    zoomControl: false,
    attributionControl: true,
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.control.scale({ position: 'bottomright', imperial: true, metric: true }).addTo(map);

  // OpenStreetMap tile layer (No contour lines)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Add numbered markers for each Kanutour station
  const markers = stations.map((st, index) => {
    const icon = L.divIcon({
      className: 'numbered-marker kanu-marker',
      html: `<span>${index + 1}</span>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([st.lat, st.lng], { icon })
      .addTo(map)
      .bindTooltip(`Station ${index + 1}: ${st.name}`, {
        permanent: false,
        direction: 'top',
        className: 'map-tooltip',
        offset: [0, -10],
      });

    return marker;
  });

  const cards = document.querySelectorAll('.sidecar-kanu__card');
  const counterCurrent = document.querySelector('.sidecar-kanu__counter-current');

  function activateStation(index) {
    cards.forEach((card, i) => {
      card.classList.toggle('active', i === index);
    });

    if (counterCurrent) {
      counterCurrent.textContent = String(index + 1).padStart(2, '0');
    }

    const st = stations[index];
    map.flyTo([st.lat, st.lng], 14, { duration: 1.2 });

    markers.forEach((marker, i) => {
      const el = marker.getElement();
      if (el) {
        const inner = el.querySelector('.numbered-marker');
        if (inner) {
          inner.classList.toggle('active', i === index);
        }
      }
    });

    markers[index].openTooltip();
  }

  cards.forEach((card, index) => {
    card.addEventListener('click', () => activateStation(index));
    card.addEventListener('mouseenter', () => activateStation(index));
  });

  const cardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.dataset.kanuIndex, 10);
          activateStation(index);
        }
      });
    },
    {
      root: document.querySelector('.sidecar-kanu__panel'),
      threshold: 0.6,
    }
  );

  cards.forEach((card) => cardObserver.observe(card));
  activateStation(0);

  const HomeControl = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd: function () {
      const btn = L.DomUtil.create('div', 'leaflet-bar');
      btn.innerHTML = '<a class="leaflet-home-btn" href="#" title="Reset view">⌂</a>';
      btn.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        map.flyTo([53.6000, 10.0500], 11, { duration: 1.2 });
      });
      return btn;
    },
  });
  new HomeControl().addTo(map);
}
