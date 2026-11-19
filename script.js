// =====================================================
//  🎉 MAURICIO'S BIRTHDAY INVITATION - MAIN JS
//  Particles · Confetti · Typewriter · Countdown
//  Audio Visualizer · Whistle · Vibration
//  Cursor trail · Click sparkles · Scroll animations
// =====================================================

(function () {
    'use strict';

    // ===================== PARTICLES SYSTEM =====================
    const particlesCanvas = document.getElementById('particles-canvas');
    const pCtx = particlesCanvas.getContext('2d');
    let particles = [];
    let pW, pH;

    function resizeParticles() {
        pW = particlesCanvas.width = window.innerWidth;
        pH = particlesCanvas.height = window.innerHeight;
    }
    resizeParticles();
    window.addEventListener('resize', resizeParticles);

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * pW;
            this.y = Math.random() * pH;
            this.size = Math.random() * 3 + 1;
            this.speedY = -Math.random() * 0.5 - 0.2;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.5 + 0.1;
            this.color = Math.random() > 0.5
                ? `rgba(255, 215, 0, ${this.opacity})`
                : `rgba(76, 175, 80, ${this.opacity})`;
        }
        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            this.opacity -= 0.0008;
            if (this.y < -10 || this.opacity <= 0) this.reset();
        }
        draw() {
            pCtx.beginPath();
            pCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            pCtx.fillStyle = this.color;
            pCtx.fill();
        }
    }

    const particleCount = Math.min(90, Math.floor(pW * pH / 12000));
    for (let i = 0; i < particleCount; i++) particles.push(new Particle());

    function animateParticles() {
        pCtx.clearRect(0, 0, pW, pH);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // ===================== CONFETTI BURST =====================
    function launchConfetti(originX, originY) {
        const canvas = document.getElementById('confetti-canvas');
        // If envelope is gone, create a temporary canvas
        let tempCanvas = canvas;
        if (!tempCanvas || tempCanvas.offsetParent === null) {
            tempCanvas = document.createElement('canvas');
            tempCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
            document.body.appendChild(tempCanvas);
            setTimeout(() => tempCanvas.remove(), 4000);
        }
        const ctx = tempCanvas.getContext('2d');
        tempCanvas.width = window.innerWidth;
        tempCanvas.height = window.innerHeight;

        const ox = originX || tempCanvas.width / 2;
        const oy = originY || tempCanvas.height / 2;
        const pieces = [];
        const colors = ['#ffd700', '#4caf50', '#ff5722', '#2196f3', '#e91e63', '#ff9800', '#00bcd4', '#8bc34a'];

        for (let i = 0; i < 180; i++) {
            pieces.push({
                x: ox, y: oy,
                size: Math.random() * 8 + 3,
                speedX: (Math.random() - 0.5) * 24,
                speedY: (Math.random() - 0.5) * 24 - 6,
                gravity: 0.25 + Math.random() * 0.15,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 15,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: 1,
                shape: ['rect', 'circle', 'triangle'][Math.floor(Math.random() * 3)]
            });
        }

        let frame = 0;
        function animate() {
            ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            let alive = false;
            pieces.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;
                p.speedY += p.gravity;
                p.speedX *= 0.985;
                p.rotation += p.rotationSpeed;
                p.opacity -= 0.006;
                if (p.opacity <= 0) return;
                alive = true;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.fillStyle = p.color;

                if (p.shape === 'rect') {
                    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                } else if (p.shape === 'circle') {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.beginPath();
                    ctx.moveTo(0, -p.size / 2);
                    ctx.lineTo(p.size / 2, p.size / 2);
                    ctx.lineTo(-p.size / 2, p.size / 2);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
            });
            frame++;
            if (alive && frame < 250) requestAnimationFrame(animate);
        }
        animate();
    }

    // ===================== AUDIO VISUALIZER =====================
    let audioContext = null;
    let analyser = null;
    let dataArray = null;
    let useSimulatedViz = false;
    let visualizerStarted = false;
    const vizCanvas = document.getElementById('audio-visualizer');
    const vizCtx = vizCanvas ? vizCanvas.getContext('2d') : null;
    let vizW = 0, vizH = 0;

    function resizeVisualizer() {
        if (!vizCanvas) return;
        const dpr = window.devicePixelRatio || 1;
        vizW = vizCanvas.width = vizCanvas.offsetWidth * dpr;
        vizH = vizCanvas.height = vizCanvas.offsetHeight * dpr;
    }
    window.addEventListener('resize', resizeVisualizer);

    function initAudioVisualizer() {
        if (visualizerStarted) {
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
            return;
        }
        visualizerStarted = true;
        resizeVisualizer();

        // On file:// protocol, Web Audio createMediaElementSource can mute audio due to CORS
        if (window.location.protocol === 'file:') {
            useSimulatedViz = true;
            animateVisualizer();
            return;
        }

        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 128;
            analyser.smoothingTimeConstant = 0.82;
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);

            const source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);

            animateVisualizer();
        } catch (e) {
            useSimulatedViz = true;
            animateVisualizer();
        }
    }

    function animateVisualizer() {
        if (!vizCanvas || !vizCtx) return;

        const barCount = 48;
        const smoothed = new Float32Array(barCount);
        let t = 0;

        function draw() {
            requestAnimationFrame(draw);
            if (!vizW || !vizH) resizeVisualizer();
            vizCtx.clearRect(0, 0, vizW, vizH);

            const isPlaying = !audio.paused && !audio.ended;
            if (!useSimulatedViz && analyser && dataArray) {
                analyser.getByteFrequencyData(dataArray);
            }
            t += 0.08;

            const gap = Math.max(2, vizW * 0.004);
            const barWidth = (vizW - gap * (barCount - 1)) / barCount;
            const maxBarHeight = vizH * 0.85;

            for (let i = 0; i < barCount; i++) {
                let targetVal = 0.04;
                if (isPlaying) {
                    if (!useSimulatedViz && analyser && dataArray) {
                        const binIndex = Math.min(dataArray.length - 1, Math.floor((i / barCount) * (dataArray.length * 0.75)));
                        targetVal = Math.max(0.06, dataArray[binIndex] / 255);
                    } else {
                        const wave = Math.sin(t + i * 0.35) * 0.35 + Math.cos(t * 1.4 - i * 0.2) * 0.25 + 0.45;
                        targetVal = Math.max(0.08, Math.min(0.95, wave * (0.65 + 0.35 * Math.sin(i * 0.5 + t * 0.7))));
                    }
                }
                smoothed[i] += (targetVal - smoothed[i]) * 0.22;
                const val = smoothed[i];
                const barHeight = Math.max(3, val * maxBarHeight);

                // Gradient from emerald green to gold
                const hue = 52 + (1 - val) * 72; // 52 (gold) to 124 (green)
                const saturation = 75 + val * 25;
                const lightness = 42 + val * 18;
                vizCtx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.45 + val * 0.45})`;

                const x = i * (barWidth + gap);
                const y = vizH - barHeight;
                const radius = Math.min(barWidth / 2, barHeight / 2, 4);

                vizCtx.beginPath();
                vizCtx.moveTo(x + radius, y);
                vizCtx.lineTo(x + barWidth - radius, y);
                vizCtx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
                vizCtx.lineTo(x + barWidth, vizH);
                vizCtx.lineTo(x, vizH);
                vizCtx.lineTo(x, y + radius);
                vizCtx.quadraticCurveTo(x, y, x + radius, y);
                vizCtx.fill();
            }
        }
        draw();
    }

    // ===================== WHISTLE SOUND =====================
    const whistleAudio = document.getElementById('whistle-sound');

    function playWhistle() {
        if (whistleAudio) {
            whistleAudio.volume = 0.6;
            whistleAudio.currentTime = 0;
            whistleAudio.play().catch(() => {});
        }
    }

    // ===================== VIBRATION =====================
    function vibrateDevice() {
        if ('vibrate' in navigator) {
            // Pattern: short-pause-short-pause-long
            navigator.vibrate([100, 50, 100, 50, 200]);
        }
    }

    // ===================== ENVELOPE LOGIC =====================
    const envelopeScreen = document.getElementById('envelope-screen');
    const envelope = document.getElementById('envelope');
    const tapText = document.getElementById('tap-text');
    const invitation = document.getElementById('invitation');
    const musicPlayer = document.getElementById('music-player');
    const bouncingBall = document.getElementById('bouncing-ball');
    const audio = document.getElementById('bg-music');
    const vinyl = document.getElementById('vinyl');
    const turntableBtn = document.getElementById('turntable-btn');

    let isOpened = false;

    envelopeScreen.addEventListener('click', function () {
        if (isOpened) return;
        isOpened = true;

        // 🔔 Play whistle sound!
        playWhistle();

        // 📳 Vibrate mobile device!
        vibrateDevice();

        // Stage 1 (0ms): Break wax seal & hide tap prompt
        envelope.classList.add('opening', 'seal-broken');
        if (tapText) tapText.classList.add('hide');

        // Stage 2 (180ms): Swing 3D top flap open smoothly
        setTimeout(() => {
            envelope.classList.add('flap-open');
        }, 180);

        // Stage 3 (600ms): Put open flap behind card, glide invitation card out & burst confetti
        setTimeout(() => {
            envelope.classList.add('flap-behind', 'letter-out');
            const rect = envelope.getBoundingClientRect();
            launchConfetti(rect.left + rect.width / 2, rect.top + rect.height * 0.35);
        }, 600);

        // Stage 4 (1600ms): Transition cleanly into the main invitation page
        setTimeout(() => {
            envelopeScreen.classList.add('opened');
            invitation.classList.add('visible');
            musicPlayer.classList.add('visible');
            if (vizCanvas) vizCanvas.classList.add('visible');
            if (bouncingBall) bouncingBall.classList.add('visible');

            // Try autoplay music
            audio.play().then(() => {
                vinyl.classList.add('spinning');
                initAudioVisualizer();
            }).catch(() => { /* user will click turntable */ });

            // Start typewriter & scroll animations
            setTimeout(() => {
                startTypewriter();
                triggerScrollAnimations();
            }, 300);
        }, 1600);

        // Remove overlay after fade completes
        setTimeout(() => {
            envelopeScreen.style.display = 'none';
        }, 2500);
    });

    // ===================== TYPEWRITER EFFECT =====================
    function startTypewriter() {
        const el = document.getElementById('typewriter');
        if (!el) return;
        const text = el.getAttribute('data-text') || el.textContent;
        el.textContent = '';
        el.style.opacity = '1';
        let i = 0;

        function type() {
            if (i < text.length) {
                el.textContent += text.charAt(i);
                i++;
                setTimeout(type, 70 + Math.random() * 40);
            } else {
                const subtitle = document.querySelector('.hero-subtitle');
                if (subtitle) subtitle.classList.add('show');
            }
        }
        type();
    }

    // ===================== MUSIC PLAYER =====================
    turntableBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (audio.paused) {
            audio.play().then(() => {
                vinyl.classList.add('spinning');
                initAudioVisualizer();
            });
        } else {
            audio.pause();
            vinyl.classList.remove('spinning');
        }
    });

    audio.addEventListener('play', () => {
        vinyl.classList.add('spinning');
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    });
    audio.addEventListener('pause', () => vinyl.classList.remove('spinning'));

    // ===================== COUNTDOWN (CUMPLEAÑOS - 9:30 AM) =====================
    const prevValues = { days: '', hours: '', minutes: '', seconds: '' };

    function updateCountdown() {
        const target = new Date('2026-11-28T09:30:00-04:00').getTime();
        const now = Date.now();
        const diff = target - now;

        const ids = ['days', 'hours', 'minutes', 'seconds'];

        if (diff <= 0) {
            const emojis = ['🎉', '🎂', '⚽', '🥳'];
            ids.forEach((id, i) => {
                const el = document.getElementById(id);
                if (el) el.textContent = emojis[i];
            });
            return;
        }

        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        const values = {
            days: String(d).padStart(2, '0'),
            hours: String(h).padStart(2, '0'),
            minutes: String(m).padStart(2, '0'),
            seconds: String(s).padStart(2, '0')
        };

        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el && values[id] !== prevValues[id]) {
                el.textContent = values[id];
                el.classList.remove('flip');
                void el.offsetWidth;
                el.classList.add('flip');
                prevValues[id] = values[id];
            }
        });
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);

    // ===================== COUNTDOWN (FINAL LIBERTADORES - 16:00 PM) =====================
    const prevLibValues = { 'lib-days': '', 'lib-hours': '', 'lib-minutes': '', 'lib-seconds': '' };

    function updateLibertadoresCountdown() {
        const targetLib = new Date('2026-11-28T16:00:00-04:00').getTime();
        const now = Date.now();
        const diff = targetLib - now;

        const ids = ['lib-days', 'lib-hours', 'lib-minutes', 'lib-seconds'];

        if (diff <= 0) {
            const emojis = ['🏆', '⚽', '🔥', '🎉'];
            ids.forEach((id, i) => {
                const el = document.getElementById(id);
                if (el) el.textContent = emojis[i];
            });
            return;
        }

        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        const values = {
            'lib-days': String(d).padStart(2, '0'),
            'lib-hours': String(h).padStart(2, '0'),
            'lib-minutes': String(m).padStart(2, '0'),
            'lib-seconds': String(s).padStart(2, '0')
        };

        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el && values[id] !== prevLibValues[id]) {
                el.textContent = values[id];
                el.classList.remove('flip');
                void el.offsetWidth;
                el.classList.add('flip');
                prevLibValues[id] = values[id];
            }
        });
    }

    updateLibertadoresCountdown();
    setInterval(updateLibertadoresCountdown, 1000);

    // ===================== SCROLL ANIMATIONS =====================
    function triggerScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (entry.target.classList.contains('stagger-children')) {
                        const children = entry.target.querySelectorAll('.info-card');
                        children.forEach((child, i) => {
                            setTimeout(() => child.classList.add('visible'), i * 200);
                        });
                    } else {
                        entry.target.classList.add('visible');
                    }
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.info-card, .reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children').forEach(el => {
            observer.observe(el);
        });
    }

    // ===================== CURSOR TRAIL (desktop) =====================
    const trailEmojis = ['⚽', '⭐', '✨', '🎉'];
    let trailCounter = 0;

    document.addEventListener('mousemove', function (e) {
        trailCounter++;
        if (trailCounter % 8 !== 0) return;

        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        trail.textContent = trailEmojis[Math.floor(Math.random() * trailEmojis.length)];
        trail.style.left = e.clientX + 'px';
        trail.style.top = e.clientY + 'px';
        document.body.appendChild(trail);
        setTimeout(() => trail.remove(), 1000);
    });

    // ===================== CLICK SPARKLES =====================
    document.addEventListener('click', function (e) {
        if (e.target.closest('.turntable, .rsvp-btn, .map-link, a, iframe')) return;

        const colors = ['#ffd700', '#4caf50', '#ff5722', '#e91e63', '#2196f3'];
        for (let i = 0; i < 8; i++) {
            const spark = document.createElement('div');
            spark.className = 'sparkle';
            spark.style.left = e.clientX + 'px';
            spark.style.top = e.clientY + 'px';
            spark.style.background = colors[Math.floor(Math.random() * colors.length)];
            const angle = (Math.PI * 2 / 8) * i;
            const dist = 30 + Math.random() * 40;
            spark.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
            spark.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
            document.body.appendChild(spark);
            setTimeout(() => spark.remove(), 600);
        }
    });

    // ===================== RSVP + WHATSAPP =====================
    const rsvpBtn = document.getElementById('rsvp-btn');
    const rsvpMsg = document.getElementById('rsvp-message');
    const WHATSAPP_NUMBER = '59176210801';
    const WHATSAPP_TEXT = '¡Hola! Confirmo mi asistencia al cumpleaños de Mauricio el sábado 28 de noviembre a las 9:30 a.m. ¡Nos vemos ahí!';
    const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_TEXT)}`;

    if (rsvpBtn) {
        rsvpBtn.addEventListener('click', function () {
            if (!rsvpBtn.classList.contains('confirmed')) {
                rsvpBtn.classList.add('confirmed');
                rsvpBtn.innerHTML = '✅ ¡Confirmado! Enviar por WhatsApp';
                if (rsvpMsg) rsvpMsg.classList.add('show');

                // Confetti from button position
                const rect = rsvpBtn.getBoundingClientRect();
                launchConfetti(rect.left + rect.width / 2, rect.top);

                // Vibrate on confirm too
                vibrateDevice();
            }

            // Open WhatsApp with pre-filled confirmation message
            window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer');
        });
    }

    // ===================== SCROLL INDICATOR =====================
    const scrollIndicator = document.getElementById('scroll-indicator');
    const nextSection = document.getElementById('carousel-section');

    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function (e) {
            e.stopPropagation();
            if (nextSection) {
                nextSection.scrollIntoView({ behavior: 'smooth' });
            }
        });

        window.addEventListener('scroll', function () {
            if (window.scrollY > 80) {
                scrollIndicator.classList.add('hidden');
            } else {
                scrollIndicator.classList.remove('hidden');
            }
        }, { passive: true });
    }

    // ===================== PARALLAX (desktop) =====================
    if (window.innerWidth > 768) {
        window.addEventListener('scroll', function () {
            const scrollY = window.scrollY;
            const hero = document.querySelector('.hero');
            if (hero) {
                const heroImg = hero.querySelector('.hero-image-container');
                if (heroImg && scrollY < window.innerHeight) {
                    heroImg.style.transform = `translateY(${scrollY * 0.15}px)`;
                }
            }
        });
    }

    // ===================== TOUCH SPARKLES (mobile) =====================
    if ('ontouchstart' in window) {
        document.addEventListener('touchstart', function (e) {
            const touch = e.touches[0];
            const colors = ['#ffd700', '#4caf50'];
            for (let i = 0; i < 5; i++) {
                const spark = document.createElement('div');
                spark.className = 'sparkle';
                spark.style.left = touch.clientX + 'px';
                spark.style.top = touch.clientY + 'px';
                spark.style.background = colors[Math.floor(Math.random() * colors.length)];
                const angle = (Math.PI * 2 / 5) * i;
                const dist = 20 + Math.random() * 30;
                spark.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
                spark.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
                document.body.appendChild(spark);
                setTimeout(() => spark.remove(), 600);
            }
        }, { passive: true });
    }

    // ===================== PHOTO/VIDEO CAROUSEL =====================
    const track = document.getElementById('carousel-track');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const dotsContainer = document.getElementById('carousel-dots');

    if (track && prevBtn && nextBtn && dotsContainer) {
        const slides = track.querySelectorAll('.carousel-slide');
        const total = slides.length;
        let current = 0;
        let startX = 0;
        let isDragging = false;

        // Create dots
        for (let i = 0; i < total; i++) {
            const dot = document.createElement('button');
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', `Foto ${i + 1}`);
            dot.addEventListener('click', () => goTo(i));
            dotsContainer.appendChild(dot);
        }
        const dots = dotsContainer.querySelectorAll('.carousel-dot');

        function goTo(index) {
            if (index < 0) index = total - 1;
            if (index >= total) index = 0;
            current = index;
            track.style.transform = `translateX(-${current * 100}%)`;

            // Update dots
            dots.forEach((d, i) => d.classList.toggle('active', i === current));

            // Auto play/pause videos
            slides.forEach((slide, i) => {
                const video = slide.querySelector('video');
                if (video) {
                    if (i === current) {
                        video.play().catch(() => {});
                    } else {
                        video.pause();
                        video.currentTime = 0;
                    }
                }
            });
        }

        prevBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(current - 1); });
        nextBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(current + 1); });

        // Touch swipe support
        track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        }, { passive: true });

        track.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;
            const diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) {
                goTo(diff > 0 ? current + 1 : current - 1);
            }
        }, { passive: true });

        // Auto-advance every 5s
        let autoSlide = setInterval(() => goTo(current + 1), 5000);

        // Pause auto on user interaction
        [prevBtn, nextBtn, track].forEach(el => {
            el.addEventListener('pointerdown', () => {
                clearInterval(autoSlide);
                autoSlide = setInterval(() => goTo(current + 1), 8000);
            });
        });
    }

})();
