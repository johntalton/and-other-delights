import { I2CAddress, I2CBufferSource, I2CBus, I2CReadResult, I2CWriteResult } from './aod'

export type ScriptEntry = {
  method: string,
  parameters?: Array<number>,
  result?: number | string | I2CReadResult | I2CWriteResult
}
export type Script = Array<ScriptEntry>

export const EOS_SCRIPT: Script = [
  { method: 'throw', result: 'end of script' }
]
/**
 *
 */
export class I2CScriptBus implements I2CBus {
  readonly _name: string

  private script: Script
  private scriptIndex: number
  private debug: boolean

  static async openPromisified(script: Script): Promise<I2CBus> {
    return Promise.resolve(new I2CScriptBus(script))
  }

  constructor(script: Script) {
    this._name = '__unnamed__'
    this.scriptIndex = 0
    this.script = script
    this.debug = false
  }

  get name(): string { return this._name }

  private validate(name: string): ScriptEntry {
    const nextNode = this.script[this.scriptIndex]
    if(nextNode.method === 'debug') { this.debug = true; this.scriptIndex += 1 }
    if(nextNode.method === 'no-debug') { this.debug = false; this.scriptIndex += 1 }

    const scriptNode = this.script[this.scriptIndex]
    if(this.debug) { console.log(name, 'scriptNode:', scriptNode) }
    if(scriptNode.method === 'throw') { throw new Error(scriptNode.result as string) }
    if(scriptNode.method !== name) {
      throw new Error('invalid script step #' + this.scriptIndex)
    }
    this.scriptIndex += 1
    return scriptNode
  }

  close(): void {
    this.validate('close')
  }

  async sendByte(_address: I2CAddress, _byte: number): Promise<void> {
    this.validate('sendByte')
    return Promise.resolve()
  }

  async readI2cBlock(_address: I2CAddress, _cmd: number, _length: number, _bufferSource: I2CBufferSource): Promise<I2CReadResult> {
    console.log('readI2cBlock')
    const scriptNode = this.validate('readI2cBlock')
    return Promise.resolve(scriptNode.result as I2CReadResult)
  }

  async writeI2cBlock(_address: I2CAddress, _cmd: number, _length: number, _bufferSource: I2CBufferSource): Promise<I2CWriteResult> {
    const scriptNode = this.validate('writeI2cBlock')
    return Promise.resolve(scriptNode.result as I2CWriteResult)
  }

  async i2cRead(_address: I2CAddress, _length: number, _bufferSource: I2CBufferSource): Promise<I2CReadResult> {
    const scriptNode = this.validate('i2cRead')
    return Promise.resolve(scriptNode.result as I2CReadResult)
  }

  async i2cWrite(_address: I2CAddress, _length: number, _bufferSource: I2CBufferSource): Promise<I2CWriteResult> {
    const scriptNode = this.validate('i2cWrite')
    return Promise.resolve(scriptNode.result as I2CWriteResult)
  }
}
