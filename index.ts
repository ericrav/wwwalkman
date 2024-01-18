import { AsyncSubject } from "./AsyncSubject";
import { scrape } from "./scrape";
import { h } from "./utils";

const port = parseInt(process.env.PORT!) || 1234;
const baudRate = process.env.BAUD || '1200';

let buf = '';

const state = {
  ready: new AsyncSubject<string>()
};
const stream = new WritableStream({
  write(chunk) {
    const str = new TextDecoder().decode(chunk);
    if (str === '�' || !str.trim()) return;
    buf += str;
    if (buf.length >= 32) {
      state.ready.resolve(buf);
      buf = '';
      state.ready = new AsyncSubject();
    }
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

const proc = Bun.spawn(['minimodem', '-r', baudRate], {
  stderr: 'pipe',
});
proc.stdout.pipeTo(stream);
proc.stderr.pipeTo(debugStream);


Bun.serve({
  async fetch(req: Request) {
    const url = new URL(req.url);

    if (url.pathname === '/record') {
      await record(url.searchParams.get('url')!);
      return new Response('ok');
    }

    const asyncIterator = (async function* () {
      yield '<html>';

      while (true) {
        const data = await state.ready.promise;
        if (data) yield data;
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
  port,
});

async function record(siteUrl: string) {
  await scrape(siteUrl);

  const proc = Bun.spawn(['bash', './record.sh'], {
    // stderr: 'pipe',
  });

  await proc.exited;
}
