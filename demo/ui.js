fetch('/ne/playlist/66163538')
.then(res => res.json())
.then(data => {
  var container = document.querySelector('#players');
  var single;
  var players = [];
  setMode(true);

  document.querySelector('#mode>button').addEventListener('click', e => {
    setMode(!single);
  }, false);

  // custom events
  document.addEventListener('PlayerEvent', e => {
    var detail = e.detail, title = '';
    if (detail.type == 'play')
      title = detail.player.songs[detail.player.current].name + ' - ';
    title += 'H5Player';
    document.title = title;
  }, false);

  function setMode(_single) {
    single = _single;
    document.querySelector('#mode>span').innerHTML = single ? 'Single' : 'Multiple';
    single ? initSingle() : initMultiple();
  }

  function reset() {
    container.innerHTML = '';
    players.forEach(player => player.destroy());
    players = [];
  }

  function initSingle() {
    reset();
    var player = addPlayer('normal');
    player.setSongs(data);
  }

  function initMultiple() {
    reset();
    first5 = data.slice(0, 5);
    first5.forEach(song => {
      var player = addPlayer('simple');
      player.setSongs([song]);
    });
  }

  function addPlayer(theme) {
    var div = document.createElement('div');
    container.appendChild(div);
    var player = new h5player.Player({
      container: div,
      image: 'http://cn.gravatar.com/avatar/a0ad718d86d21262ccd6ff271ece08a3?s=130',
      theme: theme,
      lyricCallback: lyricCallback,
    });
    players.push(player);
    return player;
  }

  function lyricCallback(song, cb) {
    fetch(`/ne/lyric/${song.id}`)
    .then(res => res.json())
    .then(data => cb(data.lyric));
  }
});
