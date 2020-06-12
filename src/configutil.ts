/**
 *
 **/
export class ConfigUtil {
  static readString(str: string|undefined, fallback: string) { return str !== undefined ? str : fallback.toString(); }

  static readBoolean(b: boolean|undefined, fallback: boolean) { return b !== undefined ? b : fallback; }

  static readTimeout(ms: number|undefined, s: number|undefined, fallback: number) {
    if(ms === undefined && s === undefined) { return fallback; }
    const sz = s !== undefined ? s : 0;
    const msz = ms !== undefined ? ms : 0;
    return sz * 1000 + msz;
  }
}
