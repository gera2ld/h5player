const data = [{
  name: 'My Prayer',
  artist: 'Devotion',
  url: 'http://localhost:4000/Devotion%20-%20My%20Prayer.mp3',
}];
const container = document.querySelector('#players');
let single;
setMode(true);

document.querySelector('#mode>button')
.addEventListener('click', e => {
  setMode(!single);
}, false);

// custom events
document.addEventListener('PlayerEvent', e => {
  const { detail: { type, player } } = e;
  const title = [
    type === 'play' && player.songs[player.current].name,
    'H5Player',
  ].filter(Boolean).join(' - ');
  document.title = title;
}, false);

function setMode(value) {
  single = value;
  document.querySelector('#mode>span').textContent = value ? 'Single' : 'Multiple';
  if (value) initSingle();
  else initMultiple();
}

function reset() {
  container.innerHTML = '';
}

function initSingle() {
  reset();
  const player = addPlayer('normal');
  player.setSongs(data);
}

function initMultiple() {
  reset();
  first5 = data.slice(0, 5);
  first5.forEach(song => {
    const player = addPlayer('simple');
    player.setSongs([song]);
  });
}

function addPlayer(theme) {
  const div = document.createElement('div');
  container.appendChild(div);
  const player = new H5Player({
    theme,
    image: 'http://cn.gravatar.com/avatar/a0ad718d86d21262ccd6ff271ece08a3?s=130',
  });
  div.append(player.el);
  return player;
}
