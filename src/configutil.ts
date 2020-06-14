const MS_PER_SEC = 1000;
const DEFAULT_SECS = 0;
const DEFAULT_MSECS = 0;

/**
 *
 **/
export class ConfigUtil {
  static readString(str: string|undefined, fallback: string): string { return str !== undefined ? str : fallback; }

  static readBoolean(b: boolean|undefined, fallback: boolean): boolean { return b !== undefined ? b : fallback; }

  static readTimeout(ms: number|undefined, s: number|undefined, fallback: number): number {
    if(ms === undefined && s === undefined) { return fallback; }
    const sz = s !== undefined ? s : DEFAULT_SECS;
    const msz = ms !== undefined ? ms : DEFAULT_MSECS;
    return sz * MS_PER_SEC + msz;
  }
}
