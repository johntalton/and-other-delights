import { I2CAddress, I2CBus, I2CBusNumber, I2CReadResult, I2CWriteResult } from './aod';

export type ScriptEntry = { method: string; parameters?: Array<number>, result?: number | string | I2CReadResult | I2CWriteResult };
export type Script = Array<ScriptEntry>;

export const EOS_SCRIPT: Script = [
  { method: 'throw', result: 'end of script' }
];
/**
 *
 */
export class ScriptBus implements I2CBus {
    readonly busNumber: I2CBusNumber;

    private script: Script;
    private scriptIndex: number;

    static openPromisified(busNumber: I2CBusNumber, script: Script): I2CBus {
      return new ScriptBus(busNumber, script);
    }

    constructor(busNumber: I2CBusNumber, script: Script) {
      this.busNumber = busNumber;
      this.scriptIndex = 0;
      this.script = script;
    }

    close(): void {
      const scriptNode = this.script[this.scriptIndex];
      if(scriptNode.method === 'throw') { throw new Error(scriptNode.result as string); }
      if(scriptNode.method !== 'close') {
        throw new Error('invalid script step #' + this.scriptIndex);
      }
      this.scriptIndex += 1;
    }

    sendByte(address: I2CAddress, byte: number): Promise<void> {
      const scriptNode = this.script[this.scriptIndex];
      if(scriptNode.method === 'throw') { throw new Error(scriptNode.result as string); }
      if(scriptNode.method !== 'sendByte') {
        throw new Error('invalid script step #' + this.scriptIndex);
      }
      this.scriptIndex += 1;
      return Promise.resolve();
    }

    readI2cBlock(address: number, cmd: number, length: number, buffer: Buffer): Promise<I2CReadResult> {
      const scriptNode = this.script[this.scriptIndex];
      if(scriptNode.method === 'throw') { throw new Error(scriptNode.result as string); }
      if(scriptNode.method !== 'readI2cBlock') {
        throw new Error('invalid script step #' + this.scriptIndex);
      }
      // console.log('R', scriptNode.parameters, address, cmd, length, buffer);
      this.scriptIndex += 1;
      return Promise.resolve(scriptNode.result as I2CReadResult);
    }

    writeI2cBlock(address: number, cmd: number, length: number, buffer: Buffer): Promise<I2CWriteResult> {
      const scriptNode = this.script[this.scriptIndex];
      if(scriptNode.method === 'throw') { throw new Error(scriptNode.result as string); }
      if(scriptNode.method !== 'writeI2cBlock') {
        throw new Error('invalid script step #' + this.scriptIndex);
      }
      // console.log('W', scriptNode.parameters, address, cmd, length, buffer);
      this.scriptIndex += 1;
      return Promise.resolve(scriptNode.result as I2CWriteResult);
    }

    i2cRead(address: number, length: number, buffer: Buffer): Promise<I2CReadResult> {
      throw new Error('Method not implemented.');
    }

    i2cWrite(address: number, length: number, buffer: Buffer): Promise<I2CWriteResult> {
      throw new Error('Method not implemented.');
    }
  }