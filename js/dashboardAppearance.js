const DASH_APPEARANCE_STORAGE_KEY = "foxbodyDash.gaugeLayout";

const DASH_APPEARANCE_DEFAULTS = {
    smallGaugeTickColor: "#f3f3f3",
    shiftBaseColor: "#ffffff"
};

function getDashboardAppearance() {
    try {
        const saved = JSON.parse(localStorage.getItem(DASH_APPEARANCE_STORAGE_KEY) || "null") || {};
        return {
            ...DASH_APPEARANCE_DEFAULTS,
            ...(saved.appearance || {})
        };
    } catch (error) {
        console.warn("Dashboard appearance settings unavailable:", error);
        return { ...DASH_APPEARANCE_DEFAULTS };
    }
}

function applyDashboardAppearance() {
    const appearance = getDashboardAppearance();
    const root = document.documentElement;

    root.style.setProperty("--small-gauge-tick-color", appearance.smallGaugeTickColor);
    root.style.setProperty("--shift-base-color", appearance.shiftBaseColor);
}

applyDashboardAppearance();
window.addEventListener("storage", applyDashboardAppearance);
