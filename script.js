/* ============================================================
   NexChat – script.js
   Concepts: DOM manipulation, localStorage, chatbot responses,
             timestamps, emoji picker, auto-resize textarea,
             typing indicator simulation
   ============================================================ */

'use strict';

// ─── Constants ────────────────────────────────────────────────
const LS_KEY    = 'nexchat_history';
const ME_NAME   = 'You';
const ME_AVATAR = { bg:'linear-gradient(135deg,#3b72f5,#7c5cfc)', letter:'Y' };

// ─── Contact Config ───────────────────────────────────────────
const CONTACTS = {
  nova: {
    name:     'Nova AI',
    status:   '🟢 Online — AI Assistant',
    avatarBg: 'linear-gradient(135deg,#6fa3ff,#a78bfa)',
    letter:   'N',
    isBot:    true,
    onlineDot: true,
  },
  alice: {
    name:     'Alice Wang',
    status:   '🟢 Online',
    avatarBg: 'linear-gradient(135deg,#f472b6,#ec4899)',
    letter:   'A',
    isBot:    true,
    onlineDot: true,
  },
  bob: {
    name:     'Bob Martinez',
    status:   '🟡 Last seen 10 min ago',
    avatarBg: 'linear-gradient(135deg,#34d399,#059669)',
    letter:   'B',
    isBot:    true,
    onlineDot: false,
  },
  sara: {
    name:     'Sara Patel',
    status:   '🟢 Online',
    avatarBg: 'linear-gradient(135deg,#fb923c,#f97316)',
    letter:   'S',
    isBot:    true,
    onlineDot: true,
  },
};

// ─── Chatbot Response Bank ────────────────────────────────────
const BOT_RESPONSES = {
  nova: [
    '👋 Hi there! I\'m Nova, your AI assistant. How can I help you today?',
    '🤔 That\'s an interesting question! Let me think about that…',
    '💡 Great idea! Here\'s what I suggest: break it into smaller steps and tackle one at a time.',
    '📚 I\'d recommend checking the docs for more details on that.',
    '✅ Done! Is there anything else I can help you with?',
    '🚀 That sounds like a solid plan. Go for it!',
    '😊 Happy to help! Let me know if you need anything else.',
    '🔍 I found something relevant: try searching for "best practices" in that area.',
    '⚙️ You can usually configure that in the settings panel.',
    '🧠 Based on what you\'ve shared, I think the best approach is to start simple and iterate.',
    '🌟 Excellent! That\'s one of the best patterns to follow.',
    '📊 The data suggests a consistent improvement when you apply that technique.',
    '🤝 Absolutely, collaboration is key! Consider pair programming on this.',
    '💬 Interesting! Could you tell me more about the problem you\'re facing?',
    '⏳ Great things take time. Stay consistent and you\'ll see results!',
  ],
  alice: [
    '😄 Hey! Good to hear from you!',
    '🎉 That\'s awesome news! Congrats!',
    '👍 Sounds good to me!',
    'Haha yeah, I was thinking the same thing 😂',
    '📸 Did you see the new design I sent over?',
    'Let\'s catch up over coffee sometime ☕',
    '🤔 Hmm, let me check and get back to you.',
    'Sorry for the late reply, was in a meeting!',
    '✨ Love the idea! Let\'s go with it.',
    '😅 Oh no, really? That\'s wild!',
  ],
  bob: [
    'Hey! What\'s up?',
    '🙌 Sure, let\'s do it.',
    'Was just thinking about that actually!',
    '😴 It\'s been a long week…',
    '💪 Let\'s crush it!',
    '👀 Interesting. Tell me more.',
    '🤙 I\'ll reach out once I\'m free.',
    'Makes sense to me! Good call.',
    '🎮 Off topic but have you tried the new game?',
    '📅 Let\'s schedule something for next week.',
  ],
  sara: [
    '🚀 On my way!',
    '🌸 Hey! How\'ve you been?',
    '✅ Done! What\'s next?',
    '🙈 Oh my, I forgot all about that!',
    '😊 Of course! Happy to help.',
    '💌 Just sent you the file.',
    '🏃 Give me 5 mins, be right there!',
    '🎯 Right on target!',
    '✨ This is going to be so good!',
    '🤗 Aww that\'s so sweet, thank you!',
  ],
};

// ─── Emoji Set ────────────────────────────────────────────────
const EMOJIS = [
  '😀','😂','🥰','😎','🤔','😅','😭','🥳','🤩','😏',
  '👍','👎','🙌','🤝','💪','🫶','🙏','👀','💯','🔥',
  '❤️','💙','💜','💛','🧡','✨','⭐','🎉','🎊','🎯',
  '🚀','💡','🎨','🎮','📚','🎵','🌟','🍕','☕','🌈',
  '😴','🤣','🥲','😤','😱','🤯','😇','🤫','🫡','😬',
  '🐶','🐱','🦊','🐼','🦁','🐸','🐙','🦋','🌸','🌺',
];

// ─── State ────────────────────────────────────────────────────
let activeContact = 'nova';
let chatHistory   = {};      // { contactId: [{ sender, text, time, id }] }
let botTimer      = null;
let lastDates     = {};      // { contactId: 'YYYY-MM-DD' }

// ─── DOM refs ─────────────────────────────────────────────────
const messagesArea    = document.getElementById('messagesArea');
const msgInput        = document.getElementById('msgInput');
const sendBtn         = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const typingLabel     = document.getElementById('typingLabel');
const typingAvatar    = document.getElementById('typingAvatar');
const typingAvatarLetter = document.getElementById('typingAvatarLetter');
const emojiPicker     = document.getElementById('emojiPicker');
const emojiGrid       = document.getElementById('emojiGrid');
const emojiToggleBtn  = document.getElementById('emojiToggleBtn');
const contactSearch   = document.getElementById('contactSearch');
const chatPeerName    = document.getElementById('chatPeerName');
const chatPeerStatus  = document.getElementById('chatPeerStatus');
const chatAvatar      = document.getElementById('chatAvatar');
const chatAvatarLetter = document.getElementById('chatAvatarLetter');
const peerOnlineDot   = document.getElementById('peerOnlineDot');
const clearChatBtn    = document.getElementById('clearChatBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const mobileBack      = document.getElementById('mobileBack');
const sidebar         = document.querySelector('.sidebar');

// ─── Init ─────────────────────────────────────────────────────
(function init() {
  loadHistory();
  buildEmojiPicker();
  attachListeners();
  switchContact('nova');
  setContactTimestamps();
})();

// ─── Listeners ────────────────────────────────────────────────
function attachListeners() {

  // Send on button click
  sendBtn.addEventListener('click', sendMessage);

  // Send on Enter (Shift+Enter = new line)
  msgInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  // Auto-resize textarea
  msgInput.addEventListener('input', () => {
    msgInput.style.height = 'auto';
    msgInput.style.height = Math.min(msgInput.scrollHeight, 120) + 'px';
    sendBtn.disabled = !msgInput.value.trim();
  });

  // Contact switching
  document.getElementById('contactList').addEventListener('click', e => {
    const item = e.target.closest('.contact-item');
    if (item) {
      switchContact(item.dataset.contact);
      // Mobile: hide sidebar
      sidebar.classList.add('hidden-mobile');
    }
  });

  // Mobile back
  mobileBack.addEventListener('click', () => sidebar.classList.remove('hidden-mobile'));

  // Emoji toggle
  emojiToggleBtn.addEventListener('click', () => {
    emojiPicker.hidden = !emojiPicker.hidden;
    emojiToggleBtn.textContent = emojiPicker.hidden ? '😊' : '✕';
    if (!emojiPicker.hidden) msgInput.focus();
  });

  // Close emoji on outside click
  document.addEventListener('click', e => {
    if (!emojiPicker.contains(e.target) && e.target !== emojiToggleBtn) {
      emojiPicker.hidden = true;
      emojiToggleBtn.textContent = '😊';
    }
  });

  // Clear single chat
  clearChatBtn.addEventListener('click', () => {
    chatHistory[activeContact] = [];
    lastDates[activeContact]   = null;
    saveHistory();
    renderMessages(activeContact);
    updateContactPreview(activeContact, '');
  });

  // Clear all history
  clearHistoryBtn.addEventListener('click', () => {
    chatHistory = {};
    lastDates   = {};
    saveHistory();
    renderMessages(activeContact);
    Object.keys(CONTACTS).forEach(id => updateContactPreview(id, ''));
  });

  // Contact search filter
  contactSearch.addEventListener('input', () => {
    const q = contactSearch.value.toLowerCase();
    document.querySelectorAll('.contact-item').forEach(item => {
      const name = item.querySelector('.contact-name').textContent.toLowerCase();
      item.style.display = name.includes(q) ? '' : 'none';
    });
  });
}

// ─── Switch Contact ───────────────────────────────────────────
function switchContact(contactId) {
  if (!CONTACTS[contactId]) return;
  activeContact = contactId;

  const peer = CONTACTS[contactId];

  // Update header
  chatPeerName.textContent  = peer.name;
  chatPeerStatus.textContent = peer.status;
  chatAvatar.style.background     = peer.avatarBg;
  chatAvatarLetter.textContent    = peer.letter;
  typingAvatar.style.background   = peer.avatarBg;
  typingAvatarLetter.textContent  = peer.letter;
  typingLabel.textContent = `${peer.name} is typing…`;
  peerOnlineDot.hidden    = !peer.onlineDot;

  // Contact list active state
  document.querySelectorAll('.contact-item').forEach(item => {
    item.classList.toggle('active', item.dataset.contact === contactId);
    item.setAttribute('aria-selected', item.dataset.contact === contactId);
  });

  // Hide typing + emoji
  typingIndicator.hidden = true;
  emojiPicker.hidden     = true;
  clearTimeout(botTimer);

  // Render messages
  renderMessages(contactId);
  msgInput.focus();
}

// ─── Send Message ─────────────────────────────────────────────
function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;

  const msg = {
    id:     `m_${Date.now()}`,
    sender: 'me',
    text,
    time:   new Date().toISOString(),
  };

  if (!chatHistory[activeContact]) chatHistory[activeContact] = [];
  chatHistory[activeContact].push(msg);
  saveHistory();

  appendMessage(msg, activeContact);
  updateContactPreview(activeContact, text);

  // Reset input
  msgInput.value = '';
  msgInput.style.height = 'auto';
  sendBtn.disabled = true;

  // Send button animation
  sendBtn.classList.add('sent-anim');
  setTimeout(() => sendBtn.classList.remove('sent-anim'), 400);

  // Close emoji picker
  emojiPicker.hidden = true;
  emojiToggleBtn.textContent = '😊';

  scrollToBottom();
  triggerBotReply();
}

// ─── Bot Reply ────────────────────────────────────────────────
function triggerBotReply() {
  const peer = CONTACTS[activeContact];
  if (!peer?.isBot) return;

  // Random typing delay 800ms – 2500ms
  const delay = 800 + Math.random() * 1700;

  typingIndicator.hidden = false;
  scrollToBottom();

  botTimer = setTimeout(() => {
    typingIndicator.hidden = true;

    const pool    = BOT_RESPONSES[activeContact] || BOT_RESPONSES.nova;
    const history = chatHistory[activeContact] || [];
    // Avoid repeating last bot reply
    const lastBot = [...history].reverse().find(m => m.sender !== 'me');
    let response;
    do {
      response = pool[Math.floor(Math.random() * pool.length)];
    } while (pool.length > 1 && lastBot && response === lastBot.text);

    const msg = {
      id:     `m_${Date.now()}`,
      sender: 'bot',
      text:   response,
      time:   new Date().toISOString(),
    };

    chatHistory[activeContact].push(msg);
    saveHistory();
    appendMessage(msg, activeContact);
    updateContactPreview(activeContact, response);
    scrollToBottom();
  }, delay);
}

// ─── Render All Messages ──────────────────────────────────────
function renderMessages(contactId) {
  messagesArea.innerHTML = '';
  lastDates[contactId]   = null;

  const msgs = chatHistory[contactId] || [];

  if (!msgs.length) {
    messagesArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <h3>Start a conversation</h3>
        <p>Send a message to begin chatting with ${CONTACTS[contactId]?.name || 'this contact'}.</p>
      </div>`;
    return;
  }

  msgs.forEach(msg => appendMessage(msg, contactId, false));
  scrollToBottom(false);
}

// ─── Append Single Message ────────────────────────────────────
function appendMessage(msg, contactId, animate = true) {
  const isSent = msg.sender === 'me';
  const peer   = CONTACTS[contactId];
  const d      = new Date(msg.time);
  const dateKey = d.toDateString();

  // Remove empty state if present
  const emptyState = messagesArea.querySelector('.empty-state');
  if (emptyState) emptyState.remove();

  // Date divider
  if (lastDates[contactId] !== dateKey) {
    const divider = buildDateDivider(d);
    messagesArea.appendChild(divider);
    lastDates[contactId] = dateKey;
  }

  // Row
  const row = document.createElement('div');
  row.className = `msg-row ${isSent ? 'sent' : 'recv'}`;
  row.dataset.msgId = msg.id;
  if (!animate) row.style.animation = 'none';

  // Avatar (for received)
  if (!isSent && peer) {
    const av = document.createElement('div');
    av.className = 'msg-avatar';
    av.style.background = peer.avatarBg;
    av.textContent = peer.letter;
    row.appendChild(av);
  }

  // Bubble wrap
  const wrap = document.createElement('div');
  wrap.className = 'bubble-wrap';

  // Sender name (received only)
  if (!isSent && peer) {
    const name = document.createElement('span');
    name.className = 'sender-name';
    name.textContent = peer.name;
    wrap.appendChild(name);
  }

  // Bubble
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = msg.text;
  wrap.appendChild(bubble);

  // Meta (time + ticks)
  const meta = document.createElement('div');
  meta.className = 'bubble-meta';

  const timeEl = document.createElement('span');
  timeEl.textContent = formatTime(d);
  meta.appendChild(timeEl);

  if (isSent) {
    const tick = document.createElement('span');
    tick.className = 'read-tick';
    tick.textContent = '✓✓';
    meta.appendChild(tick);
  }

  wrap.appendChild(meta);
  row.appendChild(wrap);
  messagesArea.appendChild(row);
}

// ─── Date Divider ─────────────────────────────────────────────
function buildDateDivider(date) {
  const div  = document.createElement('div');
  div.className = 'date-divider';
  const span = document.createElement('span');
  span.textContent = formatDate(date);
  div.appendChild(span);
  return div;
}

// ─── Emoji Picker ─────────────────────────────────────────────
function buildEmojiPicker() {
  EMOJIS.forEach(emoji => {
    const btn = document.createElement('button');
    btn.type  = 'button';
    btn.className   = 'emoji-btn';
    btn.textContent = emoji;
    btn.title = emoji;
    btn.addEventListener('click', () => {
      const pos    = msgInput.selectionStart;
      const before = msgInput.value.slice(0, pos);
      const after  = msgInput.value.slice(pos);
      msgInput.value = before + emoji + after;
      msgInput.setSelectionRange(pos + emoji.length, pos + emoji.length);
      msgInput.dispatchEvent(new Event('input'));
      msgInput.focus();
    });
    emojiGrid.appendChild(btn);
  });
}

// ─── Contact Preview ──────────────────────────────────────────
function updateContactPreview(contactId, text) {
  const prevEl = document.getElementById(`preview-${contactId}`);
  const timeEl = document.getElementById(`time-${contactId}`);
  if (prevEl) prevEl.textContent = text ? truncate(text, 32) : 'No messages yet';
  if (timeEl) timeEl.textContent = text ? formatTime(new Date()) : '';
}

function setContactTimestamps() {
  Object.keys(CONTACTS).forEach(id => {
    const msgs = chatHistory[id] || [];
    if (msgs.length) {
      const last = msgs[msgs.length - 1];
      updateContactPreview(id, last.text);
      const timeEl = document.getElementById(`time-${id}`);
      if (timeEl) timeEl.textContent = formatTime(new Date(last.time));
    }
  });
}

// ─── localStorage ─────────────────────────────────────────────
function saveHistory() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(chatHistory));
  } catch { /* quota exceeded */ }
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    chatHistory = raw ? JSON.parse(raw) : {};
  } catch {
    chatHistory = {};
  }
}

// ─── Scroll ───────────────────────────────────────────────────
function scrollToBottom(smooth = true) {
  requestAnimationFrame(() => {
    messagesArea.scrollTo({
      top: messagesArea.scrollHeight,
      behavior: smooth ? 'smooth' : 'instant',
    });
  });
}

// ─── Time / Date Helpers ──────────────────────────────────────
function formatTime(date) {
  return date.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
}

function formatDate(date) {
  const now   = new Date();
  const today = now.toDateString();
  const yest  = new Date(now - 86400000).toDateString();

  if (date.toDateString() === today) return 'Today';
  if (date.toDateString() === yest)  return 'Yesterday';
  return date.toLocaleDateString([], { weekday:'long', month:'long', day:'numeric' });
}

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}
