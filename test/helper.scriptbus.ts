import { I2CBus, I2CReadResult, I2CWriteResult } from './aod';

export type ScriptEntry = { method: string; parameters?: Array<number>, result?: number | string | I2CReadResult | I2CWriteResult };
export type Script = Array<ScriptEntry>;

export const EOS_SCRIPT: Script = [
  { method: 'throw', result: 'end of script' },
];
/**
 *
 */
export class ScriptBus implements I2CBus {
    private script: Script;
    private scriptIndex: number;

    static from(script: Script) {
      return new ScriptBus(script);
    }

    constructor(script: Script) {
      this.scriptIndex = 0;
      this.script = script;
    }

    get _bus() { return { _busNumber: -1 }; }
    get busNumber() { return this._bus._busNumber; }

    close(): void {
      const scriptNode = this.script[this.scriptIndex];
      if(scriptNode.method === 'throw') { throw new Error(scriptNode.result as string); }
      if(scriptNode.method !== 'close') {
        throw new Error('invalid script step #' + this.scriptIndex);
      }
      // console.log('C', scriptNode.parameters, address, cmd, length, buffer);
      this.scriptIndex += 1;
    }
    sendByte(address: number, byte: number): Promise<void> {
      const scriptNode = this.script[this.scriptIndex];
      if(scriptNode.method === 'throw') { throw new Error(scriptNode.result as string); }
      if(scriptNode.method !== 'sendByte') {
        throw new Error('invalid script step #' + this.scriptIndex);
      }
      // console.log('C', scriptNode.parameters, address, cmd, length, buffer);
      this.scriptIndex += 1;
      return Promise.resolve();
    }
    readI2cBlock(address: number, cmd: number, length: number, buffer: Buffer): Promise<import("../lib/i2c").I2CReadResult> {
      const scriptNode = this.script[this.scriptIndex];
      if(scriptNode.method === 'throw') { throw new Error(scriptNode.result as string); }
      if(scriptNode.method !== 'readI2cBlock') {
        throw new Error('invalid script step #' + this.scriptIndex);
      }
      // console.log('R', scriptNode.parameters, address, cmd, length, buffer);
      this.scriptIndex += 1;
      return Promise.resolve(scriptNode.result as I2CReadResult);
    }
    writeI2cBlock(address: number, cmd: number, length: number, buffer: Buffer): Promise<import("../lib/i2c").I2CWriteResult> {
      const scriptNode = this.script[this.scriptIndex];
      if(scriptNode.method === 'throw') { throw new Error(scriptNode.result as string); }
      if(scriptNode.method !== 'writeI2cBlock') {
        throw new Error('invalid script step #' + this.scriptIndex);
      }
      // console.log('W', scriptNode.parameters, address, cmd, length, buffer);
      this.scriptIndex += 1;
      return Promise.resolve(scriptNode.result as I2CWriteResult);
    }
    i2cRead(address: number, length: number, buffer: Buffer): Promise<import("../lib/i2c").I2CReadResult> {
      throw new Error("Method not implemented.");
    }
    i2cWrite(address: number, length: number, buffer: Buffer): Promise<import("../lib/i2c").I2CWriteResult> {
      throw new Error("Method not implemented.");
    }
  }