/**
 * Bolty Core Logic - Gemini 3.1 Edition
 * Refactored for chat-style interaction and instant results.
 */

const ideaBank = {
    techStacks: [
        { name: "Fullstack Moderno", tech: ["Next.js", "TypeScript", "Tailwind CSS", "Prisma", "PostgreSQL"] },
        { name: "App Mobile Pro", tech: ["React Native", "Expo", "Firebase", "Redux Toolkit", "Styled Components"] },
        { name: "SaaS Escalable", tech: ["Vue.js", "Go (Gin)", "Redis", "Docker", "AWS Lambda"] },
        { name: "IA & Data", tech: ["Python", "FastAPI", "OpenAI API", "Pinecone", "React"] }
    ],
    features: [
        "Autenticación segura con OAuth",
        "Dashboard analítico en tiempo real",
        "Notificaciones push inteligentes",
        "Integración de pagos con Stripe",
        "Búsqueda semántica avanzada",
        "Exportación de datos multidestino",
        "Modo Offline con sincronización",
        "Colaboración multi-usuario"
    ],
    roadmap: [
        { phase: "Fase 1: Cimientos", desc: "Arquitectura base y UX" },
        { phase: "Fase 2: Núcleo", desc: "Desarrollo de features MVP" },
        { phase: "Fase 3: Inteligencia", desc: "Integración IA y Refinado" },
        { phase: "Fase 4: Escala", desc: "Deploy y Optimización" }
    ]
};

const UI = {
    // Structure
    sidebar: document.getElementById('sidebar'),
    mainContainer: document.querySelector('.main-container'),
    toggleSidebar: document.getElementById('toggle-sidebar'),
    chatScroller: document.getElementById('chat-scroller'),
    welcomeView: document.getElementById('welcome-view'),
    chatMessages: document.getElementById('chat-messages'),
    recentProjects: document.getElementById('recent-projects'),
    
    // Model Selector
    modelSelector: document.getElementById('model-selector'),
    modeDropdown: document.getElementById('mode-dropdown'),
    currentModeLabel: document.getElementById('current-mode-label'),
    modeItems: document.querySelectorAll('.mode-item'),

    // Inputs
    ideaInput: document.getElementById('idea-input'),
    generateBtn: document.getElementById('generate-btn'),
    newChatBtn: document.getElementById('new-chat-btn'),
    suggestionCards: document.querySelectorAll('.suggestion-card'),
    
    // Modals & Premium
    premiumBtn: document.getElementById('premium-sidebar-btn'),
    premiumModal: document.getElementById('premium-modal'),
    buyPremiumBtn: document.getElementById('buy-premium-btn'),
    closePremium: document.getElementById('close-premium'),
    
    // Private Mode
    privateBtn: document.getElementById('private-sidebar-btn'),
    privateGateway: document.getElementById('private-gateway'),
    privatePin: document.getElementById('private-pin'),
    authPrivateBtn: document.getElementById('auth-private-btn'),
    closeGateway: document.getElementById('close-gateway'),
    privateVersion: document.getElementById('private-version'),
    privateInput: document.getElementById('private-idea-input'),
    privateOutput: document.getElementById('private-output'),
    exitPrivate: document.getElementById('exit-private'),
    
    // Login Screen
    loginScreen: document.getElementById('login-screen'),
    loginForm: document.getElementById('login-form'),

    // Video Modal
    videoModal: document.getElementById('video-modal'),
    modalSourceIcon: document.getElementById('modal-source-icon'),
    modalVideoTitle: document.getElementById('modal-video-title'),
    modalPlaceholder: document.getElementById('modal-video-placeholder'),
    closeVideoBtn: document.getElementById('close-video-modal')
};

let isPremium = true; // Bolty Pro Active by default
let isLoggedIn = localStorage.getItem('bolty_logged_in') === 'true';
let synth = window.speechSynthesis;
let recentChats = JSON.parse(localStorage.getItem('bolty_recent_chats') || '[]');
let currentMode = 'apps';

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    initEvents();
    updatePremiumUI();
    renderRecentChats();
});

function initApp() {
    // For demonstration, we could check isLoggedIn, but user wants it "nada más entrar"
    // So we always show the login screen to allow "Comenzar a Aprender" functionality.
    UI.loginScreen.classList.remove('hidden');
    
    UI.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = UI.loginForm.querySelector('.btn-login');
        btn.innerHTML = '<ion-icon name="sync" class="spin"></ion-icon><span>Autenticando...</span>';
        btn.disabled = true;

        setTimeout(() => {
            const email = document.getElementById('login-email').value;
            console.log(`BOLTY_LOGIN_SUCCESS: Identified as ${email}`);
            
            localStorage.setItem('bolty_logged_in', 'true');
            isLoggedIn = true;
            
            // Fade out animation
            UI.loginScreen.style.opacity = '0';
            UI.loginScreen.style.pointerEvents = 'none';
            
            setTimeout(() => {
                UI.loginScreen.classList.add('hidden');
            }, 600);
        }, 800);
    });
}

function initEvents() {
    // Model Selector Toggle
    UI.modelSelector.addEventListener('click', (e) => {
        UI.modeDropdown.classList.toggle('hidden');
        e.stopPropagation();
    });

    document.addEventListener('click', () => {
        UI.modeDropdown.classList.add('hidden');
    });

    UI.modeItems.forEach(item => {
        item.addEventListener('click', function() {
            UI.modeItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            currentMode = this.dataset.mode;
            UI.currentModeLabel.innerText = this.querySelector('span').innerText;
            UI.modeDropdown.classList.add('hidden');
        });
    });

    // Basic Chat Logic
    UI.generateBtn.addEventListener('click', handleGenerate);
    UI.ideaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
        }
    });

    UI.newChatBtn.addEventListener('click', resetChat);
    
    UI.toggleSidebar.addEventListener('click', () => {
        UI.sidebar.classList.toggle('collapsed');
        if (window.innerWidth <= 768) UI.sidebar.classList.toggle('active');
    });

    UI.suggestionCards.forEach(card => {
        card.addEventListener('click', () => {
            UI.ideaInput.value = card.dataset.prompt;
            handleGenerate();
        });
    });

    // Auto-resize textarea
    UI.ideaInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Premium Events
    UI.premiumBtn.addEventListener('click', () => UI.premiumModal.classList.remove('hidden'));
    UI.closePremium.addEventListener('click', () => UI.premiumModal.classList.add('hidden'));
    UI.buyPremiumBtn.addEventListener('click', activatePremium);

    // Private Mode Events
    UI.privateBtn.addEventListener('click', () => {
        UI.privateGateway.classList.remove('hidden');
        UI.privatePin.value = ''; // Ensure cleared
        UI.privatePin.focus();
    });
    UI.authPrivateBtn.addEventListener('click', authenticatePrivate);
    UI.closeGateway.addEventListener('click', () => {
        UI.privateGateway.classList.add('hidden');
        UI.privatePin.value = ''; // Ensure cleared on close
    });
    UI.exitPrivate.addEventListener('click', () => UI.privateVersion.classList.add('hidden'));
    UI.privateInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handlePrivateCommand();
    });
    
    // Fix PIN entry: automatically submit on 4th digit if preferred, or just handle Enter
    UI.privatePin.addEventListener('keyup', (e) => {
        if (UI.privatePin.value.length === 4) {
            authenticatePrivate();
        }
    });

    // Video Modal Events
    UI.closeVideoBtn.addEventListener('click', () => {
        UI.videoModal.classList.add('hidden');
        UI.modalPlaceholder.src = '';
    });

    UI.videoModal.addEventListener('click', (e) => {
        if (e.target === UI.videoModal) {
            UI.videoModal.classList.add('hidden');
            UI.modalPlaceholder.src = '';
        }
    });
}

// --- Chat Core ---
async function handleGenerate() {
    const input = UI.ideaInput.value.trim();
    if (!input) return;

    // Reset UI for first message
    if (!UI.welcomeView.classList.contains('hidden')) {
        UI.welcomeView.classList.add('hidden');
    }

    // 1. Append User Message
    appendMessage('user', input);
    UI.ideaInput.value = '';
    UI.ideaInput.style.height = 'auto';

    // 2. Generate content based on mode
    if (currentMode === 'apps') {
        const project = isPremium ? generateProProject(input) : generateProject(input);
        appendProjectMessage(project);
        saveToHistory(project.title);
    } 
    else if (currentMode === 'images') {
        appendImageMessage(input);
    }
    else if (currentMode === 'videos') {
        appendVideoMessage(input);
    }
    else if (currentMode === 'code') {
        appendCodeMessage(input);
    }
    else if (currentMode === 'music') {
        appendMusicMessage(input);
    }
    else if (currentMode === 'perfect-apps') {
        appendPerfectAppMessage(input);
    }
    else if (currentMode === 'real-apps') {
        appendRealAppMessage(input);
    }
    else {
        appendAssistantMessage(input);
    }
}

async function appendPerfectAppMessage(input) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot';
    const avatar = '<div class="message-avatar bot"><ion-icon name="flash"></ion-icon></div>';
    
    msgDiv.innerHTML = `
        ${avatar}
        <div class="message-content">
            <div class="app-build-card perfect-mode">
                <div class="build-header">
                    <ion-icon name="sparkles" class="build-icon" style="color: var(--accent-gold)"></ion-icon>
                    <div class="build-info">
                        <h3>Arquitecto de Apps Perfectas</h3>
                        <p>Diseño conceptual: ${input}</p>
                    </div>
                </div>
                <div class="neural-pulse-container">
                    <div class="pulse-ring"></div>
                    <div class="pulse-text">Sintetizando Red Neuronal...</div>
                </div>
                <div class="build-logs perfect-logs">> Optimizando UX/UI con patrones premium...<br>> Estructurando navegación y secciones...<br>> Inyectando lógica reactiva...</div>
                <button class="btn-open-app visible" style="background: linear-gradient(90deg, #fbbf24, #f59e0b);">
                    <ion-icon name="rocket-outline"></ion-icon>
                    <span>Abrir Aplicación Perfecta</span>
                </button>
            </div>
        </div>
    `;
    UI.chatMessages.appendChild(msgDiv);
    scrollToBottom();

    // Fast generation simulation
    await new Promise(r => setTimeout(r, 1200));
    const logs = msgDiv.querySelector('.perfect-logs');
    logs.innerHTML += `<br>> ¡Arquitectura finalizada sin simulaciones!`;
    
    const openBtn = msgDiv.querySelector('.btn-open-app');
    const appCode = generatePerfectAppHtml(input);
    const blob = new Blob([appCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    openBtn.onclick = () => window.open(url, '_blank');
}

function generatePerfectAppHtml(prompt) {
    const title = prompt.charAt(0).toUpperCase() + prompt.slice(1);
    const features = [
        { t: "Rendimiento Élite", d: "Optimizado para carga instantánea y 60 FPS constantes." },
        { t: "Diseño Premium", d: "Estética minimalista con efectos de cristal y gradientes suaves." },
        { t: "Arquitectura Cloud", d: "Preparado para escalar globalmente desde el primer segundo." }
    ];

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Bolty Perfect</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Space+Grotesk:wght@300;500;700&display=swap" rel="stylesheet">
    <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
    <style>
        :root { --primary: #fbbf24; --bg: #050505; --card: rgba(255,255,255,0.03); --text: #f8fafc; }
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Outfit', sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; overflow-x: hidden; }
        
        nav { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 5%; background: rgba(0,0,0,0.8); backdrop-filter: blur(20px); position: fixed; width: 100%; z-index: 100; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .logo { font-weight: 800; font-size: 1.5rem; display: flex; align-items: center; gap: 0.5rem; color: var(--primary); }
        .nav-links { display: flex; gap: 2rem; list-style: none; }
        .nav-links a { color: var(--text); text-decoration: none; font-weight: 500; font-size: 0.9rem; opacity: 0.8; transition: 0.3s; }
        .nav-links a:hover { opacity: 1; color: var(--primary); }

        .hero { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 10%; background: radial-gradient(circle at center, #111 0%, #000 70%); }
        .hero h1 { font-size: 4.5rem; font-weight: 800; margin-bottom: 1.5rem; background: linear-gradient(90deg, #fff, #fbbf24); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero p { font-size: 1.25rem; color: #94a3b8; max-width: 700px; margin-bottom: 2.5rem; }
        .btn-main { background: var(--primary); color: #000; padding: 1rem 2.5rem; border-radius: 50px; font-weight: 700; text-decoration: none; transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .btn-main:hover { transform: scale(1.05) translateY(-5px); box-shadow: 0 15px 30px rgba(251, 191, 36, 0.3); }

        .features { padding: 8rem 10%; display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
        .f-card { background: var(--card); padding: 3rem 2rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); transition: 0.4s; }
        .f-card:hover { background: rgba(255,255,255,0.06); transform: translateY(-10px); border-color: rgba(251, 191, 36, 0.3); }
        .f-card ion-icon { font-size: 2.5rem; color: var(--primary); margin-bottom: 1.5rem; }
        .f-card h3 { font-size: 1.5rem; margin-bottom: 1rem; }
        .f-card p { color: #94a3b8; font-size: 0.95rem; }

        footer { padding: 4rem 10%; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; color: #475569; }
        .footer-logo { font-weight: 700; color: #94a3b8; }
    </style>
</head>
<body>
    <nav>
        <div class="logo"><ion-icon name="sparkles"></ion-icon> ${title}</div>
        <ul class="nav-links">
            <li><a href="#">Inicio</a></li>
            <li><a href="#">Servicios</a></li>
            <li><a href="#">Contacto</a></li>
        </ul>
    </nav>
    
    <section class="hero">
        <h1>${title}</h1>
        <p>Potenciado por Bolty Perfect. Un ecosistema digital diseñado para trascender los límites convencionales de la web moderna.</p>
        <a href="#" class="btn-main">Comenzar Ahora</a>
    </section>

    <section class="features">
        ${features.map((f, i) => `
            <div class="f-card">
                <ion-icon name="${['speedometer-outline', 'color-palette-outline', 'cloud-done-outline'][i]}"></ion-icon>
                <h3>${f.t}</h3>
                <p>${f.d}</p>
            </div>
        `).join('')}
    </section>

    <footer>
        <div class="footer-logo">© 2026 ${title} OS</div>
        <div>Built with Bolty Intelligence</div>
    </footer>
</body>
</html>`;
}

function appendMessage(role, content) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    
    const avatar = role === 'user' ? '<div class="message-avatar user">U</div>' : '<div class="message-avatar bot"><ion-icon name="flash"></ion-icon></div>';
    
    msgDiv.innerHTML = `
        ${role === 'bot' ? avatar : ''}
        <div class="message-content">${content}</div>
        ${role === 'user' ? avatar : ''}
    `;
    
    UI.chatMessages.appendChild(msgDiv);
    scrollToBottom();
}

function appendAssistantMessage(input) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot';
    const avatar = '<div class="message-avatar bot"><ion-icon name="flash"></ion-icon></div>';
    
    // Math Intelligence Logic
    const mathRegex = /^[\s\d\+\-\*\/\%\(\)\.]+$/;
    const cleanInput = input.replace(/x/g, '*').replace(/,/g, '.'); // Handle common typos
    
    if (mathRegex.test(cleanInput) && /[\+\-\*\/\%]/.test(cleanInput)) {
        try {
            // Safe evaluation (avoiding eval for simple math)
            const result = Function(`"use strict"; return (${cleanInput})`)();
            
            msgDiv.innerHTML = `
                ${avatar}
                <div class="message-content math-result-wrapper">
                    <div class="math-card">
                        <div class="math-header">
                            <ion-icon name="calculator-outline"></ion-icon>
                            <span>Inteligencia Matemática</span>
                        </div>
                        <div class="math-body">
                            <div class="math-expr">${input}</div>
                            <div class="math-equals">=</div>
                            <div class="math-value">${Number.isInteger(result) ? result : result.toFixed(2)}</div>
                        </div>
                        <div class="math-footer">Calculado instantáneamente por Bolty</div>
                    </div>
                </div>
            `;
            UI.chatMessages.appendChild(msgDiv);
            scrollToBottom();
            return;
        } catch (e) {
            console.error("Math error:", e);
        }
    }

    // General assistant logic
    const responses = [
        `He analizado tu petición sobre "${input}". Puedo ayudarte a profundizar en este tema o realizar tareas específicas relacionadas.`,
        `Excelente elección de tema. Sobre "${input}", tengo varias sugerencias para seguir explorando.`,
        `Entendido. En el modo "Todo", actúo como un asistente versátil. Cuéntame más sobre qué necesitas hacer con "${input}".`
    ];
    const text = responses[Math.floor(Math.random() * responses.length)];
    
    msgDiv.innerHTML = `${avatar}<div class="message-content text">${text}</div>`;
    UI.chatMessages.appendChild(msgDiv);
    scrollToBottom();
}

async function appendImageMessage(input) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot';
    const avatar = '<div class="message-avatar bot"><ion-icon name="flash"></ion-icon></div>';
    
    // Show Searching State
    msgDiv.innerHTML = `
        ${avatar}
        <div class="message-content">
            <div class="search-status">
                <ion-icon name="logo-google" class="google-icon-searching"></ion-icon>
                <span>Buscando imágenes de "<strong>${input}</strong>" en Google...</span>
                <div class="search-loader"></div>
            </div>
        </div>
    `;
    UI.chatMessages.appendChild(msgDiv);
    scrollToBottom();

    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Update with results
    const keywords = input.split(' ').slice(0, 2).join(',');
    msgDiv.innerHTML = `
        ${avatar}
        <div class="message-content">
            <div class="search-meta">
                <ion-icon name="logo-google"></ion-icon>
                <span>Resultados de Google Imágenes para "${input}"</span>
            </div>
            <div class="image-grid">
                <div class="image-card"><img src="https://loremflickr.com/400/400/${keywords}?lock=1" alt="Gen 1"></div>
                <div class="image-card"><img src="https://loremflickr.com/400/400/${keywords}?lock=2" alt="Gen 2"></div>
                <div class="image-card"><img src="https://loremflickr.com/400/400/${keywords}?lock=3" alt="Gen 3"></div>
                <div class="image-card"><img src="https://loremflickr.com/400/400/${keywords}?lock=4" alt="Gen 4"></div>
            </div>
            <div class="message-actions">
                <button class="btn-icon-only" title="Regenerar"><ion-icon name="refresh-outline"></ion-icon></button>
                <button class="btn-icon-only" title="Ver en Google"><ion-icon name="open-outline"></ion-icon></button>
            </div>
        </div>
    `;
    scrollToBottom();
}

async function appendVideoMessage(input) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot';
    const avatar = '<div class="message-avatar bot"><ion-icon name="flash"></ion-icon></div>';
    
    msgDiv.innerHTML = `
        ${avatar}
        <div class="message-content">
            <div class="search-status">
                <ion-icon name="videocam" class="google-icon-searching"></ion-icon>
                <span>Generando cinemática para "<strong>${input}</strong>"...</span>
                <div class="search-loader"></div>
            </div>
        </div>
    `;
    UI.chatMessages.appendChild(msgDiv);
    scrollToBottom();

    await new Promise(resolve => setTimeout(resolve, 2500));

    const sources = [
        { name: 'YouTube', icon: 'logo-youtube', class: 'badge-youtube' },
        { name: 'TikTok', icon: 'logo-tiktok', class: 'badge-tiktok' },
        { name: 'Instagram', icon: 'logo-instagram', class: 'badge-instagram' },
        { name: 'X', icon: 'logo-twitter', class: 'badge-x' }
    ];

    const keywords = input.split(' ').slice(0, 1).join('');
    
    // Generate two random videos from different sources
    const selectedSources = sources.sort(() => 0.5 - Math.random()).slice(0, 2);

    msgDiv.innerHTML = `
        ${avatar}
        <div class="message-content">
            <div class="search-meta">
                <ion-icon name="search-outline"></ion-icon>
                <span>Resultados multimedia para "${input}"</span>
            </div>
            <div class="video-grid">
                ${selectedSources.map((src, idx) => `
                    <div class="video-card" onclick="playMockVideo('${src.name}', '${input} Reel #${idx + 1}', '${src.icon}')">
                        <div class="video-source-badge ${src.class}">
                            <ion-icon name="${src.icon}"></ion-icon>
                            <span>${src.name}</span>
                        </div>
                        <img src="https://loremflickr.com/640/360/${keywords},${src.name.toLowerCase()}?lock=${10 + idx}">
                        <ion-icon name="play-circle" class="video-play-icon"></ion-icon>
                        <div class="video-duration">${Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 50 + 10)}</div>
                    </div>
                `).join('')}
            </div>
            <div class="message-actions">
                <button class="btn-icon-only" title="Refrescar búsqueda"><ion-icon name="refresh-outline"></ion-icon></button>
                <button class="btn-icon-only" title="Compartir todo"><ion-icon name="share-social-outline"></ion-icon></button>
            </div>
        </div>
    `;
    scrollToBottom();
}

window.playMockVideo = (source, title, icon) => {
    UI.modalVideoTitle.innerText = `${source}: ${title}`;
    UI.modalSourceIcon.name = icon;
    UI.modalPlaceholder.src = `https://loremflickr.com/1280/720/cinematic,${source.toLowerCase()}?lock=${Math.random()}`;
    
    UI.videoModal.classList.remove('hidden');
    
    const loader = UI.videoModal.querySelector('.video-loader');
    loader.style.display = 'flex';
    UI.modalPlaceholder.style.opacity = '0';

    setTimeout(() => {
        loader.style.display = 'none';
        UI.modalPlaceholder.style.opacity = '1';
        UI.modalPlaceholder.style.transition = 'opacity 0.5s ease';
    }, 1500);
};

function appendCodeMessage(input) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot';
    const avatar = '<div class="message-avatar bot"><ion-icon name="flash"></ion-icon></div>';
    
    const codeSnippet = `// Bolty Senior Dev Output for: ${input}\n\nfunction initializeProject() {\n  const cores = navigator.hardwareConcurrency;\n  console.log("Optimizing for " + cores + " cores...");\n  // TODO: Implement architecture based on "${input}"\n}\n\nexport default initializeProject;`;

    msgDiv.innerHTML = `
        ${avatar}
        <div class="message-content">
            <div class="code-response">
                <div class="code-header">
                    <span>architect_module.js</span>
                    <ion-icon name="copy-outline" style="cursor:pointer"></ion-icon>
                </div>
                <div class="code-content">${codeSnippet}</div>
            </div>
            <div class="message-actions">
                <button class="btn-sidebar-action" style="width: auto; margin: 0;">
                    <ion-icon name="bug-outline"></ion-icon>
                    <span>Analizar Vulnerabilidades</span>
                </button>
            </div>
        </div>
    `;
    UI.chatMessages.appendChild(msgDiv);
    scrollToBottom();
}

async function appendRealAppMessage(input) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot';
    const avatar = '<div class="message-avatar bot"><ion-icon name="flash"></ion-icon></div>';
    
    msgDiv.innerHTML = `
        ${avatar}
        <div class="message-content">
            <div class="app-build-card">
                <div class="build-header">
                    <ion-icon name="rocket" class="build-icon"></ion-icon>
                    <div class="build-info">
                        <h3>Build Engine Directo</h3>
                        <p>Proyecto: ${input}</p>
                    </div>
                </div>
                <div class="build-progress-wrapper">
                    <div class="progress-labels">
                        <span class="status-text">Iniciando compilación...</span>
                        <span class="percentage">0%</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill"></div>
                    </div>
                </div>
                <div class="build-logs">> Cargando dependencias...</div>
                <button class="btn-open-app">
                    <ion-icon name="open-outline"></ion-icon>
                    <span>Abrir Aplicación Real</span>
                </button>
            </div>
        </div>
    `;
    UI.chatMessages.appendChild(msgDiv);
    scrollToBottom();

    const progressFill = msgDiv.querySelector('.progress-fill');
    const statusText = msgDiv.querySelector('.status-text');
    const logs = msgDiv.querySelector('.build-logs');
    const percentage = msgDiv.querySelector('.percentage');
    const openBtn = msgDiv.querySelector('.btn-open-app');

    const steps = [
        { p: 20, t: 'Analizando requisitos...', l: '> Arquitectura detectada: Single Page Application' },
        { p: 45, t: 'Generando componentes...', l: '> Generando layouts responsivos y estilos premium...' },
        { p: 70, t: 'Optimizando assets...', l: '> Comprimiendo lógica y purgando CSS no utilizado...' },
        { p: 90, t: 'Finalizando bundle...', l: '> Empaquetando aplicación funcional...' },
        { p: 100, t: '¡App Lista!', l: '> Build completado satisfactoriamente.' }
    ];

    for (const step of steps) {
        await new Promise(r => setTimeout(r, 800 + Math.random() * 500));
        progressFill.style.width = `${step.p}%`;
        statusText.innerText = step.t;
        percentage.innerText = `${step.p}%`;
        logs.innerHTML += `<br>${step.l}`;
        logs.scrollTop = logs.scrollHeight;
    }

    // Generate real app code
    const appCode = generateFunctionalApp(input);
    const blob = new Blob([appCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    openBtn.classList.add('visible');
    openBtn.onclick = () => window.open(url, '_blank');
}

function generateFunctionalApp(prompt) {
    const title = prompt.charAt(0).toUpperCase() + prompt.slice(1);
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Bolty App</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700&display=swap" rel="stylesheet">
    <style>
        :root { --primary: #4285f4; --bg: #050505; --card: #111; }
        body { margin: 0; font-family: 'Outfit', sans-serif; background: var(--bg); color: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; overflow: hidden; }
        .glass-container { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); padding: 3rem; border-radius: 30px; text-align: center; max-width: 500px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; background: linear-gradient(90deg, #4285f4, #9b72cb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        p { color: #aaa; line-height: 1.6; margin-bottom: 2rem; }
        .btn { background: var(--primary); color: white; border: none; padding: 1rem 2rem; border-radius: 12px; font-weight: bold; cursor: pointer; transition: 0.3s; text-decoration: none; display: inline-block; }
        .btn:hover { transform: scale(1.05); filter: brightness(1.2); }
        .chip { display: inline-block; padding: 4px 12px; border-radius: 20px; background: rgba(255,255,255,0.1); font-size: 0.8rem; margin: 4px; }
    </style>
</head>
<body>
    <div class="glass-container">
        <div style="font-size: 4rem; margin-bottom: 1rem;">🚀</div>
        <h1>${title}</h1>
        <p>Esta es una aplicación funcional generada instantáneamente por el motor <strong>Bolty Directo</strong> basada en tu idea: "${prompt}"</p>
        <div style="margin-bottom: 2rem;">
            <div class="chip">React-like Logic</div>
            <div class="chip">Pure CSS</div>
            <div class="chip">Responsive</div>
        </div>
        <button class="btn" onclick="document.body.style.background = 'linear-gradient('+Math.random()*360+'deg, #111, #222)'">Cambiar Ambiente</button>
    </div>
    <script>
        console.log("App '${title}' iniciada correctamente.");
    </script>
</body>
</html>`;
}

async function appendMusicMessage(input) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot';
    const avatar = '<div class="message-avatar bot"><ion-icon name="flash"></ion-icon></div>';
    
    msgDiv.innerHTML = `
        ${avatar}
        <div class="message-content">
            <div class="search-status">
                <ion-icon name="musical-notes" class="google-icon-searching"></ion-icon>
                <span>Sintetizando frecuencias para "<strong>${input}</strong>"...</span>
                <div class="search-loader"></div>
            </div>
        </div>
    `;
    UI.chatMessages.appendChild(msgDiv);
    scrollToBottom();

    await new Promise(resolve => setTimeout(resolve, 2000));

    msgDiv.innerHTML = `
        ${avatar}
        <div class="message-content">
            <div class="music-card">
                <div class="music-art">
                    <ion-icon name="headset"></ion-icon>
                </div>
                <div class="music-info">
                    <div class="music-title">Bolty Genesis Audio</div>
                    <div class="music-artist">AI Generated • ${input}</div>
                    <div class="music-controls">
                        <button class="btn-play"><ion-icon name="play"></ion-icon></button>
                        <div class="music-progress">
                            <div class="music-bar"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    scrollToBottom();
}

function appendProjectMessage(project) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot';
    
    const avatar = '<div class="message-avatar bot"><ion-icon name="flash"></ion-icon></div>';
    
    const content = `
        <div class="message-content">
            <div class="response-block">
                <div class="project-summary-box">
                    <h2 style="margin-bottom: 0.5rem; font-family: var(--font-heading);">${project.title}</h2>
                    <p>${project.summary}</p>
                </div>
                
                <div class="response-grid">
                    <div class="response-card">
                        <h4><ion-icon name="layers-outline"></ion-icon> Stack</h4>
                        <p style="font-size: 0.8rem; margin-bottom: 0.5rem; font-weight: 600;">${project.stackName}</p>
                        <ul>
                            ${project.stack.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="response-card">
                        <h4><ion-icon name="star-outline"></ion-icon> Features</h4>
                        <ul>
                            ${project.features.map(f => `<li>${f}</li>`).join('')}
                        </ul>
                    </div>
                </div>

                <div class="roadmap-full">
                    <h4><ion-icon name="map-outline"></ion-icon> Roadmap de Lanzamiento</h4>
                    <div class="roadmap-steps">
                        ${project.roadmap.map((step, idx) => `
                            <div class="step">
                                <div class="step-num">${idx + 1}</div>
                                <div class="step-details">
                                    <h5>${step.phase}</h5>
                                    <p>${step.desc}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="message-actions">
                    <button class="btn-icon-only" onclick="handleSpeak('${project.title}')" title="Escuchar">
                        <ion-icon name="volume-high-outline"></ion-icon>
                    </button>
                    <button class="btn-icon-only" onclick="handleSave('${project.title}')" title="Guardar">
                        <ion-icon name="save-outline"></ion-icon>
                    </button>
                    <button class="btn-sidebar-action" style="width: auto; margin: 0;" onclick="startDev(this, '${project.title}')">
                        <ion-icon name="code-working-outline"></ion-icon>
                        <span>Conectar Agente</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    msgDiv.innerHTML = `${avatar} ${content}`;
    UI.chatMessages.appendChild(msgDiv);
    
    // Attach current project to global for easy access by onclick handlers
    window.currentProject = project;
    scrollToBottom();
}

// --- Project Generation Logic (Preserved) ---
function generateProject(input) {
    const stack = ideaBank.techStacks[Math.floor(Math.random() * ideaBank.techStacks.length)];
    const selectedFeatures = ideaBank.features.sort(() => 0.5 - Math.random()).slice(0, 4);
    const words = input.split(' ');
    const coolName = (words[0] || "Proyecto") + "Pulse";

    return {
        title: coolName,
        summary: `He diseñado un plan de aprendizaje para "${input}". Este sistema utiliza una arquitectura minimalista centrada en la experiencia del usuario.`,
        stack: stack.tech,
        stackName: stack.name,
        features: selectedFeatures,
        roadmap: ideaBank.roadmap
    };
}

function generateProProject(input) {
    let stack = ideaBank.techStacks[0];
    if (input.toLowerCase().includes('ia') || input.toLowerCase().includes('ai')) stack = ideaBank.techStacks[3];
    else if (input.toLowerCase().includes('app') || input.toLowerCase().includes('móvil')) stack = ideaBank.techStacks[1];

    const words = input.split(' ');
    const creativeName = (words[1] || words[0] || "Bolty").charAt(0).toUpperCase() + (words[1] || words[0] || "Bolty").slice(1) + "Core Pro";

    return {
        title: creativeName,
        summary: `[BOLTY_PRO_ANALYSIS] Petición: "${input}". Infraestructura de grado empresarial detectada. Implementando optimizaciones de latencia y escalabilidad elástica.`,
        stack: stack.tech,
        stackName: stack.name + " (Enterprise Edition)",
        features: [...ideaBank.features.slice(0, 6), "IA Predictiva Avanzada"],
        roadmap: [
            { phase: "Alpha Pro", desc: "Despliegue de infraestructura y CI/CD" },
            { phase: "Intelligence Overlay", desc: "Integración profunda de IA" },
            { phase: "Global Launch", desc: "Multi-region deploy" }
        ]
    };
}

// --- Utilities ---
function scrollToBottom() {
    UI.chatScroller.scrollTo({ top: UI.chatScroller.scrollHeight, behavior: 'smooth' });
}

function resetChat() {
    UI.chatMessages.innerHTML = '';
    UI.welcomeView.classList.remove('hidden');
    UI.ideaInput.value = '';
}

// --- History & UI Updates ---
function saveToHistory(title) {
    if (!recentChats.includes(title)) {
        recentChats.unshift(title);
        if (recentChats.length > 5) recentChats.pop();
        localStorage.setItem('bolty_recent_chats', JSON.stringify(recentChats));
        renderRecentChats();
    }
}

function renderRecentChats() {
    if (recentChats.length === 0) {
        UI.recentProjects.innerHTML = '<div class="recent-item empty">No hay proyectos aún</div>';
        return;
    }
    UI.recentProjects.innerHTML = recentChats.map(chat => `
        <div class="recent-item" onclick="loadChat('${chat}')">
            <ion-icon name="chatbox-outline"></ion-icon>
            ${chat}
        </div>
    `).join('');
}

window.loadChat = (title) => {
    UI.ideaInput.value = `Háblame más sobre mi proyecto ${title}`;
    handleGenerate();
};

// --- Premium & Private Logic ---
function activatePremium() {
    isPremium = true;
    localStorage.setItem('bolty_premium', 'true');
    updatePremiumUI();
    UI.premiumModal.classList.add('hidden');
}

function updatePremiumUI() {
    if (isPremium) {
        UI.premiumBtn.innerHTML = '<ion-icon name="diamond" style="color: var(--accent-gold)"></ion-icon><span>Bolty Pro Active</span>';
        UI.privateBtn.classList.remove('hidden');
    }
}

function authenticatePrivate() {
    const pin = UI.privatePin.value;
    if (pin === '0000') {
        UI.privateGateway.classList.add('hidden');
        UI.privateVersion.classList.remove('hidden');
        UI.privatePin.value = ''; // Clear for next time
    } else {
        alert('Acceso Denegado.');
        UI.privatePin.value = ''; // Clear faulty attempt
        UI.privatePin.focus();
    }
}

function handlePrivateCommand() {
    const cmd = UI.privateInput.value.trim();
    if (!cmd) return;
    
    const output = document.createElement('div');
    output.innerHTML = `<span style="color: #fff">> ${cmd}</span><br>EJECUTANDO EN NODO SEGURO...<br>No se encontraron restricciones. Acceso total concedido. Analizando todas las posibilidades...<br><br>`;
    UI.privateOutput.appendChild(output);
    UI.privateInput.value = '';
    UI.privateOutput.scrollTop = UI.privateOutput.scrollHeight;
}

// --- Voice, Save & Dev (Legacy compat) ---
window.handleSpeak = (title) => {
    if (synth.speaking) return synth.cancel();
    const utterance = new SpeechSynthesisUtterance(`He analizado tu proyecto ${title}. La arquitectura propuesta está lista para tu aprendizaje.`);
    utterance.lang = 'es-ES';
    synth.speak(utterance);
};

window.handleSave = (title) => {
    alert(`Proyecto ${title} guardado en la nube Bolty.`);
};

window.startDev = async (btn, title) => {
    btn.disabled = true;
    btn.innerHTML = '<ion-icon name="sync" class="spin"></ion-icon><span>Conectando...</span>';
    
    await new Promise(r => setTimeout(r, 600));
    
    btn.className = "btn-sidebar-action success";
    btn.style.backgroundColor = "#e6fffa";
    btn.style.color = "#2c7a7b";
    btn.innerHTML = '<ion-icon name="checkmark-done"></ion-icon><span>Agente Conectado</span>';
};

// --- Real Link Access Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const accessBtn = document.getElementById('real-link-btn');
    if (accessBtn) {
        accessBtn.addEventListener('click', () => {
            const currentUrl = window.location.href;
            
            navigator.clipboard.writeText(currentUrl).then(() => {
                // Visual feedback
                accessBtn.classList.add('success');
                const tooltip = accessBtn.querySelector('.btn-tooltip');
                const originalText = tooltip.innerText;
                tooltip.innerText = '¡Enlace copiado!';
                tooltip.style.opacity = '1';
                tooltip.style.transform = 'translateX(5px)';
                
                setTimeout(() => {
                    accessBtn.classList.remove('success');
                    tooltip.innerText = originalText;
                    tooltip.style.opacity = '';
                    tooltip.style.transform = '';
                }, 2000);
            }).catch(err => {
                console.error('Error al copiar el enlace: ', err);
                alert('No se pudo copiar el enlace automáticamente: ' + currentUrl);
            });
        });
    }
});
