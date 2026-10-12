(() => {
  "use strict";

  const REQUIRED_TAPS = 5;
  const WINDOW_MS = 4000;
  let unlockTaps = [];
  let busy = false;

  const overlay = document.getElementById("maintenanceOverlay");
  const message = document.getElementById("maintenanceMessage");

  function setOpen(open) {
    overlay.hidden = !open;
    if (open) refresh();
  }

  async function call(action) {
    if (busy) return;
    busy = true;
    overlay.querySelectorAll("button").forEach(button => button.disabled = true);

    try {
      const response = await fetch("/api/maintenance/" + action, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const state = await response.json();
      if (!response.ok) throw new Error(state.last_error || "Maintenance action failed");
      message.textContent = action === "desktop"
        ? "DESKTOP OPEN — USE THE FOXBODY DASH DESKTOP ICON TO RETURN"
        : action === "terminal"
          ? "TERMINAL OPENED OVER THE DASH"
          : "DASH RESTORED";
      if (action !== "status") setTimeout(() => setOpen(false), 350);
    } catch (error) {
      message.textContent = error.message;
    } finally {
      busy = false;
      overlay.querySelectorAll("button").forEach(button => button.disabled = false);
    }
  }

  async function refresh() {
    try {
      const response = await fetch("/api/maintenance/status");
      const state = await response.json();
      if (!state.wmctrl_available) {
        message.textContent = "MAINTENANCE NEEDS WMCTRL INSTALLED";
      } else if (!state.return_helper_available) {
        message.textContent = "DESKTOP RETURN BUTTON NEEDS X11-UTILS";
      } else if (!state.terminal_available) {
        message.textContent = "DESKTOP READY — TERMINAL PROGRAM NOT FOUND";
      } else {
        message.textContent = "MAINTENANCE MODE";
      }
    } catch (_) {
      message.textContent = "MAINTENANCE SERVICE UNAVAILABLE";
    }
  }

  const unlockTarget = document.querySelector("#statusBar span:last-child");

  unlockTarget?.addEventListener("click", event => {
    const now = Date.now();
    unlockTaps = unlockTaps.filter(time => now - time <= WINDOW_MS);
    unlockTaps.push(now);

    if (unlockTaps.length < REQUIRED_TAPS) return;

    unlockTaps = [];
    event.preventDefault();
    setOpen(true);
  });

  document.getElementById("maintenanceDesktop")?.addEventListener(
    "click", () => call("desktop")
  );
  document.getElementById("maintenanceTerminal")?.addEventListener(
    "click", () => call("terminal")
  );
  document.getElementById("maintenanceReturn")?.addEventListener(
    "click", () => call("return")
  );
  document.getElementById("maintenanceClose")?.addEventListener(
    "click", () => setOpen(false)
  );
})();
