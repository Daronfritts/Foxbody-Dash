/* Foxbody Mustang shift-light thresholds.
   The running-horse logo stays dim below 5000 RPM,
   turns yellow from 5000-5499 RPM,
   and turns red at 5500 RPM and above. */

setShiftLight = function setShiftLight(rpm) {
    const logo = document.getElementById("mustangLogo");
    if (!logo) return;

    logo.classList.remove("shiftYellow", "shiftRed");

    const currentRpm = Number(rpm) || 0;

    if (currentRpm >= 5500) {
        logo.classList.add("shiftRed");
    } else if (currentRpm >= 5000) {
        logo.classList.add("shiftYellow");
    }
};
