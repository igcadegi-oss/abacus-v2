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
    </div>
  `;
  container.appendChild(layout);

  const exampleContainer = layout.querySelector("#exampleView");
  const view = new ExampleView(exampleContainer);

  const settings = state?.settings || {};
  const count = Number(settings.actions) || 10;
  const range = settings.range || [1, 4];
  const inlineMode = settings.inline || false;

  const examples = generateExamples(count, range);
  const mode = inlineMode ? "inline" : "column";

  view.render(examples, mode);
}