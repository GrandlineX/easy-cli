import moment from 'moment';
import process from 'process';

function p(num: number) {
  return num < 10 ? `0${num}` : `${num}`;
}

export default class ProgressBar {
  private startDate: Date;

  private lastDate: Date | null = null;

  private cur: number;

  private end: number;

  private info: string | null = null;

  constructor(end: number = 1) {
    this.startDate = new Date();
    this.cur = 0;
    this.end = end;
  }

  setEnd(end: number) {
    this.end = end;
    this.update();
  }

  setState(cur: number, info: string | null) {
    this.cur = cur;
    this.info = info;
    this.update();
  }

  private update() {
    const perc = (this.cur / this.end) * 100;
    const int = Math.trunc(perc);
    const dev = int;

    const curDate = new Date();
    const curSec = curDate.getTime() - this.startDate.getTime();
    const cur = moment.duration(curSec, 'millisecond');
    let time = '';
    if (this.lastDate !== null && perc > 0) {
      const p1 = curSec / perc;
      const e = moment.duration(p1 * 100, 'millisecond');
      time = ` (${p(Math.trunc(cur.asMinutes()))}:${p(cur.seconds())}/${p(
        Math.trunc(e.asMinutes()),
      )}:${p(e.seconds())})`;
    }
    let bar = '';
    for (let j = 0; j < 100; j += 1) {
      if (j < dev) {
        bar += '#';
      } else {
        bar += ' ';
      }
    }
    const txt = `Processing: [${bar}] ${perc.toFixed(2)}%${time}${this.info}`;
    process.stdout.write(`${txt}\r`);
    this.lastDate = curDate;
  }
}
