/**
 * HTML5 Player
 * @author Gerald <gera2ld@163.com>
 */
import LyricParser from './lyric';
import Progress from './progress';
import { prevent, createElement, bindEvents, empty } from './util';

const H5P_ACTIVE = 'h5p-active';
const RE_SPACE = /\s+/;

// manage all the players to ensure only one is playing at once
const players = [];
let currentPlayer = null;

function setCurrentPlayer(player) {
  currentPlayer = player;
  players.forEach(other => {
    if (player !== other) other.audio.pause();
  });
}

function fireEvent(detail) {
  const event = new CustomEvent('PlayerEvent', {
    detail,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
}

export default class Player {
  static themes = [
    'normal',
    'simple',
  ];
  static classNames = {
    list: 'fa fa-list',
    prev: 'fa fa-step-backward',
    play: 'fa fa-play',
    next: 'fa fa-step-forward',
    pause: 'fa fa-pause',
  };

  constructor(options) {
    this.options = options;
    players.push(this);
    this.build();
    this.setSongs([]);
    this.setTheme();
  }

  build() {
    this.classNames = {
      ...Player.classNames,
      ...this.options.classNames,
    };
    this.progress = new Progress();
    const buttons = {};
    const image = createElement('div', {
      className: 'h5p-image',
    });
    const toolbar = createElement('div', {
      className: 'h5p-toolbar',
    }, [
      buttons.list = createElement('i', {
        className: `h5p-button ${this.classNames.list}`,
        on: {
          click: this.handleToggleList,
        },
      }),
    ]);
    const title = createElement('div', {
      className: 'h5p-title',
    });
    const artist = createElement('div', {
      className: 'h5p-artist',
    });
    const info = createElement('div', {
      className: 'h5p-info',
    }, [title, artist]);
    const control = createElement('div', {
      className: 'h5p-control',
    }, [
      buttons.prev = createElement('i', {
        className: `h5p-button ${this.classNames.prev}`,
        on: {
          click: this.handlePlayPrev,
        },
      }),
      buttons.play = createElement('i', {
        className: `h5p-button ${this.classNames.play}`,
        on: {
          click: this.handleTogglePlay,
        },
      }),
      buttons.next = createElement('i', {
        className: `h5p-button ${this.classNames.next}`,
        on: {
          click: this.handlePlayNext,
        },
      }),
    ]);
    const progress = createElement('div', {
      className: 'h5p-progress-wrap',
    }, [this.progress.el]);
    const lyric = createElement('div', {
      className: 'h5p-lyric',
    });
    const playlist = createElement('div', {
      className: 'h5p-playlist',
      on: {
        click: this.handlePlayItem,
      },
    });
    const audio = bindEvents(new Audio(), {
      ended: this.handlePlayAnother,
      timeupdate: this.handleUpdateTime,
      play: this.handleStatusChange,
      pause: this.handleStatusChange,
    });
    this.progress.on('cursor', this.handleCursorChange);
    this.audio = audio;
    this.el = createElement('div', {
      className: 'h5p',
    }, [
      image, toolbar, info, control,
      progress, lyric, playlist, audio,
    ]);
    this.els = {
      image, buttons, lyric, playlist, title, artist,
    };
    this.lyricParser = new LyricParser();
  }

  destroy() {
    const { el } = this;
    const parent = el.parentNode;
    if (parent) parent.removeChild(el);
  }

  play(index) {
    let song = this.songs[index];
    if (!song) song = this.songs[index = 0];
    if (song) {
      if (this.current === index) {
        this.audio.currentTime = 0;
      } else {
        const { childNodes } = this.els.playlist;
        const last = childNodes[this.current];
        if (last) last.classList.remove(H5P_ACTIVE);
        this.current = index;
        childNodes[index].classList.add(H5P_ACTIVE);
        this.audio.src = song.url;
        this.duration = song.duration ? song.duration / 1000 : null;
        this.showInfo(song);
      }
      this.progress.setCursor(0, this.duration);
      this.audio.play();
    }
  }

  prev() {
    return (this.current + this.songs.length - 1) % this.songs.length;
  }

  next() {
    return (this.current + 1) % this.songs.length;
  }

  setSongs(songs) {
    this.songs = songs;
    const { playlist } = this.els;
    empty(playlist);
    songs.forEach(({ name }) => {
      playlist.appendChild(createElement('div', {
        title: name,
        textContent: name,
      }));
    });
    this.current = -1;
    this.audio.src = '';
    this.duration = 0;
    this.showInfo(this.songs[0]);
  }

  showInfo(song) {
    this.updateInfo(song);
    const { name, artist } = song || {};
    const { els } = this;
    els.title.textContent = name || '';
    els.artist.textContent = artist || '';
  }

  updateInfo(item) {
    const song = item || this.songs[this.current];
    let { image } = song || {};
    if (typeof image === 'object') image = image[this.theme];
    image = image || this.options.image || '';
    const { els } = this;
    const imageEl = empty(els.image);
    if (image) {
      imageEl.appendChild(createElement('img', {
        src: image,
      }));
    }
    els.lyric.textContent = '';
    if (song) this.loadLyric(song);
  }

  loadLyric(song) {
    const { lyricParser } = this;
    if (song.lyric == null) {
      lyricParser.setLyric();
      const { lyricCallback } = this.options;
      if (lyricCallback) {
        lyricCallback({ ...song }, lyric => {
          if (song === this.songs[this.current]) {
            lyricParser.setLyric(song.lyric = lyric || '');
          }
        });
      }
    } else {
      lyricParser.setLyric(song.lyric);
    }
  }

  setTheme(name) {
    const { themes } = Player;
    let index = themes.indexOf(name || this.options.theme);
    if (index < 0) index = 0;
    const oldTheme = this.theme;
    this.theme = themes[index];
    if (oldTheme !== this.theme) {
      const { classList } = this.el;
      classList.remove(`h5p-${oldTheme}`);
      classList.add(`h5p-${this.theme}`);
      this.updateInfo();
    }
  }

  handleToggleList = e => {
    e.target.classList.toggle(H5P_ACTIVE);
    const active = e.target.classList.contains(H5P_ACTIVE);
    this.els.playlist.style.display = active ? 'block' : '';
  }

  handleTogglePlay = e => {
    prevent(e);
    if (this.current < 0) this.play(0);
    else if (this.audio.paused) this.audio.play();
    else this.audio.pause();
  }

  handlePlayPrev = e => {
    prevent(e);
    this.play(this.prev());
  }

  handlePlayNext = e => {
    prevent(e);
    this.play(this.next());
  }

  handlePlayAnother = () => this.handlePlayNext()

  handleUpdateTime = e => {
    const { target } = e;
    const { currentTime } = target;
    this.duration = target.duration || this.duration;
    this.progress.setCursor(currentTime, this.duration);
    this.els.lyric.textContent = this.lyricParser.getLyricByTime(currentTime);
  }

  handleStatusChange = e => {
    const { type } = e;
    const isPlaying = type === 'play';
    if (isPlaying) {
      setCurrentPlayer(this);
      fireEvent({ type, player: this });
    } else if (currentPlayer === this) {
      currentPlayer = null;
      fireEvent({ type, player: this });
    }
    const { classList } = this.els.buttons.play;
    const { classNames } = this;
    const items = [classNames.pause, classNames.play];
    if (isPlaying) items.reverse();
    items.forEach((className, force) => {
      className.split(RE_SPACE)
      .forEach(name => {
        if (name) classList.toggle(name, force);
      });
    });
    this.els.image.classList.toggle('h5p-roll', isPlaying);
  }

  handlePlayItem = e => {
    prevent(e);
    [...this.els.playlist.childNodes].some((child, i) => {
      if (child === e.target) {
        this.play(i);
        return true;
      }
      return false;
    });
  }

  handleCursorChange = pos => {
    const currentTime = this.duration * pos | 0;
    this.audio.currentTime = currentTime;
  }
}
