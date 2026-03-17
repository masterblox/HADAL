/* ══════════════════════════════════════════════════════════════
   MIT-HADAL — Extracted JS components from MASTERBLOX Intelligence Terminal
   Copilot AI panel, Squarified Treemap, Iceberg Math
   All exports on window.HADAL namespace
   ══════════════════════════════════════════════════════════════ */

window.HADAL = window.HADAL || {};

/* ══════════════════════════════════════════════════════════════
   1. COPILOT AI PANEL (self-contained IIFE)
   Rebranded: CO-PILOT → HADAL AI, amber → lime green
   Modes: ANALYST (default), COMMANDER, BUILDER
   ══════════════════════════════════════════════════════════════ */
(function () {
  var SYSTEM_PROMPTS = {
    ANALYST: 'You are HADAL AI, a tactical geopolitical intelligence analyst for the Gulf Watch threat terminal. Respond in ALL CAPS. HUD tactical style. Maximum 120 words.',
    COMMANDER: 'You are HADAL AI, operating in COMMANDER mode. Strategic-level geopolitical threat assessment only. ALL CAPS, authoritative tone. Max 100 words.',
    BUILDER: 'You are HADAL AI in BUILDER mode. Answer questions about dashboard features, data sources, and threat modeling. ALL CAPS, technical. Max 150 words.',
  };

  var state = {
    open: false,
    mode: 'ANALYST',
    messages: [],
    busy: false,
    status: 'offline',
  };

  /* ── Color tokens ── */
  var LIME = '#C4FF2C';
  var LIME_RGB = '196,255,44';
  var GREEN = '#00FF88';

  /* ── Inject styles ── */
  function injectStyles() {
    var style = document.createElement('style');
    style.id = 'hadal-ai-styles';
    style.textContent =
      '/* ── TOGGLE BUTTON ── */' +
      '#hadalAiTrigger{position:fixed;bottom:28px;right:28px;z-index:9999;width:120px;height:44px;background:#0A0A0A;border:1.5px solid ' + LIME + ';clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;overflow:hidden;box-shadow:0 0 14px rgba(' + LIME_RGB + ',0.35),inset 0 0 20px rgba(' + LIME_RGB + ',0.04);transition:box-shadow 0.15s ease;}' +
      '#hadalAiTrigger:hover{box-shadow:0 0 24px rgba(' + LIME_RGB + ',0.65),inset 0 0 30px rgba(' + LIME_RGB + ',0.08);}' +
      '#hadalAiTrigger::before{content:"";position:absolute;bottom:0;left:0;right:0;height:6px;background:repeating-linear-gradient(-45deg,rgba(90,90,90,0.45) 0px,rgba(90,90,90,0.45) 1.5px,transparent 1.5px,transparent 6px);opacity:0.55;}' +
      '#hadalAiTrigger::after{content:"";position:absolute;top:-100%;left:0;right:0;height:1px;background:rgba(' + LIME_RGB + ',0.7);animation:h-scanSweep 3s ease-in-out infinite;}' +
      '#hadalAiTrigger .trig-label{font:7px "Share Tech Mono",monospace;letter-spacing:3px;color:' + LIME + ';z-index:1;line-height:1;}' +
      '#hadalAiTrigger .trig-icon{font-size:14px;color:' + LIME + ';z-index:1;line-height:1;}' +
      '#hadalAiTrigger .trig-live{font:6px "Share Tech Mono",monospace;letter-spacing:2px;color:' + GREEN + ';z-index:1;transition:color 0.3s;}' +
      '#hadalAiTrigger .trig-live span{display:inline-block;width:5px;height:5px;background:' + GREEN + ';border-radius:50%;box-shadow:0 0 6px ' + GREEN + ';margin-right:3px;vertical-align:middle;animation:h-blink 1.5s infinite;transition:background 0.3s,box-shadow 0.3s;}' +
      '#hadalAiTrigger.status-offline .trig-live{color:#FF4444;}' +
      '#hadalAiTrigger.status-offline .trig-live span{background:#FF4444;box-shadow:0 0 6px #FF4444;}' +
      '#hadalAiTrigger.status-offline{border-color:rgba(255,68,68,0.5);box-shadow:0 0 14px rgba(255,68,68,0.2),inset 0 0 20px rgba(255,68,68,0.04);}' +
      '#hadalAiTrigger.status-degraded .trig-live{color:#FF8C00;}' +
      '#hadalAiTrigger.status-degraded .trig-live span{background:#FF8C00;box-shadow:0 0 6px #FF8C00;}' +

      '/* ── PANEL ── */' +
      '#hadalAiPanel{position:fixed;bottom:88px;right:28px;z-index:9998;width:420px;height:530px;background:#060800;border:1px solid ' + LIME + ';border-radius:0;display:none;flex-direction:column;clip-path:polygon(0 0,calc(100% - 22px) 0,100% 22px,100% 100%,22px 100%,0 calc(100% - 22px));box-shadow:0 0 40px rgba(' + LIME_RGB + ',0.12),inset 0 0 60px rgba(0,0,0,0.8);font-family:"Share Tech Mono",monospace;}' +
      '#hadalAiPanel.open{display:flex;}' +
      '#hadalAiPanel::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,0) 0px,rgba(0,0,0,0) 3px,rgba(0,0,0,0.07) 3px,rgba(0,0,0,0.07) 4px);pointer-events:none;z-index:100;}' +
      '#hadalAiPanel::after{content:"";position:absolute;top:0;right:0;width:60px;height:6px;background:repeating-linear-gradient(-45deg,rgba(' + LIME_RGB + ',0.35) 0px,rgba(' + LIME_RGB + ',0.35) 1.5px,transparent 1.5px,transparent 6px);opacity:0.45;}' +

      '/* ── HEADER ── */' +
      '#hadalAiHeader{height:36px;background:#0C0C0C;border-bottom:1px solid #1C1C1C;display:flex;align-items:center;justify-content:space-between;padding:0 12px;flex-shrink:0;position:relative;}' +
      '#hadalAiHeader::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:' + LIME + ';}' +
      '#hadalAiHeader .h-left{display:flex;align-items:center;gap:8px;padding-left:8px;}' +
      '#hadalAiHeader .h-arrow{color:' + LIME + ';font-size:10px;letter-spacing:0;}' +
      '#hadalAiHeader .h-title{font-size:11px;letter-spacing:4px;color:' + LIME + ';}' +
      '#hadalAiHeader .h-badge{font-size:6px;letter-spacing:2px;color:' + LIME + ';border:1px solid rgba(' + LIME_RGB + ',0.4);padding:2px 5px;background:rgba(' + LIME_RGB + ',0.07);}' +
      '#hadalAiHeader .h-right{display:flex;align-items:center;gap:8px;}' +
      '#hadalAiClose{font-size:8px;letter-spacing:2px;color:#444;border:1px solid #2a2a2a;padding:3px 8px;background:transparent;cursor:pointer;font-family:"Share Tech Mono",monospace;transition:all 0.1s;}' +
      '#hadalAiClose:hover{color:#FF4444;border-color:#FF4444;}' +

      '/* ── SUBTITLE BAR ── */' +
      '#hadalAiSub{height:20px;background:#060606;border-bottom:1px solid #111;display:flex;align-items:center;justify-content:space-between;padding:0 12px;flex-shrink:0;}' +
      '#hadalAiSub .sub-left{font-size:6px;letter-spacing:2px;color:#222;}' +
      '#hadalAiSub .sub-right{font-size:6px;letter-spacing:2px;color:' + GREEN + ';}' +

      '/* ── LIVE BAR ── */' +
      '#hadalAiLive{height:24px;background:#050505;border-bottom:1px solid #111;display:flex;align-items:center;gap:8px;padding:0 12px;flex-shrink:0;position:relative;overflow:hidden;}' +
      '#hadalAiLive::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:repeating-linear-gradient(-45deg,rgba(0,255,136,0.4) 0px,rgba(0,255,136,0.4) 1.5px,transparent 1.5px,transparent 5px);opacity:0.6;}' +
      '#hadalAiLive .live-dot{width:6px;height:6px;background:' + GREEN + ';border-radius:50%;box-shadow:0 0 8px ' + GREEN + ';animation:h-blink 1.5s infinite;flex-shrink:0;margin-left:8px;transition:background 0.3s,box-shadow 0.3s;}' +
      '#hadalAiLive .live-text{font-size:7px;letter-spacing:2px;color:' + GREEN + ';transition:color 0.3s;}' +
      '#hadalAiPanel.status-offline .live-dot{background:#FF4444;box-shadow:0 0 8px #FF4444;}' +
      '#hadalAiPanel.status-offline .live-text{color:#FF4444;}' +
      '#hadalAiPanel.status-offline .live-up{color:#FF4444;}' +
      '#hadalAiPanel.status-offline .sub-right{color:#FF4444;}' +
      '#hadalAiPanel.status-degraded .live-dot{background:#FF8C00;box-shadow:0 0 8px #FF8C00;}' +
      '#hadalAiPanel.status-degraded .live-text{color:#FF8C00;}' +
      '#hadalAiPanel.status-degraded .live-up{color:#FF8C00;}' +
      '#hadalAiLive .live-sep{color:#222;font-size:10px;}' +
      '#hadalAiLive .live-tag{font-size:7px;letter-spacing:2px;color:' + LIME + ';}' +
      '#hadalAiLive .live-up{margin-left:auto;font-size:6px;letter-spacing:1px;color:#222;}' +

      '/* ── MODE TABS ── */' +
      '#hadalAiTabs{height:30px;display:flex;background:#0A0A0A;border-bottom:1px solid #1C1C1C;flex-shrink:0;position:relative;}' +
      '#hadalAiTabs::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:repeating-linear-gradient(-45deg,rgba(' + LIME_RGB + ',0.38) 0px,rgba(' + LIME_RGB + ',0.38) 1.5px,#0A0A0A 1.5px,#0A0A0A 5px);}' +
      '.haTab{flex:1;display:flex;align-items:center;justify-content:center;font-size:7px;letter-spacing:3px;color:#252525;cursor:pointer;transition:all 0.1s;background:transparent;position:relative;border:none;font-family:"Share Tech Mono",monospace;}' +
      '.haTab:hover{color:#555;background:#0d0d0d;}' +
      '.haTab.active{color:' + LIME + ';background:#0C0C0C;border-bottom:2px solid ' + LIME + ';}' +
      '.haTab.active::after{content:"";position:absolute;top:0;right:0;width:0;height:0;border-style:solid;border-width:0 6px 6px 0;border-color:transparent ' + LIME + ' transparent transparent;}' +

      '/* ── CHAT AREA ── */' +
      '#hadalAiChat{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px;background:#060800;scroll-behavior:smooth;}' +
      '#hadalAiChat::-webkit-scrollbar{width:3px;}' +
      '#hadalAiChat::-webkit-scrollbar-track{background:#0d0d0d;}' +
      '#hadalAiChat::-webkit-scrollbar-thumb{background:' + LIME + ';}' +
      '.ha-msg-ai{border-left:2px solid ' + LIME + ';background:rgba(' + LIME_RGB + ',0.03);padding:6px 10px;position:relative;clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%);}' +
      '.ha-msg-ai::after{content:"";position:absolute;top:0;right:0;width:30px;height:4px;background:repeating-linear-gradient(-45deg,rgba(' + LIME_RGB + ',0.28) 0px,rgba(' + LIME_RGB + ',0.28) 1.5px,transparent 1.5px,transparent 5px);opacity:0.4;}' +
      '.ha-msg-label{font-size:6px;letter-spacing:3px;color:' + LIME + ';display:flex;justify-content:space-between;margin-bottom:4px;}' +
      '.ha-msg-time{color:#1e1e1e;}' +
      '.ha-msg-text{font-size:9px;color:#666;line-height:1.7;text-transform:uppercase;}' +
      '.ha-msg-cmd{text-align:right;padding:5px 10px;border-right:1px solid #222;clip-path:polygon(8px 0,100% 0,100% 100%,0 100%,0 8px);}' +
      '.ha-msg-cmd .ha-msg-label{color:#2a2a2a;justify-content:flex-end;}' +
      '.ha-msg-cmd .ha-msg-text{color:#3a3a3a;}' +
      '.ha-processing{border-left:2px solid ' + LIME + ';padding:6px 10px;background:rgba(' + LIME_RGB + ',0.03);}' +
      '.ha-process-bar{height:3px;background:#111;margin-top:6px;position:relative;overflow:hidden;}' +
      '.ha-process-fill{height:100%;background:' + LIME + ';width:0%;animation:haProcessFill 2s ease-in-out infinite;box-shadow:0 0 6px ' + LIME + ';}' +
      '@keyframes haProcessFill{0%{width:0%;opacity:1}70%{width:80%;opacity:1}100%{width:100%;opacity:0}}' +
      '.ha-msg-error{border-left:2px solid #FF4444;background:rgba(255,68,68,0.04);padding:6px 10px;}' +
      '.ha-msg-error .ha-msg-label{color:#FF4444;}' +
      '.ha-msg-error .ha-msg-text{color:#FF4444;}' +

      '/* ── INPUT ROW ── */' +
      '#hadalAiInput-row{height:40px;background:#050505;border-top:1px solid #1C1C1C;display:flex;align-items:center;gap:8px;padding:0 10px;flex-shrink:0;position:relative;}' +
      '#hadalAiInput-row::after{content:"";position:absolute;bottom:0;left:0;right:0;height:3px;background:repeating-linear-gradient(-45deg,rgba(' + LIME_RGB + ',0.25) 0px,rgba(' + LIME_RGB + ',0.25) 1.5px,transparent 1.5px,transparent 6px);}' +
      '#hadalAiInput-row .inp-arrow{color:' + LIME + ';font-size:10px;flex-shrink:0;}' +
      '#hadalAiInput{flex:1;background:transparent;border:none;border-bottom:1px solid #1C1C1C;color:' + LIME + ';font:9px "Share Tech Mono",monospace;letter-spacing:1px;outline:none;padding-bottom:2px;}' +
      '#hadalAiInput::placeholder{color:#1a1a1a;}' +
      '#hadalAiInput:focus{border-bottom-color:' + LIME + ';}' +
      '#hadalAiSend{font:7px "Share Tech Mono",monospace;letter-spacing:2px;color:' + LIME + ';background:rgba(' + LIME_RGB + ',0.08);border:1px solid ' + LIME + ';padding:6px 10px;border-radius:0;cursor:pointer;clip-path:polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,0 100%);transition:all 0.1s;}' +
      '#hadalAiSend:hover{background:rgba(' + LIME_RGB + ',0.2);box-shadow:0 0 8px rgba(' + LIME_RGB + ',0.4);}';
    document.head.appendChild(style);
  }

  /* ── Status management ── */
  function updateStatus(newStatus) {
    state.status = newStatus;
    var trigger = document.getElementById('hadalAiTrigger');
    var panel = document.getElementById('hadalAiPanel');
    var trigLive = trigger ? trigger.querySelector('.trig-live') : null;
    var liveText = panel ? panel.querySelector('.live-text') : null;
    var liveUp = panel ? panel.querySelector('.live-up') : null;
    var subRight = panel ? panel.querySelector('.sub-right') : null;

    ['status-offline', 'status-live', 'status-degraded'].forEach(function (cls) {
      if (trigger) trigger.classList.remove(cls);
      if (panel) panel.classList.remove(cls);
    });

    if (newStatus === 'live') {
      if (trigger) trigger.classList.add('status-live');
      if (panel) panel.classList.add('status-live');
      if (trigLive) trigLive.innerHTML = '<span></span>ONLINE';
      if (liveText) liveText.textContent = 'LIVE';
      if (liveUp) liveUp.textContent = 'UPLINK ACTIVE';
      if (subRight) subRight.textContent = 'SYSTEMS NOMINAL';
    } else if (newStatus === 'degraded') {
      if (trigger) trigger.classList.add('status-degraded');
      if (panel) panel.classList.add('status-degraded');
      if (trigLive) trigLive.innerHTML = '<span></span>DEGRADED';
      if (liveText) liveText.textContent = 'DEGRADED';
      if (liveUp) liveUp.textContent = 'UPLINK UNSTABLE';
      if (subRight) subRight.textContent = 'CHECK CONNECTION';
    } else {
      if (trigger) trigger.classList.add('status-offline');
      if (panel) panel.classList.add('status-offline');
      if (trigLive) trigLive.innerHTML = '<span></span>OFFLINE';
      if (liveText) liveText.textContent = 'OFFLINE';
      if (liveUp) liveUp.textContent = 'UPLINK DOWN';
      if (subRight) subRight.textContent = 'SIGNAL LOST';
    }
  }

  /* ── Health check — ping API to verify uplink ── */
  async function checkUplink() {
    try {
      var token = '';
      if (typeof window.HADAL.getSession === 'function') {
        var session = await window.HADAL.getSession();
        if (session && session.access_token) token = session.access_token;
      }
      if (!token) { updateStatus('offline'); return; }

      var headers = { 'Content-Type': 'application/json' };
      headers['Authorization'] = 'Bearer ' + token;

      var res = await fetch('/api/copilot', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'ping' }],
          systemPrompt: 'Respond with exactly: PONG',
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 5,
        }),
      });
      if (res.ok) {
        updateStatus('live');
      } else if (res.status === 401) {
        updateStatus('offline');
      } else {
        updateStatus('degraded');
      }
    } catch (e) {
      updateStatus('offline');
    }
  }

  /* ── Escape HTML ── */
  function esc(str) {
    var d = document.createElement('div');
    d.textContent = String(str || '');
    return d.innerHTML;
  }

  /* ── Timestamp ── */
  function ts() {
    var now = new Date();
    return String(now.getHours()).padStart(2, '0') + ':' +
           String(now.getMinutes()).padStart(2, '0') + ':' +
           String(now.getSeconds()).padStart(2, '0');
  }

  /* ── Build DOM ── */
  function buildUI() {
    var trigger = document.createElement('div');
    trigger.id = 'hadalAiTrigger';
    trigger.innerHTML = '<span class="trig-label">HADAL AI</span>' +
      '<span class="trig-icon">\u2B21</span>' +
      '<span class="trig-live"><span></span>OFFLINE</span>';
    trigger.classList.add('status-offline');
    document.body.appendChild(trigger);

    var panel = document.createElement('div');
    panel.id = 'hadalAiPanel';
    panel.innerHTML =
      '<div id="hadalAiHeader">' +
        '<div class="h-left">' +
          '<span class="h-arrow">\u25B8\u25B8</span>' +
          '<span class="h-title">HADAL AI</span>' +
          '<span class="h-badge">V1.0</span>' +
        '</div>' +
        '<div class="h-right">' +
          '<button id="hadalAiClose">ESC</button>' +
        '</div>' +
      '</div>' +
      '<div id="hadalAiSub">' +
        '<span class="sub-left">GULF WATCH THREAT INTELLIGENCE</span>' +
        '<span class="sub-right">SIGNAL LOST</span>' +
      '</div>' +
      '<div id="hadalAiLive">' +
        '<div class="live-dot"></div>' +
        '<span class="live-text">OFFLINE</span>' +
        '<span class="live-sep">|</span>' +
        '<span class="live-tag">CLAUDE AI</span>' +
        '<span class="live-sep">|</span>' +
        '<span class="live-tag" id="hadalAiSectorTag">\u2014</span>' +
        '<span class="live-up">UPLINK DOWN</span>' +
      '</div>' +
      '<div id="hadalAiTabs">' +
        '<button class="haTab active" data-mode="ANALYST">ANALYST</button>' +
        '<button class="haTab" data-mode="COMMANDER">COMMANDER</button>' +
        '<button class="haTab" data-mode="BUILDER">BUILDER</button>' +
      '</div>' +
      '<div id="hadalAiChat"></div>' +
      '<div id="hadalAiInput-row">' +
        '<span class="inp-arrow">\u25B8</span>' +
        '<input type="text" id="hadalAiInput" placeholder="ENTER DIRECTIVE..." autocomplete="off" />' +
        '<button id="hadalAiSend">SEND</button>' +
      '</div>';
    document.body.appendChild(panel);
  }

  /* ── Render messages ── */
  function renderChat() {
    var chat = document.getElementById('hadalAiChat');
    if (!chat) return;
    chat.innerHTML = state.messages.map(function (m) {
      var time = m.time || '';
      if (m.role === 'assistant' && m.processing) {
        return '<div class="ha-processing">' +
          '<div class="ha-msg-label">HADAL <span class="ha-msg-time">' + time + '</span></div>' +
          '<div class="ha-msg-text">PROCESSING DIRECTIVE...</div>' +
          '<div class="ha-process-bar"><div class="ha-process-fill"></div></div>' +
          '</div>';
      }
      if (m.role === 'assistant') {
        var cls = m.error ? 'ha-msg-error' : 'ha-msg-ai';
        return '<div class="' + cls + '">' +
          '<div class="ha-msg-label">' + (m.error ? 'ERROR' : 'HADAL') + ' <span class="ha-msg-time">' + time + '</span></div>' +
          '<div class="ha-msg-text">' + esc(m.content) + '</div></div>';
      }
      return '<div class="ha-msg-cmd">' +
        '<div class="ha-msg-label">OPERATOR <span class="ha-msg-time">' + time + '</span></div>' +
        '<div class="ha-msg-text">' + esc(m.content) + '</div></div>';
    }).join('');
    chat.scrollTop = chat.scrollHeight;
  }

  /* ── Toggle panel ── */
  function togglePanel() {
    state.open = !state.open;
    document.getElementById('hadalAiPanel').classList.toggle('open', state.open);
  }

  function closePanel() {
    state.open = false;
    document.getElementById('hadalAiPanel').classList.remove('open');
  }

  /* ── Mode switching ── */
  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('.haTab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-mode') === mode);
    });
  }

  /* ── Send message ── */
  async function sendMessage() {
    var input = document.getElementById('hadalAiInput');
    var text = (input.value || '').trim();
    if (!text || state.busy) return;

    input.value = '';
    state.messages.push({ role: 'user', content: text, time: ts() });
    renderChat();

    state.busy = true;
    state.messages.push({ role: 'assistant', content: '', processing: true, time: ts() });
    renderChat();
    var processingIdx = state.messages.length - 1;

    try {
      var token = '';
      if (typeof window.HADAL.getSession === 'function') {
        var session = await window.HADAL.getSession();
        if (session && session.access_token) token = session.access_token;
      }

      var headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;

      var res = await fetch('/api/copilot', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          systemPrompt: SYSTEM_PROMPTS[state.mode] || SYSTEM_PROMPTS.ANALYST,
        }),
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      state.messages[processingIdx] = {
        role: 'assistant',
        content: data.reply || data.data || 'NO RESPONSE.',
        time: ts(),
      };
      if (state.status !== 'live') updateStatus('live');
    } catch (err) {
      var errMsg = (err && err.message) || '';
      var isAuth = errMsg.indexOf('401') !== -1 || errMsg.indexOf('token') !== -1 || errMsg.indexOf('session') !== -1;
      state.messages[processingIdx] = {
        role: 'assistant',
        content: isAuth ? 'AUTH FAILED. LOGIN REQUIRED.' : 'SIGNAL LOST. RETRY.',
        error: true,
        time: ts(),
      };
      updateStatus(isAuth ? 'offline' : 'degraded');
    }

    state.busy = false;
    renderChat();
  }

  /* ── Wire events ── */
  function wireEvents() {
    document.getElementById('hadalAiTrigger').addEventListener('click', togglePanel);
    document.getElementById('hadalAiClose').addEventListener('click', closePanel);

    document.querySelectorAll('.haTab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        setMode(tab.getAttribute('data-mode'));
      });
    });

    document.getElementById('hadalAiSend').addEventListener('click', sendMessage);
    document.getElementById('hadalAiInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  /* ── Init ── */
  function initCopilot() {
    if (document.getElementById('hadalAiTrigger')) return;
    injectStyles();
    buildUI();
    wireEvents();

    document.getElementById('hadalAiPanel').classList.add('status-offline');

    state.messages.push({
      role: 'assistant',
      content: 'HADAL AI INITIALIZING. CHECKING UPLINK...',
      time: ts(),
    });
    renderChat();

    checkUplink().then(function () {
      if (state.status === 'live') {
        state.messages.push({
          role: 'assistant',
          content: 'UPLINK CONFIRMED. CLAUDE AI ONLINE. AWAITING ORDERS.',
          time: ts(),
        });
      } else if (state.status === 'degraded') {
        state.messages.push({
          role: 'assistant',
          content: 'HADAL AI STANDBY. API NOT CONFIGURED OR AUTH UNAVAILABLE.',
          time: ts(),
        });
      } else {
        state.messages.push({
          role: 'assistant',
          content: 'UPLINK OFFLINE. CHECK AUTH SESSION OR API CONFIGURATION.',
          error: true,
          time: ts(),
        });
      }
      renderChat();
    });
  }

  /* Expose init so HADAL can control when to boot the copilot */
  window.HADAL.initCopilot = initCopilot;

  /* Auto-init on DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCopilot);
  } else {
    initCopilot();
  }
})();


/* ══════════════════════════════════════════════════════════════
   2. SQUARIFIED TREEMAP ALGORITHM
   Pure layout math — no rendering, no DOM.
   Input:  [{ label, value, ...meta }]
   Output: [{ node, x, y, w, h }]
   Usage:  HADAL.squarify(items, x, y, w, h)
   ══════════════════════════════════════════════════════════════ */
(function () {

  function layoutRow(items, start, end, x, y, w, h, total, result) {
    if (start >= end) return;
    if (end - start === 1) {
      result.push({ node: items[start], x: x, y: y, w: w, h: h });
      return;
    }

    var horizontal = w >= h;
    var rowSum = 0;
    var bestAspect = Infinity;
    var split = start + 1;

    for (var i = start; i < end; i++) {
      rowSum += items[i].v;
      var frac = rowSum / total;
      var rowSize = horizontal ? w * frac : h * frac;

      var worstAspect = 0;
      for (var j = start; j <= i; j++) {
        var ar = horizontal
          ? Math.max((h * (items[j].v / rowSum)) / rowSize, rowSize / (h * (items[j].v / rowSum)))
          : Math.max((w * (items[j].v / rowSum)) / rowSize, rowSize / (w * (items[j].v / rowSum)));
        if (ar > worstAspect) worstAspect = ar;
      }

      if (worstAspect < bestAspect) {
        bestAspect = worstAspect;
        split = i + 1;
      } else if (i > start + 1) {
        break;
      }
    }

    var rowTotal = 0;
    for (var i = start; i < split; i++) rowTotal += items[i].v;
    var rowFrac = rowTotal / total;

    if (horizontal) {
      var rowW = w * rowFrac;
      var cy = y;
      for (var i = start; i < split; i++) {
        var itemH = h * (items[i].v / rowTotal);
        result.push({ node: items[i], x: x, y: cy, w: rowW, h: itemH });
        cy += itemH;
      }
      layoutRow(items, split, end, x + rowW, y, w - rowW, h, total - rowTotal, result);
    } else {
      var rowH = h * rowFrac;
      var cx = x;
      for (var i = start; i < split; i++) {
        var itemW = w * (items[i].v / rowTotal);
        result.push({ node: items[i], x: cx, y: y, w: itemW, h: rowH });
        cx += itemW;
      }
      layoutRow(items, split, end, x, y + rowH, w, h - rowH, total - rowTotal, result);
    }
  }

  /**
   * Squarified treemap layout.
   * @param {Array<{v: number, ...}>} items - Items with numeric `v` (value) property.
   * @param {number} x - Left edge.
   * @param {number} y - Top edge.
   * @param {number} w - Available width.
   * @param {number} h - Available height.
   * @returns {Array<{node, x, y, w, h}>} Positioned rectangles.
   */
  window.HADAL.squarify = function (items, x, y, w, h) {
    if (!items || items.length === 0) return [];
    if (items.length === 1) {
      return [{ node: items[0], x: x, y: y, w: w, h: h }];
    }
    var total = items.reduce(function (s, n) { return s + n.v; }, 0);
    var sorted = items.slice().sort(function (a, b) { return b.v - a.v; });
    var result = [];
    layoutRow(sorted, 0, sorted.length, x, y, w, h, total, result);
    return result;
  };

})();


/* ══════════════════════════════════════════════════════════════
   3. ICEBERG MATH — Narrative Integrity Analytics
   Pure math, no DOM, no rendering.
   HADAL plugs in its own visualization.
   ══════════════════════════════════════════════════════════════ */
(function () {

  /**
   * Generate plausible divergence curves between surface narrative and reality.
   * @param {number} startVal  - Starting value (both surface & real begin here).
   * @param {number} endSurf   - Final surface (narrative) value.
   * @param {number} endReal   - Final real (ground truth) value.
   * @param {number} [months=12] - Number of monthly data points.
   * @returns {{ surf: number[], real: number[] }}
   */
  window.HADAL.genHistory = function (startVal, endSurf, endReal, months) {
    var len = months || 12;
    var s = [], r = [];
    for (var i = 0; i < len; i++) {
      var t = i / (len - 1);
      var surfVal = startVal + (endSurf - startVal) * (1 - Math.pow(1 - t, 1.5));
      var honeymoon = Math.max(0, 1 - t * 3.3);
      var realEnd = startVal + (endReal - startVal) * Math.pow(t, 0.8);
      var realVal = honeymoon * surfVal + (1 - honeymoon) * realEnd;
      var noise = i < 3 ? 0 : Math.min(1, (i - 3) / 6);
      s.push(Math.round(surfVal + (Math.random() - 0.5) * 6 * noise));
      r.push(Math.round(realVal + (Math.random() - 0.5) * 5 * noise));
    }
    r[0] = s[0];
    return { surf: s, real: r };
  };

  /**
   * Compute Narrative Greeks — weighted gap metrics for a set of variables.
   * @param {Array<{gapVal: number, sev: 'HIGH'|'MEDIUM', surf: number[], real: number[]}>} variables
   * @returns {{ depthRatio, avgDelta, stdDev, var30, highCount, maxGap, weightedGap }}
   */
  window.HADAL.computeNarrativeGreeks = function (variables) {
    var SEV_W = { HIGH: 1.5, MEDIUM: 1.0 };
    var weightedGap = variables.reduce(function (s, v) { return s + v.gapVal * (SEV_W[v.sev] || 1); }, 0);
    var weightedMax = variables.reduce(function (s, v) { return s + 100 * (SEV_W[v.sev] || 1); }, 0);
    var depthRatio = weightedGap / weightedMax;

    var varDeltas = variables.map(function (v) {
      var n = v.surf.length;
      var gapStart = (v.surf[0] - v.real[0]) / (v.surf[0] || 1);
      var gapEnd = (v.surf[n - 1] - v.real[n - 1]) / (v.surf[n - 1] || 1);
      var totalDays = n * 30;
      return ((gapEnd - gapStart) / totalDays) * 100;
    });
    var avgDelta = varDeltas.reduce(function (s, d) { return s + d; }, 0) / varDeltas.length;
    var variance = varDeltas.reduce(function (s, d) { return s + Math.pow(d - avgDelta, 2); }, 0) / varDeltas.length;
    var stdDev = Math.sqrt(variance);
    var var30 = (depthRatio * 100) + (avgDelta * 30) + 1.28 * stdDev * Math.sqrt(30);
    var highCount = variables.filter(function (v) { return v.sev === 'HIGH'; }).length;
    var maxGap = Math.max.apply(null, variables.map(function (v) { return v.gapVal; }));

    return {
      depthRatio: depthRatio,
      avgDelta: avgDelta,
      stdDev: stdDev,
      var30: var30,
      highCount: highCount,
      maxGap: maxGap,
      weightedGap: weightedGap,
    };
  };

  /**
   * Precompute per-variable limits (min, max, range, maxGap).
   * @param {Array<{surf: number[], real: number[]}>} variables
   * @returns {Array<{sMin, sMax, sRange, maxGap}>}
   */
  window.HADAL.precomputeLimits = function (variables) {
    return variables.map(function (v) {
      var sMin = Math.min.apply(null, v.surf);
      var sMax = Math.max.apply(null, v.surf);
      var sRange = sMax - sMin;
      var maxGap = 0;
      for (var j = 0; j < v.surf.length; j++) {
        var g = v.surf[j] > 0 ? Math.max(0, (v.surf[j] - v.real[j]) / v.surf[j]) : 0;
        if (g > maxGap) maxGap = g;
      }
      return { sMin: sMin, sMax: sMax, sRange: sRange, maxGap: maxGap };
    });
  };

})();
