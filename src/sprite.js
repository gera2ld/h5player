import svgSprite from './temp/svg-symbols.svg';
import { createElement } from './util';

function initialize() {
  const { body } = document;
  if (!body) {
    document.addEventListener('DOMContentLoaded', initialize);
    return;
  }
  const sprite = createElement('div', {
    innerHTML: svgSprite,
  });
  sprite.style.display = 'none';
  body.insertBefore(sprite, body.firstChild);
}

initialize();
