import { AsyncSubject } from "./AsyncSubject";
import { h } from "./utils";

const port = parseInt(process.env.PORT!) || 80;


const state = {
  ready: new AsyncSubject<string>()
};


async function runAmodemScript() {
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
      // BITRATE: '24',
    },
  });

  proc.stdout.pipeTo(stream);

  await proc.exited;

  console.log(buf);

  state.ready.resolve(buf);
  state.ready = new AsyncSubject();
}

async function amodem() {
  while (true) {
    await runAmodemScript();
  }
}

Bun.serve({
  fetch(req: Request) {
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

amodem()
