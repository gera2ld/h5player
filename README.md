HTML5 Player
===

Usage
---
``` html
<script src="player-with-css.min.js"></script>
<div id="player"></div>
<script>
var player = new Player({
	container: document.getElementById('player'),
	// path of default image (used if image of current song is not assigned)
	image: 'http://example.com/path/to/default/image',
	// classes refers to the class names of corresponding buttons
	// default values requires font-awesome: http://fontawesome.io
	/*classes: {
		list: 'fa fa-list',
		prev: 'fa fa-step-forward',
		play: 'fa fa-play',
		next: 'fa fa-step-forward',
		pause: 'fa fa-pause',
	},*/
});
player.setSongs([
	{
		name: 'Song1',
		url: 'http://example.com/path/to/song1.mp3',
		// optional: length of song in seconds
		duration: 1024,
		// optional: image path of song
		image: 'http://example.com/path/to/image/of/song1.png',
	}, {
		name: 'Song2',
		url: 'http://example.com/path/to/song2.mp3',
	}
]);
player.play(0);
</script>
```

Examples
---
<http://gerald.top/code/h5player>

![snapshot](snapshots/player.png)
