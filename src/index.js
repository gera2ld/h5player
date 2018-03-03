import LyricParser from './lyric';
import Progress from './progress';
import { prevent, createElement, bindEvents, empty, createSVGIcon } from './util';
import './sprite';

const H5P_ACTIVE = 'h5p-active';
const MODES = [
  'repeatAll',
  'repeatOne',
  'repeatOff',
];
const MODE_ICONS = {
  repeatAll: 'h5p-repeat',
  repeatOne: 'h5p-repeat-one',
  repeatOff: 'h5p-repeat-off',
};

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

  constructor(options) {
    players.push(this);
    this.build(options);
    this.setSongs([]);
    this.setTheme(options.theme);
    this.setMode(options.mode);
    this.setPlaylist(options.showPlaylist);
  }

  build(options) {
    this.defaultImage = options.image || '';
    this.callbackGetLyric = options.getLyric;
    this.progress = new Progress();
    const buttons = {};
    const image = createElement('div', {
      className: 'h5p-image',
    });
    const toolbar = createElement('div', {
      className: 'h5p-toolbar',
    }, [
      buttons.repeat = createElement('i', {
        className: 'h5p-button',
        on: {
          click: this.handleSwitchMode,
        },
      }, [createSVGIcon('h5p-repeat')]),
      buttons.list = createElement('i', {
        className: 'h5p-button',
        on: {
          click: this.handleToggleList,
        },
      }, [createSVGIcon('h5p-list')]),
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
      createElement('i', {
        className: 'h5p-button',
        on: {
          click: this.handlePlayPrev,
        },
      }, [createSVGIcon('h5p-backward')]),
      buttons.play = createElement('i', {
        className: 'h5p-button',
        on: {
          click: this.handleTogglePlay,
        },
      }, [createSVGIcon('h5p-play')]),
      createElement('i', {
        className: 'h5p-button',
        on: {
          click: this.handlePlayNext,
        },
      }, [createSVGIcon('h5p-forward')]),
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
    if (index == null) index = this.current;
    let song = this.songs[index];
    if (!song) song = this.songs[index = 0];
    if (song) {
      if (this.current !== index) {
        const { childNodes } = this.els.playlist;
        const last = childNodes[this.current];
        if (last) last.classList.remove(H5P_ACTIVE);
        this.current = index;
        childNodes[index].classList.add(H5P_ACTIVE);
        this.audio.src = song.url;
        this.duration = song.duration ? song.duration / 1000 : null;
        this.showInfo(song);
        this.progress.setCursor(0, this.duration);
      }
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
    image = image || this.defaultImage;
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
      const { callbackGetLyric } = this;
      if (callbackGetLyric) {
        callbackGetLyric({ ...song }, lyric => {
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
    let index = themes.indexOf(name);
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

  setMode(mode) {
    this.mode = MODES.indexOf(mode) < 0 ? MODES[0] : mode;
    const icon = MODE_ICONS[this.mode];
    this.els.buttons.repeat.firstChild.replaceWith(createSVGIcon(icon));
  }

  setPlaylist(show) {
    const { playlist, buttons } = this.els;
    buttons.list.classList.toggle(H5P_ACTIVE, !!show);
    playlist.style.display = show ? 'block' : '';
  }

  handleSwitchMode = e => {
    prevent(e);
    const index = MODES.indexOf(this.mode);
    this.setMode(MODES[(index + 1) % MODES.length]);
  }

  handleToggleList = e => {
    prevent(e);
    this.setPlaylist(!this.els.buttons.list.classList.contains(H5P_ACTIVE));
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

  handlePlayAnother = () => {
    const { mode } = this;
    if (mode === 'repeatAll') {
      this.handlePlayNext();
    } else if (mode === 'repeatOne') {
      this.play();
    } else {
      const next = this.next();
      if (next) this.play(next);
    }
  }

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
    const { play } = this.els.buttons;
    play.firstChild.replaceWith(createSVGIcon(isPlaying ? 'h5p-pause' : 'h5p-play'));
    this.els.image.classList.toggle('h5p-roll', isPlaying);
  }

  handlePlayItem = e => {
    prevent(e);
    const { childNodes } = this.els.playlist;
    for (let i = 0; i < childNodes.length; i += 1) {
      const child = childNodes[i];
      if (child === e.target) {
        this.play(i);
        break;
      }
    }
  }

  handleCursorChange = pos => {
    const currentTime = this.duration * pos | 0;
    this.audio.currentTime = currentTime;
    this.play();
  }
}
