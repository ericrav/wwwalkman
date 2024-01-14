import { AsyncSubject } from "./AsyncSubject";

let buf = '';

const state = {
  ready: new AsyncSubject()
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
    console.log('debug', str);
    if (str.includes('NOCARRIER')) {
      console.log('flushing!', buf)
      state.ready.resolve();
      state.ready = new AsyncSubject();
    }
  },
});

const proc = Bun.spawn(['minimodem', '-r', '500'], {
  stderr: 'pipe',
});
proc.stdout.pipeTo(stream);
proc.stderr.pipeTo(debugStream);


Bun.serve({
  fetch(req: Request) {
    const asyncIterator = (async function* () {
      yield '<html><body><h1>hello</h1>';

      while (true) {
        await state.ready.promise;
        console.log('yielding');
        if (buf) yield buf;
        buf = '';

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
