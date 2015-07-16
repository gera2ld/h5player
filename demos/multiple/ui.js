!function(){
  window.init = function(songs) {
    for(var i = 0; i < songs.length && i < 5; i ++) {
      var p = document.createElement('div');
      players.appendChild(p);
      var player = new Player({
        container: p,
        image: 'http://cn.gravatar.com/avatar/a0ad718d86d21262ccd6ff271ece08a3?s=130',
        theme: 'simple',
      });
      player.setSongs([songs[i]]);
    }
  };
  var players = document.getElementById('players');

  // custom events
  document.addEventListener('PlayerEvent', function(e) {
    var detail = e.detail, title = '';
    if (detail.type == 'play')
      title = detail.player.songs[detail.player.current].name + ' - ';
    title += 'Music Player';
    document.title = title;
  }, false);

  var s=document.createElement('script');
  s.src='http://gerald.top/~music/163/playlist/66163538?jsonp=init';
  s.onload=function(){document.body.removeChild(s);}
  document.body.appendChild(s);
}();
