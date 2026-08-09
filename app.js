export const MAX_GAP_INCHES = 4;

export function calculateLayout(openingWidth, balusterWidth, maxGap = MAX_GAP_INCHES) {
  const opening = Number(openingWidth);
  const baluster = Number(balusterWidth);
  const limit = Number(maxGap);

  if (!Number.isFinite(opening) || opening <= 0) {
    throw new RangeError("Opening width must be greater than zero.");
  }
  if (!Number.isFinite(baluster) || baluster <= 0) {
    throw new RangeError("Baluster width must be greater than zero.");
  }
  if (!Number.isFinite(limit) || limit <= 0) {
    throw new RangeError("Maximum gap must be greater than zero.");
  }
  if (baluster >= opening) {
    throw new RangeError("Baluster width must be smaller than the opening.");
  }

  // N balusters create N + 1 equal clear gaps, including both end gaps.
  // Solve (opening - N × baluster) / (N + 1) <= limit for the smallest N.
  const balusterCount = Math.max(1, Math.ceil((opening - limit) / (baluster + limit)));
  const gap = (opening - balusterCount * baluster) / (balusterCount + 1);

  if (gap < 0) {
    throw new RangeError("The selected balusters do not fit in this opening.");
  }

  return {
    openingWidth: opening,
    balusterWidth: baluster,
    balusterCount,
    gap,
    firstGap: gap,
    lastGap: gap,
    totalGaps: balusterCount + 1,
    withinLimit: gap <= limit + Number.EPSILON,
    maxGap: limit,
  };
}

const FRACTIONS = [
  { value: 0, label: "0" },
  { value: 0.125, label: "⅛″" },
  { value: 0.25, label: "¼″" },
  { value: 0.375, label: "⅜″" },
  { value: 0.5, label: "½″" },
  { value: 0.625, label: "⅝″" },
  { value: 0.75, label: "¾″" },
  { value: 0.875, label: "⅞″" },
];

export function formatMeasurement(value) {
  const roundedEighths = Math.round(Number(value) * 8);
  const whole = Math.floor(roundedEighths / 8);
  const remainder = roundedEighths % 8;
  const glyphs = ["", "⅛", "¼", "⅜", "½", "⅝", "¾", "⅞"];
  const fraction = glyphs[remainder];
  const display = whole === 0 && fraction ? fraction : `${whole}${fraction}`;
  return `${display || "0"}″`;
}

function populateSelect(select, options, selectedValue) {
  for (const option of options) {
    const element = document.createElement("option");
    element.value = String(option.value);
    element.textContent = option.label;
    element.selected = Number(option.value) === selectedValue;
    select.append(element);
  }
}

function initializeApp() {
  const feet = document.querySelector("#feet");
  const inches = document.querySelector("#inches");
  const fraction = document.querySelector("#fraction");
  const balusterWidth = document.querySelector("#baluster-width");
  const presets = [...document.querySelectorAll("[data-width]")];
  const error = document.querySelector("#error");

  populateSelect(feet, Array.from({ length: 51 }, (_, value) => ({ value, label: `${value} ft` })), 6);
  populateSelect(inches, Array.from({ length: 12 }, (_, value) => ({ value, label: `${value} in` })), 0);
  populateSelect(fraction, FRACTIONS, 0);

  const render = () => {
    const opening = Number(feet.value) * 12 + Number(inches.value) + Number(fraction.value);
    try {
      const result = calculateLayout(opening, balusterWidth.value);
      error.hidden = true;
      document.querySelector("#baluster-count").textContent = result.balusterCount;
      const formattedGap = formatMeasurement(result.gap);
      document.querySelector("#first-gap").textContent = formattedGap;
      document.querySelector("#middle-gap").textContent = formattedGap;
      document.querySelector("#last-gap").textContent = formattedGap;
      document.querySelector("#status").textContent = result.withinLimit ? "Within limit" : "Check spacing";
      document.querySelector("#summary").textContent =
        `Place ${result.balusterCount} balusters across the ${formatMeasurement(result.openingWidth)} opening. ` +
        `Leave ${formattedGap} of clear space at the first post, between every baluster, and at the last post.`;

      const diagram = document.querySelector("#rail-diagram");
      diagram.replaceChildren();
      const visibleCount = Math.min(result.balusterCount, 24);
      for (let index = 0; index < visibleCount; index += 1) {
        const marker = document.createElement("span");
        marker.className = "baluster";
        diagram.append(marker);
      }
    } catch (problem) {
      error.textContent = problem.message;
      error.hidden = false;
      document.querySelector("#baluster-count").textContent = "—";
      document.querySelector("#first-gap").textContent = "—";
      document.querySelector("#middle-gap").textContent = "—";
      document.querySelector("#last-gap").textContent = "—";
      document.querySelector("#summary").textContent = "Adjust the measurements to calculate the layout.";
      document.querySelector("#rail-diagram").replaceChildren();
    }
  };

  document.querySelectorAll("select, input").forEach((control) => {
    control.addEventListener("input", render);
    control.addEventListener("change", render);
  });

  presets.forEach((button) => {
    button.addEventListener("click", () => {
      balusterWidth.value = button.dataset.width;
      presets.forEach((item) => item.classList.toggle("active", item === button));
      render();
    });
  });

  balusterWidth.addEventListener("input", () => {
    presets.forEach((button) => {
      button.classList.toggle("active", Number(button.dataset.width) === Number(balusterWidth.value));
    });
  });

  render();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
  }
}

if (typeof document !== "undefined") {
  initializeApp();
}
