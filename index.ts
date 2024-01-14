let buf = '<html><body><h1>hello</h1>';
const stream = new WritableStream({
  write(chunk) {
    const str = new TextDecoder().decode(chunk);
    buf += str;
    // console.log(str);
  },
});

const debugStream = new WritableStream({
  write(chunk) {
    const str = new TextDecoder().decode(chunk);
    // console.log('debug', str);
  },
});

// const proc = Bun.spawn(['minimodem', '-r', '300'], {
//   stderr: 'pipe',
// });
// proc.stdout.pipeTo(stream);
// proc.stderr.pipeTo(debugStream);


Bun.serve({
  fetch(req: Request) {
    let i = 0;
    const asyncIterator = (async function* () {
      while (true) {
        yield '<p>Iteration #: ' + i++ + '</p>';

        if (i === 10) {
          yield `
            <style>
              body {
                background-color: beige;
              }

              * {
                max-width: 600px;
                margin-left: auto;
                margin-right: auto;
                color: navy;
              }
            </style>
          `
        }

        if (i === 15) {
          yield `
            <script>alert('hello')</script>
          `
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
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
