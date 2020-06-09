type SelectorFunc<S, R> = (inval: S, result?: R) => boolean;

/**
 *
 **/
export class ClassSelector<S, R> {
  private inval: S;
  private result?: R;

  static from<S>(inval: S) {
    return new ClassSelector(inval);
  }

  constructor(inval: S) {
    this.inval = inval;
    this.result = undefined;
  }

  on(condition: SelectorFunc<S, R>, result: R) {
    if(condition(this.inval, this.result)) { this.result = result; }
    return this;
  }

  catch(eresult: R) {
    return this.result !== undefined ? this.result : eresult;
  }
}
