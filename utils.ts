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

interface PipeAsync {
  <A>(value: A): Promise<A> | A;
  <A, B>(value: A, fn1: (input: A) => Promise<B> | B): Promise<B> | B;
  <A, B, C>(value: A, fn1: (input: A) => Promise<B> | B, fn2: (input: B) => Promise<C> | C): Promise<C> | C;
  <A, B, C, D>(
    value: A,
    fn1: (input: A) => Promise<B> | B,
    fn2: (input: B) => Promise<C> | C,
    fn3: (input: C) => Promise<D> | D
  ): Promise<D> | D;
  <A, B, C, D, E>(
    value: A,
    fn1: (input: A) => Promise<B> | B,
    fn2: (input: B) => Promise<C> | C,
    fn3: (input: C) => Promise<D> | D,
    fn4: (input: D) => Promise<E> | E
  ): Promise<E> | E;
  <A, B, C, D, E, F>(
    value: A,
    fn1: (input: A) => Promise<B> | B,
    fn2: (input: B) => Promise<C> | C,
    fn3: (input: C) => Promise<D> | D,
    fn4: (input: D) => Promise<E> | E,
    fn5: (input: E) => Promise<F> | F
  ): Promise<F> | F;
  <A, B, C, D, E, F, G>(
    value: A,
    fn1: (input: A) => Promise<B> | B,
    fn2: (input: B) => Promise<C> | C,
    fn3: (input: C) => Promise<D> | D,
    fn4: (input: D) => Promise<E> | E,
    fn5: (input: E) => Promise<F> | F,
    fn6: (input: F) => Promise<G> | G
  ): Promise<G> | G;
}

export const pipeAsync: PipeAsync = async (value: any, ...fns: Function[]): Promise<unknown> => {
  return fns.reduce(async (acc, fn) => fn(await acc), value);
}
