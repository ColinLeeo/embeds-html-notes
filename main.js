"use strict";

const { Plugin, FileView, Component, SuggestModal, Modal, Notice } = require("obsidian");
const ui = (en, zh) => (document.documentElement.lang || navigator.language || "").toLowerCase().startsWith("zh") ? zh : en;
const VIEW = "html-scenes-view";
const EXTENSIONS = ["html", "htm"];
const isHtml = file => EXTENSIONS.includes(file?.extension?.toLowerCase());
const sceneId = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

function parseLocation(fragment = "") {
  const raw = fragment.replace(/^#/, "");
  const mark = raw.indexOf("?");
  const scene = mark < 0 ? raw : raw.slice(0, mark);
  const params = new URLSearchParams(mark < 0 ? "" : raw.slice(mark + 1));
  return { scene, params };
}

function fragmentOf({ scene, params }) {
  if (!scene) return "";
  const query = params.toString();
  return "#" + scene + (query ? "?" + query : "");
}

function readCatalog(html) {
  const match = html.match(/<script\b[^>]*\bid\s*=\s*(["'])html-scenes\1[^>]*>([\s\S]*?)<\/script\s*>/i);
  if (!match) return new Map();
  const entries = JSON.parse(match[2]);
  if (!entries || typeof entries !== "object" || Array.isArray(entries)) throw new Error(ui("The scene catalog must be a JSON object", "场景目录需要使用 JSON 对象"));
  return new Map(Object.entries(entries).filter(([key, title]) => sceneId.test(key) && typeof title === "string" && title.trim()));
}

class Picker extends SuggestModal {
  constructor(app, title, items, choose) {
    super(app);
    this.setPlaceholder(title);
    this.emptyStateText = ui("No matches", "没有匹配项");
    this.items = items;
    this.choose = choose;
  }
  getSuggestions(query) {
    const words = query.toLowerCase().trim().split(/\s+/);
    return this.items.filter(item => words.every(word => (item.title + " " + item.detail).toLowerCase().includes(word)));
  }
  renderSuggestion(item, el) {
    el.createDiv({ text: item.title });
    el.createDiv({ cls: "html-scenes-detail", text: item.detail });
  }
  onChooseSuggestion(item) { this.choose(item); }
}

class CopyFallback extends Modal {
  constructor(app, text) { super(app); this.value = text; }
  onOpen() {
    this.setTitle(ui("Copy Markdown reference", "复制 Markdown 引用"));
    const area = this.contentEl.createEl("textarea", { cls: "html-scenes-copy" });
    area.value = this.value;
    area.readOnly = true;
    area.focus();
    area.select();
  }
}

class SceneFrame extends Component {
  constructor(plugin, parent, file, subpath, inline) {
    super();
    Object.assign(this, { plugin, parent, file, inline });
    this.location = parseLocation(subpath);
    this.generation = 0;
    this.catalog = new Map();
  }

  onload() {
    this.root = this.parent.createDiv({ cls: "html-scenes-frame" });
    this.root.classList.toggle("is-inline", this.inline);
    const bar = this.root.createDiv({ cls: "html-scenes-bar" });
    this.caption = bar.createSpan({ cls: "html-scenes-caption" });
    const action = (label, run) => {
      const button = bar.createEl("button", { text: label, attr: { type: "button" } });
      this.registerDomEvent(button, "click", run);
    };
    action(ui("Copy link", "复制链接"), () => this.copy(false));
    action(ui("Copy embed", "复制嵌入"), () => this.copy(true));
    action(ui("Find references", "查看引用"), () => this.plugin.showReferences(this.file, this.location));
    if (this.inline) action(ui("Open full page", "打开整页"), () => this.plugin.openScene(this.file, this.location));
    this.body = this.root.createDiv({ cls: "html-scenes-body" });
    this.updateCaption();
    this.registerDomEvent(this.parent.ownerDocument.defaultView, "message", event => this.onMessage(event));
    this.registerEvent(this.plugin.app.vault.on("modify", file => {
      if (file === this.file) this.loadFile();
    }));
    this.registerEvent(this.plugin.app.vault.on("rename", file => {
      if (file === this.file) this.updateCaption();
    }));
    this.loadFile();
  }

  // Obsidian embeds can also call loadFile during mounting.
  async loadFile() {
    if (!this.body) return;
    const sequence = ++this.generation;
    try {
      const html = await this.plugin.app.vault.cachedRead(this.file);
      if (sequence !== this.generation) return;
      this.catalog = readCatalog(html);
      this.updateCaption();
      const doc = this.parent.ownerDocument;
      const frame = doc.createElement("iframe");
      frame.setAttribute("sandbox", "allow-scripts");
      frame.setAttribute("referrerpolicy", "no-referrer");
      frame.title = this.file.basename;
      const win = doc.defaultView;
      this.releaseFrame();
      this.url = win.URL.createObjectURL(new win.Blob([html], { type: "text/html;charset=utf-8" }));
      this.iframe = frame;
      frame.src = this.url + fragmentOf(this.location);
      frame.addEventListener("load", () => {
        if (this.iframe === frame) this.sendLocation();
      }, { once: true });
      this.body.replaceChildren(frame);
    } catch (error) {
      if (sequence !== this.generation) return;
      this.releaseFrame();
      this.body.setText(ui("Could not display ", "无法显示 ") + this.file.name + " · " + error.message);
    }
  }

  sendLocation() {
    if (!this.iframe?.contentWindow) return;
    this.sentInitialState = true;
    this.iframe.contentWindow.postMessage({
      type: "html-scenes:open", scene: this.location.scene,
      params: Object.fromEntries(this.location.params), inline: this.inline
    }, "*");
  }
  navigate(subpath) {
    this.location = parseLocation(subpath);
    this.updateCaption();
    if (this.iframe) {
      this.iframe.src = this.url + fragmentOf(this.location);
      this.sendLocation();
    }
  }
  onMessage(event) {
    if (!this.iframe || event.source !== this.iframe.contentWindow || event.origin !== "null") return;
    const m = event.data;
    if (!m || typeof m !== "object") return;
    if (m.type === "html-scenes:ready") return this.sendLocation();
    if (m.type === "html-scenes:height" && this.inline && Number.isFinite(m.height)) {
      this.iframe.style.height = Math.min(1200, Math.max(100, Math.ceil(m.height))) + "px";
      return;
    }
    if (!this.sentInitialState || m.type !== "html-scenes:state" || !this.catalog.has(m.scene) || !m.params ||
        typeof m.params !== "object" || Array.isArray(m.params)) return;
    const pairs = Object.entries(m.params);
    if (pairs.length > 32 || pairs.some(([k, v]) => !sceneId.test(k) || typeof v !== "string" || v.length > 1024)) return;
    this.location = { scene: m.scene, params: new URLSearchParams(pairs) };
    this.updateCaption();
  }
  updateCaption() {
    if (!this.caption) return;
    this.caption.setText(this.catalog.get(this.location.scene) || this.location.scene || this.file.basename);
    this.caption.title = this.file.path + fragmentOf(this.location);
  }
  async copy(embed) {
    // Vault-root paths keep references unambiguous when the destination note is unknown.
    const text = (embed ? "!" : "") + "[[" + this.file.path + fragmentOf(this.location) + "]]";
    try {
      await this.parent.ownerDocument.defaultView.navigator.clipboard.writeText(text);
      new Notice(embed ? ui("Scene embed copied", "已复制场景嵌入") : ui("Scene link copied", "已复制场景链接"));
    } catch { new CopyFallback(this.plugin.app, text).open(); }
  }
  releaseFrame() {
    this.sentInitialState = false;
    this.iframe?.remove();
    this.iframe = null;
    if (this.url) this.parent.ownerDocument.defaultView.URL.revokeObjectURL(this.url);
    this.url = null;
  }
  onunload() {
    ++this.generation;
    this.releaseFrame();
    this.root?.remove();
  }
}

class HtmlView extends FileView {
  constructor(leaf, plugin) { super(leaf); this.plugin = plugin; }
  getViewType() { return VIEW; }
  getDisplayText() { return this.file?.basename || this.plugin.manifest.name; }
  getIcon() { return "panels-top-left"; }
  canAcceptExtension(ext) { return EXTENSIONS.includes(ext); }
  async onLoadFile(file) {
    this.frame = this.addChild(new SceneFrame(this.plugin, this.contentEl, file, "", false));
  }
  async onUnloadFile() {
    if (this.frame) this.removeChild(this.frame);
    this.frame = null;
  }
  setEphemeralState(state) {
    super.setEphemeralState(state);
    if (typeof state?.subpath === "string") this.frame?.navigate(state.subpath);
  }
  getState() {
    return { ...super.getState(), sceneFragment: this.frame ? fragmentOf(this.frame.location) : "" };
  }
  async setState(state, result) {
    await super.setState(state, result);
    if (state.sceneFragment) this.frame?.navigate(state.sceneFragment);
  }
}

class HtmlScenes extends Plugin {
  onload() {
    this.registerView(VIEW, leaf => new HtmlView(leaf, this));
    for (const ext of EXTENSIONS) {
      try { this.registerExtensions([ext], VIEW); }
      catch { new Notice(this.manifest.name + " · ." + ext + ui(" is already registered. Use the Find HTML scenes command.", " 已由其他插件打开，可用“搜索 HTML 场景”命令打开。")); }
      const registry = this.app.embedRegistry;
      if (!registry?.registerExtension || registry.isExtensionRegistered?.(ext)) continue;
      const creator = (ctx, file, subpath) => new SceneFrame(this, ctx.containerEl, file, subpath || "", true);
      registry.registerExtension(ext, creator);
      this.register(() => {
        if (registry.getEmbedCreator({ extension: ext }) === creator) registry.unregisterExtension(ext);
      });
    }
    this.addCommand({ id: "find-scene", name: ui("Find HTML scenes", "搜索 HTML 场景"), callback: () => this.findScenes() });
    this.addRibbonIcon("panels-top-left", ui("Find HTML scenes", "搜索 HTML 场景"), () => this.findScenes());
  }
  openScene(file, location) {
    return this.app.workspace.getLeaf("tab").setViewState({
      type: VIEW, active: true, state: { file: file.path, sceneFragment: fragmentOf(location) }
    });
  }
  async findScenes() {
    const items = [];
    for (const file of this.app.vault.getFiles().filter(isHtml)) {
      const push = (scene, title) => items.push({ file, scene, title, detail: file.path + (scene ? "#" + scene : "") });
      push("", file.basename);
      try {
        const scenes = readCatalog(await this.app.vault.cachedRead(file));
        for (const [scene, title] of scenes) push(scene, title);
      } catch { /* The file entry still opens and reports read or catalog errors. */ }
    }
    new Picker(this.app, ui("Find an HTML file or scene", "查找 HTML 文件或场景"), items, item =>
      this.openScene(item.file, parseLocation(item.scene))).open();
  }
  showReferences(file, location) {
    const { vault, metadataCache, workspace } = this.app;
    const items = [];
    for (const source of vault.getMarkdownFiles()) {
      const cache = metadataCache.getFileCache(source);
      for (const ref of [...(cache?.links || []), ...(cache?.embeds || [])]) {
        const hash = ref.link.indexOf("#");
        const path = hash < 0 ? ref.link : ref.link.slice(0, hash);
        if (!/\.html?$/i.test(path) || metadataCache.getFirstLinkpathDest(path, source.path)?.path !== file.path) continue;
        const target = parseLocation(hash < 0 ? "" : ref.link.slice(hash));
        if (location.scene && target.scene !== location.scene) continue;
        const line = ref.position.start.line;
        items.push({ source, line, title: source.basename, detail: source.path + ui(" · line ", " · 第 ") + (line + 1) + ui(" · ", " 行 · ") +
          (ref.original || ref.link) });
      }
    }
    if (!items.length) return new Notice(ui("No notes reference this scene yet", "还没有笔记引用这个场景"));
    new Picker(this.app, ui("Notes referencing this scene", "引用此场景的笔记"), items, item =>
      workspace.getLeaf("tab").openFile(item.source, { eState: { line: item.line } })).open();
  }
}

module.exports = HtmlScenes;
