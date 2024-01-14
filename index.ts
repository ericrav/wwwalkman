import { AsyncSubject } from "./AsyncSubject";
import { h } from "./utils";

let buf = '';

const state = {
  ready: new AsyncSubject<string>()
};
const stream = new WritableStream({
  write(chunk) {
    const str = new TextDecoder().decode(chunk);
    if (str === '�' || !str.trim()) return;
    buf += str;
  },
});

const debugStream = new WritableStream({
  write(chunk) {
    const str = new TextDecoder().decode(chunk);
    if (str.includes('NOCARRIER') && buf) {
      console.log('flushing!', buf)
      state.ready.resolve(buf);
      buf = '';
      state.ready = new AsyncSubject();
    }
  },
});

const proc = Bun.spawn(['minimodem', '-r', '600'], {
  stderr: 'pipe',
});
proc.stdout.pipeTo(stream);
proc.stderr.pipeTo(debugStream);


Bun.serve({
  fetch(req: Request) {
    const asyncIterator = (async function* () {
      yield '<html><body><h1>hello</h1>';

      while (true) {
        const data = await state.ready.promise;
        if (data) yield h(data);
      }
    })();

    const readable = new ReadableStream({
      async pull(controller) {
        const { value, done } = await asyncIterator.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      },
    });

    const res = new Response(readable);

    return res;
  },
  port: 1234,
});
