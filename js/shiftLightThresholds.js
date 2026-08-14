/* Foxbody Mustang shift-light thresholds.
   The running-horse logo uses its configured base color below 5000 RPM,
   turns yellow from 5000-5999 RPM,
   and turns red at 6000 RPM and above. */

setShiftLight = function setShiftLight(rpm) {
    const logo = document.getElementById("mustangLogo");
    if (!logo) return;

    logo.classList.remove("shiftYellow", "shiftRed");

    const currentRpm = Number(rpm) || 0;

    if (currentRpm >= 6000) {
        logo.classList.add("shiftRed");
    } else if (currentRpm >= 5000) {
        logo.classList.add("shiftYellow");
    }
};
