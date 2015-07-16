/**
 * Lyric Parser
 * Parse lyrics and get lyric by time
 * @author Gerald <gera2ld@163.com>
 */
'use strict';
var binarySearch = function (array, value, start, end, compare) {
    var res = -1, l = start || 0, r = end || array.length - 1;
    if (!compare)compare = function (v) {
        return v;
    }
    while (l <= r) {
        var mid = (l + r) >> 1;
        if (compare(array[mid]) <= value) {
            l = mid + 1;
            res = mid;
        } else {
            r = mid - 1;
        }
    }
    return res;
}

function LyricParser() {
    this.data = [];
    this.last = 0;
}
LyricParser.prototype = {
    setLyric: function (lyric) {
        var data = this.data = [];
        this.last = 0;
        if (lyric) {
            var reg = /^\[([^\]]*)\]\s*(.*)$/;
            lyric.split(/\n/).forEach(function (line) {
                var m = line.match(reg);
                if (m) {
                    var t = 0;
                    m[1].split(/:/).forEach(function (part) {
                        t = t * 60 + Number(part);
                    });
                    data.push([t, m[2]]);
                }
            });
        }
    },
    getLyricAtTime: function (time) {
        var self = this;
        var data = self.data;
        var last = self.last;
        var line = data[last] || data[last = 0];
        var start = 0, end = 0;
        if (line) {
            if (line[0] < time) start = last;
            else end = last;
            last = binarySearch(data, time, start, end, function (o) {
                return o[0];
            });
            if (last == -1)last = data.length - 1;
            line = data[self.last = last];
        }
        return line ? line[1] : '';
    },
};
