const userDisplay = document.getElementById('userDisplay');
const messagesBox = document.getElementById('messagesBox');
const composer = document.getElementById('composer');
const promptInput = document.getElementById('promptInput');
const logoutBtn = document.getElementById('logoutBtn');
const uploadInput = document.getElementById('uploadInput');
const downloadBtn = document.getElementById('downloadBtn');

const currentUser = localStorage.getItem('discoking_user') || 'guest';
userDisplay.textContent = currentUser;

if (localStorage.getItem('discoking_authenticated') !== 'true') {
  window.location.href = 'index.html';
}

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('discoking_authenticated');
  localStorage.removeItem('discoking_user');
  localStorage.removeItem('discoking_role');
  window.location.href = 'index.html';
});

composer.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = promptInput.value.trim();

  if (!text) return;

  const userMsg = document.createElement('div');
  userMsg.className = 'msg user';
  userMsg.innerHTML = `<div class="bubble">${text}</div>`;
  messagesBox.appendChild(userMsg);

  const agentReply = document.createElement('div');
  agentReply.className = 'msg assistant';

  const autoMode = document.querySelector('.switch input');
  const modeText = autoMode && autoMode.checked
    ? 'Auto mode engaged. Sandbox is running a safe orchestration sequence.'
    : 'Manual mode enabled. Forwarding instructions to the active toolchain.';

  agentReply.innerHTML = `<div class="bubble">${modeText} Hermes has queued the request and is coordinating the private workspace, Forgejo sync, and secure tool execution.</div>`;

  messagesBox.appendChild(agentReply);
  messagesBox.scrollTop = messagesBox.scrollHeight;
  promptInput.value = '';
  promptInput.focus();
});

uploadInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const uploadMsg = document.createElement('div');
  uploadMsg.className = 'msg assistant';
  uploadMsg.innerHTML = `<div class="bubble">Sandbox upload received: <strong>${file.name}</strong>. File is now in the private vault and available for tool processing.</div>`;
  messagesBox.appendChild(uploadMsg);
  messagesBox.scrollTop = messagesBox.scrollHeight;
  uploadInput.value = '';
});

downloadBtn.addEventListener('click', () => {
  const blob = new Blob([
    'DiscoKING sandbox export\n\n' +
    'Status: Active\n' +
    'Mode: Auto\n' +
    'Tools: Enabled\n' +
    'Private Vault: Secure\n' +
    'Free model pool: Hidden\n'
  ], { type: 'text/plain' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'discoking_sandbox_export.txt';
  a.click();
  URL.revokeObjectURL(url);

  const alertMsg = document.createElement('div');
  alertMsg.className = 'msg assistant';
  alertMsg.innerHTML = '<div class="bubble">Sandbox export generated successfully. Download is ready.</div>';
  messagesBox.appendChild(alertMsg);
  messagesBox.scrollTop = messagesBox.scrollHeight;
});

const agentButtons = document.querySelectorAll('.agent');
agentButtons.forEach((button) => {
  button.addEventListener('click', () => {
    agentButtons.forEach((b) => b.classList.remove('active'));
    button.classList.add('active');

    const agentName = button.dataset.agent || 'Hermes';
    const title = document.querySelector('.topbar h1');
    title.textContent = `${agentName} session`;

    const status = document.createElement('div');
    status.className = 'msg assistant';
    status.innerHTML = `<div class="bubble">${agentName} activated. The toolchain, sandbox, and private protections are aligned for the selected workflow.</div>`;

    messagesBox.appendChild(status);
    messagesBox.scrollTop = messagesBox.scrollHeight;
  });
});
