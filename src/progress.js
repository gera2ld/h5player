import EventEmitter from './events';
import { prevent, createElement } from './util';

export default class Progress extends EventEmitter {
  constructor() {
    super();
    this.build();
  }

  build() {
    const played = createElement('div', {
      className: 'h5p-played',
    });
    const bar = createElement('div', {
      className: 'h5p-bar',
    }, [played]);
    const cursor = createElement('div', {
      className: 'h5p-cursor',
      on: {
        mousedown: this.handleCursor,
        click: prevent,
      },
    });
    const time = createElement('div', {
      className: 'h5p-time',
    });
    const el = createElement('div', {
      className: 'h5p-progress',
      on: {
        click: this.handleCursorChange,
      },
    }, [bar, cursor, time]);
    this.el = el;
    this.els = {
      bar, played, cursor, time,
    };
  }

  setCursor(currentTime, duration) {
    if (!this.cursorData) this.setCursorPos(duration ? currentTime / duration : null);
    this.els.time.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
  }

  setCursorPos(pos) {
    const { played, cursor } = this.els;
    const past = `${(pos || 0) * 100}%`;
    played.style.width = past;
    cursor.style.left = past;
  }

  getPos(e) {
    const pos = (e.clientX - this.cursorData.delta) / this.els.bar.offsetWidth;
    return Math.max(0, Math.min(1, pos));
  }

  handleCursor = e => {
    prevent(e);
    this.cursorData = {
      delta: e.clientX - this.els.played.offsetWidth,
    };
    document.addEventListener('mousemove', this.handleCursorMove, false);
    document.addEventListener('mouseup', this.handleCursorEnd, false);
  }

  handleCursorMove = e => {
    prevent(e);
    this.cursorData.moved = true;
    this.setCursorPos(this.getPos(e));
  }

  handleCursorChange = e => {
    let x;
    if ('offsetX' in e) {
      x = e.offsetX;
    } else {
      const rect = e.target.getBoundingClientRect();
      const docEl = document.documentElement;
      const win = window;
      x = e.pageX - (rect.left + win.pageXOffset - docEl.clientLeft);
    }
    const pos = x / this.els.bar.offsetWidth;
    this.setCursorPos(pos);
    this.emit('cursor', pos);
  }

  handleCursorEnd = e => {
    document.removeEventListener('mousemove', this.handleCursorMove, false);
    document.removeEventListener('mouseup', this.handleCursorEnd, false);
    const pos = this.getPos(e);
    this.cursorData = null;
    this.setCursorPos(pos);
    this.emit('cursor', pos);
  };
}

function formatTime(time) {
  const minutes = time / 60 | 0;
  const seconds = time % 60 | 0;
  return `${leftpadNumber(minutes, 2)}:${leftpadNumber(seconds, 2)}`;
}

function leftpadNumber(num, len) {
  const pad = Number.isNaN(num) ? '?' : '0';
  let str;
  for (str = `${num}`; str.length < len; str = `${pad}${str}`);
  return str;
}
