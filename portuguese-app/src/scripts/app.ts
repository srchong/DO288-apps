// Conmutación entre vistas en una página única. Mantener ambas vistas en el
// DOM (solo se oculta una con el atributo `hidden`) conserva el AudioContext
// y los audios ya precargados al cambiar de vista.
import { micRecorder } from './audio/micRecorder';

const navButtons = document.querySelectorAll<HTMLButtonElement>('[data-nav]');
const views = document.querySelectorAll<HTMLElement>('[data-view]');

function showView(name: string): void {
  for (const view of views) {
    view.hidden = view.dataset.view !== name;
  }
  for (const button of navButtons) {
    if (button.dataset.nav === name) {
      button.setAttribute('aria-current', 'page');
    } else {
      button.removeAttribute('aria-current');
    }
  }
  // Avisa a las vistas del cambio (p. ej. para abortar una grabación).
  document.dispatchEvent(new CustomEvent('app:viewchange', { detail: { view: name } }));
  // Al salir de la práctica, libera el micrófono y apaga su indicador.
  if (name !== 'practice') micRecorder.release();
}

for (const button of navButtons) {
  button.addEventListener('click', () => {
    const name = button.dataset.nav;
    if (name) showView(name);
  });
}
