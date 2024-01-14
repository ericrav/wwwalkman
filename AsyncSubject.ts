export class AsyncSubject<T = void> {
  promise: Promise<T>;
  resolve: (value: T) => void = () => {};

  constructor() {
    this.promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
  }
}
