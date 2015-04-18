function Player(options) {
	this.options = options;
	this.init();
}
Player.prototype = {
	init: function() {
		var self = this;
		var container = self.options.container;
		container.classList.add('ge-player');
		container.innerHTML =
			'<div class="image"></div>'+
			'<div class="buttons">'+
				'<span class="fa fa-list"></span>'+
			'</div>'+
			'<div class="control">'+
				'<div class="title"></div>'+
				'<span data="prev" class="fa fa-step-backward"></span>'+
				'<span data="play" class="fa fa-play"></span>'+
				'<span data="next" class="fa fa-step-forward"></span>'+
			'</div>'+
			'<div class=progress>'+
				'<div class="wrap">'+
					'<div class="bar"></div>'+
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
		self.btplaylist = container.querySelector('.fa-list');
		self.playlist = container.querySelector('.playlist');
		self.prcur = container.querySelector('.cursor');
		self.prtime = container.querySelector('.time');
		self.audio = new Audio;
		self.setSongs([]);
		self.bindEvents();
	},
	bindEvents: function() {
		var self = this;
		self.btplaylist.addEventListener('click', function(e) {
			this.classList.toggle('active');
			self.playlist.classList.toggle('hide');
		}, false);
		self.btprev.addEventListener('click', function(e) {
			self.play(self.previous());
		}, false);
		self.btnext.addEventListener('click', function(e) {
			self.play(self.next());
		}, false);
		self.btplay.addEventListener('click', function(e) {
			if(self.audio.paused)
				self.audio.play();
			else
				self.audio.pause();
		}, false);
		self.audio.addEventListener('ended', function(e) {
			self.play(self.next());
		}, false);
		self.audio.addEventListener('timeupdate', function(e) {
			var currentTime = this.currentTime;
			var duration = self.duration || this.duration;
			self.prcur.style.left = duration ? (currentTime / duration * 100) + '%' : 0;
			self.prtime.innerHTML = self.timestr(currentTime) + '/' + self.timestr(duration);
		}, false);
		var playStatusChange = function(e) {
			var cmd = ['add', 'remove'];
			if(e.type == 'pause') cmd.reverse();
			var playcls = self.btplay.classList;
			playcls[cmd[1]]('fa-play');
			playcls[cmd[0]]('fa-pause');
			self.image.classList[cmd[0]]('ge-roll');
		};
		self.audio.addEventListener('play', playStatusChange, false);
		self.audio.addEventListener('pause', playStatusChange, false);
		self.playlist.addEventListener('click', function(e) {
			var i = Array.prototype.indexOf.call(this.childNodes, e.target);
			if(i >= 0) self.play(i);
		}, false);
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
		self.play(0);
	},
	play: function(i) {
		var self = this;
		var image = null;
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
				image = song.image;
			}
			self.prtime.innerHTML = '';
			self.prcur.style.left = 0;
			self.audio.play();
		}
		if(!image) image = self.options.image;
		if(image)
			self.image.innerHTML = '<img src="' + self.safeHTML(image) + '">';
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
