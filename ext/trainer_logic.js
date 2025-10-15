// ext/trainer_logic.js
import { ExampleView } from "./components/ExampleView.js";
import { generateExamples } from "./core/generator.js";

export function mountTrainerUI(container, { t, state }) {
  container.innerHTML = "";

  const layout = document.createElement("div");
  layout.className = "trainer-layout";
  layout.innerHTML = `
    <div class="trainer-left">
      <div id="exampleView" class="example-view"></div>
      <div id="speedWarning" class="speed-warning" hidden>Выбери время</div>
    </div>
  `;
  container.appendChild(layout);

  const exampleContainer = layout.querySelector("#exampleView");
  const view = new ExampleView(exampleContainer);
  const speedWarning = layout.querySelector("#speedWarning");

  const settings =
    state?.settings ||
    state?.currentSession?.settings ||
    state?.gameSettings ||
    {};

  let actions = settings.actions;
  const inlineMode = settings.inline || false;
  const range = settings.range || [1, 4];
  const speed = settings.speed || 0;

  if (typeof actions === "string" && actions !== "∞") actions = Number(actions);
  const isInfinity = actions === "∞" || actions === Infinity || actions === -1;

  const count = isInfinity ? 0 : (Number(actions) || 10) + 1;

  const speedInput = document.getElementById("speedInput");
  if (isInfinity) {
    if (!speed) {
      speedWarning.hidden = false;
      speedWarning.style.display = "block";
      if (speedInput) speedInput.classList.add("highlight-speed");
    } else {
      speedWarning.hidden = true;
      if (speedInput) speedInput.classList.remove("highlight-speed");
    }
  }

  const examples = isInfinity
    ? ["∞"]
    : generateExamples(count, range).slice(0, count);

  const mode = inlineMode ? "inline" : "column";
  view.render(examples, mode);
}