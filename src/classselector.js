/**
 *
 **/
class ClassSelector {
  static from(inval) {
    return new ClassSelector(inval);
  }

  constructor(inval) {
    this.inval = inval;
    this.result = undefined;
  }

  on(condition, result) {
    if(condition(this.inval, this.result)) { this.result = result; }
    return this;
  }

  catch(eresult) {
    return this.result !== undefined ? this.result : eresult;
  }
}

module.exports = { ClassSelector };
