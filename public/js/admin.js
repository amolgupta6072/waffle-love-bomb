// Whole table rows act as links.
document.querySelectorAll('tr[data-href]').forEach((row) => {
  row.addEventListener('click', (e) => {
    if (e.target.closest('a, button, input, select')) return;
    window.location.href = row.dataset.href;
  });
});

// Confirm destructive actions.
document.querySelectorAll('form[data-confirm]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    if (!window.confirm(form.dataset.confirm)) e.preventDefault();
  });
});

// Keep colour pickers and their hex text fields in sync.
document.querySelectorAll('input[type=color][data-mirror]').forEach((picker) => {
  const text = document.getElementById(picker.dataset.mirror);
  picker.addEventListener('input', () => { text.value = picker.value; });
  text.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(text.value)) picker.value = text.value; });
});
