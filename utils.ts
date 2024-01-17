import sanitize from 'sanitize-html';

export const h = (str: string) =>
  sanitize(str, {
    allowVulnerableTags: true,
    allowedTags: sanitize.defaults.allowedTags.concat(['script', 'style']),
    disallowedTagsMode: 'escape',
    allowedSchemes: ['data', 'http'],
  });

// from https://dev.to/nexxeln/implementing-the-pipe-operator-in-typescript-30ip
interface Pipe {
  <A>(value: A): A;
  <A, B>(value: A, fn1: (input: A) => B): B;
  <A, B, C>(value: A, fn1: (input: A) => B, fn2: (input: B) => C): C;
  <A, B, C, D>(
    value: A,
    fn1: (input: A) => B,
    fn2: (input: B) => C,
    fn3: (input: C) => D
  ): D;
  <A, B, C, D, E>(
    value: A,
    fn1: (input: A) => B,
    fn2: (input: B) => C,
    fn3: (input: C) => D,
    fn4: (input: D) => E
  ): E;
  <A, B, C, D, E, F>(
    value: A,
    fn1: (input: A) => B,
    fn2: (input: B) => C,
    fn3: (input: C) => D,
    fn4: (input: D) => E,
    fn5: (input: E) => F
  ): F;
  <A, B, C, D, E, F, G>(
    value: A,
    fn1: (input: A) => B,
    fn2: (input: B) => C,
    fn3: (input: C) => D,
    fn4: (input: D) => E,
    fn5: (input: E) => F,
    fn6: (input: F) => G
  ): G;
}

export const pipe: Pipe = (value: any, ...fns: Function[]): unknown => {
  return fns.reduce((acc, fn) => fn(acc), value);
};
