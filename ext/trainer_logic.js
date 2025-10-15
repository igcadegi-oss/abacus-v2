// ext/trainer_logic.js
// Логика тренировки (упрощённая версия)

export function mountTrainerUI(container, { t, state }) {
  const wrapper = document.createElement("div");
  wrapper.className = "trainer-wrapper";

  const title = document.createElement("h3");
  title.textContent = "🔸 Mental arithmetic trainer (extended)";
  wrapper.appendChild(title);

  const output = document.createElement("div");
  output.className = "trainer-output";
  wrapper.appendChild(output);

  container.appendChild(wrapper);

  // Генерация примеров
  const examples = generateExamples(10);
  output.innerHTML = examples.map(e => `<div class="example">${e}</div>`).join("");
}

// === Генератор примеров (демо) ===
export function generateExamples(count = 10) {
  const arr = [];
  let cur = 0;
  for (let i = 0; i < count; i++) {
    let delta = randomDelta();
    // исправлено: оператор || вместо or
    while ((cur + delta < -9) || (cur + delta > 9)) {
      delta = randomDelta();
    }
    cur += delta;
    const sign = delta > 0 ? "+" : "";
    arr.push(`${sign}${delta}`);
  }
  return arr;
}

function randomDelta() {
  const vals = [-4, -3, -2, -1, 1, 2, 3, 4];
  return vals[Math.floor(Math.random() * vals.length)];
}
