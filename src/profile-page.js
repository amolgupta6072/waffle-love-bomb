const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

function shell({ title, description = '', theme = 'midnight', body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/css/profile.css">
</head>
<body class="theme-${esc(theme)}">
${body}
</body>
</html>`;
}

function avatar(user) {
  const name = user.display_name || user.username;
  if (user.avatar_url) return `<img class="avatar" src="${esc(user.avatar_url)}" alt="" referrerpolicy="no-referrer">`;
  return `<div class="avatar avatar-initial" aria-hidden="true">${esc(name.charAt(0).toUpperCase())}</div>`;
}

export function renderProfile(user, links) {
  const name = user.display_name || user.username;
  const items = links.length
    ? links.map((l) => `<li><a class="link" href="/go/${l.id}" rel="noopener nofollow">${esc(l.title)}</a></li>`).join('\n      ')
    : '<li class="empty">No links yet.</li>';
  return shell({
    title: `${name} (@${user.username}) · lynq`,
    description: user.bio || `${name}'s links on lynq`,
    theme: user.theme,
    body: `  <main class="profile">
    ${avatar(user)}
    <h1>${esc(name)}</h1>
    <p class="handle">@${esc(user.username)}</p>
    ${user.bio ? `<p class="bio">${esc(user.bio)}</p>` : ''}
    <ul class="links">
      ${items}
    </ul>
    <footer><a href="/">Made with <strong>lynq</strong></a></footer>
  </main>`,
  });
}

export function renderNotFound(username) {
  return shell({
    title: 'Page not found · lynq',
    body: `  <main class="profile">
    <div class="avatar avatar-initial" aria-hidden="true">?</div>
    <h1>Nothing here… yet</h1>
    <p class="bio">${username ? `<strong>@${esc(username)}</strong> isn't taken. ` : ''}Grab it and make it yours.</p>
    <ul class="links"><li><a class="link" href="/signup${username ? `?username=${encodeURIComponent(username)}` : ''}">Claim this lynq</a></li></ul>
    <footer><a href="/">Made with <strong>lynq</strong></a></footer>
  </main>`,
  });
}
