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
		container.classList.add('ge-player');
		var i = self.themes.indexOf(self.options.theme);
		if(i < 0) i = 0;
		container.classList.add(self.theme = self.themes[i]);
		container.innerHTML =
			'<div class="image"></div>' +
			'<div class="buttons">' +
				'<i data="list" class="button ' + self.classes.list + '"></i>' +
			'</div>' +
			'<div class="info">' +
				'<div class="title"></div>' +
				'<div class="artist"></div>' +
			'</div>' +
			'<div class="control">' +
				'<i data="prev" class="button ' + self.classes.prev + '"></i>' +
				'<i data="play" class="button ' + self.classes.play + '"></i>' +
				'<i data="next" class="button ' + self.classes.next + '"></i>' +
			'</div>' +
			'<div class="progress">' +
				'<div class="wrap">' +
					'<div class="barwrap">' +
						'<div class="bar"><div class="played"></div></div>' +
					'</div>' +
					'<div class="cursor"></div>' +
					'<div class="time"></div>' +
				'</div>' +
			'</div>' +
			'<div class="lyric"></div>' +
			'<div class="playlist hide"></div>'
		;
		var $ = container.querySelector.bind(container);
		self.image = $('.image');
		self.title = $('.title');
		self.artist = $('.artist');
		self.playlist = $('.playlist');
		self.prwrap = $('.barwrap');
		self.prcur = $('.cursor');
		self.prtime = $('.time');
		self.brplayed = $('.played');
		self.lyric = $('.lyric');
		Array.prototype.forEach.call(container.querySelectorAll('.button[data]'), function(bt){
			self['bt' + bt.getAttribute('data')] = bt;
		});
		self.audio = new Audio;
		if(self.options.image)
					self.image.innerHTML = '<img src="' + self.safeHTML(self.options.image) + '">';
		self.setSongs([]);
		self.lyricParser = new LyricParser();
		self.bindEvents();
	},
	bindEvents: function() {
		var self = this;
		var cursorData = null;
		var evtHandler = self.evtHandler = new EventHandler(self.options.container);
		evtHandler.delegate(self.btlist, 'click', self.toggleList.bind(self));
		evtHandler.delegate(self.btprev, 'click', self.playPrev.bind(self));
		evtHandler.delegate(self.btnext, 'click', self.playNext.bind(self));
		evtHandler.delegate(self.btplay, 'click', self.togglePlay.bind(self));
		evtHandler.on(self.audio, 'ended', self.playAnother.bind(self));
		evtHandler.on(self.audio, 'timeupdate', function(e) {
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
		});
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
			self.image.classList[e.type=='play'?'add':'remove']('ge-roll');
		};
		evtHandler.on(self.audio, 'play', playStatusChange);
		evtHandler.on(self.audio, 'pause', playStatusChange);
		evtHandler.delegate(self.playlist, 'click', function(e) {
			var i = Array.prototype.indexOf.call(this.childNodes, e.target);
			if(i >= 0) self.play(i);
		});
		var setCursor = function(x, play) {
			var newPos = x / self.prwrap.offsetWidth;
			if(newPos < 0) newPos = 0;
			else if(newPos > 1) newPos = 1;
			self.prcur.style.left = self.brplayed.style.width = newPos * 100 + '%';
			if(play) self.audio.currentTime = ~~ (newPos * self.duration);
		};
		evtHandler.delegate(self.prwrap, 'click', function(e) {
			e.preventDefault();
			var x = evtHandler.getPoint(e).x;
			setCursor(x, true);
		});
		var movingCursor = function(e) {
			if(cursorData) {
				cursorData.moved = true;
				setCursor(e.clientX - cursorData.delta);
			}
		};
		var stopMovingCursor = function(e) {
			if(cursorData) {
				e.preventDefault();
				cursorData = null;
			}
		};
		var endMovingCursor = function(e) {
			if(cursorData) {
				setCursor(e.clientX - cursorData.delta, true);
				stopMovingCursor(e);
			}
		};
		var startMovingCursor = function(e) {
			e.preventDefault();
			cursorData = {
				delta: e.clientX - self.brplayed.offsetWidth,
			};
		};
		evtHandler.delegate(self.prcur, 'mousedown', startMovingCursor);
		evtHandler.delegate(self.options.container, 'mousemove', movingCursor);
		evtHandler.delegate(self.options.container, 'mouseup', endMovingCursor);
		evtHandler.on(self.options.container, 'mouseleave', stopMovingCursor);
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
	toggleList: function() {
		var self = this;
		self.btlist.classList.toggle('active');
		self.playlist.classList.toggle('hide');
	},
	togglePlay: function() {
		var self = this;
		if(self.current < 0)
			self.play(0);
		else if(self.audio.paused)
			self.audio.play();
		else
			self.audio.pause();
	},
	playPrev: function() {
		this.play(this.previous());
	},
	playNext: function() {
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
				if(last) last.classList.remove('active');
				self.current = i;
				children[self.current].classList.add('active');
				var song = self.songs[self.current];
				self.audio.src = song.url;
				self.duration = song.duration ? song.duration / 1000 : null;
				self.showInfo(song);
				self.lyric.innerHTML = '';
				self.getLyric(10000);
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
		self.evtHandler.destroy();
		self.evtHandler = null;
		self.lyricParser = null;
		self.audio.src = '';
		self.audio = null;
		self.options.container.innerHTML = '';
		self.options.container.classList.remove('ge-player');
		var i = players.indexOf(this);
		if(i >= 0) players.splice(i, 1);
	},
};
window.Player = Player;
