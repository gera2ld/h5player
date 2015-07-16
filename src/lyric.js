/**
 * Lyric Parser
 * Parse lyrics and get lyric by time
 * @author Gerald <gera2ld@163.com>
 */
'use strict';
function LyricParser() {
  this.data = [];
  this.last = 0;
}
LyricParser.prototype = {
  setLyric: function(lyric) {
    var data = this.data = [];
    this.last = 0;
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
    var self = this;
    var data = self.data;
    var last = self.last;
    var line = data[last] || data[last = 0];
    var next;
    if(line) {
      if(line[0] < time) {
        while((next = data[++ last]) && next[0] <= time)
          line = next;
        self.last = last - 1;
      } else {
        while(line && line[0] > time)
          line = data[-- last];
        self.last = last;
      }
    }
    return line ? line[1] : '';
  },
};
