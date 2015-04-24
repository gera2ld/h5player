!function(){
var player = new Player({
	container: document.getElementById('player'),
	image: 'http://cn.gravatar.com/avatar/a0ad718d86d21262ccd6ff271ece08a3?s=130',
});
window.init = function(songs) {
	player.setSongs(songs);
	player.play(0);
};
var s=document.createElement('script');
if(location.search=='?xiami')
	s.src='http://wsgi.oschina.mopaas.com/music/xiami/songs/1774005550?jsonp=init';
else
	s.src='http://wsgi.oschina.mopaas.com/music/163/playlist/66163538?jsonp=init';
document.body.appendChild(s);
}();
