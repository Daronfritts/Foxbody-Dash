(() => {
  "use strict";

  const app = document.getElementById("foxApp");
  const editButton = document.getElementById("editModeButton");

  if (!app || !editButton) return;

  function makeNavButton(label, action, disabled = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.disabled = disabled;

    if (action) {
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        action();
      });
    }

    return button;
  }

  function updateNav() {
    const editing = app.classList.contains("editing");

    document.querySelectorAll(".navStrip:not(.fox-nav-ready)").forEach(nav => {
      nav.classList.add("fox-nav-ready");
      nav.replaceChildren();

      if (editing) {
        nav.append(
          makeNavButton("HOME", null, true),
          makeNavButton("VEHICLE", null, true),
          makeNavButton("EDIT", null, true)
        );
        return;
      }

      nav.append(
        makeNavButton("HOME", () => { window.location.href = "index.html"; }),
        makeNavButton("VEHICLE", () => { window.location.href = "pages/vehicle.html"; }),
        makeNavButton("EDIT", () => { editButton.click(); })
      );
    });
  }

  const observer = new MutationObserver(updateNav);
  observer.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });

  updateNav();
})();
