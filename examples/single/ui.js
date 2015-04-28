!function(){
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
				theme: 'simple',
			});
			var s=document.createElement('script');
			if(location.search=='?xiami')
				s.src='http://wsgi.oschina.mopaas.com/music/xiami/songs/1774005550?jsonp=init';
			else
				s.src='http://gerald.lan/~music/163/playlist/66163538?jsonp=init';
			s.onload=function(){document.body.removeChild(s);}
			document.body.appendChild(s);
		}
	}
	var player = null;
	var container = document.getElementById('player');
	var btLoad = document.getElementById('load');
	window.init = function(songs) {
		player.setSongs(songs);
		player.play(0);
	};
	btLoad.onclick = togglePlayer;
	togglePlayer();
}();
