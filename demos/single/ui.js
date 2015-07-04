!function(){
  function injectScript(src) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = function () {
      document.body.removeChild(s);
    };
    document.body.appendChild(s);
  }

	function togglePlayer() {
		if(player) {
			btLoad.innerHTML = 'Turn On';
			player.destroy();
			player = null;
		} else {
			btLoad.innerHTML = 'Turn Off';
			player = new Player({
				container: container,
				image: 'http://cn.gravatar.com/avatar/a0ad718d86d21262ccd6ff271ece08a3?s=130',
        lyricCallback: function (song, cb) {
          var jsonp = 'getLyric_' + song.id;
          var getLyric = function (ret) {
            delete window[jsonp];
            if (ret.code == 200) cb(ret.lyric);
          };
          window[jsonp] = getLyric;
          injectScript('http://gerald.top/~music/163/lyric/' + encodeURIComponent(song.id) + '?jsonp=' + encodeURIComponent(jsonp));
        },
			});
      injectScript('http://gerald.top/~music/163/playlist/66163538?jsonp=init');
		}
	}
	var player = null;
	var container = document.getElementById('player');
	var btLoad = document.getElementById('load');

	// custom events
	document.addEventListener('PlayerEvent', function(e) {
		var detail = e.detail, title = '';
		if (detail.type == 'play')
			title = detail.player.songs[detail.player.current].name + ' - ';
		title += 'Music Player';
		document.title = title;
	}, false);

	window.init = function(songs) {
		player.setSongs(songs);
		player.play(0);
	};
	btLoad.onclick = togglePlayer;
	togglePlayer();
}();
