export function prevent(e) {
  if (e && e.preventDefault) {
    e.preventDefault();
    e.stopPropagation();
  }
}

export function createElement(tagName, props, children) {
  const el = document.createElement(tagName);
  if (props) {
    Object.keys(props).forEach(key => {
      const value = props[key];
      if (key === 'on') {
        bindEvents(el, value);
      } else {
        el[key] = value;
      }
    });
  }
  if (children) {
    children.forEach(child => {
      el.appendChild(child);
    });
  }
  return el;
}

export function bindEvents(el, events) {
  if (events) {
    Object.keys(events).forEach(type => {
      const handle = events[type];
      if (handle) el.addEventListener(type, handle);
    });
  }
  return el;
}

export function empty(el) {
  el.innerHTML = '';
  return el;
}

const NS_SVG = 'http://www.w3.org/2000/svg';
const NS_XLINK = 'http://www.w3.org/1999/xlink';

export function createSVGElement(tagName, children) {
  const el = document.createElementNS(NS_SVG, tagName);
  if (children) {
    children.forEach(child => {
      el.appendChild(child);
    });
  }
  return el;
}

export function createSVGIcon(name) {
  const use = createSVGElement('use');
  use.setAttributeNS(NS_XLINK, 'href', `#${name}`);
  return createSVGElement('svg', [use]);
}
