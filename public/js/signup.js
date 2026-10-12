const form = document.getElementById('signup-form');
const usernameInput = form.username;
const hint = document.getElementById('username-hint');

// Prefill from the landing page's "claim" box: /signup?username=foo
const prefill = new URLSearchParams(location.search).get('username');
if (prefill) usernameInput.value = prefill.toLowerCase();

let checkTimer;
let lastChecked = '';
async function checkUsername() {
  const value = usernameInput.value.trim().toLowerCase();
  if (!value || value === lastChecked) return;
  lastChecked = value;
  try {
    const res = await api('GET', `/api/check-username?username=${encodeURIComponent(value)}`);
    if (usernameInput.value.trim().toLowerCase() !== value) return; // stale
    hint.textContent = res.available ? `lynq/${value} is available!` : res.error;
    hint.className = `hint ${res.available ? 'ok' : 'bad'}`;
  } catch { /* ignore; the server re-validates on submit */ }
}
usernameInput.addEventListener('input', () => {
  hint.textContent = '';
  clearTimeout(checkTimer);
  checkTimer = setTimeout(checkUsername, 300);
});
if (prefill) checkUsername();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('');
  const btn = form.querySelector('button');
  btn.disabled = true;
  try {
    await api('POST', '/api/signup', {
      username: usernameInput.value,
      email: form.email.value,
      password: form.password.value,
    });
    location.href = '/dashboard';
  } catch (err) {
    showError(err.message);
    btn.disabled = false;
  }
});
