import { AsyncSubject } from "./AsyncSubject";
import { scrape } from "./scrape";
import { h } from "./utils";

const port = parseInt(process.env.PORT!) || 1234;
const baudRate = process.env.BAUD || '1200';

let buf = '';

const scrollingScript = `<script>
let interval = setInterval(() => {
  window.scrollTo(0, document.body.scrollHeight);
}, 1000);

let timeout;
document.addEventListener('scroll', () => {
  clearInterval(interval);
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    const delay = (window.scrollTop)
    interval = setInterval(() => {
      window.scrollTo(0, document.body.scrollHeight);
    }, 1000);
  }, 1200);
});

</script>`;

const state = {
  ready: new AsyncSubject<string>()
};
const stream = new WritableStream({
  write(chunk) {
    const str = new TextDecoder().decode(chunk);
    if (str === '�') return;
    buf += str;
    if (buf.length >= 32) {
      console.log(buf)
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
      console.log(buf)
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
      const siteParam = url.searchParams.get('url');

      if (!siteParam) {
        return new Response(Bun.file('./record.html'))
      }

      return await record(siteParam, req);
    }

    const asyncIterator = (async function* () {
      yield '<html>' + scrollingScript;

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

async function record(siteUrl: string, req: Request) {
  console.log('\nRequesting ' + siteUrl);
  await scrape(siteUrl);
  console.log('\nRecording started');

  const proc = Bun.spawn(['minimodem', '-t', baudRate], {
    stdin: Bun.file('./html/output.html')
  });

  req.signal.onabort = () => {
    console.log('request aborted');
    proc.kill();
  }

  let keepSending = true;

  const asyncIterator = (async function* () {
    yield `
    <html>
      <body>
      <p>Recording...</p>
      <br />
      <button onclick="stop()">Stop</button>
    `;

    while (keepSending) {
      const data = await state.ready.promise;
      if (data) yield data;
    }

    yield `<p>Done recording ${siteUrl}!</p></body></html>`
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

  proc.exited.then(() => {
    console.log(`Done recording ${siteUrl}!`);
    keepSending = false;
  })

  return res;
}
