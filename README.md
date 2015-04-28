HTML5 Player
===
![Bower](https://img.shields.io/bower/v/h5player.svg)

Installation
---
``` sh
$ bower install h5player
```

Usage
---
``` html
<script src="player-with-css.min.js"></script>
<div id="player"></div>
<script>
var player = new Player({
	container: document.getElementById('player'),
	image: 'http://example.com/path/to/default/image',
});
player.setSongs([
	{
		name: 'Song1',
		url: 'http://example.com/path/to/song1.mp3',
	}, {
		name: 'Song2',
		url: 'http://example.com/path/to/song2.mp3',
	}
]);
player.play(0);
</script>
```

Document
---
After loading `dist/player-with-css.min.js`, there will be a global variable `Player`.

Each player is built with `new Player(options)`. *options* is an object with properties below:

* container: *required*  
  refer to a DOM element to hold the player panel.

* image: *optional*  
	path to the default image, shown when no image is assigned for the current song.
	The recommended size is 130 * 130.

* smallimage: *optional*  
  path to the default small image, shown when no image is assigned for the current song in **simple** theme.
	The recommended size is 34 * 34.

* theme: *optional*  
  currently there are two themes available: **simple** and **normal**. The default value is **normal**.

* classes: *optional*  
  refer to a dict with custom classes of each button, the default values are:
	``` javascript
classes: {
	list: 'fa fa-list',
	prev: 'fa fa-step-forward',
	play: 'fa fa-play',
	next: 'fa fa-step-forward',
	pause: 'fa fa-pause',
}
	```
	Notice: the default values require [Font-Awesome](http://fontawesome.io).

The `Player` object has following methods:

* setSongs(*Array* songs)  
  set playlist for the player, *songs* is a list of `object`s with properties below:
	* name: *required*  
	  string, the name of the song.
	* url: *required*  
	  string, a downloadable URL.
	* artist: *optional*  
	  string, the artist name.
	* duration: *optional*  
	  integer, length of the song in seconds.
	* image: *optional*  
	  string, path to the image (130 * 130 recommended) of the song.
	* smallimage: *optional*  
	  string, path to the small image (34 * 34 recommended) of the song, which is used in **simple** theme.
	* lyric: *optional*  
	  string, lyric data of the song. The data may be something like `[00:00]foo\n[00:05]bar\n...`.
	* lyricjsonp: *optional*  
	  string, a JSONP URL to be used if *lyric* is not provided. If *lyricjsonp* is `http://example.com/path/to/lyric`, the request URL will be `http://example.com/path/to/lyric?jsonp=randomCallbackName`.

* play(*int* index)  
  start playing the *index*-th song.

Cases
---
* <http://gerald.top/code/h5player>

Snapshots
---
Normal theme:

![snapshot](snapshots/normal.png)

Simple theme: (multiple players)

![snapshot](snapshots/simple.png)
