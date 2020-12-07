type SelectorFunc<S, R> = (inval: S, result?: R) => boolean;

/**
 *
 **/
export class ClassSelector<S, R> {
  private inval: S;
  private result?: R;

  static from<U, V>(inval: U): ClassSelector<U, V> {
    return new ClassSelector(inval);
  }

  constructor(inval: S) {
    this.inval = inval;
    this.result = undefined;
  }

  on(condition: SelectorFunc<S, R>, result: R): ClassSelector<S, R> {
    if(condition(this.inval, this.result)) { this.result = result; }
    return this;
  }

  catch(eresult: R): R {
    return this.result !== undefined ? this.result : eresult;
  }
}
