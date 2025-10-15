
// ext/trainer_ext.js — attach to existing 'game' screen without modifying its code
import { t } from "../core/i18n.js";
import { state } from "../core/state.js";
import { mountTrainerUI } from "./trainer_logic.js";
import "../trainer-ext.css";

function tryMount(){
  const game = document.querySelector(".game-screen .screen__body");
  if (!game) return;
  // If already mounted, skip
  if (game.querySelector(".mws-trainer")) return;
  mountTrainerUI(game);
}

const observer = new MutationObserver(() => tryMount());
observer.observe(document.body, { childList: true, subtree: true });
document.addEventListener("DOMContentLoaded", tryMount);
window.addEventListener("load", tryMount);
