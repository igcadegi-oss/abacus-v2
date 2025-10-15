// ext/trainer_ext.js
import { t } from "../core/i18n.js";
import { state } from "../core/state.js";
import { mountTrainerUI } from "./trainer_logic.js";

const waitForGameScreen = async () => {
  for (let i = 0; i < 30; i++) {
    const game = document.querySelector(".game-screen .screen__body");
    if (game) return game;
    await new Promise(r => setTimeout(r, 300));
  }
  console.warn("⚠️ Не найден .game-screen .screen__body — тренажёр не был смонтирован.");
  return null;
};

(async () => {
  const game = await waitForGameScreen();
  if (game) {
    console.log("✅ TrainerView initialized");
    mountTrainerUI(game, { t, state });
  }
})();