// Import links carry structure in the fragment; only the browser reads it. No analytics or network API.
(function () {
  const strings = {
    en: {
      languageLabel: "Language",
      fileLabel: "App file",
      heading: "Open in Tinkrum",
      privacy:
        "This app file is checked in your browser. Nothing in the file is uploaded.",
      ready: "Ready to review",
      invalid:
        "This link is incomplete or cannot be read. Ask your AI for the whole app file and paste it in Tinkrum.",
      broken: "This app file has problems. Send them back to your AI.",
      open: "Open in Tinkrum",
      copy: "Copy the app file",
      copyProblems: "Copy the problems for your AI",
      copied: "Copied",
      copyFailed: "Select the text below and copy it.",
      install:
        "If Tinkrum is not installed, get it first. You can keep this page and open it again afterwards.",
      ios: "iPhone version coming soon.",
      paste:
        "You can also copy the file, then in Tinkrum: Settings → Apps and presets → My presets → Paste from clipboard.",
      problems:
        "Tinkrum could not import this app file. Fix these problems and send the whole file again:",
    },
    zh: {
      languageLabel: "语言",
      fileLabel: "App 文件",
      heading: "在 Tinkrum 中打开",
      privacy: "App 文件只在你的浏览器里检查，文件内容不会上传。",
      ready: "可以查看并导入",
      invalid:
        "这个链接不完整或无法读取。请让 AI 给你完整 App 文件，再粘贴到 Tinkrum。",
      broken: "这个 App 文件有问题，请把问题交回给 AI。",
      open: "在 Tinkrum 中打开",
      copy: "复制 App 文件",
      copyProblems: "复制问题给 AI",
      copied: "已复制",
      copyFailed: "请选中下面的文字并复制。",
      install: "还没装 Tinkrum？请先安装，之后可以回到这个页面再打开。",
      ios: "iPhone 版即将推出。",
      paste:
        "也可以复制文件，然后在 Tinkrum 打开：设置 → App 和预设 → 我的预设 → 从剪贴板粘贴。",
      problems:
        "Tinkrum 无法导入这个 App 文件。请修好以下问题，再给我完整文件：",
    },
    fr: {
      languageLabel: "Langue",
      fileLabel: "Fichier d’app",
      heading: "Ouvrir dans Tinkrum",
      privacy:
        "Ce fichier d’app est vérifié dans ton navigateur. Son contenu n’est pas envoyé.",
      ready: "Prêt à examiner",
      invalid:
        "Ce lien est incomplet ou illisible. Demande le fichier d’app entier à ton IA, puis colle-le dans Tinkrum.",
      broken: "Ce fichier d’app contient des erreurs. Renvoie-les à ton IA.",
      open: "Ouvrir dans Tinkrum",
      copy: "Copier le fichier d’app",
      copyProblems: "Copier les erreurs pour l’IA",
      copied: "Copié",
      copyFailed: "Sélectionne le texte ci-dessous pour le copier.",
      install:
        "Tinkrum n’est pas installé ? Installe-le d’abord. Tu peux garder cette page et l’ouvrir à nouveau ensuite.",
      ios: "La version iPhone arrive bientôt.",
      paste:
        "Tu peux aussi copier le fichier, puis dans Tinkrum : Paramètres → Apps et préréglages → Mes préréglages → Coller depuis le presse-papiers.",
      problems:
        "Tinkrum ne peut pas importer ce fichier d’app. Corrige ces erreurs et renvoie le fichier entier :",
    },
  };
  const $ = (id) => document.getElementById(id);
  const language = $("language");
  const browserLanguage = (navigator.language || "en").slice(0, 2);
  language.value = strings[browserLanguage] ? browserLanguage : "en";
  let text, check, payload;
  function read() {
    text = undefined;
    check = null;
    payload = undefined;
    try {
      const values = new URLSearchParams(location.hash.slice(1)).getAll("a");
      if (values.length !== 1) throw new Error("missing payload");
      payload = values[0];
      text = window.tinkrumReadAppLink(payload);
      check = window.tinkrumCheckAppFile(text);
    } catch {
      check = null;
    }
  }

  function element(tag, value) {
    const node = document.createElement(tag);
    node.textContent = value;
    return node;
  }
  async function copy(value, button, s) {
    try {
      await navigator.clipboard.writeText(value);
      button.textContent = s.copied;
    } catch {
      button.textContent = s.copyFailed;
      $("manual-copy").hidden = false;
      $("copy-text").value = value;
      $("copy-text").select();
    }
  }
  function show() {
    const lang = language.value;
    const s = strings[lang];
    document.documentElement.lang = lang;
    document.title = s.heading;
    language.setAttribute("aria-label", s.languageLabel);
    $("copy-text").setAttribute("aria-label", s.fileLabel);
    $("heading").textContent = s.heading;
    $("privacy").textContent = s.privacy;
    $("result").replaceChildren();
    $("preview").replaceChildren();
    $("preview").hidden = true;
    $("actions").hidden = true;
    $("manual-copy").hidden = true;
    if (!check) {
      $("result").className = "result bad";
      $("result").append(element("p", s.invalid));
      return;
    }
    $("result").className = `result ${check.ok ? "ok" : "bad"}`;
    if (!check.ok) {
      $("result").append(element("h2", s.broken));
      const list = document.createElement("ul");
      for (const problem of check.problems) list.append(element("li", problem));
      const button = element("button", s.copyProblems);
      button.className = "btn small";
      button.type = "button";
      button.addEventListener("click", () =>
        copy(
          `${s.problems}\n${check.problems.map((p) => `- ${p}`).join("\n")}`,
          button,
          s,
        ),
      );
      $("result").append(list, button);
      return;
    }
    $("result").append(element("h2", `${s.ready}: ${check.summary.name}`));
    const files = check.config
      ? window.tinkrumSetupPreviewFiles(check.config)
      : [check.file];
    for (const file of files) $("preview").append(window.tinkrumPreview(file));
    $("preview").hidden = false;
    $("actions").hidden = false;
    $("open-app").textContent = s.open;
    const play = $("play").href;
    $("open-app").href = /Android/i.test(navigator.userAgent)
      ? `intent://open?a=${payload}#Intent;scheme=morph;package=dev.stonetech.tinkrum;S.browser_fallback_url=${encodeURIComponent(play)};end`
      : `morph://open?a=${payload}`;
    $("copy-file").textContent = s.copy;
    $("copy-file").onclick = () => copy(text, $("copy-file"), s);
    $("install-note").textContent = s.install;
    $("ios-note").textContent = s.ios;
    $("paste-note").textContent = s.paste;
  }
  language.addEventListener("change", show);
  function load() {
    read();
    show();
  }
  window.addEventListener("hashchange", load);
  load();
})();
