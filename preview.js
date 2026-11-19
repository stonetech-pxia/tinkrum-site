// A rough, clickable preview of a Tinkrum app file: one phone frame with the app's bottom bar, its pages
// drawn as sketches in the app's colours, and the structure (tables, quick actions, reminders) underneath.
// It is a sketch, not the app's renderer: every block is drawn as a simple shape with its labels.
// Everything is built with textContent; nothing in the file is ever treated as HTML.
(function () {
  const DEFAULTS = { background: '#F5EFE8', surface: '#FFFCF8', text: '#2A2420', secondary: '#6B7F62' };
  const PERIODS = {
    today: 'Today', yesterday: 'Yesterday', thisWeek: 'This week', lastWeek: 'Last week', thisMonth: 'This month',
    lastMonth: 'Last month', thisYear: 'This year', lastYear: 'Last year', last7days: '7 days', last30days: '30 days',
    last90days: '90 days', last365days: '365 days',
  };
  const DAYS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }
  const plain = (s) => String(s ?? '').replace(/\*\*|\*|`/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  const isEmoji = (icon) => typeof icon === 'string' && !/^[a-z-]+$/.test(icon);

  window.tinkrumPreview = function (file) {
    const tables = new Map(file.tables.map((t) => [t.id, t]));
    const pages = new Map(file.pages.map((p) => [p.id, p]));
    const tools = new Map(file.tools.map((t) => [t.id, t]));
    const field = (tableId, id) => {
      if (id === 'createdAt') return 'Created';
      if (id === 'updatedAt') return 'Updated';
      const f = tables.get(tableId)?.fields.find((x) => x.id === id);
      return f ? f.name : id;
    };
    const tableName = (id) => (id === '$files' ? 'Your files' : tables.get(id)?.name ?? id);
    const theme = file.app.theme;
    const colors = { ...DEFAULTS, ...(theme.colors || {}) };

    const root = el('div', 'pv');
    const phone = el('div', 'pv-phone');
    phone.style.setProperty('--pv-bg', colors.background);
    phone.style.setProperty('--pv-card', colors.surface);
    phone.style.setProperty('--pv-text', colors.text);
    phone.style.setProperty('--pv-card-text', colors.surfaceText || colors.text);
    phone.style.setProperty('--pv-primary', theme.primaryColor);
    phone.style.setProperty('--pv-secondary', colors.secondary);
    phone.style.setProperty('--pv-radius', `${Math.min(theme.radius ?? 18, 24)}px`);
    const top = el('div', 'pv-top');
    const screen = el('div', 'pv-screen');
    const bar = el('nav', 'pv-bar');
    phone.append(top, screen, bar);

    const barPages = file.app.bar.filter((t) => t.startsWith('page:')).map((t) => t.slice(5));
    let current = barPages[0] ?? file.pages[0]?.id;
    const history = [];

    function go(pageId, push) {
      if (!pages.has(pageId)) return;
      if (push) history.push(current);
      else history.length = 0;
      current = pageId;
      draw();
    }

    function opener(node, opens) {
      if (typeof opens !== 'string') return node;
      const target = opens.startsWith('page:') ? opens.slice(5) : pages.has(opens) ? opens : null;
      if (!target || !pages.has(target)) return node;
      node.classList.add('pv-link');
      node.tabIndex = 0;
      node.setAttribute('role', 'button');
      const open = () => go(target, !barPages.includes(target));
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        open();
      });
      node.addEventListener('keydown', (e) => e.key === 'Enter' && open());
      return node;
    }

    function rows(block, count) {
      const src = block.source || {};
      const show = block.show || {};
      const wrap = el('div', 'pv-rows');
      for (let i = 0; i < count; i++) {
        const row = opener(el('div', 'pv-row'), block.opens);
        const main = el('div', 'pv-row-main');
        main.append(el('b', '', field(src.table, show.title) || 'Entry'));
        if (show.subtitles?.length) main.append(el('small', '', show.subtitles.map((f) => field(src.table, f)).join(' · ')));
        row.append(main);
        if (show.trailing) row.append(el('span', 'pv-trail', field(src.table, show.trailing)));
        wrap.append(row);
      }
      return wrap;
    }

    function recordBlock(block) {
      const src = block.source || {};
      const show = block.show || {};
      const card = el('div', 'pv-card');
      card.append(el('div', 'pv-cap', `${tableName(src.table)} · ${block.look}${src.group?.by ? ` by ${field(src.table, src.group.by)}` : ''}`));
      switch (block.look) {
        case 'checklist': {
          const r = rows(block, 3);
          for (const row of r.children) row.prepend(el('span', 'pv-check'));
          card.append(r);
          break;
        }
        case 'tiles': {
          const grid = el('div', 'pv-tiles');
          for (let i = 0; i < 3; i++) {
            const tile = opener(el('div', 'pv-tile'), block.opens);
            tile.append(el('span', 'pv-ring'), el('small', '', field(src.table, show.title)));
            grid.append(tile);
          }
          card.append(grid);
          break;
        }
        case 'board': {
          const cols = el('div', 'pv-board');
          const by = tables.get(src.table)?.fields.find((f) => f.id === src.group?.by);
          for (const o of (by?.options || [{ label: 'Column' }, { label: 'Column' }]).slice(0, 3)) {
            const col = el('div', 'pv-col');
            col.append(el('small', '', o.label), opener(el('div', 'pv-mini'), block.opens));
            cols.append(col);
          }
          card.append(cols);
          break;
        }
        case 'calendar': {
          const cal = el('div', 'pv-cal');
          for (let i = 0; i < 21; i++) cal.append(el('span', i % 5 === 2 ? 'on' : ''));
          card.append(cal);
          break;
        }
        case 'table': {
          const cols = [show.title, ...(show.columns || show.subtitles || [])].filter(Boolean);
          const head = el('div', 'pv-thead');
          for (const c of cols.slice(0, 4)) head.append(el('span', '', field(src.table, c)));
          card.append(head, rows({ ...block, show: { title: show.title } }, 2));
          break;
        }
        case 'gallery': {
          const g = el('div', 'pv-tiles');
          for (let i = 0; i < 2; i++) g.append(opener(el('div', 'pv-pic'), block.opens));
          card.append(g);
          break;
        }
        case 'single':
          for (const f of (show.fields || []).slice(0, 4)) card.append(el('div', 'pv-kv', field(src.table || file.pages.find((p) => p.id === current)?.of, f)));
          break;
        case 'callout':
          card.classList.add('pv-tint');
          card.append(el('b', '', plain(show.title)), el('small', '', plain(show.text)));
          break;
        default:
          card.append(rows(block, block.look === 'cards' ? 2 : 3));
      }
      for (const tool of block.tools || []) if (tool.label && tool.as !== 'check') card.append(el('span', 'pv-chip', tool.label));
      return card;
    }

    function sketch(block) {
      if (block.hidden) return null;
      const show = block.show || {};
      const src = block.source || {};
      let node;
      switch (block.look) {
        case 'header':
          node = el('div', 'pv-header');
          node.append(el('h4', '', plain(show.title)));
          if (show.subtitle) node.append(el('small', '', plain(show.subtitle)));
          break;
        case 'text':
          node = el('p', 'pv-text', plain(show.text).slice(0, 160));
          break;
        case 'notice':
          node = el('div', 'pv-card pv-tint');
          if (show.title) node.append(el('b', '', plain(show.title)));
          node.append(el('small', '', plain(show.text).slice(0, 140)));
          break;
        case 'button': {
          const label = show.label || block.tools?.[0]?.label || 'Button';
          node = opener(el('div', `pv-btn ${show.variant === 'filled' ? 'filled' : ''}`, label), block.opens);
          break;
        }
        case 'entry': {
          const target = typeof block.opens === 'string' && block.opens.startsWith('page:') ? pages.get(block.opens.slice(5)) : null;
          node = opener(el('div', 'pv-card pv-entry'), block.opens);
          node.append(el('span', 'pv-icon', isEmoji(show.icon) ? show.icon : ''), el('b', '', show.title || target?.title || 'Entry'), el('span', 'pv-chev', '›'));
          break;
        }
        case 'action': {
          const id = block.tools?.[0]?.tool;
          node = el('div', 'pv-card pv-entry');
          node.append(el('span', 'pv-icon', '▶'), el('b', '', tools.get(id)?.name || id || 'Quick action'));
          break;
        }
        case 'picker':
          node = el('div', 'pv-btn filled', 'Open files');
          break;
        case 'form': {
          const tool = block.tools?.[0] || {};
          node = el('div', 'pv-card');
          const asked = Array.isArray(tool.ask) ? tool.ask : (tables.get(tool.table)?.fields || []).filter((f) => f.type !== 'formula').map((f) => f.id);
          for (const f of asked.slice(0, 5)) node.append(el('div', 'pv-input', field(tool.table, f)));
          node.append(el('div', 'pv-btn filled', tool.label || 'Save'));
          break;
        }
        case 'number':
          node = el('div', 'pv-card pv-num');
          node.append(el('small', '', show.label), el('b', '', '—'));
          break;
        case 'chart': {
          node = el('div', 'pv-card');
          node.append(el('div', 'pv-cap', `${show.title || 'Chart'} · ${show.kind || 'bar'}`));
          const bars = el('div', `pv-chart ${show.kind === 'pie' ? 'pie' : ''}`);
          if (show.kind !== 'pie') for (const h of [40, 70, 55, 85, 30]) {
            const b = el('span');
            b.style.height = `${h}%`;
            bars.append(b);
          }
          node.append(bars);
          break;
        }
        case 'group': {
          node = el('div', 'pv-group');
          if (show.title) node.append(el('div', 'pv-cap', plain(show.title)));
          const inner = show.layout === 'row' || show.layout === 'grid' ? el('div', `pv-group pv-${show.layout}-layout`) : node;
          if (inner !== node) node.append(inner);
          for (const child of block.children || []) {
            const c = sketch(child);
            if (c) inner.append(c);
          }
          break;
        }
        case 'image':
          node = el('div', 'pv-pic', show.caption || 'A picture you choose');
          break;
        case 'divider':
          node = el('hr', 'pv-hr');
          break;
        case 'spacer':
          node = el('div', 'pv-space');
          break;
        case 'period':
        case 'choices': {
          node = el('div', 'pv-chips');
          const opts = block.look === 'period' ? (show.options || []).map((o) => PERIODS[o] || o) : ['All', 'Option', 'Option'];
          opts.slice(0, 4).forEach((o, i) => node.append(el('span', `pv-chip ${i === 0 ? 'on' : ''}`, o)));
          break;
        }
        case 'dial':
          node = el('div', 'pv-btn filled pv-dial', block.tools?.[0]?.label || tools.get(block.tools?.[0]?.tool)?.name || '+');
          break;
        case 'files':
          node = el('div', 'pv-card');
          node.append(el('div', 'pv-cap', show.title || 'Files'), el('div', 'pv-row', 'Your file'), el('div', 'pv-row', 'Your file'));
          break;
        case 'library':
        case 'packages':
          node = el('div', 'pv-card');
          node.append(el('div', 'pv-cap', show.title || (block.look === 'library' ? 'Quick actions' : 'Tools')));
          node.append(el('div', 'pv-chips', (src.ids || []).join(' · ') || '…'));
          break;
        default:
          node = src.table ? recordBlock(block) : el('div', 'pv-card pv-cap', block.look);
      }
      if (block.showIf) {
        const tag = el('div', 'pv-if', `shown when ${tableName(block.showIf.table)} has ${block.showIf.has === 'none' ? 'no' : 'some'} entries`);
        const box = el('div');
        box.append(tag, node);
        node = box;
      }
      return node;
    }

    function draw() {
      const page = pages.get(current);
      top.replaceChildren();
      if (history.length > 0 || !barPages.includes(current)) {
        const back = el('button', 'pv-back', '‹');
        back.type = 'button';
        back.setAttribute('aria-label', 'Back');
        back.addEventListener('click', () => {
          current = history.pop() ?? barPages[0];
          draw();
        });
        top.append(back);
      }
      top.append(el('span', '', page.of ? `${page.title} (one ${tableName(page.of)} entry)` : page.title));
      screen.replaceChildren();
      for (const block of page.blocks) {
        const node = sketch(block);
        if (node) screen.append(node);
      }
      if (page.blocks.length === 0) screen.append(el('p', 'pv-text', 'An empty page.'));
      screen.scrollTop = 0;
      bar.replaceChildren();
      for (const target of file.app.bar) {
        const id = target.startsWith('page:') ? target.slice(5) : null;
        const p = id ? pages.get(id) : null;
        const tab = el('button', `pv-tab ${id === current ? 'on' : ''}`);
        tab.type = 'button';
        tab.append(el('span', 'pv-tab-icon', p && isEmoji(p.icon) ? p.icon : id ? '▢' : '✦'), el('small', '', p ? p.title : 'Tink'));
        if (id) tab.addEventListener('click', () => go(id, false));
        else tab.disabled = true;
        bar.append(tab);
      }
    }
    draw();

    // ── structure ──
    const facts = el('div', 'pv-facts');
    const section = (title, items) => {
      if (items.length === 0) return;
      const box = el('div');
      box.append(el('h4', '', title));
      const ul = el('ul');
      for (const [head, rest] of items) {
        const li = el('li');
        li.append(el('b', '', head));
        if (rest) li.append(document.createTextNode(` — ${rest}`));
        ul.append(li);
      }
      box.append(ul);
      facts.append(box);
    };
    const typeText = (f) => (f.type === 'choice' ? `choice: ${(f.options || []).map((o) => o.label).join(', ')}` : f.type === 'link' ? `link to ${tableName(f.table)}` : f.type);
    section('Pages', file.pages.map((p) => [p.title, `${p.blocks.length} blocks${p.of ? `, one ${tableName(p.of)} entry` : ''}${barPages.includes(p.id) ? ', in the bar' : ''}`]));
    section('Tables', file.tables.map((t) => [t.name, t.fields.map((f) => `${f.name} (${typeText(f)})`).join(' · ')]));
    const whenText = (w) => {
      if (!w) return '';
      if (w.every === 'day') return `every day at ${w.at}`;
      if (w.every === 'week') return `every ${(w.days || []).map((d) => DAYS[d] || d).join(', ')} at ${w.at}`;
      if (w.every === 'month') return `on day ${w.day} of each month at ${w.at}`;
      if (w.before) return `${w.days ?? w.minutes} ${w.days !== undefined ? 'days' : 'minutes'} before ${field(w.before.table, w.before.field)}`;
      if (w.each) return `on each ${field(w.each.table, w.each.field)} at ${w.at}`;
      if (w.after) return `${w.minutes} minutes after a new ${tableName(w.after.table)} entry`;
      return '';
    };
    section('Quick actions', file.tools.filter((t) => t.kind === 'quickAction').map((q) => [q.name, (q.steps || []).map((s) => s.action).join(' → ')]));
    section('Reminders', file.tools.filter((t) => t.kind === 'reminder').map((r) => [r.title, whenText(r.when)]));

    const hint = el('p', 'pv-hint', 'A sketch of the app in its own colours: tap the bar, entries and rows to move between pages. Lists start empty; the real app draws each block in its own style.');
    root.append(hint, phone, facts);
    return root;
  };
})();
