(() => {
  const ready = (fn) => {
    const afterReactMount = () => {
      let attempts = 0;
      const check = () => {
        if (document.querySelector(".fl-shell__inner .fl-pagetitle") || attempts++ > 60) fn();
        else requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", afterReactMount, { once: true });
    else afterReactMount();
  };

  ready(() => {
    const inner = document.querySelector(".fl-shell__inner");
    const title = inner?.querySelector(".fl-pagetitle");
    if (!inner || !title || document.querySelector(".fl-system-intro")) return;

    const intro = document.createElement("section");
    intro.className = "fl-system-intro";
    intro.innerHTML = `
      <div class="fl-stream-hero__copy">
        <span class="fl-system-intro__label">Made for your next 20 minutes</span>
        <h2>Turn the whole neck into music.</h2>
        <p>One focused session connects fretboard landmarks, chord tones, rhythm and songs—without losing your place.</p>
        <div class="fl-stream-hero__actions"><button type="button" class="fl-btn fl-btn--primary fl-btn--lg fl-hero-start"><span aria-hidden="true">▶</span> Start today’s session</button><button type="button" class="fl-btn fl-btn--outline fl-btn--lg fl-hero-browse">Browse drills</button></div>
        <div class="fl-stream-hero__meta"><span>C major</span><span>18 min</span><span>Adaptive</span></div>
      </div>
      <div class="fl-stream-hero__art" role="img" aria-label="Guitarist practicing on an electric guitar"><span class="fl-stream-hero__now"><i></i> Recommended for you</span></div>`;
    title.after(intro);

    const groupRecords = [];
    document.querySelectorAll(".fl-sectionhead__title").forEach((heading) => {
      const name = heading.textContent?.trim();
      if (!name || name === "Scale library") return;
      const group = heading.closest(".fl-sectionhead")?.parentElement;
      if (!group || !group.parentElement?.classList.contains("fl-shell__inner")) return;
      const id = `system-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
      group.id = id;
      group.classList.add("fl-system-group");
      const specimens = group.querySelectorAll(":scope > div:nth-child(2) > div").length;
      const sectionHead = group.querySelector(":scope > .fl-sectionhead");
      sectionHead?.setAttribute("data-count", `${specimens} ${specimens === 1 ? "specimen" : "specimens"}`);
      groupRecords.push({ name, id, group });
    });

    document.querySelectorAll(".fl-system-group > div:nth-child(2) > div").forEach((node) => {
      node.classList.add("fl-specimen-modern");
    });

    const toolbar = document.createElement("div");
    toolbar.className = "fl-system-toolbar";
    toolbar.innerHTML = `
      <input class="fl-system-search" type="search" aria-label="Filter components" placeholder="Filter controls and components…">
      <label class="fl-system-jump"><span>Category</span><select aria-label="Jump to component category"></select></label>
      <nav class="fl-system-nav" aria-label="Component categories"></nav>
      <div class="fl-system-toolbar__end">
        <span class="fl-system-health">AA ready</span>
        <span class="fl-density" role="group" aria-label="Gallery density"><button type="button" aria-label="Comfortable density" aria-pressed="true">▦</button><button type="button" aria-label="Compact density" aria-pressed="false">≡</button></span>
      </div>`;
    intro.after(toolbar);
    enhanceMediaExperience(intro, toolbar);
    const nav = toolbar.querySelector(".fl-system-nav");
    const jump = toolbar.querySelector(".fl-system-jump select");
    groupRecords.forEach(({ name, id }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = name;
      button.addEventListener("click", () => document.getElementById(id)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
      nav.append(button);
      jump.add(new Option(name, id));
    });
    jump.addEventListener("change", () => document.getElementById(jump.value)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
    const empty = document.createElement("div");
    empty.className = "fl-system-empty";
    empty.textContent = "No components match that filter.";
    toolbar.after(empty);
    toolbar.querySelector("input").addEventListener("input", (event) => {
      const query = event.target.value.trim().toLowerCase();
      let shown = 0;
      groupRecords.forEach(({ group }) => {
        const match = !query || group.textContent.toLowerCase().includes(query);
        group.dataset.filtered = String(!match);
        shown += Number(match);
      });
      empty.dataset.visible = String(shown === 0);
    });

    const densityButtons = toolbar.querySelectorAll(".fl-density button");
    densityButtons.forEach((button, index) => button.addEventListener("click", () => {
      densityButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      document.querySelector(".fl-root")?.setAttribute("data-density", index === 1 ? "compact" : "comfortable");
    }));

    enhanceTheme();
    enhanceControlLab(groupRecords);
    enhanceActionSystem(groupRecords);
    enhancePillSystem(groupRecords);
    enhanceLabelSystem(groupRecords);
    enhanceCardSystem(groupRecords);
    enhanceFretboardStudio(groupRecords);
    enhanceProgressHeatmap(groupRecords);
    enhanceTuner(groupRecords);
    enhanceStringRows();
    enhanceMetronome();
    groupRecords.forEach(({ group }) => {
      const count = group.querySelectorAll(":scope > div:nth-child(2) > div, :scope > div:nth-child(2) > section").length;
      group.querySelector(":scope > .fl-sectionhead")?.setAttribute("data-count", `${count} ${count === 1 ? "specimen" : "specimens"}`);
    });
    document.body.insertAdjacentHTML("beforeend", '<div class="fl-toast-region" role="status" aria-live="polite"></div>');
  });

  function enhanceMediaExperience(intro, toolbar) {
    const title = document.querySelector(".fl-pagetitle__h");
    if (title) title.textContent = "Practice home";
    const topbarPage = document.querySelector(".fl-topbar__page");
    if (topbarPage) topbarPage.textContent = "Practice home";
    const status = document.querySelector(".fl-topbar__centre .fl-status");
    if (status?.lastChild) status.lastChild.nodeValue = " Ready to practice";
    const queueButton = document.querySelector('[aria-label="Sort"]');
    if (queueButton) { queueButton.setAttribute("aria-label", "Open practice queue"); queueButton.setAttribute("title", "Open practice queue"); queueButton.addEventListener("click", () => toast("4 exercises in your practice queue")); }
    document.querySelectorAll(".fl-navitem").forEach((item) => {
      const active = item.querySelector(".fl-navitem__label")?.textContent?.trim() === "Today";
      if (active) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current");
    });
    const corner = document.querySelector(".fl-corner");
    if (corner) corner.textContent = "C major · 12 day streak";

    const shelf = document.createElement("section");
    shelf.className = "fl-media-shelf";
    shelf.innerHTML = `
      <div class="fl-media-shelf__head"><div><span class="fl-media-shelf__eyebrow">Pick up where you left off</span><h2>Continue practicing</h2></div><button type="button" class="fl-media-shelf__all">See all <span aria-hidden="true">→</span></button></div>
      <div class="fl-media-rail">
        <button type="button" class="fl-media-card fl-media-card--feature" data-track="Position one · up and back" data-sub="C major · 84 BPM"><span class="fl-media-card__art fl-media-card__art--photo"><span class="fl-media-card__play">▶</span></span><span class="fl-media-card__body"><span class="fl-media-card__kicker">Continue · 68%</span><strong>Position one, up and back</strong><span>Connect six strings without breaking time.</span><i><b style="width:68%"></b></i></span></button>
        <button type="button" class="fl-media-card" data-track="Chord change flow" data-sub="Am · C · G · F"><span class="fl-media-card__art fl-media-card__art--chords"><span class="fl-media-card__glyph">Am</span><span class="fl-media-card__play">▶</span></span><span class="fl-media-card__body"><span class="fl-media-card__kicker">Daily mix · 8 min</span><strong>Chord change flow</strong><span>Clean transitions in the songs you know.</span><i><b style="width:34%"></b></i></span></button>
        <button type="button" class="fl-media-card" data-track="Timing lab" data-sub="Pocket · 92 BPM"><span class="fl-media-card__art fl-media-card__art--time"><span class="fl-media-card__glyph">92</span><span class="fl-media-card__play">▶</span></span><span class="fl-media-card__body"><span class="fl-media-card__kicker">Recommended · 6 min</span><strong>Timing lab</strong><span>Lock eighth notes to a steady pulse.</span><i><b style="width:12%"></b></i></span></button>
        <button type="button" class="fl-media-card" data-track="Hear the chord tones" data-sub="Ear + fretboard"><span class="fl-media-card__art fl-media-card__art--ear"><span class="fl-media-card__glyph">Ⅲ</span><span class="fl-media-card__play">▶</span></span><span class="fl-media-card__body"><span class="fl-media-card__kicker">New for you · 10 min</span><strong>Hear the chord tones</strong><span>Find the third before you see it.</span><i><b style="width:4%"></b></i></span></button>
      </div>`;
    toolbar.before(shelf);

    const player = document.createElement("aside");
    player.className = "fl-player";
    player.setAttribute("aria-label", "Practice player");
    player.innerHTML = `
      <div class="fl-player__track"><span class="fl-player__cover" aria-hidden="true"></span><span class="fl-player__copy"><strong>Position one · up and back</strong><small>C major · 84 BPM</small></span><button type="button" class="fl-player__heart" aria-label="Save exercise" aria-pressed="false">♡</button></div>
      <div class="fl-player__transport">
        <div class="fl-player__buttons"><button type="button" aria-label="Previous exercise">‹</button><button type="button" class="fl-player__play" aria-label="Play exercise" aria-pressed="false">▶</button><button type="button" aria-label="Next exercise">›</button><button type="button" class="fl-player__loop" aria-label="Loop exercise" aria-pressed="true">↻</button></div>
        <div class="fl-player__timeline"><span>0:00</span><input type="range" min="0" max="100" value="0" aria-label="Exercise progress"><span>2:40</span></div>
      </div>
      <div class="fl-player__tools"><button type="button" class="fl-player__tool fl-player__metro" aria-label="Metronome" aria-pressed="true">●</button><div class="fl-player__tempo" role="group" aria-label="Practice tempo"><button type="button" aria-label="Decrease tempo">−</button><output>84 <small>BPM</small></output><button type="button" aria-label="Increase tempo">+</button></div><span class="fl-player__volume">⌁<input type="range" min="0" max="100" value="72" aria-label="Volume"></span></div>`;
    document.body.append(player);

    let playing = false;
    let trackIndex = 0;
    let progressTimer = 0;
    const playButton = player.querySelector(".fl-player__play");
    const progress = player.querySelector('[aria-label="Exercise progress"]');
    const updateTime = () => { player.querySelector(".fl-player__timeline span").textContent = `${Math.floor(Number(progress.value) * 1.6 / 60)}:${String(Math.floor(Number(progress.value) * 1.6 % 60)).padStart(2,"0")}`; };
    const setPlaying = (value) => {
      playing = value; playButton.setAttribute("aria-pressed", String(value)); playButton.setAttribute("aria-label", value ? "Pause exercise" : "Play exercise"); playButton.textContent = value ? "Ⅱ" : "▶"; player.dataset.playing = String(value);
      clearInterval(progressTimer);
      if (value) progressTimer = window.setInterval(() => { const next = Number(progress.value) + .625; progress.value = String(next > 100 ? 0 : next); updateTime(); }, 1000);
    };
    playButton.addEventListener("click", () => setPlaying(!playing));
    player.querySelector(".fl-player__loop").addEventListener("click", (event) => event.currentTarget.setAttribute("aria-pressed", String(event.currentTarget.getAttribute("aria-pressed") !== "true")));
    player.querySelector(".fl-player__metro").addEventListener("click", (event) => event.currentTarget.setAttribute("aria-pressed", String(event.currentTarget.getAttribute("aria-pressed") !== "true")));
    player.querySelector(".fl-player__heart").addEventListener("click", (event) => { const on = event.currentTarget.getAttribute("aria-pressed") !== "true"; event.currentTarget.setAttribute("aria-pressed", String(on)); event.currentTarget.textContent = on ? "♥" : "♡"; });
    const tempoOutput = player.querySelector(".fl-player__tempo output");
    player.querySelectorAll(".fl-player__tempo button").forEach((button, index) => button.addEventListener("click", () => { const bpm = Math.max(40, Math.min(208, Number.parseInt(tempoOutput.textContent) + (index ? 2 : -2))); tempoOutput.innerHTML = `${bpm} <small>BPM</small>`; }));
    const cards = [...shelf.querySelectorAll(".fl-media-card")];
    const activateTrack = (card) => { trackIndex = cards.indexOf(card); progress.value = "0"; updateTime(); player.querySelector(".fl-player__copy strong").textContent = card.dataset.track; player.querySelector(".fl-player__copy small").textContent = card.dataset.sub; setPlaying(true); toast(`Now practicing · ${card.dataset.track}`); };
    cards.forEach((card) => card.addEventListener("click", () => activateTrack(card)));
    player.querySelector('[aria-label="Previous exercise"]').addEventListener("click", () => activateTrack(cards[(trackIndex - 1 + cards.length) % cards.length]));
    player.querySelector('[aria-label="Next exercise"]').addEventListener("click", () => activateTrack(cards[(trackIndex + 1) % cards.length]));
    progress.addEventListener("input", updateTime);
    shelf.querySelector(".fl-media-shelf__all").addEventListener("click", () => document.getElementById("system-content-cards")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
    intro.querySelector(".fl-hero-start")?.addEventListener("click", () => { setPlaying(true); toast("Today’s session started"); });
    intro.querySelector(".fl-hero-browse")?.addEventListener("click", () => document.getElementById("system-content-cards")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
    window.addEventListener("beforeunload", () => clearInterval(progressTimer), { once: true });
  }

  function enhanceTheme() {
    const toggle = document.querySelector('[aria-label="Toggle contrast"]');
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      const root = document.documentElement;
      const high = root.dataset.flContrast !== "high";
      root.dataset.flTheme = "light";
      root.dataset.flContrast = high ? "high" : "soft";
      root.style.colorScheme = "light";
      const highContrastTokens = {
        "--fl-canvas":"#f1f0ec", "--fl-surface":"#ffffff", "--fl-surface-sunk":"#e7e6e1",
        "--fl-line":"#cbc9c2", "--fl-line-soft":"#dfddd7", "--fl-ink":"#0c0b0e",
        "--fl-ink-2":"#34313a", "--fl-ink-3":"#5d5963", "--fl-accent":"#5542dc", "--fl-accent-ink":"#3826ac"
      };
      Object.entries(highContrastTokens).forEach(([key, value]) => high ? root.style.setProperty(key, value) : root.style.removeProperty(key));
      toggle.setAttribute("aria-pressed", String(high));
      toggle.title = high ? "Use softer contrast" : "Use higher contrast";
    });
  }

  function toast(message) {
    const region = document.querySelector(".fl-toast-region");
    if (!region) return;
    const node = document.createElement("div");
    node.className = "fl-toast";
    node.textContent = message;
    region.append(node);
    window.setTimeout(() => node.remove(), 2600);
  }

  function enhanceControlLab(groups) {
    const actions = groups.find(({ name }) => name === "Actions")?.group;
    const grid = actions?.querySelector(":scope > div:nth-child(2)");
    if (!grid) return;
    const specimen = document.createElement("section");
    specimen.className = "fl-specimen-modern";
    specimen.style.cssText = "grid-column:1/-1;border:1px solid var(--fl-line);overflow:hidden;background:var(--fl-surface)";
    specimen.innerHTML = `
      <header style="display:flex;justify-content:space-between;gap:16px;padding:12px 18px;border-bottom:1px solid var(--fl-line-soft)">
        <code style="font-family:var(--fl-font-mono);font-size:13px;color:var(--fl-accent-ink)">&lt;FieldControls / States&gt;</code>
        <span style="font-size:var(--fl-t-small);color:var(--fl-ink-3)">Forms, settings, feedback</span>
      </header>
      <div style="padding:22px;background:var(--fl-canvas)">
        <div class="fl-control-lab">
          <div class="fl-control-lab__block">
            <div class="fl-control-lab__head"><span class="fl-control-lab__title">Input family</span><span class="fl-control-lab__meta">40 px · AA focus</span></div>
            <label class="fl-field"><span class="fl-field__label">Session name</span><input class="fl-field__control" value="C major connections" aria-describedby="session-hint"><span id="session-hint" class="fl-field__hint">Used in practice history and exports.</span></label>
            <div class="fl-control-lab__row">
              <label class="fl-field" style="flex:1"><span class="fl-field__label">Difficulty</span><span class="fl-selectwrap"><select class="fl-field__control fl-field__select"><option>Adaptive</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></span></label>
              <button type="button" class="fl-btn fl-btn--primary fl-save-control">Save setup</button>
            </div>
          </div>
          <div class="fl-control-lab__block">
            <div class="fl-control-lab__head"><span class="fl-control-lab__title">Preference controls</span><span class="fl-control-lab__meta">Persistent state</span></div>
            <label class="fl-switchfield"><span><span class="fl-field__label">Count-in</span><span class="fl-field__hint">One bar before the exercise starts.</span></span><input type="checkbox" role="switch" checked><span class="fl-switch"><span class="fl-switch__thumb"></span></span></label>
            <label class="fl-switchfield"><span><span class="fl-field__label">Haptic accents</span><span class="fl-field__hint">Emphasize the first beat of each bar.</span></span><input type="checkbox" role="switch"><span class="fl-switch"><span class="fl-switch__thumb"></span></span></label>
            <label class="fl-rangefield"><span class="fl-rangefield__head"><span class="fl-field__label">Click volume</span><output>72%</output></span><input type="range" min="0" max="100" value="72"></label>
          </div>
          <div class="fl-control-lab__block" style="grid-column:1/-1">
            <div class="fl-control-lab__head"><span class="fl-control-lab__title">Action state contract</span><span class="fl-control-lab__meta">Visible, named, reversible</span></div>
            <div class="fl-state-row">
              <span class="fl-state-swatch"><small>Primary</small><button type="button" class="fl-btn fl-btn--primary">Start session</button></span>
              <span class="fl-state-swatch"><small>Secondary</small><button type="button" class="fl-btn fl-btn--outline">Tune first</button></span>
              <span class="fl-state-swatch"><small>Quiet</small><button type="button" class="fl-btn fl-btn--quiet">Not now</button></span>
              <span class="fl-state-swatch"><small>Loading</small><button type="button" class="fl-btn fl-btn--primary" aria-busy="true" disabled>Saving <span class="fl-btn__spinner"></span></button></span>
              <span class="fl-state-swatch"><small>Disabled</small><button type="button" class="fl-btn fl-btn--outline" disabled>Continue</button></span>
            </div>
          </div>
        </div>
      </div>`;
    grid.prepend(specimen);
    specimen.querySelector(".fl-save-control")?.addEventListener("click", () => toast("Practice setup saved"));
    specimen.querySelector('input[type="range"]')?.addEventListener("input", (event) => {
      specimen.querySelector(".fl-rangefield output").textContent = `${event.target.value}%`;
    });
  }

  function specimenShell(name, used, body) {
    const specimen = document.createElement("section");
    specimen.className = "fl-specimen-modern fl-production-specimen";
    specimen.innerHTML = `<header><code>&lt;${name}&gt;</code><span>${used}</span></header><div class="fl-production-specimen__body">${body}</div>`;
    return specimen;
  }

  function setupDisclosure(root, toggleSelector, panelSelector) {
    const toggle = root.querySelector(toggleSelector);
    const panel = root.querySelector(panelSelector);
    if (!toggle || !panel) return { close: () => {} };
    const close = () => { panel.dataset.open = "false"; toggle.setAttribute("aria-expanded", "false"); };
    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = panel.dataset.open !== "true";
      panel.dataset.open = String(open); toggle.setAttribute("aria-expanded", String(open));
      if (open) panel.querySelector("button, select, input")?.focus();
    });
    root.addEventListener("keydown", (event) => { if (event.key === "Escape") { close(); toggle.focus(); } });
    document.addEventListener("click", (event) => { if (!root.contains(event.target)) close(); });
    return { close };
  }

  function enhanceActionSystem(groups) {
    const grid = groups.find(({ name }) => name === "Actions")?.group.querySelector(":scope > div:nth-child(2)");
    if (!grid) return;
    const specimen = specimenShell("ActionOrchestrator", "Async state · menus · undo · icon toggle", `
      <div class="fl-action-console">
        <div class="fl-action-console__copy"><span class="fl-micro-label">Session action</span><strong>Ship confidence with every click.</strong><p>Progress, completion and recovery are built into the control—not left to the screen.</p></div>
        <div class="fl-action-console__rail">
          <button type="button" class="fl-btn fl-btn--primary fl-btn--lg fl-async-action"><span class="fl-btn__label">Create practice plan</span><span aria-hidden="true">→</span></button>
          <div class="fl-split" data-open="false">
            <button type="button" class="fl-btn fl-btn--outline fl-split__main">Save routine</button><button type="button" class="fl-btn fl-btn--outline fl-split__toggle" aria-label="More save options" aria-expanded="false">⌄</button>
            <div class="fl-menu" role="menu"><button type="button" role="menuitem"><span>Duplicate routine</span><kbd>⌘D</kbd></button><button type="button" role="menuitem"><span>Schedule for tomorrow</span><kbd>⌘↵</kbd></button><button type="button" role="menuitem"><span>Export session</span><kbd>⇧E</kbd></button></div>
          </div>
          <button type="button" class="fl-iconbtn fl-icon-toggle" aria-label="Save to favorites" aria-pressed="false"><span aria-hidden="true">♡</span></button>
        </div>
        <div class="fl-action-console__status" role="status"><span class="fl-status-orb"></span><span>Ready for input</span><button type="button" class="fl-inline-undo" hidden>Undo</button></div>
      </div>`);
    grid.prepend(specimen);

    const asyncButton = specimen.querySelector(".fl-async-action");
    const status = specimen.querySelector(".fl-action-console__status span:nth-child(2)");
    const undo = specimen.querySelector(".fl-inline-undo");
    let actionTimer = 0;
    asyncButton.addEventListener("click", () => {
      clearTimeout(actionTimer);
      asyncButton.disabled = true; asyncButton.setAttribute("aria-busy", "true"); asyncButton.dataset.state = "loading";
      asyncButton.querySelector(".fl-btn__label").textContent = "Building plan";
      status.textContent = "Connecting your drills…";
      actionTimer = window.setTimeout(() => {
        asyncButton.disabled = false; asyncButton.removeAttribute("aria-busy"); asyncButton.dataset.state = "success";
        asyncButton.querySelector(".fl-btn__label").textContent = "Plan created";
        status.textContent = "18-minute adaptive plan created"; undo.hidden = false;
        toast("Practice plan created");
      }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : 950);
    });
    undo.addEventListener("click", () => {
      asyncButton.dataset.state = "idle"; asyncButton.querySelector(".fl-btn__label").textContent = "Create practice plan";
      status.textContent = "Action undone"; undo.hidden = true; toast("Plan creation undone");
    });
    specimen.querySelector(".fl-icon-toggle").addEventListener("click", (event) => {
      const button = event.currentTarget; const on = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(on)); button.querySelector("span").textContent = on ? "♥" : "♡";
      status.textContent = on ? "Saved to favorites" : "Removed from favorites";
    });
    const split = specimen.querySelector(".fl-split");
    const toggle = split.querySelector(".fl-split__toggle");
    const close = () => { split.dataset.open = "false"; toggle.setAttribute("aria-expanded", "false"); };
    toggle.addEventListener("click", () => { const open = split.dataset.open !== "true"; split.dataset.open = String(open); toggle.setAttribute("aria-expanded", String(open)); if (open) split.querySelector('[role="menuitem"]')?.focus(); });
    split.querySelector(".fl-split__main").addEventListener("click", () => { status.textContent = "Routine saved · just now"; toast("Routine saved"); });
    split.querySelectorAll('[role="menuitem"]').forEach((item) => item.addEventListener("click", () => { status.textContent = item.querySelector("span").textContent; toast(item.querySelector("span").textContent); close(); }));
    split.addEventListener("keydown", (event) => { if (event.key === "Escape") { close(); toggle.focus(); } });
    document.addEventListener("click", (event) => { if (!split.contains(event.target)) close(); });
  }

  function enhancePillSystem(groups) {
    document.querySelectorAll(".fl-pillgroup").forEach((pillGroup) => {
      const buttons = [...pillGroup.querySelectorAll(".fl-pill")];
      const current = Math.max(0, buttons.findIndex((button) => button.getAttribute("aria-pressed") === "true"));
      buttons.forEach((button, index) => {
        button.tabIndex = index === current ? 0 : -1;
        button.addEventListener("click", () => requestAnimationFrame(() => {
          buttons.forEach((item) => { item.setAttribute("aria-pressed", String(item === button)); item.tabIndex = item === button ? 0 : -1; });
        }));
        button.addEventListener("keydown", (event) => {
          const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
          if (!delta && event.key !== "Home" && event.key !== "End") return;
          event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + delta + buttons.length) % buttons.length;
          buttons[next].focus(); buttons[next].click();
        });
      });
    });

    const grid = groups.find(({ name }) => name === "Selectors")?.group.querySelector(":scope > div:nth-child(2)");
    if (!grid) return;
    const specimen = specimenShell("SmartFilterBar", "Multi-select · counts · keyboard · clear", `
      <div class="fl-filterbar">
        <div class="fl-filterbar__head"><div><span class="fl-micro-label">Explore drills</span><strong>Focus your next session</strong></div><div class="fl-filterbar__head-actions"><span class="fl-filterbar__count" aria-live="polite">24 results</span><div class="fl-filter-more"><button type="button" class="fl-filter-more__toggle" aria-expanded="false">More filters <b hidden>0</b> <span aria-hidden="true">⌄</span></button><div class="fl-filter-popover" data-open="false"><header><strong>Refine results</strong><button type="button" class="fl-filter-popover__reset">Reset</button></header><label><span>Session length</span><select class="fl-filter-length"><option value="Any">Any length</option><option value="≤ 5 min">5 minutes or less</option><option value="10 min">Around 10 minutes</option><option value="20+ min">20 minutes or more</option></select></label><label><span>Difficulty</span><select class="fl-filter-level"><option value="Any">Any level</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label class="fl-filter-check"><span><b>Hide completed</b><small>Only show work still in progress</small></span><input type="checkbox" role="switch"></label></div></div></div></div>
        <div class="fl-filterbar__groups">
          <div><span class="fl-filterbar__label">Skill</span><div class="fl-smart-pills" role="group" aria-label="Filter by skill"><button type="button" aria-pressed="true" data-count="24">All</button><button type="button" aria-pressed="false" data-count="8">Fretboard <span>8</span></button><button type="button" aria-pressed="false" data-count="6">Rhythm <span>6</span></button><button type="button" aria-pressed="false" data-count="5">Chords <span>5</span></button><button type="button" aria-pressed="false" data-count="5">Ear <span>5</span></button></div></div>
        </div>
        <div class="fl-filterbar__active"><span>Active filters</span><div class="fl-filterbar__chips"><em>None</em></div><button type="button" class="fl-filterbar__clear" disabled>Clear all</button></div>
      </div>`);
    grid.prepend(specimen);
    const count = specimen.querySelector(".fl-filterbar__count");
    const chips = specimen.querySelector(".fl-filterbar__chips");
    const clear = specimen.querySelector(".fl-filterbar__clear");
    const groupsInBar = [...specimen.querySelectorAll(".fl-smart-pills")];
    const length = specimen.querySelector(".fl-filter-length");
    const level = specimen.querySelector(".fl-filter-level");
    const hideCompleted = specimen.querySelector(".fl-filter-check input");
    const moreBadge = specimen.querySelector(".fl-filter-more__toggle b");
    const render = () => {
      const skill = groupsInBar[0].querySelector('button[aria-pressed="true"]');
      const selected = [];
      const skillLabel = skill?.childNodes[0].textContent.trim(); if (skillLabel && skillLabel !== "All") selected.push({ label: skillLabel, kind: "skill" });
      if (length.value !== "Any") selected.push({ label: length.value, kind: "length" });
      if (level.value !== "Any") selected.push({ label: level.value, kind: "level" });
      if (hideCompleted.checked) selected.push({ label: "Incomplete", kind: "completed" });
      chips.innerHTML = selected.length ? selected.map(({ label, kind }) => `<button type="button" data-kind="${kind}" aria-label="Remove ${label} filter">${label} <span>×</span></button>`).join("") : "<em>None</em>";
      const advancedCount = selected.filter(({ kind }) => kind !== "skill").length; moreBadge.hidden = !advancedCount; moreBadge.textContent = advancedCount;
      const base = Number(skill?.dataset.count || 24); count.textContent = `${Math.max(1, base - advancedCount * 2)} results`;
      clear.disabled = !selected.length;
      chips.querySelectorAll("button").forEach((chip) => chip.addEventListener("click", () => { if (chip.dataset.kind === "skill") groupsInBar[0].querySelector("button")?.click(); if (chip.dataset.kind === "length") length.value = "Any"; if (chip.dataset.kind === "level") level.value = "Any"; if (chip.dataset.kind === "completed") hideCompleted.checked = false; render(); }));
    };
    groupsInBar.forEach((group) => {
      const buttons = [...group.querySelectorAll("button")];
      buttons.forEach((button, index) => {
        button.tabIndex = button.getAttribute("aria-pressed") === "true" ? 0 : -1;
        button.addEventListener("click", () => { buttons.forEach((item) => { item.setAttribute("aria-pressed", String(item === button)); item.tabIndex = item === button ? 0 : -1; }); render(); });
        button.addEventListener("keydown", (event) => { const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0; if (!delta) return; event.preventDefault(); const next = (index + delta + buttons.length) % buttons.length; buttons[next].focus(); buttons[next].click(); });
      });
    });
    [length, level, hideCompleted].forEach((control) => control.addEventListener("change", render));
    specimen.querySelector(".fl-filter-popover__reset").addEventListener("click", () => { length.value = "Any"; level.value = "Any"; hideCompleted.checked = false; render(); });
    clear.addEventListener("click", () => { groupsInBar.forEach((group) => group.querySelector("button").click()); length.value = "Any"; level.value = "Any"; hideCompleted.checked = false; render(); });
    setupDisclosure(specimen.querySelector(".fl-filter-more"), ".fl-filter-more__toggle", ".fl-filter-popover");
  }

  function enhanceLabelSystem(groups) {
    const grid = groups.find(({ name }) => name === "Labels")?.group.querySelector(":scope > div:nth-child(2)");
    if (!grid) return;
    const specimen = specimenShell("ContextLabels", "Removable · live · semantic · compact", `
      <div class="fl-label-lab">
        <div class="fl-label-lab__row"><span class="fl-micro-label">Applied context</span><div class="fl-removable-tags"><span class="fl-rich-tag">C major <button type="button" aria-label="Remove C major">×</button></span><span class="fl-rich-tag">Intermediate <button type="button" aria-label="Remove Intermediate">×</button></span><span class="fl-rich-tag">≤ 10 min <button type="button" aria-label="Remove 10 minutes or less">×</button></span></div></div>
        <div class="fl-label-lab__row"><span class="fl-micro-label">System status</span><div class="fl-semantic-labels"><span class="fl-live-label"><i></i>Listening</span><span class="fl-count-label"><b>4</b> in queue</span><span class="fl-sync-label">✓ Synced now</span><button type="button" class="fl-notification-label" aria-label="Notifications, 3 unread">Updates <b>3</b></button></div></div>
        <p class="fl-label-lab__note" role="status">Labels communicate state before color: every meaning survives grayscale.</p>
      </div>`);
    grid.prepend(specimen);
    specimen.querySelectorAll(".fl-rich-tag button").forEach((button) => button.addEventListener("click", () => { const label = button.parentElement.textContent.replace("×", "").trim(); button.parentElement.remove(); specimen.querySelector(".fl-label-lab__note").textContent = `${label} removed. Filters updated.`; }));
    specimen.querySelector(".fl-notification-label").addEventListener("click", (event) => { event.currentTarget.querySelector("b").textContent = "0"; event.currentTarget.setAttribute("aria-label", "Notifications, none unread"); specimen.querySelector(".fl-label-lab__note").textContent = "All updates marked as read."; });
  }

  function enhanceCardSystem(groups) {
    const grid = groups.find(({ name }) => name === "Content cards")?.group.querySelector(":scope > div:nth-child(2)");
    if (!grid) return;
    const specimen = specimenShell("AdaptivePracticeCard", "Preview · save · menu · progress", `
      <div class="fl-card-deck">
        <article class="fl-practice-card" tabindex="0" data-saved="false">
          <div class="fl-practice-card__visual"><span class="fl-card-kicker">Recommended next</span><span class="fl-card-degree">Ⅰ → Ⅲ → Ⅴ</span><button type="button" class="fl-card-save" aria-label="Save chord tone pathways" aria-pressed="false">♡</button><button type="button" class="fl-card-play" aria-label="Start chord tone pathways">▶</button></div>
          <div class="fl-practice-card__body"><div class="fl-practice-card__meta"><span>Fretboard</span><span>8 min</span><span>84 BPM</span></div><h3>Chord-tone pathways</h3><p>Hear each function, then connect it across three positions.</p><div class="fl-card-progress"><span><b style="width:42%"></b></span><em>42%</em></div><div class="fl-card-footer"><span class="fl-avatar-stack"><i>C</i><i>3</i></span><small>Continues your C major path</small><button type="button" class="fl-card-more" aria-label="More card actions">•••</button></div></div>
          <div class="fl-card-menu" role="menu"><button type="button" role="menuitem">Add to queue</button><button type="button" role="menuitem">Practice later</button><button type="button" role="menuitem">Hide suggestion</button></div>
        </article>
        <aside class="fl-card-detail" aria-live="polite"><span class="fl-micro-label">Card state</span><strong>Ready to continue</strong><p>Controls stay reachable with keyboard or pointer, while the whole card remains scannable.</p><div><span>Last session</span><b>2 days ago</b></div><div><span>Best clean tempo</span><b>76 BPM</b></div></aside>
      </div>`);
    grid.prepend(specimen);
    const card = specimen.querySelector(".fl-practice-card");
    const detail = specimen.querySelector(".fl-card-detail strong");
    const save = specimen.querySelector(".fl-card-save");
    save.addEventListener("click", (event) => { event.stopPropagation(); const on = save.getAttribute("aria-pressed") !== "true"; save.setAttribute("aria-pressed", String(on)); save.textContent = on ? "♥" : "♡"; card.dataset.saved = String(on); detail.textContent = on ? "Saved to your library" : "Removed from library"; });
    specimen.querySelector(".fl-card-play").addEventListener("click", (event) => { event.stopPropagation(); document.querySelector(".fl-hero-start")?.click(); detail.textContent = "Practice started"; });
    const more = specimen.querySelector(".fl-card-more");
    const menu = specimen.querySelector(".fl-card-menu");
    more.addEventListener("click", (event) => { event.stopPropagation(); const open = menu.dataset.open !== "true"; menu.dataset.open = String(open); if (open) menu.querySelector("button")?.focus(); });
    menu.querySelectorAll("button").forEach((button) => button.addEventListener("click", (event) => { event.stopPropagation(); detail.textContent = button.textContent; toast(button.textContent); menu.dataset.open = "false"; }));
    card.addEventListener("keydown", (event) => { if ((event.key === "Enter" || event.key === " ") && event.target === card) { event.preventDefault(); specimen.querySelector(".fl-card-play").click(); } if (event.key === "Escape") { menu.dataset.open = "false"; more.focus(); } });
  }

  function enhanceFretboardStudio(groups) {
    const grid = groups.find(({ name }) => name === "Fretboard")?.group.querySelector(":scope > div:nth-child(2)");
    const source = grid?.querySelector(".fl-neck__svg");
    if (!grid || !source) return;
    const specimen = specimenShell("FretboardStudio", "Guided path · note inspector · view controls", `
      <div class="fl-board-studio">
        <div class="fl-board-toolbar">
          <div class="fl-board-toolbar__main"><button type="button" class="fl-board-play" aria-pressed="false"><span aria-hidden="true">▶</span> Play path</button><div class="fl-board-view" role="group" aria-label="Marker labels"><button type="button" aria-pressed="true" data-view="notes">Notes</button><button type="button" aria-pressed="false" data-view="intervals">Intervals</button></div></div>
          <div class="fl-board-toolbar__tools"><label>Key <select class="fl-board-key" aria-label="Fretboard key"><option>C</option><option>D♭</option><option>D</option><option>E♭</option><option>E</option><option>F</option><option>F♯</option><option>G</option><option>A♭</option><option>A</option><option>B♭</option><option>B</option></select></label><div class="fl-board-options"><button type="button" class="fl-board-options__toggle" aria-expanded="false" aria-label="Open fretboard options">Options <span aria-hidden="true">⌄</span></button><div class="fl-board-options__menu" data-open="false"><header><strong>Fretboard display</strong><small>Less-used controls</small></header><button type="button" class="fl-board-root" aria-pressed="false"><span>Root notes only</span><i></i></button><button type="button" class="fl-board-frets" aria-pressed="true"><span>Fret numbers</span><i></i></button><button type="button" class="fl-board-inlays" aria-pressed="true"><span>Position markers</span><i></i></button></div></div></div>
        </div>
        <div class="fl-board-canvas"><div class="fl-board-canvas__glow"></div></div>
        <div class="fl-board-inspector"><span><small>Selected note</small><strong class="fl-board-inspector__note">C</strong></span><span><small>Function</small><strong class="fl-board-inspector__function">Root · I</strong></span><span><small>Position</small><strong class="fl-board-inspector__position">String 1 · fret 0</strong></span><div class="fl-board-strings" role="group" aria-label="Audible strings">${[1,2,3,4,5,6].map((value) => `<button type="button" aria-pressed="true" aria-label="Toggle string ${value}">${value}</button>`).join("")}</div></div>
      </div>`);
    grid.prepend(specimen);
    const canvas = specimen.querySelector(".fl-board-canvas");
    const svg = source.cloneNode(true); svg.removeAttribute("style"); svg.classList.add("fl-board-canvas__svg"); canvas.append(svg);
    [...svg.querySelectorAll(":scope > text")].filter((node) => /^\d+$/.test(node.textContent.trim())).forEach((node) => node.dataset.fretNumber = "true");
    svg.querySelectorAll(":scope > circle").forEach((node) => node.dataset.inlay = "true");
    const markers = [...svg.querySelectorAll(":scope > g")];
    const notes = ["C", "D", "E", "F", "G", "A", "B"];
    const intervals = ["1", "2", "3", "4", "5", "6", "7"];
    markers.forEach((marker, index) => { marker.dataset.index = index; marker.tabIndex = 0; marker.setAttribute("role", "button"); marker.setAttribute("aria-label", `Select ${marker.querySelector("text")?.textContent || "note"} marker ${index + 1}`); });
    let active = 0; let pathTimer = 0; let view = "notes"; let rootOnly = false;
    const noteOutput = specimen.querySelector(".fl-board-inspector__note");
    const functionOutput = specimen.querySelector(".fl-board-inspector__function");
    const positionOutput = specimen.querySelector(".fl-board-inspector__position");
    const renderMarker = (index, announce = false) => {
      active = (index + markers.length) % markers.length;
      markers.forEach((marker, markerIndex) => marker.dataset.active = String(markerIndex === active));
      const marker = markers[active]; const label = marker.querySelector("text")?.textContent || notes[active % notes.length];
      const shape = marker.querySelector("circle, rect"); const x = shape?.getAttribute("cx") || shape?.getAttribute("x") || "0"; const y = shape?.getAttribute("cy") || shape?.getAttribute("y") || "0";
      noteOutput.textContent = label; functionOutput.textContent = `${intervals[active % intervals.length]} · ${active % 2 ? "Scale tone" : "Target tone"}`; positionOutput.textContent = `Marker ${active + 1} · x ${Math.round(Number(x))} · y ${Math.round(Number(y))}`;
      if (announce) toast(`${label} selected on the fretboard`);
    };
    markers.forEach((marker, index) => { marker.addEventListener("click", () => renderMarker(index)); marker.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); renderMarker(index, true); } if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); const next = index + (event.key === "ArrowRight" ? 1 : -1); markers[(next + markers.length) % markers.length].focus(); renderMarker(next); } }); });
    const play = specimen.querySelector(".fl-board-play");
    const stopPath = () => { clearInterval(pathTimer); pathTimer = 0; play.setAttribute("aria-pressed", "false"); play.innerHTML = '<span aria-hidden="true">▶</span> Play path'; };
    play.addEventListener("click", () => { if (pathTimer) { stopPath(); return; } play.setAttribute("aria-pressed", "true"); play.innerHTML = '<span aria-hidden="true">Ⅱ</span> Pause path'; renderMarker(active); pathTimer = window.setInterval(() => renderMarker(active + 1), matchMedia("(prefers-reduced-motion: reduce)").matches ? 900 : 420); });
    specimen.querySelectorAll(".fl-board-view button").forEach((button) => button.addEventListener("click", () => { view = button.dataset.view; specimen.querySelectorAll(".fl-board-view button").forEach((item) => item.setAttribute("aria-pressed", String(item === button))); markers.forEach((marker, index) => { const textNode = marker.querySelector("text"); if (textNode) textNode.textContent = view === "notes" ? notes[index % notes.length] : intervals[index % intervals.length]; }); renderMarker(active); }));
    specimen.querySelector(".fl-board-key").addEventListener("change", (event) => { const keyIndex = event.target.selectedIndex; markers.forEach((marker, index) => { const textNode = marker.querySelector("text"); if (textNode && view === "notes") textNode.textContent = ["C","D♭","D","E♭","E","F","F♯","G","A♭","A","B♭","B"][(keyIndex + index * 2) % 12]; }); canvas.style.setProperty("--fl-board-hue", String((keyIndex * 29 + 258) % 360)); renderMarker(active); });
    specimen.querySelector(".fl-board-root").addEventListener("click", (event) => { rootOnly = !rootOnly; event.currentTarget.setAttribute("aria-pressed", String(rootOnly)); markers.forEach((marker, index) => marker.dataset.hidden = String(rootOnly && index % 7 !== 0)); });
    specimen.querySelector(".fl-board-frets").addEventListener("click", (event) => { const on = event.currentTarget.getAttribute("aria-pressed") !== "true"; event.currentTarget.setAttribute("aria-pressed", String(on)); svg.dataset.fretNumbers = String(on); });
    specimen.querySelector(".fl-board-inlays").addEventListener("click", (event) => { const on = event.currentTarget.getAttribute("aria-pressed") !== "true"; event.currentTarget.setAttribute("aria-pressed", String(on)); svg.dataset.inlays = String(on); });
    setupDisclosure(specimen.querySelector(".fl-board-options"), ".fl-board-options__toggle", ".fl-board-options__menu");
    specimen.querySelectorAll(".fl-board-strings button").forEach((button) => button.addEventListener("click", () => { const on = button.getAttribute("aria-pressed") !== "true"; button.setAttribute("aria-pressed", String(on)); positionOutput.textContent = on ? `String ${button.textContent} audible` : `String ${button.textContent} muted`; }));
    renderMarker(0);
    window.addEventListener("beforeunload", stopPath, { once: true });
  }

  function enhanceProgressHeatmap(groups) {
    const grid = groups.find(({ name }) => name === "Progress")?.group.querySelector(":scope > div:nth-child(2)");
    if (!grid) return;
    const today = new Date(2026, 8, 12); const start = new Date(today); start.setDate(today.getDate() - 90);
    const cells = []; const monthStarts = [];
    for (let i = 0; i < 91; i += 1) {
      const date = new Date(start); date.setDate(start.getDate() + i);
      const weekday = (date.getDay() + 6) % 7; const week = Math.floor(i / 7);
      const seed = (i * 17 + i * i * 3 + date.getMonth() * 11) % 37;
      const minutes = seed < 9 || date.getDay() === 0 && i % 3 ? 0 : 6 + (seed % 31);
      if (date.getDate() === 1 || i === 0) monthStarts.push({ label: date.toLocaleString("en-US", { month: "short" }), week });
      cells.push({ date, weekday, week, minutes });
    }
    const total = cells.reduce((sum, cell) => sum + cell.minutes, 0); const sessions = cells.filter((cell) => cell.minutes > 0).length;
    const specimen = specimenShell("ProgressHeatmap", "3 months · 13 weeks · daily detail", `
      <div class="fl-progress-pro">
        <div class="fl-progress-pro__head"><div><span class="fl-micro-label">Last 3 months</span><strong>Consistency is becoming a habit.</strong><p>${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p></div><div class="fl-progress-summary"><span><b>${Math.round(total / 60)}h</b><small>practice</small></span><span><b>${sessions}</b><small>sessions</small></span><span><b>12</b><small>day streak</small></span><span class="fl-progress-summary__up"><b>+18%</b><small>vs prior period</small></span></div></div>
        <div class="fl-heatmap-scroll"><div class="fl-heatmap-pro" style="--fl-weeks:13"><div class="fl-heatmap-pro__months">${monthStarts.map(({ label, week }) => `<span style="grid-column:${week + 1}">${label}</span>`).join("")}</div><div class="fl-heatmap-pro__body"><div class="fl-heatmap-pro__days">${["M","T","W","T","F","S","S"].map((day) => `<span>${day}</span>`).join("")}</div><div class="fl-heatmap-pro__grid" role="grid" aria-label="Practice activity for the last three months">${cells.map((cell, index) => `<button type="button" role="gridcell" style="--fl-level:${Math.min(4, Math.ceil(cell.minutes / 9))};grid-column:${cell.week + 1};grid-row:${cell.weekday + 1}" data-index="${index}" data-week="${cell.week}" data-day="${cell.weekday}" data-minutes="${cell.minutes}" data-date="${cell.date.toISOString().slice(0,10)}" aria-label="${cell.date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}: ${cell.minutes} minutes" aria-selected="false"></button>`).join("")}</div></div></div></div>
        <div class="fl-progress-detail" aria-live="polite"><span class="fl-progress-detail__date">Select a day</span><strong class="fl-progress-detail__value">Explore 91 days of practice</strong><span class="fl-progress-detail__note">Arrow keys move across days. Enter opens the selected session.</span><div class="fl-progress-legend"><span>Less</span>${[0,1,2,3,4].map((level) => `<i style="--fl-level:${level}"></i>`).join("")}<span>More</span></div></div>
      </div>`);
    grid.prepend(specimen);
    const buttons = [...specimen.querySelectorAll(".fl-heatmap-pro__grid button")];
    const dateOutput = specimen.querySelector(".fl-progress-detail__date"); const valueOutput = specimen.querySelector(".fl-progress-detail__value"); const noteOutput = specimen.querySelector(".fl-progress-detail__note");
    const select = (index, focus = false) => { const bounded = Math.max(0, Math.min(buttons.length - 1, index)); const button = buttons[bounded]; buttons.forEach((item) => { item.setAttribute("aria-selected", String(item === button)); item.tabIndex = item === button ? 0 : -1; }); const date = new Date(`${button.dataset.date}T12:00:00`); dateOutput.textContent = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }); valueOutput.textContent = Number(button.dataset.minutes) ? `${button.dataset.minutes} minutes practiced` : "Rest day"; noteOutput.textContent = Number(button.dataset.minutes) >= 25 ? "Deep-work session · strongest intensity" : Number(button.dataset.minutes) ? "Focused practice session" : "Recovery supports consistency too."; if (focus) button.focus(); };
    buttons.forEach((button, index) => { button.tabIndex = index === buttons.length - 1 ? 0 : -1; button.addEventListener("click", () => select(index)); button.addEventListener("keydown", (event) => { const move = { ArrowRight: 7, ArrowLeft: -7, ArrowDown: 1, ArrowUp: -1 }[event.key]; if (!move) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toast(`${button.dataset.minutes} practice minutes opened`); } return; } event.preventDefault(); select(index + move, true); }); });
    select(buttons.length - 1);
  }

  function enhanceTuner(groups) {
    const tunerGroup = groups.find(({ name }) => name === "Tuner")?.group;
    const grid = tunerGroup?.querySelector(":scope > div:nth-child(2)");
    if (!grid) return;
    const specimen = document.createElement("section");
    specimen.className = "fl-specimen-modern";
    specimen.style.cssText = "grid-column:1/-1;border:1px solid var(--fl-line);overflow:hidden;background:var(--fl-surface)";
    specimen.innerHTML = `
      <header style="display:flex;justify-content:space-between;gap:16px;padding:12px 18px;border-bottom:1px solid var(--fl-line-soft)">
        <code style="font-family:var(--fl-font-mono);font-size:13px;color:var(--fl-accent-ink)">&lt;TunerPro&gt;</code>
        <span style="font-size:var(--fl-t-small);color:var(--fl-ink-3)">Live input · confidence · calibration</span>
      </header>
      <div style="padding:22px;background:var(--fl-canvas)">
        <section class="fl-tuner" data-listening="false" data-intune="false" style="--fl-cents:-14;--fl-signal:.25" aria-label="Professional guitar tuner">
          <div class="fl-tuner__chrome">
            <div class="fl-tuner__modes" role="group" aria-label="Input source"><button type="button" class="fl-tuner__mode" data-mode="demo" aria-pressed="true">Demo signal</button><button type="button" class="fl-tuner__mode" data-mode="live" aria-pressed="false">Microphone</button></div>
            <label><span class="fl-tuner__eyebrow" style="position:absolute;clip:rect(0 0 0 0)">Tuning preset</span><select class="fl-tuner__preset" aria-label="Tuning preset"><option value="standard">Standard · E A D G B E</option><option value="drop-d">Drop D · D A D G B E</option><option value="dadgad">DADGAD · D A D G A D</option><option value="half-step">Half step down</option></select></label>
          </div>
          <div class="fl-tuner__body">
            <div class="fl-tuner__head"><div><div class="fl-tuner__eyebrow">Targeted chromatic tuner</div><h3 class="fl-tuner__title">Standard tuning</h3></div><span class="fl-tuner__status" role="status"><span class="fl-tuner__status-dot"></span><span class="fl-tuner__status-text">Ready</span></span></div>
            <div class="fl-tuner__stage">
              <span class="fl-tuner__direction fl-tuner__direction--flat">Flat</span><span class="fl-tuner__direction fl-tuner__direction--sharp">Sharp</span>
              <div class="fl-tuner__meter"><div class="fl-tuner__arc"><span class="fl-tuner__sweet"></span></div><span class="fl-tuner__needle"></span></div>
              <div class="fl-tuner__readout" aria-live="polite"><div><span class="fl-tuner__note">E</span><span class="fl-tuner__octave">2</span></div><div class="fl-tuner__cents">−14 cents</div><div class="fl-tuner__frequency">81.75 Hz</div></div>
              <svg class="fl-tuner__trace" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><polyline points="0,24 20,23 40,25 60,22 80,24 100,23"></polyline></svg>
            </div>
            <div class="fl-tuner__signal"><span>Input</span><span class="fl-tuner__signal-bars">${Array.from({ length: 18 }, () => "<i></i>").join("")}</span><span class="fl-tuner__signal-label">Good</span></div>
            <div class="fl-tuner__strings" role="group" aria-label="Target string">
              ${[6,5,4,3,2,1].map((number, index) => `<button type="button" class="fl-tuner__string" aria-pressed="${index === 0}" data-midi="${[40,45,50,55,59,64][index]}"><span class="fl-tuner__string-status">✓</span><span class="fl-tuner__string-note">${["E","A","D","G","B","E"][index]}</span><small>${number}</small></button>`).join("")}
            </div>
            <div class="fl-tuner__telemetry" aria-label="Input diagnostics">
              <div class="fl-tuner__metric"><span class="fl-tuner__metric-label">Input</span><span class="fl-tuner__metric-value fl-tuner__input-value">Demo signal</span></div>
              <div class="fl-tuner__metric"><span class="fl-tuner__metric-label">Confidence</span><span class="fl-tuner__metric-value fl-tuner__confidence">—</span></div>
              <div class="fl-tuner__metric"><span class="fl-tuner__metric-label">Stability</span><span class="fl-tuner__metric-value fl-tuner__stability">Waiting</span></div>
            </div>
            <div class="fl-tuner__foot"><div class="fl-tuner__reference" role="group" aria-label="Reference pitch"><button type="button" class="fl-tuner__ref-btn" data-delta="-1" aria-label="Lower reference pitch">−</button><span>A4 = <b>440</b> Hz</span><button type="button" class="fl-tuner__ref-btn" data-delta="1" aria-label="Raise reference pitch">+</button></div><button type="button" class="fl-btn fl-btn--primary fl-tuner__start">Start demo</button></div>
            <p class="fl-tuner__alert" role="alert"></p>
            <p class="fl-tuner__hint">Microphone audio is analysed locally, never uploaded or stored.</p>
          </div>
        </section>
      </div>`;
    grid.prepend(specimen);

    const tuner = specimen.querySelector(".fl-tuner");
    const telemetry = tuner.querySelector(".fl-tuner__telemetry");
    const diagnostics = document.createElement("details");
    diagnostics.className = "fl-tuner__diagnostics";
    diagnostics.innerHTML = '<summary><span>Input diagnostics</span><small>Signal, confidence and stability</small><i aria-hidden="true">⌄</i></summary>';
    telemetry.before(diagnostics); diagnostics.append(telemetry);
    const start = tuner.querySelector(".fl-tuner__start");
    const modeButtons = [...tuner.querySelectorAll(".fl-tuner__mode")];
    const stringButtons = [...tuner.querySelectorAll(".fl-tuner__string")];
    const signalBars = [...tuner.querySelectorAll(".fl-tuner__signal-bars i")];
    const trace = tuner.querySelector(".fl-tuner__trace polyline");
    const presets = {
      standard: [40, 45, 50, 55, 59, 64],
      "drop-d": [38, 45, 50, 55, 59, 64],
      dadgad: [38, 45, 50, 55, 57, 62],
      "half-step": [39, 44, 49, 54, 58, 63]
    };
    const noteNames = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
    let mode = "demo";
    let timer = 0;
    let frame = 0;
    let stream;
    let audioContext;
    let analyser;
    let cents = -14;
    let signal = .25;
    let confidence = 0;
    let stableFrames = 0;
    let history = Array(32).fill(-14);

    const midiDetails = (midi) => ({ note: noteNames[(midi % 12 + 12) % 12], octave: Math.floor(midi / 12) - 1 });
    const targetFrequency = (midi) => Number(tuner.querySelector(".fl-tuner__reference b").textContent) * Math.pow(2, (midi - 69) / 12);
    const selectedString = () => stringButtons.find((button) => button.getAttribute("aria-pressed") === "true") ?? stringButtons[0];
    const render = (detectedFrequency, detectedMidi) => {
      cents = Math.max(-50, Math.min(50, cents));
      tuner.style.setProperty("--fl-cents", cents.toFixed(2));
      tuner.style.setProperty("--fl-signal", signal.toFixed(2));
      const target = selectedString();
      const midi = detectedMidi ?? Number(target.dataset.midi);
      const pitchMatches = detectedMidi === undefined || midi === Number(target.dataset.midi);
      const inTune = Math.abs(cents) <= 5 && pitchMatches && confidence >= .55;
      tuner.dataset.intune = String(inTune);
      tuner.querySelector(".fl-tuner__cents").textContent = inTune ? "In tune" : pitchMatches ? `${cents > 0 ? "+" : "−"}${Math.abs(Math.round(cents))} cents` : "Wrong string";
      const details = midiDetails(midi);
      const frequency = detectedFrequency ?? targetFrequency(Number(target.dataset.midi)) * Math.pow(2, cents / 1200);
      tuner.querySelector(".fl-tuner__note").textContent = details.note;
      tuner.querySelector(".fl-tuner__octave").textContent = details.octave;
      tuner.querySelector(".fl-tuner__frequency").textContent = `${frequency.toFixed(2)} Hz`;
      tuner.querySelector(".fl-tuner__confidence").textContent = confidence ? `${Math.round(confidence * 100)}%` : "—";
      tuner.querySelector(".fl-tuner__signal-label").textContent = signal < .08 ? "Low" : signal > .72 ? "Hot" : "Good";
      signalBars.forEach((bar, index) => {
        const on = index / signalBars.length < signal;
        bar.style.opacity = on ? String(.34 + index / signalBars.length * .66) : ".12";
        bar.style.transform = `scaleY(${on ? .45 + index / signalBars.length * .55 : .28})`;
      });
      history.push(cents); history = history.slice(-32);
      trace.setAttribute("points", history.map((value, index) => `${index / (history.length - 1) * 100},${20 - value / 50 * 16}`).join(" "));
      if (inTune && confidence >= .72) stableFrames += 1; else stableFrames = 0;
      const stability = tuner.querySelector(".fl-tuner__stability");
      stability.textContent = stableFrames > 10 ? "Locked" : confidence ? (Math.abs(cents) < 12 ? "Settling" : "Tracking") : "Waiting";
      if (stableFrames === 11) {
        target.dataset.tuned = "true";
        toast(`${details.note}${details.octave} locked in tune`);
      }
    };

    const stop = async () => {
      clearInterval(timer); cancelAnimationFrame(frame); timer = 0; frame = 0;
      stream?.getTracks().forEach((track) => track.stop()); stream = undefined;
      if (audioContext && audioContext.state !== "closed") await audioContext.close();
      audioContext = undefined; analyser = undefined;
      tuner.dataset.listening = "false";
      tuner.querySelector(".fl-tuner__status-text").textContent = "Ready";
      start.textContent = mode === "live" ? "Start microphone" : "Start demo";
    };

    const startDemo = () => {
      tuner.dataset.listening = "true"; confidence = .91; signal = .54;
      tuner.querySelector(".fl-tuner__status-text").textContent = "Tracking demo";
      start.textContent = "Stop tuning";
      timer = window.setInterval(() => {
        cents += (0 - cents) * .14 + (Math.random() - .5) * 2.4;
        if (Math.abs(cents) < 1.3) cents += (Math.random() - .5) * 1.6;
        signal = .46 + Math.random() * .18; confidence = .88 + Math.random() * .09;
        render();
      }, 150);
    };

    const detectPitch = (buffer, sampleRate) => {
      let rms = 0;
      for (const sample of buffer) rms += sample * sample;
      rms = Math.sqrt(rms / buffer.length);
      if (rms < .008) return { rms, frequency: 0, confidence: 0 };
      const minLag = Math.floor(sampleRate / 1100);
      const maxLag = Math.min(buffer.length - 2, Math.floor(sampleRate / 55));
      let bestLag = 0, best = 0;
      for (let lag = minLag; lag <= maxLag; lag += 1) {
        let corr = 0, a = 0, b = 0;
        for (let i = 0; i < buffer.length - lag; i += 1) {
          corr += buffer[i] * buffer[i + lag]; a += buffer[i] ** 2; b += buffer[i + lag] ** 2;
        }
        corr /= Math.sqrt(a * b) || 1;
        if (corr > best) { best = corr; bestLag = lag; }
      }
      return { rms, frequency: best > .55 ? sampleRate / bestLag : 0, confidence: best };
    };

    const startLive = async () => {
      const alert = tuner.querySelector(".fl-tuner__alert");
      alert.dataset.visible = "false";
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone input requires localhost or a secure HTTPS page.");
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false });
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser(); analyser.fftSize = 2048; analyser.smoothingTimeConstant = .15;
        audioContext.createMediaStreamSource(stream).connect(analyser);
        const buffer = new Float32Array(analyser.fftSize);
        tuner.dataset.listening = "true"; start.textContent = "Stop tuning";
        tuner.querySelector(".fl-tuner__status-text").textContent = "Listening";
        tuner.querySelector(".fl-tuner__input-value").textContent = stream.getAudioTracks()[0]?.label || "Microphone";
        let skip = false;
        const analyse = () => {
          frame = requestAnimationFrame(analyse); skip = !skip; if (skip) return;
          analyser.getFloatTimeDomainData(buffer);
          const result = detectPitch(buffer, audioContext.sampleRate);
          signal = Math.min(1, result.rms * 9); confidence = Math.max(0, Math.min(1, result.confidence));
          if (!result.frequency) { render(); return; }
          const rawMidi = 69 + 12 * Math.log2(result.frequency / Number(tuner.querySelector(".fl-tuner__reference b").textContent));
          const nearestMidi = Math.round(rawMidi);
          cents = (rawMidi - nearestMidi) * 100;
          render(result.frequency, nearestMidi);
        };
        analyse();
      } catch (error) {
        await stop();
        alert.textContent = error?.message || "Microphone input could not be started. Check browser permission and try again.";
        alert.dataset.visible = "true";
      }
    };

    start.addEventListener("click", async () => tuner.dataset.listening === "true" ? stop() : (mode === "live" ? startLive() : startDemo()));
    modeButtons.forEach((button) => button.addEventListener("click", async () => {
      await stop(); mode = button.dataset.mode;
      modeButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      tuner.querySelector(".fl-tuner__input-value").textContent = mode === "live" ? "Microphone" : "Demo signal";
      start.textContent = mode === "live" ? "Start microphone" : "Start demo";
    }));
    stringButtons.forEach((button) => button.addEventListener("click", () => {
      stringButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      cents = (Math.random() - .5) * 34; stableFrames = 0; confidence = mode === "demo" ? .91 : confidence;
      render();
    }));
    tuner.querySelector(".fl-tuner__preset").addEventListener("change", (event) => {
      const values = presets[event.target.value];
      stringButtons.forEach((button, index) => {
        const midi = values[index]; const details = midiDetails(midi); button.dataset.midi = midi; button.dataset.tuned = "false";
        button.querySelector(".fl-tuner__string-note").textContent = details.note;
      });
      tuner.querySelector(".fl-tuner__title").textContent = event.target.options[event.target.selectedIndex].textContent.split(" · ")[0];
      cents = -11; stableFrames = 0; render();
    });
    tuner.querySelectorAll(".fl-tuner__ref-btn").forEach((button) => button.addEventListener("click", () => {
      const value = tuner.querySelector(".fl-tuner__reference b");
      value.textContent = String(Math.max(430, Math.min(450, Number(value.textContent) + Number(button.dataset.delta))));
      render();
    }));
    render();
    window.addEventListener("beforeunload", stop, { once: true });
  }

  function enhanceStringRows() {
    document.querySelectorAll(".fl-stringrow").forEach((row) => {
      row.setAttribute("role", "button"); row.tabIndex = 0;
      const activate = () => {
        row.parentElement?.querySelectorAll(".fl-stringrow").forEach((item) => item.classList.remove("fl-stringrow--active"));
        row.classList.add("fl-stringrow--active");
        window.setTimeout(() => row.classList.remove("fl-stringrow--active"), 1100);
      };
      row.addEventListener("click", activate);
      row.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); } });
    });
  }

  function enhanceMetronome() {
    const metro = document.querySelector(".fl-metro");
    if (!metro) return;
    const buttons = [...metro.querySelectorAll("button")];
    const toggle = buttons.find((button) => /start click|stop click/i.test(button.textContent));
    const tap = buttons.find((button) => button.textContent.trim() === "Tap");
    const range = metro.querySelector('input[type="range"]');
    let tickTimer = 0;
    let running = false;
    let beat = 0;
    let taps = [];
    const beatDots = [...metro.querySelectorAll("svg circle")].slice(1, 5);
    const dispatchRange = (value) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      setter.call(range, String(value));
      range.dispatchEvent(new Event("change", { bubbles: true }));
      range.dispatchEvent(new Event("input", { bubbles: true }));
    };
    const run = () => {
      clearInterval(tickTimer);
      if (!running) return;
      const tick = () => {
        beatDots.forEach((dot, index) => { dot.setAttribute("r", index === beat ? "5.5" : "3.5"); dot.setAttribute("fill", index === beat ? "var(--fl-accent)" : "var(--fl-accent-line)"); });
        beat = (beat + 1) % beatDots.length;
      };
      tick(); tickTimer = window.setInterval(tick, 60000 / Number(range.value));
    };
    toggle?.addEventListener("click", () => { running = !running; metro.dataset.running = String(running); metro.style.setProperty("--fl-beat-duration", `${60000 / Number(range.value)}ms`); run(); });
    range?.addEventListener("input", () => { metro.style.setProperty("--fl-beat-duration", `${60000 / Number(range.value)}ms`); run(); });
    tap?.addEventListener("click", () => {
      const now = performance.now(); taps = taps.filter((time) => now - time < 2200); taps.push(now);
      if (taps.length > 1) {
        const intervals = taps.slice(1).map((time, index) => time - taps[index]);
        dispatchRange(Math.max(40, Math.min(208, Math.round(60000 / (intervals.reduce((a, b) => a + b, 0) / intervals.length)))));
      }
    });
  }
})();
