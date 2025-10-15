// ext/trainer_ext.js
import { t } from "../core/i18n.js";
import { state } from "../core/state.js";
import { mountTrainerUI } from "./trainer_logic.js";

// === Основная инициализация тренажёра ===
(async () => {
  // Ищем главный контейнер приложения
  const appRoot = document.getElementById("app");

  if (!appRoot) {
    console.error("❌ Не найден контейнер #app для тренажёра.");
    return;
  }

  // Проверим, не был ли тренажёр уже смонтирован
  if (appRoot.dataset.trainerMounted) {
    console.warn("⚠️ Trainer уже инициализирован.");
    return;
  }

  console.log("✅ TrainerView initialized on #app");
  appRoot.dataset.trainerMounted = "true";

  // Монтируем тренировочный интерфейс
  mountTrainerUI(appRoot, { t, state });
})();
