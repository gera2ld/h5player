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
    children.forEach(item => {
      const child = Array.isArray(item) ? createElement(...item) : item;
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
