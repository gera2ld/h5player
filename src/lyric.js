function LyricParser() {
	this.data = [];
}
LyricParser.prototype = {
	setLyric: function(lyric) {
		var data = this.data = [];
		if(lyric) {
			var reg = /^\[([^\]]*)\]\s*(.*)$/;
			lyric.split(/\n/).forEach(function(line) {
				var m = line.match(reg);
				if(m) {
					var t = 0;
					m[1].split(/:/).forEach(function(part){
						t = t * 60 + Number(part);
					});
					data.push([t, m[2]]);
				}
			});
		}
	},
	getLyricAtTime: function(time) {
		var i, line;
		var data = this.data;
		var last = '';
		for(i = 0; i < data.length; i ++) {
			line = data[i];
			if(line[0] > time) break;
			last = line[1];
		}
		return last;
	},
};
