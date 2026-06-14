/* NILOY Interactive UI Manager */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    lucide.createIcons();

    // 2. Custom Cursor Follower Logic
    const cursorOuter = document.querySelector('.cursor-outer');
    const cursorInner = document.querySelector('.cursor-inner');
    
    let mouseX = 0, mouseY = 0;
    let outerX = 0, outerY = 0;
    let innerX = 0, innerY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function updateCursor() {
        outerX += (mouseX - outerX) * 0.16;
        outerY += (mouseY - outerY) * 0.16;
        cursorOuter.style.left = `${outerX}px`;
        cursorOuter.style.top = `${outerY}px`;

        innerX += (mouseX - innerX) * 0.45;
        innerY += (mouseY - innerY) * 0.45;
        cursorInner.style.left = `${innerX}px`;
        cursorInner.style.top = `${innerY}px`;

        requestAnimationFrame(updateCursor);
    }
    requestAnimationFrame(updateCursor);

    // Hover elements selectors
    const hoverElements = 'a, button, select, input, textarea, .clickable, .uid-card, .shop-card';
    
    function setupCursorHovers() {
        document.querySelectorAll(hoverElements).forEach(el => {
            // Remove previous event listeners if double-bound
            el.removeEventListener('mouseenter', onMouseEnterHover);
            el.removeEventListener('mouseleave', onMouseLeaveHover);
            el.removeEventListener('click', onElementClick);
            
            el.addEventListener('mouseenter', onMouseEnterHover);
            el.addEventListener('mouseleave', onMouseLeaveHover);
            el.addEventListener('click', onElementClick);
        });
    }

    function onMouseEnterHover() {
        document.body.classList.add('cursor-hover');
        playHoverSound();
    }

    function onMouseLeaveHover() {
        document.body.classList.remove('cursor-hover');
    }

    function onElementClick() {
        playClickSound();
    }
    
    setupCursorHovers();

    // 3. Audio Synthesizer (Web Audio API)
    let audioCtx = null;
    let soundEnabled = true;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playHoverSound() {
        if (!soundEnabled) return;
        initAudio();
        if (!audioCtx) return;

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1400, audioCtx.currentTime + 0.05);

        gainNode.gain.setValueAtTime(0.008, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    }

    function playClickSound() {
        if (!soundEnabled) return;
        initAudio();
        if (!audioCtx) return;

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.06);

        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.06);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.06);
    }

    function playSuccessSound() {
        if (!soundEnabled) return;
        initAudio();
        if (!audioCtx) return;

        const now = audioCtx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];

        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);

            const startTime = now + idx * 0.07;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.setValueAtTime(0.02, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.3);

            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }

    // Audio Toggle Action
    const audioToggleBtn = document.getElementById('audio-toggle');
    const audioIcon = document.getElementById('audio-icon');
    const audioStatusText = audioToggleBtn ? audioToggleBtn.querySelector('.status-lbl') : null;

    if (audioToggleBtn) {
        audioToggleBtn.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            if (soundEnabled) {
                audioIcon.setAttribute('data-lucide', 'volume-2');
                audioStatusText.textContent = 'ON';
                audioStatusText.className = 'status-lbl font-mono text-green';
                showNotification('AUDIO ACTIVE', 'Sound effects are now enabled.', 'volume-2', 'cyan');
            } else {
                audioIcon.setAttribute('data-lucide', 'volume-x');
                audioStatusText.textContent = 'OFF';
                audioStatusText.className = 'status-lbl font-mono text-magenta';
                showNotification('AUDIO MUTED', 'Sound effects have been disabled.', 'volume-x', 'magenta');
            }
            lucide.createIcons();
        });
    }

    // 4. Hero Typewriter Effect
    const typewriterText = document.getElementById('typewriter-text');
    if (typewriterText) {
        const words = ["Mobile Games Doctor", "PUBG Strategist", "COD Mobile Expert"];
        let wordIdx = 0;
        let charIdx = 0;
        let isDeleting = false;
        
        function type() {
            const currentWord = words[wordIdx];
            if (isDeleting) {
                typewriterText.textContent = currentWord.substring(0, charIdx - 1);
                charIdx--;
            } else {
                typewriterText.textContent = currentWord.substring(0, charIdx + 1);
                charIdx++;
            }
            
            let typeSpeed = isDeleting ? 40 : 80;
            
            if (!isDeleting && charIdx === currentWord.length) {
                typeSpeed = 1800; // Pause at end of word
                isDeleting = true;
            } else if (isDeleting && charIdx === 0) {
                isDeleting = false;
                wordIdx = (wordIdx + 1) % words.length;
                typeSpeed = 300; // Pause before starting next word
            }
            
            setTimeout(type, typeSpeed);
        }
        setTimeout(type, 1000);
    }

    // 5. Tab Navigation Switching
    const navItems = document.querySelectorAll('.nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTabId = item.getAttribute('data-tab');

            // Switch active link
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Switch active view pane
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === targetTabId) {
                    pane.classList.add('active');
                }
            });
            
            const tabName = item.querySelector('span').textContent;
            showNotification('SECTOR LOADED', `Transitioned to ${tabName} interface.`, 'layout', 'cyan');
        });
    });

    // Action CTAs in Hero page
    const ctaConsoleBtn = document.getElementById('cta-console');
    const ctaShopBtn = document.getElementById('cta-shop');

    if (ctaConsoleBtn) {
        ctaConsoleBtn.addEventListener('click', () => {
            document.querySelector('[data-tab="dashboard-tab"]').click();
        });
    }
    if (ctaShopBtn) {
        ctaShopBtn.addEventListener('click', () => {
            document.querySelector('[data-tab="shop-tab"]').click();
        });
    }

    // 6. Copy Game UIDs to Clipboard
    const copyUidButtons = document.querySelectorAll('.btn-copy-uid');
    const uidCards = document.querySelectorAll('.uid-card');

    // Trigger copy when clicking the copy button directly
    copyUidButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card body click from firing twice
            const card = btn.closest('.uid-card');
            const uidVal = card.getAttribute('data-uid');
            copyTextToClipboard(uidVal, card);
        });
    });

    // Trigger copy when clicking anywhere on the UID card
    uidCards.forEach(card => {
        card.addEventListener('click', () => {
            const uidVal = card.getAttribute('data-uid');
            copyTextToClipboard(uidVal, card);
        });
    });

    function copyTextToClipboard(text, cardElement) {
        navigator.clipboard.writeText(text).then(() => {
            playSuccessSound();
            
            // Visual feedback on the specific copy icon
            const copyBtn = cardElement.querySelector('.btn-copy-uid');
            if (copyBtn) {
                copyBtn.innerHTML = '<i data-lucide="check" class="text-green"></i>';
                lucide.createIcons();
                setTimeout(() => {
                    copyBtn.innerHTML = '<i data-lucide="copy"></i>';
                    lucide.createIcons();
                    setupCursorHovers(); // Re-bind custom cursor events
                }, 2000);
            }
            
            const gameName = cardElement.querySelector('.game-name').textContent;
            showNotification('UID COPIED', `Successfully copied ${gameName} UID: ${text}`, 'clipboard', 'green');
        }).catch(err => {
            showNotification('COPY ERROR', 'Could not copy to clipboard automatically.', 'alert-triangle', 'magenta');
        });
    }

    // 7. 3D Parallax Hover Tilt Effect
    const tiltCards = document.querySelectorAll('[data-tilt]');
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const pctX = x / rect.width;
            const pctY = y / rect.height;

            card.style.setProperty('--mouse-x', `${pctX * 100}%`);
            card.style.setProperty('--mouse-y', `${pctY * 100}%`);

            const rotY = (pctX - 0.5) * 12;
            const rotX = -(pctY - 0.5) * 12;

            card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-5px) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
        });
    });

    // 8. Ping Canvas Chart updates
    const pingCanvas = document.getElementById('ping-canvas');
    if (pingCanvas) {
        const ctx = pingCanvas.getContext('2d');
        const pings = Array(35).fill(24);

        function updateAndDrawPing() {
            ctx.clearRect(0, 0, pingCanvas.width, pingCanvas.height);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 1;
            for (let i = 20; i < pingCanvas.height; i += 20) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(pingCanvas.width, i);
                ctx.stroke();
            }

            const drift = (Math.random() - 0.5) * 3;
            const spikeChance = Math.random() > 0.97 ? Math.random() * 25 : 0;
            const finalPing = Math.round(Math.max(14, 23 + drift + spikeChance));

            pings.push(finalPing);
            pings.shift();

            const readout = document.getElementById('ping-readout');
            if (readout) {
                readout.textContent = `${finalPing} ms`;
                readout.className = finalPing > 38 ? 'font-mono text-magenta' : 'font-mono text-green';
            }

            ctx.beginPath();
            const step = pingCanvas.width / (pings.length - 1);
            pings.forEach((ping, index) => {
                const y = pingCanvas.height - (ping / 70) * pingCanvas.height;
                const x = index * step;
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0, 242, 254, 0.8)';
            ctx.strokeStyle = '#00f2fe';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.lineTo(pingCanvas.width, pingCanvas.height);
            ctx.lineTo(0, pingCanvas.height);
            ctx.closePath();
            const fillGrad = ctx.createLinearGradient(0, 0, 0, pingCanvas.height);
            fillGrad.addColorStop(0, 'rgba(0, 242, 254, 0.16)');
            fillGrad.addColorStop(1, 'rgba(0, 242, 254, 0)');
            ctx.fillStyle = fillGrad;
            ctx.fill();
        }

        setInterval(updateAndDrawPing, 400);
    }

    // 9. Interactive Matchmaking Simulation
    const matchmakerBtn = document.getElementById('matchmaker-btn');
    const queueOverlay = document.getElementById('queue-overlay');
    const queueTimer = document.getElementById('queue-timer');
    const cancelQueueBtn = document.getElementById('cancel-queue-btn');
    const regionSelect = document.getElementById('region-select');

    let queueActive = false;
    let queueSeconds = 0;
    let queueInterval = null;

    if (matchmakerBtn && queueOverlay) {
        matchmakerBtn.addEventListener('click', () => {
            queueActive = true;
            queueSeconds = 0;
            queueOverlay.classList.remove('hidden');
            queueTimer.textContent = '00:00';
            
            showNotification('MATCHMAKING STARTED', `Searching in ${regionSelect.value.toUpperCase()} sector.`, 'search', 'cyan');

            queueInterval = setInterval(() => {
                queueSeconds++;
                const mins = String(Math.floor(queueSeconds / 60)).padStart(2, '0');
                const secs = String(queueSeconds % 60).padStart(2, '0');
                queueTimer.textContent = `${mins}:${secs}`;

                if (queueSeconds === 6) {
                    playSuccessSound();
                    clearInterval(queueInterval);
                    
                    const overlayMsg = queueOverlay.querySelector('.status-msg');
                    const overlayTimer = queueOverlay.querySelector('.timer');
                    
                    overlayMsg.textContent = 'SECURE SECTOR FOUND!';
                    overlayMsg.className = 'status-msg font-mono text-green';
                    overlayTimer.className = 'timer font-mono text-green';
                    
                    setTimeout(() => {
                        queueOverlay.classList.add('hidden');
                        overlayMsg.textContent = 'SCANNING QUANTUM CHANNELS...';
                        overlayMsg.className = 'status-msg font-mono';
                        overlayTimer.className = 'timer font-mono';
                        queueActive = false;

                        showNotification('READY TO DEPLOY', 'Drop sector established. Launching instance...', 'swords', 'green');
                    }, 1800);
                }
            }, 1000);
        });
    }

    if (cancelQueueBtn && queueOverlay) {
        cancelQueueBtn.addEventListener('click', () => {
            if (queueInterval) clearInterval(queueInterval);
            queueActive = false;
            queueOverlay.classList.add('hidden');
            showNotification('MATCHMAKING ABORTED', 'Terminated quantum search lines.', 'x-circle', 'magenta');
        });
    }

    // 10. Token Shop Package Selection (Enquiry router)
    const orderButtons = document.querySelectorAll('.order-btn');
    const formSubject = document.getElementById('form-subject');
    const formUid = document.getElementById('form-uid');

    orderButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const game = btn.getAttribute('data-game');
            const packageName = btn.getAttribute('data-package');
            
            // Set values inside contact form
            if (formSubject) {
                formSubject.value = `Order Request: ${packageName}`;
            }
            if (formUid) {
                // If Niloy has a matching UID, show it as an example placeholder, or leave blank for user
                let matchingPlaceholder = "";
                if (game === "PUBG Mobile") matchingPlaceholder = "e.g. 52280046754";
                else if (game === "COD Mobile") matchingPlaceholder = "e.g. 7501403367808106499";
                else if (game === "Free Fire") matchingPlaceholder = "e.g. 11419186189";
                
                formUid.placeholder = matchingPlaceholder;
                formUid.focus();
            }

            // Redirect to contact tab
            document.querySelector('[data-tab="contact-tab"]').click();
            
            showNotification('SECURE STORE ROUTE', `Transferred ${game} package to contact form.`, 'shopping-cart', 'cyan');
        });
    });

    // 11. Secure Contact Form Submission Handler
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('form-name').value;
            const subject = document.getElementById('form-subject').value;
            
            playSuccessSound();
            
            // Send toast success notification
            showNotification(
                'TRANSMISSION SENT', 
                `Hello ${name}, your order/message regarding "${subject}" has been encrypted & dispatched!`, 
                'send', 
                'green'
            );
            
            // Reset fields
            contactForm.reset();
            if (formUid) formUid.placeholder = "Your Game ID";
        });
    }

    // 12. Toast Notification Factory
    const notifBox = document.getElementById('notif-box');

    function showNotification(title, message, iconName = 'bell', type = 'cyan') {
        const toast = document.createElement('div');
        toast.className = 'toast glass-panel-sm';
        
        let typeColorClass = 'text-cyan';
        if (type === 'magenta') typeColorClass = 'text-magenta';
        if (type === 'green') typeColorClass = 'text-green';
        if (type === 'violet') typeColorClass = 'text-violet';

        toast.innerHTML = `
            <i data-lucide="${iconName}" class="toast-icon ${typeColorClass}"></i>
            <div class="toast-body">
                <span class="toast-title font-mono ${typeColorClass}">${title}</span>
                <span class="toast-msg">${message}</span>
            </div>
        `;
        
        notifBox.appendChild(toast);
        lucide.createIcons();

        setupCursorHovers();

        // Slide out after 3.8 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            toast.style.transition = 'transform 0.4s ease-in';
            setTimeout(() => {
                toast.remove();
            }, 400);
        }, 3800);
    }

    // Play initial notification to introduce interface
    setTimeout(() => {
        showNotification('NILOY CONSOLE ONLINE', 'Data successfully synchronized from core node.', 'globe', 'green');
    }, 1200);

    const alertCard = document.getElementById('notify-card');
    if (alertCard) {
        alertCard.addEventListener('click', () => {
            showNotification('NEW DIALOGUE OPENED', 'Welcome back, commander. System calibrations are nominal.', 'message-square', 'violet');
        });
    }

    // 13. Anime Kill Effect — runs every 2 seconds after intro completes
    const killOverlay = document.getElementById('anime-kill-overlay');
    const killVictimName = document.getElementById('kill-victim-name');
    
    const enemyNames = [
        'SHADOW_7X', 'GH0ST_SNIPER', 'BL4ZE_FURY', 'VENOM_STRIKE',
        'N1GHTM4RE', 'IRON_FANG', 'CYB3R_W0LF', 'DARK_PH03N1X',
        'RAZOR_EDGE', 'STORM_BR34KER', 'HAVOC_KING', 'FROST_B1TE',
        'SKULL_CR4SH', 'TH3_PUNISHER', 'WARP_DRIVE', 'OMEGA_X',
        'REAP3R_Z', 'SH4DOW_OPS', 'TITAN_SLAYER', 'QUANTUM_K1LL'
    ];

    let killAnimTimeout = null;
    let killLoopStarted = false;

    function triggerAnimeKill() {
        if (!killOverlay) return;

        // Random enemy name
        const randomEnemy = enemyNames[Math.floor(Math.random() * enemyNames.length)];
        if (killVictimName) killVictimName.textContent = randomEnemy;

        // Reset animation states by removing and re-adding class
        killOverlay.classList.remove('show-kill');
        killOverlay.classList.add('hidden-kill');

        // Force DOM reflow to reset CSS animations
        void killOverlay.offsetWidth;

        // Show the kill overlay
        killOverlay.classList.remove('hidden-kill');
        killOverlay.classList.add('show-kill');

        // Play a sharp gunshot sound
        playGunshotSound();

        // Hide after 1.2 seconds
        if (killAnimTimeout) clearTimeout(killAnimTimeout);
        killAnimTimeout = setTimeout(() => {
            killOverlay.classList.remove('show-kill');
            killOverlay.classList.add('hidden-kill');
        }, 1200);
    }

    function playGunshotSound() {
        if (!soundEnabled) return;
        initAudio();
        if (!audioCtx) return;

        // White noise burst for gunshot
        const bufferSize = audioCtx.sampleRate * 0.08;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

        // Low pass for boom
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.06);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        noise.start();
        noise.stop(audioCtx.currentTime + 0.08);
    }

    function startKillLoop() {
        if (killLoopStarted) return;
        killLoopStarted = true;

        // First kill after 3 seconds
        setTimeout(() => {
            triggerAnimeKill();
            // Then repeat every 2 seconds
            setInterval(triggerAnimeKill, 2000);
        }, 3000);
    }

    // Watch for intro completion — start kill loop when main site becomes visible
    const mainSiteObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.classList.contains('main-site-visible')) {
                startKillLoop();
                mainSiteObserver.disconnect();
            }
        });
    });

    const mainSiteEl = document.getElementById('main-site');
    if (mainSiteEl) {
        if (mainSiteEl.classList.contains('main-site-visible')) {
            // Already visible (e.g. no intro)
            startKillLoop();
        } else {
            mainSiteObserver.observe(mainSiteEl, { attributes: true, attributeFilter: ['class'] });
        }
    }
});
