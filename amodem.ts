import { AsyncSubject } from "./AsyncSubject";
import { h } from "./utils";

const port = parseInt(process.env.PORT!) || 80;

let buf = '';


const stream = new WritableStream({
  write(chunk) {
    const str = new TextDecoder().decode(chunk);
    // if (str === '�' || !str.trim()) return;
    buf += str;
  },
});


console.log('start');
const proc = Bun.spawn(['bash', './amodem.sh'], {
  // stderr: 'pipe',
  // stderr: 'ignore',
  env: {
    ...process.env,
    BITRATE: '48',
  },
});

proc.stdout.pipeTo(stream);

await proc.exited;

console.log('\n\n\n\n')
console.log(buf)
console.log('\n\n\n\nfin')
