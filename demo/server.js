const http = require('http');
const koa = require('koa');
const mount = require('koa-mount');
const send = require('koa-send');

const app = koa();
const PORT = 4009;

app.use(mount('/ne/playlist/', function* (next) {
  const playlist_id = this.request.path;
  if (/^\w+$/.test(playlist_id)) {
    const data = yield getJson(`http://music.163.com/api/playlist/detail?id=${playlist_id}`);
    this.body = getSongs(data.result.tracks);
  }
}));

app.use(mount('/ne/lyric/', function* (next) {
  const song_id = this.request.path;
  if (/^\w+$/.test(song_id)) {
    const data = yield getJson(`http://music.163.com/api/song/media?id=${song_id}`);
    this.body = data;
  }
}));

app.use(function* (next) {
  var path = this.path;
  if (path === '/dist/player.js') {
    yield send(this, path, {root: __dirname + '/..'});
  } else {
    if (path.endsWith('/')) path += 'index.html';
    yield send(this, path, {root: __dirname});
  }
});

app.listen(PORT, () => console.log(`Listen at ${PORT}...`));

function getSongs(tracks) {
  return tracks.map(track => ({
    id: track.id,
    name: track.name,
    url: track.mp3Url,
    duration: track.duration,
    image: track.album.picUrl + '?param=130y130',
    artist: track.artists[0].name,
  }));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      var data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('error', err => reject(err));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
  });
}
