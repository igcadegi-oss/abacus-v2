// ext/trainer_ext.js
import { t } from "../core/i18n.js";
import { state } from "../core/state.js";
import { mountTrainerUI } from "./trainer_logic.js";

/**
 * Ждёт появления на странице экрана "Тренування" (.game-screen)
 * и монтирует тренажёр только внутри него.
 */
const waitForGameScreen = async () => {
  for (let i = 0; i < 40; i++) {
    const gameScreen = document.querySelector(".game-screen .screen__body");
    if (gameScreen) return gameScreen;
    await new Promise(r => setTimeout(r, 250));
  }
  console.warn("⚠️ Не найден .game-screen .screen__body — тренажёр не был смонтирован.");
  return null;
};

/**
 * Следит за навигацией внутри приложения.
 * При каждом изменении URL или состояния проверяет, есть ли экран 'Тренування'.
 */
const observeNavigation = () => {
  const observer = new MutationObserver(async () => {
    const screen = await waitForGameScreen();
    if (screen && !screen.dataset.trainerMounted) {
      console.log("✅ TrainerView mounted on .game-screen");
      screen.dataset.trainerMounted = "true";
      mountTrainerUI(screen, { t, state });
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  console.log("👀 Trainer observer started");
};

/**
 * Инициализация после загрузки DOM.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Проверяем, не загружен ли тренажёр раньше
  if (window.__trainerObserverActive) return;
  window.__trainerObserverActive = true;
  observeNavigation();
});
