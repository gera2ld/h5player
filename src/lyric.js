/**
 * Lyric Parser
 * @desc Parse lyrics and get lyric by time
 * @author Gerald <gera2ld@163.com>
 */

const RE_LYRIC = /^\[([\d:.]+)\]\s*(.*)$/;

function getTime(str) {
  let time = 0;
  str.split(':').forEach(part => {
    time = time * 60 + (+part);
  });
  return time;
}

export default class LyricParser {
  constructor() {
    this.reset();
  }

  reset() {
    this.data = [];
    this.index = 0;
  }

  setLyric(lyric) {
    this.reset();
    const { data } = this;
    (lyric || '').split('\n')
    .forEach(line => {
      const matches = line.match(RE_LYRIC);
      if (matches) data.push([getTime(matches[1]), matches[2]]);
    });
  }

  getLyricByTime(time) {
    const { data } = this;
    let { index } = this;
    const last = data[index] || data[index = 0];
    if (last) {
      const step = last[0] > time ? -1 : 1;
      while (true) { // eslint-disable-line no-constant-condition
        const item = data[index];
        const next = data[index + 1];
        if ((!item || item[0] <= time) && (!next || next[0] > time)) break;
        index += step;
      }
    }
    const current = data[this.index = index];
    return current ? current[1] : '';
  }
}
