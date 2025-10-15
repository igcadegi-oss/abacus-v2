// ext/core/generator.js
export function generateExamples(count = 10, range = [1, 4]) {
  const examples = [];
  const [min, max] = range;

  for (let i = 0; i < count; i++) {
    const delta = randomDelta(min, max);
    const sign = delta > 0 ? "+" : "";
    examples.push(`${sign}${delta}`);
  }
  return examples;
}

function randomDelta(min = 1, max = 4) {
  const val = Math.floor(Math.random() * (max - min + 1)) + min;
  return Math.random() < 0.5 ? -val : val;
}