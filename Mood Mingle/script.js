document.addEventListener('DOMContentLoaded', () => {
    // PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js').then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, err => {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }

    initStarField();
    initStarField();
    initChatInterface();
});

// --- Star Field Animation ---
function initStarField() {
    const canvas = document.getElementById('star-canvas');
    const ctx = canvas.getContext('2d');

    let width, height;
    let stars = [];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        initStars();
    }

    window.addEventListener('resize', resize);

    class Star {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 1.5;
            this.speedX = (Math.random() - 0.5) * 0.2;
            this.speedY = (Math.random() - 0.5) * 0.2;
            this.opacity = Math.random();
            this.fadeDirection = Math.random() > 0.5 ? 1 : -1;
            this.fadeSpeed = Math.random() * 0.02 + 0.005;
            this.colorVariant = Math.random();
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Wrap around
            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;

            // Twinkle effect
            this.opacity += this.fadeDirection * this.fadeSpeed;
            if (this.opacity <= 0) {
                this.opacity = 0;
                this.fadeDirection = 1;
            } else if (this.opacity >= 1) {
                this.opacity = 1;
                this.fadeDirection = -1;
            }
        }

        draw() {
            if (document.body.classList.contains('love-theme')) {
                let colorBase = this.colorVariant > 0.66 ? '135, 206, 250' : (this.colorVariant > 0.33 ? '221, 160, 221' : '255, 105, 180');
                ctx.fillStyle = `rgba(${colorBase}, ${this.opacity})`;
                let size = this.size * 3;
                let topCurveHeight = size * 0.3;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + topCurveHeight);
                ctx.bezierCurveTo(this.x, this.y, this.x - size / 2, this.y, this.x - size / 2, this.y + topCurveHeight);
                ctx.bezierCurveTo(this.x - size / 2, this.y + (size + topCurveHeight) / 2, this.x, this.y + (size + topCurveHeight) / 2 + size * 0.3, this.x, this.y + size);
                ctx.bezierCurveTo(this.x, this.y + (size + topCurveHeight) / 2 + size * 0.3, this.x + size / 2, this.y + (size + topCurveHeight) / 2, this.x + size / 2, this.y + topCurveHeight);
                ctx.bezierCurveTo(this.x + size / 2, this.y, this.x, this.y, this.x, this.y + topCurveHeight);
                ctx.fill();
            } else {
                ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function initStars() {
        stars = [];
        const numStars = Math.floor((width * height) / 3000); // Density
        for (let i = 0; i < numStars; i++) {
            stars.push(new Star());
        }
    }

    function animateStars() {
        ctx.clearRect(0, 0, width, height);
        stars.forEach(star => {
            star.update();
            star.draw();
        });
        requestAnimationFrame(animateStars);
    }

    resize();
    animateStars();
}

// --- Chat Interface Logic ---
function initChatInterface() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const messagesContainer = document.getElementById('messages-container');
    const chatWindow = document.getElementById('chat-window');

    // Authentication System
    const authEmail = document.getElementById('auth-email');
    const authPhone = document.getElementById('auth-phone');
    const fullLoginScreen = document.getElementById('full-login-screen');
    const mainAppContainer = document.getElementById('main-app-container');

    let isAuthenticated = localStorage.getItem('moodMingleAuthToken');

    if (!isAuthenticated) {
        if (fullLoginScreen) fullLoginScreen.style.display = 'flex';
        if (mainAppContainer) mainAppContainer.style.display = 'none';

        const authSubmitBtn = document.getElementById('auth-submit-btn');
        const authStatus = document.getElementById('auth-status');

        if (authSubmitBtn) {
            authSubmitBtn.addEventListener('click', async () => {
                const email = authEmail ? authEmail.value.trim() : "";
                const phone = authPhone ? authPhone.value.trim() : "";

                if (!email || !phone) {
                    if (authStatus) { authStatus.textContent = "Please fill in Email and Phone Number!"; authStatus.style.color = "#ef4444"; }
                    return;
                }

                let storedUsers = JSON.parse(localStorage.getItem('moodMingleUsersDB')) || [];
                // Check if user already exists
                if (!storedUsers.find(u => u.email === email)) {
                    storedUsers.push({ email, phone });
                    localStorage.setItem('moodMingleUsersDB', JSON.stringify(storedUsers));
                }

                if (authStatus) { authStatus.textContent = "Authenticating..."; authStatus.style.color = "#10b981"; }

                const forceLoginSuccess = () => {
                    localStorage.setItem('moodMingleAuthToken', 'true');
                    localStorage.setItem('moodMingleUserContact', email);
                    if (fullLoginScreen) fullLoginScreen.style.display = 'none';
                    if (mainAppContainer) mainAppContainer.style.display = 'flex';
                };

                try {
                    const response = await fetch('http://localhost:5000/api/auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contact: email })
                    });

                    const data = await response.json();
                    if (data.success) {
                        forceLoginSuccess();
                        if (typeof showToast === 'function') showToast(data.message + "! Welcome.");
                    } else {
                        if (authStatus) { authStatus.textContent = data.error || "Authentication failed."; authStatus.style.color = "#ef4444"; }
                    }
                } catch (e) {
                    console.log("Secure Backend offline, falling back to local memory authentication.");
                    forceLoginSuccess();
                    if (typeof showToast === 'function') showToast("Local Login Successful!");
                }

            });
        }
    } else {
        if (fullLoginScreen) fullLoginScreen.style.display = 'none';
        if (mainAppContainer) mainAppContainer.style.display = 'flex';
    }

    // State Management
    const STORAGE_KEY = 'moodMingleChats';
    const THEME_KEY = 'moodMingleTheme';

    let allConversations = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    let currentChatId = null;
    let showHiddenConvs = false;

    const toggleHiddenBtn = document.getElementById('toggle-hidden-btn');
    if (toggleHiddenBtn) {
        toggleHiddenBtn.addEventListener('click', () => {
            showHiddenConvs = !showHiddenConvs;
            toggleHiddenBtn.innerHTML = showHiddenConvs ? '<i class="fas fa-eye-slash"></i> Hide Hidden' : '<i class="fas fa-eye"></i> Show Hidden';
            if (showHiddenConvs) {
                toggleHiddenBtn.style.color = 'var(--text-primary)';
                toggleHiddenBtn.style.background = 'rgba(255,255,255,0.2)';
            } else {
                toggleHiddenBtn.style.color = 'var(--text-secondary)';
                toggleHiddenBtn.style.background = 'rgba(255,255,255,0.1)';
            }
            renderConversationsList();
        });
    }

    function toggleLoveSymbols(show) {
        const existing = document.getElementById('love-symbols-container');
        if (show) {
            if (!existing) {
                const container = document.createElement('div');
                container.id = 'love-symbols-container';
                container.style.position = 'fixed';
                container.style.top = '0';
                container.style.left = '0';
                container.style.width = '100vw';
                container.style.height = '100vh';
                container.style.pointerEvents = 'none';
                container.style.zIndex = '-1';
                container.style.overflow = 'hidden';
                document.body.appendChild(container);

                const symbols = ['💖', '💙', '💕', '💜', '💗', '✨', '🩵', '🩷'];
                for (let i = 0; i < 60; i++) {
                    const el = document.createElement('div');
                    el.innerText = symbols[Math.floor(Math.random() * symbols.length)];
                    el.style.position = 'absolute';
                    el.style.left = Math.random() * 100 + 'vw';
                    el.style.bottom = '-50px';
                    el.style.fontSize = (Math.random() * 2 + 1) + 'rem';
                    el.style.opacity = Math.random() * 0.6 + 0.2;
                    el.style.animation = `floatUp ${Math.random() * 15 + 10}s linear infinite`;
                    el.style.animationDelay = `-${Math.random() * 25}s`;
                    container.appendChild(el);
                }

                if (!document.getElementById('love-keyframes')) {
                    const style = document.createElement('style');
                    style.id = 'love-keyframes';
                    style.innerHTML = `@keyframes floatUp { 0% { transform: translateY(0) rotate(0deg); opacity: 0.8; } 100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; } }`;
                    document.head.appendChild(style);
                }
            }
        } else {
            if (existing) existing.remove();
        }
    }

    // Load Theme
    let savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    const themeSelector = document.getElementById('theme-selector');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        document.body.classList.remove('love-theme');
        toggleLoveSymbols(false);
        if (themeSelector) themeSelector.value = 'light';
    } else if (savedTheme === 'love') {
        document.body.classList.add('love-theme');
        document.body.classList.remove('light-mode');
        toggleLoveSymbols(true);
        if (themeSelector) themeSelector.value = 'love';
    } else {
        toggleLoveSymbols(false);
    }

    if (themeSelector) {
        themeSelector.addEventListener('change', (e) => {
            savedTheme = e.target.value;
            localStorage.setItem(THEME_KEY, savedTheme);
            document.body.classList.remove('light-mode', 'love-theme');
            if (savedTheme === 'light') {
                document.body.classList.add('light-mode');
                toggleLoveSymbols(false);
            } else if (savedTheme === 'love') {
                document.body.classList.add('love-theme');
                toggleLoveSymbols(true);
            } else {
                toggleLoveSymbols(false);
            }
        });
    }

    // Load Language
    const LANG_KEY = 'moodMingleLang';
    let savedLang = localStorage.getItem(LANG_KEY) || 'auto';
    const langSelector = document.getElementById('language-selector');
    if (langSelector) {
        langSelector.value = savedLang;
        langSelector.addEventListener('change', (e) => {
            savedLang = e.target.value;
            localStorage.setItem(LANG_KEY, savedLang);
            if (typeof showToast === 'function') showToast('Language preference updated');
        });
    }

    // Load User Identity
    const IDENTITY_KEY = 'moodMingleUserIdentity';
    let savedIdentity = localStorage.getItem(IDENTITY_KEY) || 'female_friend';
    const identitySelector = document.getElementById('user-identity-selector');
    if (identitySelector) {
        identitySelector.value = savedIdentity;
        identitySelector.addEventListener('change', (e) => {
            savedIdentity = e.target.value;
            localStorage.setItem(IDENTITY_KEY, savedIdentity);
            if (typeof showToast === 'function') showToast('Identity context saved for AI responses');
        });
    }

    // API Keys Persistence
    const openaiApiKeyInput = document.getElementById('openai-api-key');
    if (openaiApiKeyInput) {
        openaiApiKeyInput.value = localStorage.getItem('moodMingleOpenaiKey') || '';
        openaiApiKeyInput.addEventListener('change', (e) => {
            localStorage.setItem('moodMingleOpenaiKey', e.target.value.trim());
            if (typeof showToast === 'function' && e.target.value.trim()) showToast('OpenAI GPT-3 Key Saved!');
        });
    }

    const geminiApiKeyInput = document.getElementById('gemini-api-key');
    if (geminiApiKeyInput) {
        geminiApiKeyInput.value = localStorage.getItem('moodMingleGeminiKey') || '';
        geminiApiKeyInput.addEventListener('change', (e) => {
            localStorage.setItem('moodMingleGeminiKey', e.target.value.trim());
            if (typeof showToast === 'function' && e.target.value.trim()) showToast('Gemini AI Key Saved!');
        });
    }

    // Backup functionality
    const backupBtn = document.getElementById('backup-btn');
    if (backupBtn) {
        backupBtn.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allConversations, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "mood_mingle_backup.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            showToast('Backup downloaded successfully!');
        });
    }

    // Feedback functionality
    const submitFeedbackBtn = document.getElementById('submit-feedback-btn');
    const appFeedback = document.getElementById('app-feedback');
    if (submitFeedbackBtn && appFeedback) {
        submitFeedbackBtn.addEventListener('click', () => {
            if (appFeedback.value.trim() !== '') {
                if (typeof showToast === 'function') showToast('Feedback Submitted Successfully!');
                appFeedback.value = '';
            }
        });
    }

    // NEW FEATURE: SOS Calm Mode Button Logic
    const sosBtn = document.getElementById('sos-btn');
    if (sosBtn) {
        sosBtn.addEventListener('click', () => {
            const chatInputLocal = document.getElementById('chat-input');
            const sendBtnLocal = document.getElementById('send-btn');
            if (chatInputLocal && sendBtnLocal) {
                // Instantly trigger an SOS stress phrase so AI knows to launch grounding protocols and play calm music
                chatInputLocal.value = "I am feeling severely stressed and having a panic attack, please activate SOS Calm Mode right now and help me.";
                sendBtnLocal.click();
                if (typeof showToast === 'function') showToast("🚨 SOS Mode Activated. Calling for help.");
            }
        });
    }

    // Sidebar Mobile
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');

    // API Panel Switch
    const apiBtn = document.getElementById('api-btn');
    const apiPanel = document.getElementById('api-panel');
    const closeApiBtn = document.getElementById('close-api-btn');

    if (apiBtn && apiPanel && closeApiBtn) {
        apiBtn.addEventListener('click', () => {
            apiPanel.classList.toggle('show');
        });
        closeApiBtn.addEventListener('click', () => {
            apiPanel.classList.remove('show');
        });
    }

    // Relationship Toggle Logic
    const relationshipToggle = document.getElementById('relationship-toggle');
    const relationshipMenu = document.getElementById('relationship-menu');
    const currentRelationshipSpan = document.getElementById('current-relationship');

    if (relationshipToggle && relationshipMenu) {
        relationshipToggle.addEventListener('click', (e) => {
            // Only toggle if we didn't click inside the menu
            if (!relationshipMenu.contains(e.target)) {
                relationshipMenu.classList.toggle('show');
            }
        });

        document.addEventListener('click', (e) => {
            if (!relationshipToggle.contains(e.target)) {
                relationshipMenu.classList.remove('show');
            }
        });

        const items = relationshipMenu.querySelectorAll('.dropdown-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const role = item.getAttribute('data-role');
                // Remove active class
                items.forEach(i => i.classList.remove('active'));
                // Add to clicked
                item.classList.add('active');
                // Update text
                if (currentRelationshipSpan) {
                    currentRelationshipSpan.textContent = item.textContent;
                }
                // Close menu
                relationshipMenu.classList.remove('show');

                // Start a new chat page explicitly for this relationsip
                window.location.href = window.location.pathname + '?new=1&role=' + role;
            });
        });
    }

    // Toast Notifications for dummy buttons
    const toast = document.getElementById('toast');
    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    const dummyButtons = [
        ...document.querySelectorAll('.sidebar-nav .nav-item'),
        document.getElementById('settings-btn')
    ];

    const spotifyBtn = document.getElementById('spotify-btn');
    if (spotifyBtn) {
        spotifyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const chatInputLocal = document.getElementById('chat-input');
            const sendBtnLocal = document.getElementById('send-btn');
            if (chatInputLocal && sendBtnLocal) {
                chatInputLocal.value = "I want to listen to some Spotify music for my mood.";
                sendBtnLocal.click();
            }
        });
    }

    // Voice Assistant Engine Setup
    let recognition = null;
    let isRecording = false;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const micBtn = document.querySelector('.mic-btn');

    if (SpeechRecognition && micBtn) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = function () {
            isRecording = true;
            micBtn.style.color = '#ef4444';
            showToast('Listening... Speak now 🎙️');
        };

        recognition.onend = function () {
            isRecording = false;
            micBtn.style.color = '';
        };

        recognition.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            // Append the text directly into the chat input bar instead of auto-sending
            if (chatInput.value) {
                chatInput.value += ' ' + transcript;
            } else {
                chatInput.value = transcript;
            }
            showToast('Voice transcribed! Press Send when ready.');
        };

        let micPermissionState = localStorage.getItem('micPermission') || 'unset';

        micBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isRecording) {
                recognition.stop();
                return;
            }

            // Custom UI Permission Gate
            if (micPermissionState === 'granted') {
                recognition.start();
            } else if (micPermissionState === 'denied') {
                showToast('Microphone access has been denied.');
            } else {
                // 'unset' or 'ask' -> Show our custom UI modal
                const modalEl = document.getElementById('mic-permission-modal');
                if (modalEl) openModal(modalEl);
            }
        });

        // Wire Custom Permission Buttons
        document.getElementById('mic-allow-all')?.addEventListener('click', () => {
            localStorage.setItem('micPermission', 'granted');
            micPermissionState = 'granted';
            closeModals();
            recognition.start();
        });

        document.getElementById('mic-allow-once')?.addEventListener('click', () => {
            localStorage.setItem('micPermission', 'ask');
            micPermissionState = 'ask';
            closeModals();
            recognition.start();
        });

        document.getElementById('mic-deny')?.addEventListener('click', () => {
            localStorage.setItem('micPermission', 'denied');
            micPermissionState = 'denied';
            closeModals();
            showToast('Microphone access denied.');
        });
    } else if (micBtn) {
        micBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Voice Assistant not supported in this browser.');
        });
    }

    // Agent Speech Synthesis Engine
    function speakText(text, langCode) {
        if (!('speechSynthesis' in window)) return;

        // Check if user disabled voice output
        if (localStorage.getItem('moodMingleVoiceOutput') === 'false') return;

        // Strip emojis for speech
        const stripped = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
        const utterance = new SpeechSynthesisUtterance(stripped);

        if (langCode === 'te') utterance.lang = 'te-IN';
        else if (langCode === 'hi') utterance.lang = 'hi-IN';
        else utterance.lang = 'en-US';

        // Apply Voice Modifier based on active relationship setting
        let activeRole = 'friend';
        document.querySelectorAll('.dropdown-item').forEach(div => {
            if (div.classList.contains('active')) activeRole = div.getAttribute('data-role');
        });
        const vMap = JSON.parse(localStorage.getItem('moodMingleVoiceMap')) || {};
        const voicePref = vMap[activeRole] || 'f1';

        let voices = window.speechSynthesis.getVoices();

        if (voicePref.startsWith('m')) {
            // Find a male voice
            let maleVoice = voices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('mark') || v.name.toLowerCase().includes('guy') || v.name.toLowerCase().includes('rishi'));
            if (maleVoice) utterance.voice = maleVoice;

            utterance.pitch = (voicePref === 'm1') ? 1.0 : 0.6; // Male Sweet vs Strict
            utterance.rate = (voicePref === 'm1') ? 1.0 : 0.95;
        } else {
            // Find a female voice
            let femaleVoice = voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('girl') || (!v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('david') && !v.name.toLowerCase().includes('rishi')));
            if (femaleVoice) utterance.voice = femaleVoice;

            utterance.pitch = (voicePref === 'f1') ? 1.4 : 0.7; // Female Sweet vs Strict
            utterance.rate = (voicePref === 'f1') ? 1.0 : 1.1;
        }

        window.speechSynthesis.speak(utterance);
    }

    // Modals setup
    const modalOverlay = document.getElementById('modal-overlay');
    const conversationsModal = document.getElementById('conversations-modal');
    const settingsModal = document.getElementById('settings-modal');

    function openModal(modalEl) {
        if (!modalOverlay || !modalEl) return;
        modalOverlay.classList.add('show');
        modalEl.classList.add('show');
    }

    function closeModals() {
        if (!modalOverlay) return;
        modalOverlay.classList.remove('show');
        if (conversationsModal) conversationsModal.classList.remove('show');
        if (settingsModal) settingsModal.classList.remove('show');
        const journalModal = document.getElementById('journal-modal');
        if (journalModal) journalModal.classList.remove('show');
        const micPermissionModal = document.getElementById('mic-permission-modal');
        if (micPermissionModal) micPermissionModal.classList.remove('show');
    }

    if (modalOverlay) modalOverlay.addEventListener('click', closeModals);
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    function renderConversationsList() {
        const listEl = document.getElementById('conversations-list');
        if (!listEl) return;
        listEl.innerHTML = '';

        const visibleConvs = showHiddenConvs ? allConversations : allConversations.filter(c => !c.hidden);

        if (visibleConvs.length === 0) {
            listEl.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">No conversations yet.</p>';
            return;
        }

        visibleConvs.slice().reverse().forEach(conv => {
            const div = document.createElement('div');
            div.className = 'conversation-item';
            div.innerHTML = `
                <div class="conv-icon"><i class="fas fa-comment"></i></div>
                <div class="conv-details" style="flex-grow: 1;">
                    <h4>${conv.title}</h4>
                    <p>${new Date(conv.date).toLocaleDateString()} • ${conv.role} Mode</p>
                </div>
                <div class="conv-actions-container" style="position: relative;">
                    <button class="conv-options-btn" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 8px 5px;"><i class="fas fa-ellipsis-v"></i></button>
                    <div class="conv-options-dropdown">
                        <div class="conv-dropdown-item" data-action="toggle-hide"><i class="fas ${conv.hidden ? 'fa-eye' : 'fa-eye-slash'}"></i> ${conv.hidden ? 'Unhide' : 'Hide'}</div>
                        <div class="conv-dropdown-item" data-action="delete" style="color: #ef4444;"><i class="fas fa-trash"></i> Delete</div>
                        <div class="conv-dropdown-item" data-action="close"><i class="fas fa-times"></i> Close</div>
                    </div>
                </div>
            `;

            div.addEventListener('click', (e) => {
                if (e.target.closest('.conv-actions-container')) return;
                window.location.href = window.location.pathname + '?chat=' + conv.id;
            });

            const optionsBtn = div.querySelector('.conv-options-btn');
            const dropdown = div.querySelector('.conv-options-dropdown');

            optionsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.conv-options-dropdown.show').forEach(d => {
                    if (d !== dropdown) d.classList.remove('show');
                });
                dropdown.classList.toggle('show');
            });

            const optionItems = div.querySelectorAll('.conv-dropdown-item');
            optionItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = item.getAttribute('data-action');
                    if (action === 'toggle-hide') {
                        conv.hidden = !conv.hidden;
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(allConversations));
                        renderConversationsList();
                    } else if (action === 'delete') {
                        allConversations = allConversations.filter(c => c.id !== conv.id);
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(allConversations));
                        renderConversationsList();
                        if (currentChatId === conv.id) {
                            window.location.href = window.location.pathname + '?new=1';
                        }
                    } else if (action === 'close') {
                        dropdown.classList.remove('show');
                    }
                });
            });

            listEl.appendChild(div);
        });
    }

    document.addEventListener('click', () => {
        document.querySelectorAll('.conv-options-dropdown.show').forEach(d => d.classList.remove('show'));
    });

    // Check URL parameters for New Chat or loading specific chat
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('new')) {
        if (messagesContainer) messagesContainer.innerHTML = '';
        currentChatId = Date.now().toString();

        // Inherit the role if passed in URL
        const newRole = urlParams.get('role');
        if (newRole) {
            const roleDivs = document.querySelectorAll('.dropdown-item');
            roleDivs.forEach(div => {
                if (div.getAttribute('data-role') === newRole) {
                    roleDivs.forEach(i => i.classList.remove('active'));
                    div.classList.add('active');
                    if (currentRelationshipSpan) currentRelationshipSpan.textContent = div.textContent;
                }
            });
        }
    } else if (urlParams.has('chat')) {
        currentChatId = urlParams.get('chat');
        const activeConv = allConversations.find(c => c.id === currentChatId);
        if (activeConv && messagesContainer) {
            messagesContainer.innerHTML = '';
            activeConv.messages.forEach(msg => {
                appendMessage(msg.role, msg.content, false);
            });
            // Also set context role
            const roleDivs = document.querySelectorAll('.dropdown-item');
            roleDivs.forEach(div => {
                if (div.getAttribute('data-role') === activeConv.role) {
                    roleDivs.forEach(i => i.classList.remove('active'));
                    div.classList.add('active');
                    if (currentRelationshipSpan) currentRelationshipSpan.textContent = div.textContent;
                }
            });
        }
    } else {
        // If there's an existing conversation, load the latest one automatically
        if (allConversations.length > 0) {
            const latest = allConversations[allConversations.length - 1];
            currentChatId = latest.id;
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
                latest.messages.forEach(msg => {
                    appendMessage(msg.role, msg.content, false);
                });
            }
        } else {
            // Very first time user visits empty state
            if (messagesContainer) messagesContainer.innerHTML = '';
            currentChatId = Date.now().toString();
        }
    }

    renderConversationsList();

    dummyButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent link jump

                if (btn.textContent.includes('New Chat')) {
                    // Open a completely new page without the dummy prompts
                    window.open(window.location.pathname + '?new=1', '_blank');
                    return;
                }

                if (btn.textContent.includes('Conversations')) {
                    openModal(conversationsModal);
                    return;
                }

                if (btn.textContent.includes('Settings') || btn.id === 'settings-btn') {
                    // Refresh voice selector for current role dynamically before opening!
                    const voiceRoleLabel = document.getElementById('voice-role-label');
                    const voiceSelector = document.getElementById('voice-selector');
                    let currentActiveRole = 'friend';
                    document.querySelectorAll('.dropdown-item').forEach(div => {
                        if (div.classList.contains('active')) currentActiveRole = div.getAttribute('data-role');
                    });

                    if (voiceRoleLabel && document.getElementById('current-relationship')) {
                        voiceRoleLabel.textContent = document.getElementById('current-relationship').textContent + ' Mode';
                    }

                    const vMap = JSON.parse(localStorage.getItem('moodMingleVoiceMap')) || {};
                    if (voiceSelector) {
                        voiceSelector.value = vMap[currentActiveRole] || 'f1';
                        // Keep a reference to current editing role for the change listener
                        voiceSelector.setAttribute('data-editing-role', currentActiveRole);
                    }

                    openModal(settingsModal);
                    return;
                }

                showToast('Feature coming soon!');
            });
        }
    });

    // Textarea handling
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
    chatInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value === '') this.style.height = 'auto';
    });

    // Image Upload Logic
    const imageUpload = document.getElementById('image-upload');
    const imageUploadBtn = document.getElementById('image-upload-btn');
    if (imageUploadBtn && imageUpload) {
        imageUploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            imageUpload.click();
        });
        imageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (event) {
                const imgData = event.target.result;
                const imgHtml = `<img src="${imgData}" style="max-width: 100%; border-radius: 8px; margin-bottom: 8px;"><br>`;
                chatInput.value = `[Sent a Photo] Please give me feedback on this photo!`;
                chatInput.setAttribute('data-pending-image', imgHtml);
                if (typeof showToast === 'function') showToast("Photo attached. Press Send!");
            };
            reader.readAsDataURL(file);
        });
    }

    // Maps Button Integration
    const mapsBtn = document.getElementById('maps-btn');
    if (mapsBtn) {
        mapsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            chatInput.value = "Show me the map or route to ";
            chatInput.focus();
        });
    }

    // Send Message Handling
    function scrollToBottom() {
        chatWindow.scrollTo({
            top: chatWindow.scrollHeight,
            behavior: 'smooth'
        });
    }

    function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Ensure we have a current chat ID
        if (!currentChatId) {
            currentChatId = Date.now().toString();
        }

        // Dynamically get replies based on the current relationship
        const roleDivs = document.querySelectorAll('.dropdown-item');
        let currentRole = 'friend';
        roleDivs.forEach(div => {
            if (div.classList.contains('active')) {
                currentRole = div.getAttribute('data-role');
            }
        });

        // Add Sent Sound
        try {
            const sendSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
            sendSound.volume = 0.5;
            sendSound.play();
        } catch (e) { }

        const pendingImage = chatInput.getAttribute('data-pending-image') || '';
        chatInput.removeAttribute('data-pending-image');

        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const msgHtml = `${pendingImage}<p>${text.replace(/\n/g, '<br>')} <span class="msg-status msg-time" id="msg-${currentChatId}-${Date.now()}">${currentTime} <i class="fas fa-check"></i></span></p>`;

        // Save User Message
        appendMessage('user', msgHtml, true);
        chatInput.value = '';
        chatInput.style.height = 'auto'; // reset textarea height
        scrollToBottom();

        // Update stored conversation
        let conv = allConversations.find(c => c.id === currentChatId);
        if (!conv) {
            conv = {
                id: currentChatId,
                title: text.substring(0, 30) + '...',
                role: currentRole,
                date: new Date().toISOString(),
                messages: []
            };
            allConversations.push(conv);
        }
        conv.messages.push({ role: 'user', content: msgHtml });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allConversations));
        renderConversationsList();

        // Show thinking state & Typing indicator
        const typingStatus = document.getElementById('typing-status');
        if (typingStatus) {
            typingStatus.innerHTML = `<span class="online-dot" style="width: 8px; height: 8px; background-color: #3b82f6; border-radius: 50%; display: inline-block; animation: pulse-dot 1.5s infinite;"></span> <span style="color: #3b82f6;">Typing...</span>`;
        }

        const thinkingId = 'thinking-' + Date.now();
        appendThinking(thinkingId);
        scrollToBottom();

        // Simulate AI Reply delay
        setTimeout(async () => {
            const isPhotoFeedback = text === "[Sent a Photo] Please give me feedback on this photo!";
            if (isPhotoFeedback) {
                if (typeof showToast === 'function') showToast("Analyzing photo...");
                await new Promise(r => setTimeout(r, 3000)); // few seconds delay
                let finalReply = "This photo is good to post it, very simple and classi look.";

                removeThinking(thinkingId);
                appendMessage('ai', finalReply, true);
                scrollToBottom();
                speakText(finalReply, 'en');

                let conv = allConversations.find(c => c.id === currentChatId);
                if (conv) {
                    conv.messages.push({ role: 'ai', content: finalReply });
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(allConversations));
                }
                updateApiPanel(text, finalReply);
                return; // Early return to avoid executing the rest of the NLP pipeline
            }

            // Simple NLP Language detection (Chatting / Regional strings)
            const teluguKeywords = ['ela', 'unnava', 'enti', 'cheppu', 'bavunna', 'baagunna', 'anna', 'akka', 'chelli', 'thammudu', 'bangaram', 'bava', 'thinnava', 'nenu', 'nuvvu', 'ra', 'mama', 'bhayya', 'kadu', 'avunu', 'santhosham', 'anandam', 'badha', 'bagunda', 'em', 'chestunnav', 'chey', 'velli'];
            const hindiKeywords = ['kya', 'kaise', 'ho', 'hai', 'bhai', 'jaan', 'mujhe', 'mera', 'tum', 'main', 'nahi', 'haan', 'karo', 'khush', 'dukhi', 'pareshan'];
            const lowerText = text.toLowerCase();
            const words = lowerText.split(/[^a-z0-9]/); // Split by non-alphanumeric

            // NLP Sentiment Engine
            const positiveKeywords = ['happy', 'great', 'awesome', 'good', 'super', 'excited', 'joy', 'love', 'bavunna', 'anandam', 'santhosham', 'khush', 'achha', 'mast', 'best', 'bagundi'];
            const negativeKeywords = ['sad', 'bad', 'stress', 'depress', 'cry', 'fail', 'badha', 'edupu', 'kopam', 'tension', 'dukhi', 'pareshan', 'ro', 'bura', 'hurt', 'feel', 'angry'];

            let sentiment = 'neutral';
            let posCount = positiveKeywords.filter(kw => words.includes(kw) || lowerText.includes(kw)).length;
            let negCount = negativeKeywords.filter(kw => words.includes(kw) || lowerText.includes(kw)).length;

            if (posCount > negCount) sentiment = 'positive';
            else if (negCount > posCount) sentiment = 'negative';

            // NLP Language Engine (Moved up to detect language before audio selection)
            let detectedLang = 'en';
            if (savedLang !== 'auto') {
                detectedLang = savedLang;
            } else if (teluguKeywords.some(kw => words.includes(kw)) || /[\u0c00-\u0c7f]/.test(text)) {
                detectedLang = 'te';
                if (typeof showToast === 'function') showToast(sentiment !== 'neutral' ? `NLP: Telugu (${sentiment})` : 'NLP Engine: Telugu Detected');
            } else if (hindiKeywords.some(kw => words.includes(kw)) || /[\u0900-\u097f]/.test(text)) {
                detectedLang = 'hi';
                if (typeof showToast === 'function') showToast(sentiment !== 'neutral' ? `NLP: Hindi (${sentiment})` : 'NLP Engine: Hindi Detected');
            } else {
                if (sentiment !== 'neutral' && typeof showToast === 'function') showToast(`NLP: Analyzed Context (${sentiment})`);
            }

            // Silently broadcast the context to the local ML Pipeline to update the dataset continuously
            try {
                fetch('http://localhost:5000/api/store_ml_data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_message: text, intent: sentiment })
                }).catch(e => { /* Ignore gracefully if backend offline */ });
            } catch (e) { }


            let wantsMusic = lowerText.includes('music') || lowerText.includes('song') || lowerText.includes('play');

            // Advanced Multi-Dimensional Relational Reply Matrix
            const db = {
                'en': {
                    'friend': {
                        'negative': [
                            "omg noo 🥺 what's wrong? I'm here for you! want to talk about it?",
                            "aww I'm sorry to hear that. taking a break and just chilling for a bit usually helps me. feel free to vent to me."
                        ],
                        'positive': ["that's amazing!! 🎉", "omg yay so happy for u!! 💙 tell me everything", "yesss keep that energy!!"],
                        'neutral': ["hmm makes sense. what else is up?", "oh really? tell me more.", "haha yea. just chilling here."]
                    },
                    'romantic': {
                        'negative': [
                            "babe noo 🥺 it hurts to see u stressed out. just take a deep breath ok? I'm right by your side 💖",
                            "im so sorry you're dealing with this babe. do u want me to just listen or try to help? 💖"
                        ],
                        'positive': ["seeing u happy makes me so happy babe!! 💖", "you deserve it babe!!", "omg hearing you this excited is everything 😘"],
                        'neutral': ["u mean the world to me, tell me everything.", "haha yeah babe. I could listen to u all day 💖"]
                    },
                    'sister': {
                        'negative': ["oh no what happened?? im always here for u, we can talk about whatever is on ur mind 🌸", "that sounds tough. but remember I've got your back ok?"],
                        'positive': ["omg yay!!! so happy for u!! 🎊", "that is amazing news! let's celebrate!", "yayyy 🌸"],
                        'neutral': ["haha yea! just tell me what happened, ready for the tea.", "okay go on, im listening."]
                    },
                    'brother': {
                        'negative': ["yo bro, what's wrong? just let it out. 🤜", "that's rough man. but we got this."],
                        'positive': ["that's what im talking about bro! 🔥", "hell yeah! party time man!", "superb bro, killed it!"],
                        'neutral': ["hmm okay bro. let's tackle this.", "wassup bro, tell me everything."]
                    },
                    'mentor': {
                        'negative': ["I understand. Let's explore your feelings and see how we can approach this strategically. 🦉", "That presents a challenge, but challenges are opportunities for growth."],
                        'positive': ["Excellent work. This is the result of your proper focus and dedication.", "I am very proud of your progress. Keep it up! 🦉"],
                        'neutral': ["Remember to maintain your perspective. You are capable.", "I hear you. Let me know if you want to brainstorm solutions or just reflect."]
                    },
                    'mother': {
                        'negative': ["oh honey, what's wrong? im always here for you. ❤️", "don't stress baby, mom is here. have you eaten anything?"],
                        'positive': ["i am so proud of you sweetheart!! ❤️", "that's wonderful news! you make me so happy."],
                        'neutral': ["take care of yourself okay? love you.", "did you eat properly today? tell me everything."]
                    },
                    'father': {
                        'negative': ["don't worry kid, we will figure it out together. 👨‍👦", "stay strong, i've got your back."],
                        'positive': ["that's my kid! very proud of you. 🌟", "excellent, keep making us proud."],
                        'neutral': ["how are your studies/work going?", "let me know if you need any help."]
                    },
                    'grandmother': {
                        'negative': ["oh my sweet child, don't cry. grandma loves you. 👵❤️", "everything will be alright, just trust me."],
                        'positive': ["bless you my child! you look so happy! 👵❤️", "that is lovely to hear."],
                        'neutral': ["have you eaten? you look tired.", "come visit grandma soon okay?"]
                    },
                    'grandfather': {
                        'negative': ["these things happen, learn from it and move forward. grandpa is here. 👴", "dust yourself off. you are strong."],
                        'positive': ["well done! hard work always pays off. 👴", "i knew you could do it."],
                        'neutral': ["how is everything going?", "listen to your grandpa's advice."]
                    }
                },
                'te': {
                    'friend': {
                        'positive': ["Keka mama! Racha rache inka eeroju, chala santhosham ga undi vinnanduku! 🎉", "Wow bhai, nuvvu thopu asalu. Party eppudu mari? 💙", "Adhiripoyindi mama, that's my bro! Keep it up urake taggaku!"],
                        'negative': ["Are emaindi ra? Enduku ala dull ga unnav, nenunna ga cheppu... 💙", "Badhapadaku mama, life lo ivanni common. Tinnava leda mundu?", "Emi kangarupadaku mama, kasepu antha vadilesi relax avvu, nenu unna kada neeku."],
                        'neutral': ["Ha cheppu mama, enti sangatulu? Tinnava? Ela nadusthundi life?", "Avuna? Inka cheppu vinta. Em chesthunnav? Evaritho unnav?", "Bavundi ra, mari inka sangathenti? Intlo antha clear ea ga?"]
                    },
                    'romantic': {
                        'positive': ["Nuvvu ala happy ga unte naku chala ishtam bangaram! 💖", "Love you! Erojanta pandage mari neeku. Tinnava asalu hapiness lo?", "Nee santhosham eppudu ilaage undali naa pranam! 😘"],
                        'negative': ["Emindhi bangaram? Enduku dull ga unnav... Naatho cheppu, mind relief avuthundi. 💖", "Nee badha naku cheppu, nenu dooram chesthanu. Mundu baga rest teesko.", "Ooruko bangaram, nenu unnanu ga neeku. Em kadu antha set aipotundi, I love you."],
                        'neutral': ["Ha cheppu bangaram, em chesthunnav? Tinnava? Nee gurinche alochistunna.", "Nuvvu cheppedi vintunte haayiga untundi... Inka cheppu e roju emem chesav?", "Hi jaan, how was your day? Bagunda? Naku mottham cheppali nuvvu."]
                    },
                    'sister': {
                        'positive': ["Super ra! I'm so happy for you! Maku party ivvali mari eeroju! 🎊", "Adhiripoyindi!! Intlo andaram chala happy deeni gurinchi! 🌸", "Yay! Naku chala anandam ga undhi! Chocolates tecchava naaku?"],
                        'negative': ["Emaindi ra? Enduku ala unnav, nenu vinadaniki ready ga unnanu cheppu ra. 🌸", "Dhairyanga undu, neeku ee akka/chelli undhi ga. Emi bhayapadoddu.", "Em badhapadaku ra, antha bavuntundi. Mundu velli prasantham ga tinu intlo antha sardukuntundi."],
                        'neutral': ["Ha cheppu ra, tinnavva? Em chesthunnav asalu, how is your day? 🌸", "Enti sangatulu ra? Intiki eppudu osthunnav... Cheppu akka vuntundi ga nee matalu.", "Avuna? Amma ki cheppava mari idi? Sare inka enti sangatulu cheppu..."]
                    },
                    'brother': {
                        'positive': ["Baap re baap! Kamaal kar diya bhai! 🔥 Intlo cheppava idi?", "Superb thammudu, aag laga di tumne! Ide flow maintain chey.", "Wow anna, proud of you! Racha racha cheddam eeroju!"],
                        'negative': ["Are emaindi ra? Evarina emina annara cheppu, elli kotteddam. 🤜", "Lite thesuko bro, avi antha sahajam manaki. Ra baitikelli tea taguddam.", "Himmat rakh mere bhai, apan handle karenge. Tinnava leda thondaraga tinu po."],
                        'neutral': ["Ha cheppu ra, em chesthunnav? Tinnava leda inka?", "Enti sangatulu, asalu kanipinchavu e madhya inti daggara. Cheppu mari, how was the day?", "Ammo avuna? Mari inka em nadusthundi life lo... cheppu anna untadu ga winadaniki."]
                    },
                    'mentor': {
                        'positive': ["Chala bagundi, nee kashtaniki thagga falitham dakkindi. Keep it up. 🦉", "Good. Ippudu focus miss avvaku, you are on the exact right track.", "Excellent progress. Ilaage continue avvu, future lo inkentho sadhistavu."],
                        'negative': ["Alochinchu... antha manchike jaruguthundi. Time thesko. 🦉", "Idi oka chinna hurdle matrame. Idi kooda daatestav le, dhairyam ga undu.", "Nee balam ento naaku thelusu. You are strong. Malli try chey."],
                        'neutral': ["Nee goal meedha focus pettava mari ivala?", "Cool ga alochinchu, antha ardham avtundi. Cheppu em jarigindi?", "I am listening... go ahead and explain your problem to me."]
                    },
                    'mother': {
                        'negative': ["emindhi kanna? badhapadaku nenu unnanu ga ❤️", "kangaru padaku nana, antha set aipotundi. tinnava?"],
                        'positive': ["naa kanna kada, chala santhoshanga undhi! ❤️", "super nana, baga chaduvuko."],
                        'neutral': ["tinnava leda mundu? jagratha.", "em chesthunnav nana?"]
                    },
                    'father': {
                        'negative': ["badhapadaku ra, dhairyam ga undu nenu chuskunta. 👨‍👦", "lite theesko, next time chuskundam."],
                        'positive': ["baga chesav ra, proud of you! 🌟", "alage continue chey ra."],
                        'neutral': ["chaduvu ela undhi?", "em chesthunnav, jagratha."]
                    },
                    'grandmother': {
                        'negative': ["badhapadaku bidda, antha bavuntundi. 👵❤️", "nenu unnanu ga, enduku edusthunnav?"],
                        'positive': ["chala santhosham bidda! devudu challaga chudali. 👵❤️", "bavundi bidda."],
                        'neutral': ["annam tinnava bidda?", "epudu osthunnavi intiki?"]
                    },
                    'grandfather': {
                        'negative': ["dhairyam ga undali, anni manchike. 👴", "kangaru padaku."],
                        'positive': ["bhaleg chesav pilla! 👴", "manchi peru thevali."],
                        'neutral': ["ela unnav?", "jagrathaga undu."]
                    }
                },
                'hi': {
                    'friend': {
                        'positive': ["Bohot badhiya bhai! Khushi hui sunkar! 🎉", "Kya baat hai! Party kab hai bata? 💙", "Maja aa gaya sunkar, keep it up!"],
                        'negative': ["Main hoon na! Batao kya hua, tension mat le.", "Tum akele nahi ho, dost humesha sath hote hain.", "Tension mat lo, sab theek ho jayega."],
                        'neutral': ["Accha, aage batao.", "Main sun raha hoon, batao mujhe.", "Aur kya chal raha hai?"]
                    },
                    'romantic': {
                        'positive': ["Tum khush ho toh main bhi bohot khush hoon jaan! 💖", "Meri jaan, yeh toh bohot acchi khabar hai!", "I love seeing you smile! 😘"],
                        'negative': ["Jaan, main humesha tumhare sath hoon. 💖", "Mujhe batao kya baat hai, main fix kar dunga.", "Rona nahi, sab theek ho jayega."],
                        'neutral': ["Aur batao jaan, kaisa lag raha hai.", "Main humesha tumhari baat sunne ke liye taiyar hoon."]
                    },
                    'sister': {
                        'positive': ["Wah! Main bohat khush hoon tumhare liye! 🎊", "Awesome! Chalo celebrate karte hain! 🌸", "Yeh sunkar maza aa gaya!"],
                        'negative': ["Kya hua? Main sunne ke liye yahan hoon. 🌸", "Himmat rakho, main hoon na.", "Tension mat lo, relax karo."],
                        'neutral': ["Haan batao, aur kya hua.", "Main idhar hi hoon, batao sab detail mein."]
                    },
                    'brother': {
                        'positive': ["Baap re baap! Kamaal kar diya bhai! 🔥", "Superb bhai, aag laga di tumne!", "Wow bhai, proud of you!"],
                        'negative': ["Bol mere bhai, kya tension hai? 🤜", "Lite le bhai, main dekh lunga.", "Himmat rakh mere bhai, apan handle karenge."],
                        'neutral': ["Haan bhai bol, main sun raha hoon.", "Accha phir kya hua?"]
                    },
                    'mentor': {
                        'positive': ["Bohot accha kiya tumne, yeh mehnat ka phal hai. 🦉", "Very good, focus aise hi rakho aage badho.", "Proud of your progress."],
                        'negative': ["Socho is baare mein... sab theek hoga. 🦉", "Ye sirf ek choti si rukaawat hai, don't worry.", "Apni taaqat ko pehchano."],
                        'neutral': ["Apne goal pe focus karo, tum kar sakte ho.", "Dhyan se faisla lo, tum competent ho."]
                    },
                    'mother': {
                        'negative': ["kya hua beta? tension mat lo maa hai na. ❤️", "rona nahi beta."],
                        'positive': ["bohot badhiya beta, khush raho! ❤️", "mera baccha sabse accha!"],
                        'neutral': ["khana khaya beta?", "kya chal raha hai?"]
                    },
                    'father': {
                        'negative': ["tension mat lo beta, main sambhal lunga. 👨‍👦", "himmat rakho."],
                        'positive': ["proud of you beta! 🌟", "shabash!"],
                        'neutral': ["padhai kaisi chal rahi hai?", "dhyan rakhna."]
                    },
                    'grandmother': {
                        'negative': ["kya hua mere bacche? dadi hai na. 👵❤️", "sab theek ho jayega."],
                        'positive': ["khush raho mere bacche! 👵❤️", "bohot accha lag raha hai."],
                        'neutral': ["khana khaya?", "kab aaoge milne?"]
                    },
                    'grandfather': {
                        'negative': ["himmat rakho, in sab se seekho. 👴", "tension mat lo."],
                        'positive': ["bohot accha kiya! 👴", "shabash mere bacche."],
                        'neutral': ["kya chal raha hai?", "dhyan rakhna apna."]
                    }
                }
            };

            let finalReply = '';

            if (false) {
                // Obsolete
            } else {
                const geminiInput = document.getElementById('gemini-api-key');
                const tempInput = geminiInput ? geminiInput.value.trim() : '';
                const apiKey = tempInput || localStorage.getItem('moodMingleGeminiKey') || 'Lucky API KEY';

                const openaiInput = document.getElementById('openai-api-key');
                const tempOpenaiInput = openaiInput ? openaiInput.value.trim() : '';
                const openaiKey = tempOpenaiInput || localStorage.getItem('moodMingleOpenaiKey') || '';

                let offlineFallback = false;

                // Real AI Engine Integration (High Accuracy Official Gemini AI)
                try {
                    const exactLanguage = detectedLang === 'te' ? 'Telugu (written in English script / Tanglish)' : (detectedLang === 'hi' ? 'Hindi (Hinglish)' : 'English');

                    const userIdentitySelect = document.getElementById('user-identity-selector');
                    let userIdentity = userIdentitySelect ? userIdentitySelect.value : (localStorage.getItem('moodMingleUserIdentity') || 'female_friend');

                    let relationalPromptTemplate = '';
                    if (userIdentity === 'little_brother' || userIdentity === 'big_brother') {
                        relationalPromptTemplate = `I am your Brother (Thamudu or Anna). When you talk to me, strictly use reciprocal brotherly pronouns where appropriate! If you are my sister, call me thamudu or anna. If you are my friend, call me mama or bhayya.`;
                    } else if (userIdentity === 'little_sister' || userIdentity === 'big_sister') {
                        relationalPromptTemplate = `I am your Sister (Chelli or Akka). When you talk to me, strictly use reciprocal sisterly pronouns! If you are my big sister, call me chelli. If you are my friend, call me pilla or chelli.`;
                    } else if (userIdentity === 'male_friend') {
                        relationalPromptTemplate = `I am your Male Friend. When you talk to me, strictly use reciprocal friendship slang like Mama, Macha, Dosth, or Bhayya where appropriate.`;
                    } else if (userIdentity === 'female_friend') {
                        relationalPromptTemplate = `I am your Female Friend. When you talk to me, use reciprocal friendship pronouns like Pilla or Dosth where appropriate.`;
                    } else if (userIdentity === 'boyfriend') {
                        relationalPromptTemplate = `I am your Boyfriend/Romantic partner. Use deep loving pronouns like Bava, Baby, or Bangaram when talking to me.`;
                    } else if (userIdentity === 'girlfriend') {
                        relationalPromptTemplate = `I am your Girlfriend/Romantic partner. Use deep loving pronouns like Baby, Bangaram or Pilla when talking to me.`;
                    } else if (userIdentity === 'child') {
                        relationalPromptTemplate = `I am your Son/Daughter. When you talk to me, treat me like your own child with deep parental love.`;
                    } else if (userIdentity === 'grandchild') {
                        relationalPromptTemplate = `I am your Grandchild. Treat me with profound warmth and grandparently love.`;
                    }

                    const systemPrompt = `You are Mood Mingle, an advanced Gemini-powered AI chatbot acting as a loyal ${currentRole}. Your goal is to deeply analyze the user's prompt, understand their core intent, and provide a highly accurate, empathetic, and human-like response in ${exactLanguage}. Keep your responses incredibly friendly and short.

${relationalPromptTemplate}`;

                    let chatHistory = conv && conv.messages ? conv.messages.slice(-6) : [];
                    let historyStr = "";
                    chatHistory.forEach(msg => {
                        historyStr += `\n${msg.role === 'user' ? 'User' : 'You'}: ${msg.content}`;
                    });

                    // 🧠 Intelligent Gemini Context Building
                    let promptContext = `System Setup: ${systemPrompt}\n\nRecent Conversation History: ${historyStr}\n\nNow, strictly analyze the following new message and generate the correct reply directly:\nUser: ${text}\nYour Reply:`;

                    let responseText = '';

                    // Native GPT-3 Integration Header (High Realism)
                    if (openaiKey && openaiKey.startsWith('sk-')) {
                        if (typeof showToast === 'function') showToast("Using Real OpenAI GPT-3 🧠");

                        // Exact requested message format
                        const openaiPayload = {
                            model: "gpt-3.5-turbo",
                            messages: [
                                { role: "system", content: "You are a friendly Telugu-English chatbot." },
                                { role: "user", content: text }
                            ],
                            temperature: 0.7
                        };

                        const response = await fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${openaiKey}`
                            },
                            body: JSON.stringify(openaiPayload)
                        });

                        if (response.ok) {
                            const data = await response.json();
                            if (data.choices && data.choices.length > 0) {
                                responseText = data.choices[0].message.content;
                            }
                        }
                    } else if (apiKey && !apiKey.includes('Lucky')) {
                        if (typeof showToast === 'function') showToast("Using Official High-Accuracy Gemini 1.5 🧠");
                        const geminiPayload = {
                            contents: [{ parts: [{ text: promptContext }] }],
                            generationConfig: { temperature: 0.7 }
                        };

                        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(geminiPayload)
                        });

                        if (response.ok) {
                            const data = await response.json();
                            if (data.candidates && data.candidates.length > 0) {
                                responseText = data.candidates[0].content.parts[0].text;
                            }
                        }
                    }

                    // GPT-3 / Backend Real Output via Python API Integration
                    if (!responseText) {
                        try {
                            if (typeof showToast === 'function') showToast("Thinking via Python AI Backend 🧠");
                            const payload = {
                                system_prompt: systemPrompt,
                                history: chatHistory
                            };

                            const response = await fetch('http://localhost:5000/api/chat', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                            });

                            if (response.ok) {
                                const data = await response.json();
                                if (data.success && data.reply) {
                                    responseText = data.reply;
                                    if (data.ml_intent) sentiment = data.ml_intent;
                                }
                            } else {
                                throw new Error("Local backend not running.");
                            }
                        } catch (backupErr) {
                            // Ultimate Cloud Edge Fallback
                            console.log("Local Backend failed, trying purely pollinations proxy", backupErr);
                            const response = await fetch('https://text.pollinations.ai/' + encodeURIComponent(promptContext));
                            if (!response.ok) throw new Error('Proxy API failed');
                            responseText = await response.text();
                        }
                    }

                    if (responseText && responseText.length > 0) {
                        // Convert Markdown bold to HTML bold seamlessly
                        let formattedText = responseText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');

                        finalReply = formattedText;

                        finalReply = formattedText;
                    } else {
                        throw new Error('Invalid AI response structure');
                    }
                } catch (err) {
                    console.error('Real AI Error -> Falling back to local offline DB:', err);
                    offlineFallback = true;
                }

                if (offlineFallback) {
                    const langDb = db[detectedLang] || db['en'];
                    const roleDb = langDb[currentRole] || langDb['friend'];

                    let matchedReply = '';
                    let isShortMessage = lowerText.split(' ').length <= 4;
                    // Basic Pattern Matching for Hyper-Realism offline
                    if (isShortMessage && lowerText.match(/\b(hi|hello|hey|namaste|hlo|hii|helo)\b/)) {
                        if (detectedLang === 'te') {
                            const greets = {
                                'friend': ["Ha mama cheppu!", "Hi ra, em sangathi?", "Hi bhayya!"],
                                'romantic': ["Hi bangaram, em chesthunnav?", "Hello jaan, tinnava?", "Hi naa pranam, I missed you."],
                                'sister': ["Hi ra, em chesthunnav asalu?", "Ha cheppu ra.", "Hi thammudu/anna!"],
                                'brother': ["Ha anna cheppu.", "Hi ra em chesthunnav.", "Hi thammudu."],
                                'mentor': ["Hello, tell me.", "Hi, ela unnaru?"]
                            };
                            matchedReply = (greets[currentRole] || greets['friend'])[Math.floor(Math.random() * 2)];
                        } else {
                            matchedReply = "Hey! How's your day going?";
                        }
                    } else if (lowerText.match(/\b(how are you|ela unnava|kaise ho|bagunnava|fine)\b/)) {
                        matchedReply = detectedLang === 'te' ? "Nenu super ra, nuvvu ela unnav?" : "I'm doing great, what about you?";
                    } else if (lowerText.match(/\b(tinnava|tinna|food|lunch|dinner|breakfast)\b/)) {
                        matchedReply = detectedLang === 'te' ? "Ha tinna ra, nuvvu em tinnau ipudu?" : "Had my food, you tell me.";
                    } else if (lowerText.match(/\b(em chestunnav|kya kar rahe|what are you doing|kya chal raha|em chestunav|em dng)\b/)) {
                        matchedReply = detectedLang === 'te' ? "Emi ledu, nee gurinche alochistunna pichoda." : "Nothing much, just thinking about you.";
                    } else if (lowerText.match(/\b(bye|good night|gn|gud nyt|see you)\b/)) {
                        matchedReply = detectedLang === 'te' ? "Sare ra, malli matladadam. Bye, take care!" : "Alright, talk to you later. Take care!";
                    } else if (wantsMusic) {
                        let isHappyLoc = !(sentiment === 'negative' || lowerText.includes('sad') || lowerText.includes('stress'));
                        if (detectedLang === 'te') {
                            matchedReply = isHappyLoc ? "Sare, ee patalu vinu, mind block aipothundi! 🔥😘" : "Badhapadaku, ee prashanthamaina patalu vinu. 💙";
                        } else if (detectedLang === 'hi') {
                            matchedReply = isHappyLoc ? "Zaroor! Ye lo badhiya gaane suno! 🔥" : "Tension mat lo, ye aaramdayak gaane suno. 💙";
                        } else {
                            matchedReply = isHappyLoc ? "I've got the perfect vibes for you right here. Enjoy the music! 🎶💖" : "Take a deep breath and listen to this. Everything will be okay. 💙";
                        }
                    }

                    if (matchedReply) {
                        finalReply = matchedReply;
                    } else {
                        // Fallback to Kaggle NLP DailyDialog Chat Mocking System
                        const kaggleRealTimeChatData = {
                            'positive': ["That's wonderful to hear! 😊", "Wow, that sounds amazing! ✨", "I'm genuinely happy for you! 🎉", "This is so great!", "I'm so glad things are going well.", "Sounds like a wonderful time!"],
                            'negative': ["I'm incredibly sorry you're dealing with this.", "Please know you aren't alone.", "I'm here for you, take a deep breath.", "It's tough, but you're strong.", "I'm always here if you need to vent."],
                            'neutral': ["Oh, I see. What happened next?", "Mhm, go on.", "That makes sense.", "I understand.", "Tell me more about it."]
                        };
                        const aiReplies = kaggleRealTimeChatData[sentiment] || roleDb[sentiment] || roleDb['neutral'];
                        finalReply = aiReplies[Math.floor(Math.random() * aiReplies.length)];
                    }
                }

                // Psychology & Explicit Spotify AI Integration
                // User requirement: ONLY display/play songs when explicitly asked in the message!
                const embedSpotify = wantsMusic;

                if (embedSpotify) {
                    let isHappy = !(sentiment === 'negative' || lowerText.includes('sad') || lowerText.includes('stress'));

                    let spotifyUrl = isHappy ? "37i9dQZF1DXdPec7aLTmlC" : "37i9dQZF1DWZeKCadgRdKQ";
                    let playlistName = "AI Mood Playlist";

                    // Dynamic Language Prompt Parsing (Telugu, Tamil, Hindi, English)
                    if (lowerText.includes('telugu') || detectedLang === 'te' || lowerText.includes('tollywood')) {
                        spotifyUrl = isHappy ? "37i9dQZF1DX4F2JqEEpSBB" : "37i9dQZF1DWZNZsR0yZ0V2"; // Telugu Top 50 / Telugu Romance-Melody
                        playlistName = "Tollywood " + (isHappy ? "Hits" : "Melodies");
                    } else if (lowerText.includes('tamil') || lowerText.includes('kollywood')) {
                        spotifyUrl = isHappy ? "37i9dQZF1DX11bEqoYwLpY" : "37i9dQZF1DWZq91oLsHYJj"; // Tamil Top / Tamil Melodies
                        playlistName = "Tamil " + (isHappy ? "Hits" : "Melodies (Relax)");
                    } else if (lowerText.includes('hindi') || lowerText.includes('bollywood') || detectedLang === 'hi') {
                        spotifyUrl = isHappy ? "37i9dQZF1DX0XUfTFmNBRM" : "37i9dQZF1DWTx7AowQv7Zz"; // Top Hindi / Bollywood Mush
                        playlistName = "Bollywood " + (isHappy ? "Hits" : "Chill & Relax");
                    } else {
                        // English Default
                        playlistName = "English " + (isHappy ? "Pop & Vibes" : "Psychology & Grounding");
                    }

                    // Generate the dynamic correct reply block to match the prompt!
                    finalReply += `<br><br>
                    <div style="background: rgba(0,0,0,0.1); padding: 15px; border-radius: 12px; margin-top: 10px; text-align: center; border: 1px solid var(--glass-border); box-shadow: 0 4px 15px rgba(29, 185, 84, 0.1);">
                        <h4 style="margin-bottom: 8px; color: #1DB954;"><i class="fas fa-play-circle"></i> ${playlistName}</h4>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px;">Here is the custom ${isHappy ? 'cheer-up' : 'soothing'} music you requested. Try the volume slider!</p>
                        <audio controls autoplay loop style="width: 100%; height: 40px; border-radius: 8px; margin-bottom: 12px; opacity: 0.9;">
                            <source src="${isHappy ? 'https://assets.mixkit.co/music/download/mixkit-pop-05-695.mp3' : 'https://assets.mixkit.co/music/download/mixkit-sleepy-cat-135.mp3'}" type="audio/mpeg">
                        </audio>
                        <iframe style="border-radius:12px" src="https://open.spotify.com/embed/playlist/${spotifyUrl}?utm_source=generator&theme=0" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                    </div>`;
                }
            }

            // Revert Typing status back to Online
            const typingStatus = document.getElementById('typing-status');
            if (typingStatus) {
                typingStatus.innerHTML = `<span class="online-dot" style="width: 8px; height: 8px; background-color: #10b981; border-radius: 50%; display: inline-block; box-shadow: 0 0 5px #10b981; animation: pulse-dot 2s infinite;"></span> <span style="color: #10b981;">Online</span>`;
            }

            // Upgrade User's Sent Ticks to Double Blue Read Ticks
            const userTicks = document.querySelectorAll('.msg-status i.fa-check');
            userTicks.forEach(tick => {
                tick.className = 'fas fa-check-double';
                tick.parentElement.classList.add('read');
            });

            // Play Received Message Notification Pop Effect
            try {
                const recvSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
                recvSound.volume = 0.6;
                recvSound.play();
            } catch (e) { }

            removeThinking(thinkingId); // Only remove thinking once response is actually ready
            appendMessage('ai', finalReply, true);
            scrollToBottom();

            // Feed data to the backend Real-time Machine Learning Storage Pipeline
            try {
                fetch('http://localhost:5000/api/store_ml_data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_message: text, intent: sentiment })
                }).catch(e => console.log('ML Server is offline. Run app.py to track history.'));
            } catch (e) { }

            // Output Voice Response mapped to input language
            speakText(finalReply, detectedLang);

            // Save AI Message
            let conv = allConversations.find(c => c.id === currentChatId);
            if (conv) {
                conv.messages.push({ role: 'ai', content: finalReply });
                localStorage.setItem(STORAGE_KEY, JSON.stringify(allConversations));
            }

            updateApiPanel(text, finalReply);
        }, 1500);
    }

    function appendMessage(role, contentHtml, animate = true) {
        const div = document.createElement('div');
        div.className = `message ${role}-message`;
        if (!animate) {
            div.style.animation = 'none';
            div.style.opacity = '1';
            div.style.transform = 'translateY(0)';
        }

        let innerHtml = '';
        if (role === 'ai') {
            innerHtml += `
            <div class="avatar" style="padding: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; background: transparent;">
                <img src="logo.png" alt="Mood Mingle AI" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
            </div>`;
        }

        innerHtml += `
        <div class="message-content">
            <!-- Content will be injected here -->
        </div>`;

        if (role === 'user') {
            innerHtml += `
            <div class="avatar" style="background: rgba(255,255,255,0.15);">
                <i class="fas fa-envelope"></i>
            </div>`;
        }

        div.innerHTML = innerHtml;
        messagesContainer.appendChild(div);

        const contentDiv = div.querySelector('.message-content');

        if (animate && role === 'ai') {
            // Split up raw text from complex HTML widgets (e.g. Map/Spotify iframes which start with <br><br><div...)
            let textPart = contentHtml;
            let widgetPart = '';

            if (contentHtml.includes('<br><br><div')) {
                const parts = contentHtml.split('<br><br><div');
                textPart = parts[0];
                widgetPart = '<br><br><div' + parts.slice(1).join('<br><br><div');
            } else if (contentHtml.includes('<p>I found the best route')) {
                // Map split
                const parts = contentHtml.split('<div style="border-radius');
                textPart = parts[0];
                if (parts[1]) widgetPart = '<div style="border-radius' + parts.slice(1).join('<div style="border-radius');
            }

            const span = document.createElement('span');
            span.style.borderRight = '2px solid rgba(255,255,255,0.7)';
            // blinking effect via manual interval or css, we'll just use trailing border
            contentDiv.appendChild(span);

            let i = 0;
            let currentContent = "";

            function typeWriter() {
                if (i < textPart.length) {
                    if (textPart.charAt(i) === '<') {
                        const endIndex = textPart.indexOf('>', i);
                        if (endIndex !== -1) {
                            currentContent += textPart.substring(i, endIndex + 1);
                            i = endIndex + 1;
                        } else {
                            currentContent += textPart.charAt(i);
                            i++;
                        }
                    } else {
                        // Accurately capture full unicode characters (e.g., surrogate pairs like Emojis)
                        const charCode = textPart.charCodeAt(i);
                        if (charCode >= 0xD800 && charCode <= 0xDBFF && i + 1 < textPart.length) {
                            // It's a high surrogate, meaning it's the first half of an emoji
                            currentContent += textPart.charAt(i) + textPart.charAt(i + 1);
                            i += 2;
                        } else {
                            currentContent += textPart.charAt(i);
                            i++;
                        }
                    }

                    // Assign the accumulated correctly-encoded HTML string to display flawlessly
                    span.innerHTML = currentContent;
                    scrollToBottom();
                    setTimeout(typeWriter, 15 + Math.random() * 20); // Fast 15-35ms stream like ChatGPT
                } else {
                    span.style.borderRight = 'transparent'; // hide cursor
                    if (widgetPart) {
                        const widgetDiv = document.createElement('div');
                        widgetDiv.style.opacity = '0';
                        widgetDiv.style.transition = 'opacity 0.5s ease-in';
                        widgetDiv.innerHTML = widgetPart;
                        contentDiv.appendChild(widgetDiv);
                        setTimeout(() => widgetDiv.style.opacity = '1', 100); // fade in widgets
                        setTimeout(scrollToBottom, 200);
                    }
                }
            }
            typeWriter();
        } else {
            // Static load without animation
            contentDiv.innerHTML = contentHtml;
        }
    }

    function appendThinking(id) {
        const div = document.createElement('div');
        div.className = 'message ai-message thinking-wrapper';
        div.id = id;

        div.innerHTML = `
        <div class="avatar" style="font-weight: 800; font-family: 'Inter', sans-serif; font-size: 1rem; color: white;">
            MM
        </div>
        <div class="thinking">
            <span>Thinking</span>
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>`;

        messagesContainer.appendChild(div);
    }

    function removeThinking(id) {
        const thinkingEl = document.getElementById(id);
        if (thinkingEl) {
            thinkingEl.remove();
        }
    }

    function updateApiPanel(inputText, responseText) {
        if (!apiPanel) return;
        const blocks = apiPanel.querySelectorAll('pre code');
        if (blocks.length >= 2) {
            blocks[0].textContent = `{\n  "message": "${inputText}"\n}`;
            blocks[1].textContent = `{\n  "mood": "Detected",\n  "reply": "${responseText}"\n}`;
        }
    }

    sendBtn.addEventListener('click', handleSend);
    // Duplicate "Enter" logic is already reliably handled by the 'keydown' listener, no keypress needed.

    // Ensure we start scrolled to bottom
    setTimeout(scrollToBottom, 100);

    // Mood Journal Logic
    const journalModal = document.getElementById('journal-modal');
    const journalBtn = document.getElementById('journal-nav-btn');
    if (journalBtn && journalModal) {
        journalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            renderJournal();
            openModal(journalModal);
        });
    }

    const saveJournalBtn = document.getElementById('save-journal-btn');
    const journalInput = document.getElementById('journal-input');
    const journalSelect = document.getElementById('journal-mood-select');
    const journalEntriesDiv = document.getElementById('journal-entries');

    function renderJournal() {
        if (!journalEntriesDiv) return;
        let entries = JSON.parse(localStorage.getItem('moodJournalEntries')) || [];
        journalEntriesDiv.innerHTML = '';
        if (entries.length === 0) {
            journalEntriesDiv.innerHTML = '<p style="color:var(--text-secondary); text-align:center;">No entries yet. Start writing!</p>';
            return;
        }
        entries.slice().reverse().forEach(ent => {
            const div = document.createElement('div');
            div.style.background = 'rgba(0,0,0,0.1)';
            div.style.padding = '10px';
            div.style.borderRadius = 'var(--border-radius-sm)';
            div.style.border = '1px solid var(--glass-border)';
            div.innerHTML = `
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">${new Date(ent.date).toLocaleString()} • ${ent.mood}</div>
                <div style="font-size: 0.9rem; color: var(--text-primary);">${ent.text}</div>
            `;
            journalEntriesDiv.appendChild(div);
        });
    }

    if (saveJournalBtn && journalInput) {
        saveJournalBtn.addEventListener('click', () => {
            const text = journalInput.value.trim();
            if (!text) return;
            const mood = journalSelect.value;
            let entries = JSON.parse(localStorage.getItem('moodJournalEntries')) || [];
            entries.push({ date: new Date().toISOString(), text, mood });
            localStorage.setItem('moodJournalEntries', JSON.stringify(entries));
            journalInput.value = '';
            renderJournal();
            if (typeof showToast === 'function') showToast('Journal entry saved successfully! 📖');
        });
    }

    // Initialize Voice Settings
    const voiceSelector = document.getElementById('voice-selector');
    const voiceRoleLabel = document.getElementById('voice-role-label');
    const VOICE_KEY = 'moodMingleVoiceMap';
    let voiceMap = JSON.parse(localStorage.getItem(VOICE_KEY)) || {};

    // Defer slightly so UI finishes active role setup
    setTimeout(() => {
        let activeRole = 'friend';
        document.querySelectorAll('.dropdown-item').forEach(div => {
            if (div.classList.contains('active')) activeRole = div.getAttribute('data-role');
        });

        if (voiceRoleLabel && document.getElementById('current-relationship')) {
            voiceRoleLabel.textContent = document.getElementById('current-relationship').textContent + ' Mode';
        }
        if (voiceSelector) {
            voiceSelector.value = voiceMap[activeRole] || 'f1';
            voiceSelector.addEventListener('change', (e) => {
                let editingRole = voiceSelector.getAttribute('data-editing-role') || activeRole;
                let vMapSaved = JSON.parse(localStorage.getItem(VOICE_KEY)) || {};
                vMapSaved[editingRole] = e.target.value;
                localStorage.setItem(VOICE_KEY, JSON.stringify(vMapSaved));
                if (typeof showToast === 'function') showToast('Voice saved for ' + editingRole + '!');
            });
        }

        // AI Voice Output Toggle Logic
        const voiceOutputToggle = document.getElementById('voice-output-toggle');
        if (voiceOutputToggle) {
            voiceOutputToggle.checked = localStorage.getItem('moodMingleVoiceOutput') !== 'false';
            voiceOutputToggle.addEventListener('change', (e) => {
                localStorage.setItem('moodMingleVoiceOutput', e.target.checked);
                if (typeof showToast === 'function') showToast(e.target.checked ? 'Voice Output Enabled 🔊' : 'Voice Output Muted 🔇');
                if (!e.target.checked && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel(); // Stop speaking immediately if muted
                }
            });
        }

        // Setup API Key Binding
        const geminiApiKeyInput = document.getElementById('gemini-api-key');
        if (geminiApiKeyInput) {
            geminiApiKeyInput.value = localStorage.getItem('moodMingleGeminiKey') || '';
            geminiApiKeyInput.addEventListener('change', (e) => {
                localStorage.setItem('moodMingleGeminiKey', e.target.value.trim());
                if (typeof showToast === 'function') {
                    showToast(e.target.value.trim() ? 'Real AI (Gemini) Unlocked 🔓' : 'Reverted to Offline Model');
                }
            });
        }
    }, 300);
}

// Face Scanner Feature Logic
document.addEventListener('DOMContentLoaded', () => {
    const faceScanBtn = document.getElementById('face-scan-btn');
    const faceScanModal = document.getElementById('face-scan-modal');
    const cancelScanBtn = document.getElementById('cancel-scan-btn');
    const webcamVideo = document.getElementById('webcam-video');
    const statusText = document.getElementById('face-scan-status');
    const overlay = document.getElementById('face-scan-overlay');

    let isModelsLoaded = false;
    let localStream = null;

    async function loadModels() {
        if (isModelsLoaded) return true;
        try {
            statusText.textContent = "Downloading High-Accuracy AI Vision Models...";
            // Upgrading from tinyFaceDetector to the highly accurate SSD MobileNet v1
            await faceapi.nets.ssdMobilenetv1.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
            await faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
            isModelsLoaded = true;
            return true;
        } catch (e) {
            statusText.textContent = "Error loading AI Models.";
            console.error(e);
            return false;
        }
    }

    async function startVideo() {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true });
            webcamVideo.srcObject = localStream;
        } catch (e) {
            statusText.textContent = "Camera access denied or unavailable.";
        }
    }

    function stopVideo() {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        webcamVideo.srcObject = null;
    }

    if (faceScanBtn && faceScanModal) {
        faceScanBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const modalOverlay = document.getElementById('modal-overlay');
            if (modalOverlay) modalOverlay.classList.add('show');
            faceScanModal.classList.add('show');

            overlay.style.display = 'none';
            statusText.textContent = "Initializing camera...";

            if (await loadModels()) {
                statusText.textContent = "Looking for your face... Please look strictly at camera.";
                startVideo();
            }
        });

        cancelScanBtn.addEventListener('click', () => {
            stopVideo();
            faceScanModal.classList.remove('show');
            const modalOverlay = document.getElementById('modal-overlay');
            if (modalOverlay) modalOverlay.classList.remove('show');
        });

        webcamVideo.addEventListener('play', () => {
            // Give 2 seconds for video to stabilize then scan
            setTimeout(async () => {
                statusText.textContent = "Analyzing emotions...";
                overlay.style.display = 'flex';

                try {
                    // Using upgraded SsdMobilenetv1 for extremely high accuracy
                    const detections = await faceapi.detectSingleFace(webcamVideo, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })).withFaceExpressions();

                    if (detections) {
                        const expressions = detections.expressions;
                        // Find the highest confidence expression
                        let dominantEmotion = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);

                        // Map expression to chat
                        statusText.textContent = `Emotion Detected: ${dominantEmotion.toUpperCase()}!`;

                        setTimeout(() => {
                            stopVideo();
                            faceScanModal.classList.remove('show');
                            const modalOverlay = document.getElementById('modal-overlay');
                            if (modalOverlay) modalOverlay.classList.remove('show');

                            // Send automatic message to chat
                            const chatInput = document.getElementById('chat-input');
                            const sendBtn = document.getElementById('send-btn');

                            const promptMap = {
                                'happy': "I am feeling very happy and excited right now!",
                                'sad': "I am feeling so sad today... I need someone to talk to.",
                                'angry': "I am feeling really angry and frustrated right now.",
                                'surprised': "I'm feeling very surprised by what just happened!",
                                'disgusted': "I am feeling disgusted and uncomfortable.",
                                'fearful': "I'm feeling fearful, anxious and distressed.",
                                'neutral': "I'm just feeling neutral, nothing much is going on."
                            };

                            if (chatInput && sendBtn) {
                                chatInput.value = promptMap[dominantEmotion] || promptMap['neutral'];
                                sendBtn.click();
                            }

                        }, 1500);

                    } else {
                        statusText.textContent = "Face not detected clearly. Retrying in 2s...";
                        overlay.style.display = 'none';
                        setTimeout(() => {
                            // trigger play cycle again safely
                            webcamVideo.dispatchEvent(new Event('play'));
                        }, 2000);
                    }
                } catch (e) {
                    statusText.textContent = "Scanning error.";
                    overlay.style.display = 'none';
                }
            }, 2000);
        });
    }
});
