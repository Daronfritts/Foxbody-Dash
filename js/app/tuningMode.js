(() => {
  "use strict";

  const overlay = document.getElementById("tuningModeOverlay");
  const message = document.getElementById("tuningModeMessage");
  const openButton = document.getElementById("tuningModeButton");
  const returnButton = document.getElementById("returnFromTuningButton");
  let busy = false;

  async function request(path) {
    if (busy) return;
    busy = true;
    openButton && (openButton.disabled = true);
    returnButton && (returnButton.disabled = true);

    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const state = await response.json();
      if (!response.ok) throw new Error(state.last_error || "Tuning mode failed");
      render(state);
    } catch (error) {
      message.textContent = error.message;
      overlay.hidden = false;
    } finally {
      busy = false;
      openButton && (openButton.disabled = false);
      returnButton && (returnButton.disabled = false);
    }
  }

  function render(state) {
    if (!overlay) return;
    overlay.hidden = !state.active;
    document.body.classList.toggle("tuning-mode-active", !!state.active);
    message.textContent = state.simulation
      ? "TUNING MODE SIMULATION — ECU SERIAL PORT RELEASED"
      : "TUNERSTUDIO ACTIVE — SAVE CHANGES BEFORE RETURNING";
  }

  async function refresh() {
    try {
      const response = await fetch("/api/tuning/status");
      if (response.ok) render(await response.json());
    } catch (_) {}
  }

  window.FoxTuningMode = {
    open: () => request("/api/tuning/open"),
    close: () => request("/api/tuning/close"),
    refresh
  };

  openButton?.addEventListener("click", window.FoxTuningMode.open);
  returnButton?.addEventListener("click", window.FoxTuningMode.close);
  refresh();
  setInterval(refresh, 1500);
})();
