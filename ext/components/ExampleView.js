// ext/components/ExampleView.js
export class ExampleView {
  constructor(container) {
    this.container = container;
  }

  render(examples, mode = "column") {
    this.container.className = `example-view ${mode}`;
    this.container.innerHTML = examples
      .map(ex => `<div class='example-item'>${ex}</div>`)
      .join("");
    this.adjustFont(examples.length);
  }

  adjustFont(lines = 10) {
    const items = this.container.querySelectorAll(".example-item");
    if (!items.length) return;

    const vh = window.innerHeight;
    const fontSize = Math.min(
      72,
      Math.max(24, (vh * 0.75) / (Math.min(lines, 15) + 2))
    );

    items.forEach(i => {
      i.style.fontSize = fontSize + "px";
      i.style.fontFamily = "'Baloo 2', cursive";
      i.style.color = "#7d733a";
      i.style.lineHeight = "1.15";
      i.style.wordBreak = "keep-all";
      i.style.overflowWrap = "anywhere";
    });
  }
}