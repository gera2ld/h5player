/**
 * HTML5 Player
 * @author Gerald <gera2ld@163.com>
 */
'use strict';

// manage all the players to ensure only one is playing at once
var players = [];

function Player(options) {
	this.options = options;
	this.init();
	players.push(this);
}
Player.prototype = {
	_classes: {
		list: 'fa fa-list',
		prev: 'fa fa-step-backward',
		play: 'fa fa-play',
		next: 'fa fa-step-forward',
		pause: 'fa fa-pause',
	},
	themes: [
		'normal',
		'simple',
	],
	extend: function(dict1, dict2) {
		for(var i in dict2) dict1[i] = dict2[i];
		return dict1;
	},
	init: function() {
		var self = this;
		var container = self.options.container;
		self.classes = self.extend({}, self._classes);
		if(self.options.classes)
			self.extend(self.classes, self.options.classes);
		container.classList.add('h5p');
		var i = self.themes.indexOf(self.options.theme);
		if(i < 0) i = 0;
		container.classList.add('h5p-' + (self.theme = self.themes[i]));
		container.innerHTML =
			'<div class="h5p-image"></div>' +
			'<div class="h5p-buttons">' +
				'<i data="list" class="h5p-button ' + self.classes.list + '"></i>' +
			'</div>' +
			'<div class="h5p-info">' +
				'<div class="h5p-title"></div>' +
				'<div class="h5p-artist"></div>' +
			'</div>' +
			'<div class="h5p-control">' +
				'<i data="prev" class="h5p-button ' + self.classes.prev + '"></i>' +
				'<i data="play" class="h5p-button ' + self.classes.play + '"></i>' +
				'<i data="next" class="h5p-button ' + self.classes.next + '"></i>' +
			'</div>' +
			'<div class="h5p-progress">' +
				'<div class="h5p-wrap">' +
					'<div class="h5p-bar">' +
						'<div class="h5p-played"></div>' +
					'</div>' +
					'<div class="h5p-cursor"></div>' +
					'<div class="h5p-time"></div>' +
				'</div>' +
			'</div>' +
			'<div class="h5p-lyric"></div>' +
			'<div class="h5p-playlist"></div>'
		;
		var $ = container.querySelector.bind(container);
		self.image = $('.h5p-image');
		self.title = $('.h5p-title');
		self.artist = $('.h5p-artist');
		self.playlist = $('.h5p-playlist');
		self.prwrap = $('.h5p-wrap');
		self.prcur = $('.h5p-cursor');
		self.prtime = $('.h5p-time');
		self.brplayed = $('.h5p-played');
		self.lyric = $('.h5p-lyric');
		Array.prototype.forEach.call(container.querySelectorAll('.h5p-button'), function(bt){
			self['bt' + bt.getAttribute('data')] = bt;
		});
		self.audio = new Audio;
		if(self.options.image)
			self.image.innerHTML = '<img src="' + self.safeHTML(self.options.image) + '">';
		self.setSongs([]);
		self.lyricParser = new LyricParser();
		self.bindEvents();
	},
	prevent: function(e) {
		if(e && e.preventDefault) {
			e.preventDefault();
			e.stopPropagation();
		}
	},
	touch: function(cb) {
		var self = this;
		return function(e) {
			self.prevent(e);
			[].forEach.call(e.changedTouches, function(e) {
				cb.call(self, e);
			});
		};
	},
	getPoint: function(e) {
		if('offsetX' in e) return {
			x: e.offsetX,
			y: e.offsetY,
		};
		var rect = e.target.getBoundingClientRect();
		var docEle = document.documentElement;
		var win = window;
		return {
			x: e.pageX - (rect.left + win.pageXOffset - docEle.clientLeft),
			y: e.pageY - (rect.top + win.pageYOffset - docEle.clientTop),
		};
	},
	bindEvents: function() {
		var self = this;
		var cursorData = null;
		self.btlist.addEventListener('touchstart', self.touch(self.toggleList), false);
		self.btlist.addEventListener('click', self.toggleList.bind(self), false);
		self.btprev.addEventListener('touchstart', self.touch(self.playPrev), false);
		self.btprev.addEventListener('click', self.playPrev.bind(self), false);
		self.btnext.addEventListener('touchstart', self.touch(self.playNext), false);
		self.btnext.addEventListener('click', self.playNext.bind(self), false);
		self.btplay.addEventListener('touchstart', self.touch(self.togglePlay), false);
		self.btplay.addEventListener('click', self.togglePlay.bind(self), false);
		self.audio.addEventListener('ended', self.playAnother.bind(self), false);
		self.audio.addEventListener('timeupdate', function(e) {
			var currentTime = this.currentTime;
			var duration = self.duration;
			if(!duration) duration = self.duration = this.duration;
			if(!cursorData) {
				var played = duration ? (currentTime / duration * 100) + '%' : 0;
				self.prcur.style.left = played;
				self.brplayed.style.width = played;
			}
			self.prtime.innerHTML = self.timestr(currentTime) + ' / ' + self.timestr(duration);
			self.lyric.innerHTML = self.safeHTML(self.lyricParser.getLyricAtTime(currentTime));
		}, false);
		var playStatusChange = function(e) {
			var status = ['play', 'pause'];
			var i = 0;
			if(e.type == 'play') {
				players.forEach(function(player) {
					if(player !== self) player.audio.pause();
				});
			} else i = 1;
			var playcls = self.btplay.classList;
			self.classes[status[i]].split(/\s+/).forEach(function(c){
				playcls.remove(c);
			});
			self.classes[status[1 - i]].split(/\s+/).forEach(function(c){
				playcls.add(c);
			});
			self.image.classList[e.type=='play'?'add':'remove']('h5p-roll');
		};
		self.audio.addEventListener('play', playStatusChange, false);
		self.audio.addEventListener('pause', playStatusChange, false);
		self.playlist.addEventListener('click', function(e) {
			self.prevent(e);
			var i = Array.prototype.indexOf.call(this.childNodes, e.target);
			if(i >= 0) self.play(i);
		}, false);
		var setCursor = function(x, play) {
			var newPos = x / self.prwrap.offsetWidth;
			if(newPos < 0) newPos = 0;
			else if(newPos > 1) newPos = 1;
			self.prcur.style.left = self.brplayed.style.width = newPos * 100 + '%';
			if(play) self.audio.currentTime = ~~ (newPos * self.duration);
		};
		var barClick = function(e) {
			self.prevent(e);
			var x = self.getPoint(e).x;
			setCursor(x, true);
		};
		self.prwrap.addEventListener('touchstart', self.touch(barClick), false);
		self.prwrap.addEventListener('click', barClick, false);
		var movingCursor = function(e) {
			self.prevent(e);
			cursorData.moved = true;
			setCursor(e.clientX - cursorData.delta);
		};
		var touchMovingCursor = self.touch(movingCursor);
		var stopMovingCursor = function(e) {
			self.prevent(e);
			cursorData = null;
			var container = self.options.container;
			container.removeEventListener('touchmove', touchMovingCursor, false);
			container.removeEventListener('mousemove', movingCursor, false);
			container.removeEventListener('touchend', touchEndMovingCursor, false);
			container.removeEventListener('mouseup', endMovingCursor, false);
		};
		var endMovingCursor = function(e) {
			setCursor(e.clientX - cursorData.delta, true);
			stopMovingCursor(e);
		};
		var touchEndMovingCursor = self.touch(endMovingCursor);
		var startMovingCursor = function(e) {
			self.prevent(e);
			if(!cursorData) {
				cursorData = {
					delta: e.clientX - self.brplayed.offsetWidth,
				};
				var container = self.options.container;
				container.addEventListener('touchmove', touchMovingCursor, false);
				container.addEventListener('mousemove', movingCursor, false);
				container.addEventListener('touchend', touchEndMovingCursor, false);
				container.addEventListener('mouseup', endMovingCursor, false);
			}
		};
		self.prcur.addEventListener('touchstart', self.touch(startMovingCursor), false);
		self.prcur.addEventListener('mousedown', startMovingCursor, false);
		// to stop click event on the progress bar
		self.prcur.addEventListener('click', self.prevent, false);
	},
	safeHTML: function(html) {
		return html.replace(/[&"<]/g, function(m) {
			return {
				'&': '&amp;',
				'"': '&quot;',
				'<': '&lt;',
			}[m];
		});
	},
	toggleList: function(e) {
		var self = this;
		self.prevent(e);
		self.btlist.classList.toggle('h5p-active');
		var display = self.playlist.style.display;
		self.playlist.style.display = display ? '' : 'block';
	},
	togglePlay: function(e) {
		var self = this;
		self.prevent(e);
		if(self.current < 0)
			self.play(0);
		else if(self.audio.paused)
			self.audio.play();
		else
			self.audio.pause();
	},
	playPrev: function(e) {
		this.prevent(e);
		this.play(this.previous());
	},
	playNext: function(e) {
		this.prevent(e);
		this.play(this.next());
	},
	playAnother: function() {
		// TODO: add other modes
		this.playNext();
	},
	/**
	 * songs should be a list of song objects:
	 * {
	 *   name: string
	 *   url: string
	 *   artist: (optional) string
	 *   duration: (optional) int (seconds)
	 *   image: (optional) string
	 *   smallimage: (optional) string
	 *   lyric: (optional) string
	 *   lyricjsonp: (optional) string
	 * }
	 */
	setSongs: function(songs) {
		var self = this, data = [];
		self.songs = songs;
		self.songs.forEach(function(song) {
			var name = self.safeHTML(song.name);
			data.push('<div title="'+name+'">'+name+'</div>');
		});
		self.playlist.innerHTML = data.join('');
		self.current = -1;
		self.audio.src = '';
		self.duration = 0;
		self.showInfo(self.songs[0]);
	},
	showInfo: function(song) {
		var self = this;
		var image;
		song = song || {};
		if(self.theme == 'simple')
			image = song.smallimage || self.options.smallimage;
		image = image || song.image || self.options.image || '';
		if(image)
			self.image.innerHTML = '<img src="' + self.safeHTML(image) + '">';
		self.title.innerHTML = self.safeHTML(song.name || '');
		self.artist.innerHTML = self.safeHTML(song.artist || '');
	},
	getLyric: function(timeout) {
		var self = this;
		var song = self.songs[self.current];
		if('lyric' in song) {
			self.lyricParser.setLyric(song.lyric);
		} else {
			self.lyricParser.setLyric();
			if('lyricjsonp' in song) {
				var jsonp = 'setLyric' + Date.now().toString(16) + (~~ (Math.random() * 0xffff)).toString(16);
				var timeoutObj;
				window[jsonp] = function(r) {
					if(r['code'] != 200)
						song.lyric = null;
					else {
						song.lyric = r.lyric;
						if(song === self.songs[self.current])
							self.lyricParser.setLyric(song.lyric);
					}
					delete window[jsonp];
					if(timeoutObj) {
						clearTimeout(timeoutObj);
						timeoutObj = null;
					}
				};
				var s = document.createElement('script');
				s.src = song.lyricjsonp + (/\?/.test(song.lyricjsonp) ? '&' : '?') + 'jsonp=' + jsonp;
				s.onload = function(){
					document.body.removeChild(s);
				};
				document.body.appendChild(s);
				if(timeout) timeoutObj = setTimeout(function() {
					delete window[jsonp];
					timeoutObj = null;
				}, timeout);
			}
		}
	},
	play: function(i) {
		var self = this;
		if(i >= 0 && i < self.songs.length) {
			if(self.current == i) {
				self.audio.currentTime = 0;
			} else {
				var children = self.playlist.childNodes;
				var last = children[self.current];
				if(last) last.classList.remove('h5p-active');
				self.current = i;
				children[self.current].classList.add('h5p-active');
				var song = self.songs[self.current];
				self.audio.src = song.url;
				self.duration = song.duration ? song.duration / 1000 : null;
				self.showInfo(song);
				if(self.theme!='simple') {
					self.lyric.innerHTML = '';
					self.getLyric(10000);
				}
			}
			self.prtime.innerHTML = '';
			self.prcur.style.left = 0;
			self.brplayed.style.width = 0;
			self.audio.play();
		}
	},
	previous: function() {
		return (this.current + this.songs.length - 1) % this.songs.length;
	},
	next: function() {
		return (this.current + 1) % this.songs.length;
	},
	timestr: function(s) {
		if(isNaN(s)) return '??:??';
		var m = Math.floor(s / 60);
		s = Math.floor(s) % 60;
		if(s < 10) s = '0' + s;
		if(m < 10) m = '0' + m;
		return m + ':' + s;
	},
	destroy: function() {
		var self = this;
		self.lyricParser = null;
		self.audio.src = '';
		self.audio = null;
		self.options.container.innerHTML = '';
		self.options.container.classList.remove('h5p');
		var i = players.indexOf(this);
		if(i >= 0) players.splice(i, 1);
	},
};
window.Player = Player;
