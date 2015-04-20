function Player(options) {
	this.options = options;
	this.init();
}
Player.prototype = {
	_classes: {
	  list: 'fa fa-list',
    prev: 'fa fa-step-backward',
		play: 'fa fa-play',
    next: 'fa fa-step-forward',
		pause: 'fa fa-pause',
	},
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
		container.innerHTML =
			'<div class="image"></div>'+
			'<div class="buttons">'+
				'<i data="list" class="'+self.classes['list']+'"></i>'+
			'</div>'+
			'<div class="control">'+
				'<div class="title"></div>'+
				'<i data="prev" class="'+self.classes['prev']+'"></i>'+
				'<i data="play" class="'+self.classes['play']+'"></i>'+
				'<i data="next" class="'+self.classes['next']+'"></i>'+
			'</div>'+
			'<div class=progress>'+
				'<div class="wrap">'+
					'<div class="barwrap">'+
						'<div class="bar"><div class="played"></div></div>'+
					'</div>'+
					'<div class="cursor"></div>'+
					'<div class="time"></div>'+
				'</div>'+
			'</div>'+
			'<div class="playlist hide"></div>'
		;
		self.image = container.querySelector('.image');
		self.title = container.querySelector('.title');
		self.btprev = container.querySelector('*[data=prev]');
		self.btplay = container.querySelector('*[data=play]');
		self.btnext = container.querySelector('*[data=next]');
		self.btplaylist = container.querySelector('*[data=list]');
		self.playlist = container.querySelector('.playlist');
		self.prwrap = container.querySelector('.barwrap');
		self.prcur = container.querySelector('.cursor');
		self.prtime = container.querySelector('.time');
		self.brplayed = container.querySelector('.played');
		self.audio = new Audio;
		if(self.options.image)
					self.image.innerHTML = '<img src="' + self.safeHTML(self.options.image) + '">';
		self.setSongs([]);
		self.bindEvents();
	},
	bindEvents: function() {
		var self = this;
		var cursorData = null;
		var evtHandler = new EventHandler(self.options.container);
		evtHandler.addListener(self.btplaylist, 'click', function(e) {
			this.classList.toggle('active');
			self.playlist.classList.toggle('hide');
		});
		evtHandler.addListener(self.btprev, 'click', function(e) {
			self.play(self.previous());
		});
		evtHandler.addListener(self.btnext, 'click', function(e) {
			self.play(self.next());
		});
		evtHandler.addListener(self.btplay, 'click', function(e) {
			if(self.current < 0)
				self.play(0);
			else if(self.audio.paused)
				self.audio.play();
			else
				self.audio.pause();
		});
		self.audio.addEventListener('ended', function(e) {
			self.play(self.next());
		}, false);
		self.audio.addEventListener('timeupdate', function(e) {
			var currentTime = this.currentTime;
			var duration = self.duration;
			if(!duration) duration = self.duration = this.duration;
			if(!cursorData) {
				var played = duration ? (currentTime / duration * 100) + '%' : 0;
				self.prcur.style.left = played;
				self.brplayed.style.width = played;
			}
			self.prtime.innerHTML = self.timestr(currentTime) + '/' + self.timestr(duration);
		}, false);
		var playStatusChange = function(e) {
			var status = ['play', 'pause'];
			if(e.type == 'pause') status.reverse();
			var playcls = self.btplay.classList;
			self.classes[status[0]].split(/\s+/).forEach(function(c){
				playcls.remove(c);
			});
			self.classes[status[1]].split(/\s+/).forEach(function(c){
				playcls.add(c);
			});
			self.image.classList[e.type=='play'?'add':'remove']('ge-roll');
		};
		self.audio.addEventListener('play', playStatusChange, false);
		self.audio.addEventListener('pause', playStatusChange, false);
		evtHandler.addListener(self.playlist, 'click', function(e) {
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
		evtHandler.addListener(self.prwrap, 'click', function(e) {
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
		evtHandler.addListener(self.prcur, 'mousedown', startMovingCursor);
		evtHandler.addListener(self.options.container, 'mousemove', movingCursor);
		evtHandler.addListener(self.options.container, 'mouseup', endMovingCursor);
		self.options.container.addEventListener('mouseleave', stopMovingCursor, false);
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
	/**
	 * songs should be a list of song objects:
	 * {
	 *   name: string
	 *   url: string
	 *   image: (optional) string
	 *   duration: (optional) int (seconds)
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
		self.duration = 0;
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
				self.title.innerHTML = self.safeHTML(song.name);
				self.audio.src = song.url;
				self.duration = song.duration ? song.duration / 1000 : null;
				var image = song.image || self.options.image;
				if(image)
					self.image.innerHTML = '<img src="' + self.safeHTML(image) + '">';
			}
			self.prtime.innerHTML = '';
			self.prcur.style.left = 0;
			self.brplayed.style.width = 0;
			self.audio.play();
		}
	},
	previous: function() {
		return (this.current - 1) % this.songs.length;
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
};
window.Player = Player;
