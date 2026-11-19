// The app-file checker page. checker.js (built from the app repo by scripts/build-agent-kit.mjs) defines
// tinkrumCheckAppFile(text): the same checks Tinkrum runs on import. Nothing leaves the page.
(function () {
  const text = document.getElementById('file-text');
  const result = document.getElementById('result');
  const pick = document.getElementById('file-pick');

  function el(tag, cls, content) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function list(items) {
    const ul = el('ul');
    for (const item of items) ul.append(el('li', '', item));
    return ul;
  }

  function copyButton(label, value) {
    const button = el('button', 'btn small', label);
    button.type = 'button';
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(value);
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Copy failed: select the text and copy it';
      }
    });
    return button;
  }

  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  function show(check) {
    result.replaceChildren();
    result.hidden = false;
    result.className = `result ${check.ok ? 'ok' : 'bad'}`;
    if (check.ok) {
      const s = check.summary;
      result.append(
        el('h3', '', `Ready to import: ${s.name}`),
        el(
          'p',
          '',
          [
            plural(s.pages, 'page', 'pages'),
            plural(s.tables, 'table', 'tables'),
            plural(s.quickActions, 'quick action', 'quick actions'),
            plural(s.reminders, 'reminder', 'reminders'),
          ].join(' · '),
        ),
      );
      if (check.warnings.length > 0) {
        result.append(el('p', 'note', 'It imports, but some parts will not work yet:'), list(check.warnings));
        const message = `Tinkrum can import this app file, but these parts will not work yet. Fix them and send the whole file again:\n${check.warnings.map((w) => `- ${w}`).join('\n')}`;
        result.append(el('p', '', ''), copyButton('Copy for your AI', message));
      } else {
        result.append(el('p', 'note', 'Copy it, then in Tinkrum: Settings → My presets → Paste from clipboard.'));
      }
      return;
    }
    const message = `Tinkrum could not import this app file. Fix these problems and send the whole file again:\n${check.problems.map((p) => `- ${p}`).join('\n')}`;
    result.append(
      el('h3', '', 'Not ready yet'),
      el('p', 'note', 'Send these problems back to your AI. It knows what they mean.'),
      list(check.problems),
      copyButton('Copy for your AI', message),
    );
  }

  function run() {
    if (typeof window.tinkrumCheckAppFile !== 'function') {
      show({ ok: false, problems: ['the checker did not load; reload the page'] });
      return;
    }
    if (!text.value.trim()) {
      show({ ok: false, problems: ['paste an app file first'] });
      return;
    }
    show(window.tinkrumCheckAppFile(text.value));
  }

  document.getElementById('check-btn').addEventListener('click', run);
  pick.addEventListener('change', async () => {
    const file = pick.files && pick.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      show({ ok: false, problems: ['the file is over 2 MB; an app file is much smaller'] });
      return;
    }
    text.value = await file.text();
    pick.value = '';
    run();
  });

  for (const button of document.querySelectorAll('[data-copy]')) {
    const source = document.getElementById(button.dataset.copy);
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(source.textContent.trim());
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Select the text and copy it';
      }
    });
  }
})();
