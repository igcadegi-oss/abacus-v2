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
    this.adjustFont();
  }

  adjustFont() {
    const items = this.container.querySelectorAll(".example-item");
    if (!items.length) return;

    const maxHeight = window.innerHeight * 0.8;
    const fontSize = Math.max(40, Math.min(140, maxHeight / (items.length + 1)));
    items.forEach(i => {
      i.style.fontSize = fontSize + "px";
      i.style.fontFamily = "'Baloo 2', cursive";
      i.style.lineHeight = "1.1";
    });
  }
}