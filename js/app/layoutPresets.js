(() => {
  "use strict";

  const ACTIVE_KEY = "foxbodyDash.activePreset";
  const RUNTIME_KEY = "foxbodyDash.studio.v7";
  const PRESET_PREFIX = "foxbodyDash.preset.";
  const DEFAULT_PRESET = "dash1";
  const PRESETS = ["dash1", "dash2"];
  const LEGACY_KEYS = [
    "foxbodyDash.studio.v6",
    "foxbodyDash.studio.v4",
    "foxbodyDash.studio.v3",
    "foxbodyDash.studio.v2",
  ];

  const presetKey = preset => `${PRESET_PREFIX}${preset}`;
  const buttonFor = preset => document.querySelector(`[data-dash-preset="${preset}"]`);

  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn("Dash preset save failed", error);
      return false;
    }
  }

  function hasLayout(raw) {
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.items);
    } catch (_) {
      return false;
    }
  }

  function activePreset() {
    const active = read(ACTIVE_KEY);
    return PRESETS.includes(active) ? active : DEFAULT_PRESET;
  }

  function currentLayout() {
    return read(RUNTIME_KEY);
  }

  function fallbackLayout(targetPreset) {
    const current = currentLayout();
    if (hasLayout(current)) return current;

    if (targetPreset === "dash2") {
      for (const key of LEGACY_KEYS) {
        const raw = read(key);
        if (hasLayout(raw)) return raw;
      }
    }

    return null;
  }

  function ensurePresetStorage() {
    const active = activePreset();
    const current = currentLayout();

    if (hasLayout(current) && !hasLayout(read(presetKey(active)))) {
      write(presetKey(active), current);
    }

    if (!read(ACTIVE_KEY)) write(ACTIVE_KEY, active);
  }

  function saveCurrentToActivePreset() {
    const current = currentLayout();
    if (!hasLayout(current)) return;
    write(presetKey(activePreset()), current);
  }

  function setActiveButton() {
    const active = activePreset();
    PRESETS.forEach(preset => {
      const button = buttonFor(preset);
      if (!button) return;
      button.classList.toggle("active", preset === active);
      button.setAttribute("aria-pressed", preset === active ? "true" : "false");
    });
  }

  function switchPreset(targetPreset) {
    if (!PRESETS.includes(targetPreset)) return;

    const active = activePreset();
    if (targetPreset === active) return;

    saveCurrentToActivePreset();

    let targetLayout = read(presetKey(targetPreset));
    if (!hasLayout(targetLayout)) {
      targetLayout = fallbackLayout(targetPreset);
      if (!hasLayout(targetLayout)) targetLayout = currentLayout();
      if (hasLayout(targetLayout)) write(presetKey(targetPreset), targetLayout);
    }

    if (hasLayout(targetLayout)) write(RUNTIME_KEY, targetLayout);
    write(ACTIVE_KEY, targetPreset);
    setActiveButton();
    location.reload();
  }

  function init() {
    ensurePresetStorage();
    setActiveButton();

    PRESETS.forEach(preset => {
      const button = buttonFor(preset);
      if (!button) return;
      button.addEventListener("click", () => switchPreset(preset));
    });

    window.addEventListener("beforeunload", saveCurrentToActivePreset);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
