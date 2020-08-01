import { I2CAddress, I2CBus, I2CBusNumber, I2CReadResult, I2CWriteResult } from './aod';

export type ScriptEntry = { method: string; parameters?: Array<number>, result?: number | string | I2CReadResult | I2CWriteResult };
export type Script = Array<ScriptEntry>;

export const EOS_SCRIPT: Script = [
  { method: 'throw', result: 'end of script' }
];
/**
 *
 */
export class I2CScriptBus implements I2CBus {
  readonly busNumber: I2CBusNumber;

  private script: Script;
  private scriptIndex: number;
  private debug: boolean;

  static openPromisified(busNumber: I2CBusNumber, script: Script): I2CBus {
    return new I2CScriptBus(busNumber, script);
  }

  constructor(busNumber: I2CBusNumber, script: Script) {
    this.busNumber = busNumber;
    this.scriptIndex = 0;
    this.script = script;
    this.debug = false;
  }

  private validate(name: string): ScriptEntry {
    const nextNode = this.script[this.scriptIndex];
    if(nextNode.method === 'debug') { this.debug = true; this.scriptIndex += 1; }
    if(nextNode.method === 'no-debug') { this.debug = false; this.scriptIndex += 1; }

    const scriptNode = this.script[this.scriptIndex];
    if(this.debug) { console.log(name, 'scriptNode:', scriptNode); }
    if(scriptNode.method === 'throw') { throw new Error(scriptNode.result as string); }
    if(scriptNode.method !== name) {
      throw new Error('invalid script step #' + this.scriptIndex);
    }
    this.scriptIndex += 1;
    return scriptNode;
  }

  close(): void {
    this.validate('close');
  }

  sendByte(address: I2CAddress, byte: number): Promise<void> {
    this.validate('sendByte');
    return Promise.resolve();
  }

  readI2cBlock(address: number, cmd: number, length: number, buffer: Buffer): Promise<I2CReadResult> {
    const scriptNode = this.validate('readI2cBlock');
    return Promise.resolve(scriptNode.result as I2CReadResult);
  }

  writeI2cBlock(address: number, cmd: number, length: number, buffer: Buffer): Promise<I2CWriteResult> {
    const scriptNode = this.validate('writeI2cBlock');
    return Promise.resolve(scriptNode.result as I2CWriteResult);
  }

  i2cRead(address: number, length: number, buffer: Buffer): Promise<I2CReadResult> {
    const scriptNode = this.validate('i2cRead');
    return Promise.resolve(scriptNode.result as I2CReadResult);
  }

  i2cWrite(address: number, length: number, buffer: Buffer): Promise<I2CWriteResult> {
    const scriptNode = this.validate('i2cWrite');
    return Promise.resolve(scriptNode.result as I2CWriteResult);
  }
}
