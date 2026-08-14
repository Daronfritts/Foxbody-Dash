const LAYOUT_APPEARANCE_STORAGE_KEY = "foxbodyDash.gaugeLayout";

const LAYOUT_APPEARANCE_DEFAULTS = {
    smallGaugeTickColor: "#f3f3f3",
    shiftBaseColor: "#ffffff"
};

function readLayoutAppearanceSettings() {
    try {
        return JSON.parse(localStorage.getItem(LAYOUT_APPEARANCE_STORAGE_KEY) || "null") || {};
    } catch (error) {
        console.warn("Appearance settings could not be read:", error);
        return {};
    }
}

function writeAppearanceValue(key, value) {
    const settings = readLayoutAppearanceSettings();
    settings.appearance = {
        ...LAYOUT_APPEARANCE_DEFAULTS,
        ...(settings.appearance || {}),
        [key]: value
    };
    localStorage.setItem(LAYOUT_APPEARANCE_STORAGE_KEY, JSON.stringify(settings));
}

function buildAppearanceControls() {
    const previewCard = document.querySelector(".previewCard");
    if (!previewCard) return;

    const settings = readLayoutAppearanceSettings();
    const appearance = {
        ...LAYOUT_APPEARANCE_DEFAULTS,
        ...(settings.appearance || {})
    };

    const card = document.createElement("section");
    card.className = "layoutCard";
    card.innerHTML = `
        <div class="cardHeading">
            <div>
                <h2>Gauge & Shift Light Colors</h2>
                <p>Set the normal small-gauge tick color and the Mustang shift light base color. RPM warnings still override the Mustang to yellow and red.</p>
            </div>
        </div>
        <div class="thresholdGrid">
            <label class="thresholdRow">
                <span>Small gauge ticks</span>
                <input id="smallGaugeTickColor" type="color" value="${appearance.smallGaugeTickColor}" aria-label="Small gauge tick color" />
            </label>
            <label class="thresholdRow">
                <span>Shift light base</span>
                <input id="shiftBaseColor" type="color" value="${appearance.shiftBaseColor}" aria-label="Shift light base color" />
            </label>
        </div>
    `;

    previewCard.parentNode.insertBefore(card, previewCard);

    const tickColor = document.getElementById("smallGaugeTickColor");
    const shiftColor = document.getElementById("shiftBaseColor");

    tickColor.addEventListener("input", () => writeAppearanceValue("smallGaugeTickColor", tickColor.value));
    shiftColor.addEventListener("input", () => writeAppearanceValue("shiftBaseColor", shiftColor.value));

    const resetButton = document.getElementById("resetButton");
    resetButton?.addEventListener("click", () => {
        window.setTimeout(() => {
            const resetSettings = readLayoutAppearanceSettings();
            resetSettings.appearance = { ...LAYOUT_APPEARANCE_DEFAULTS };
            localStorage.setItem(LAYOUT_APPEARANCE_STORAGE_KEY, JSON.stringify(resetSettings));
            tickColor.value = LAYOUT_APPEARANCE_DEFAULTS.smallGaugeTickColor;
            shiftColor.value = LAYOUT_APPEARANCE_DEFAULTS.shiftBaseColor;
        }, 0);
    });
}

buildAppearanceControls();
