import { I2CBus, I2CBusNumber, I2CReadResult, I2CWriteResult } from './aod'

export class ThrowBus implements I2CBus {
  public busNumber: number
  private err: Error

  static openPromisified(busNumber: I2CBusNumber): Promise<I2CBus> {
    return Promise.resolve(new ThrowBus(busNumber))
  }

  constructor(busNumber: I2CBusNumber) {
    this.busNumber = busNumber
    this.err = new Error('throw bus #' + busNumber)
  }

  close(): void { throw this.err }
  sendByte(address: number, byte: number): Promise<void> { throw this.err }
  readI2cBlock(address: number, cmd: number, length: number, buffer: Buffer): Promise<I2CReadResult> { throw this.err }
  writeI2cBlock(address: number, cmd: number, length: number, buffer: Buffer): Promise<I2CWriteResult> { throw this.err }
  i2cRead(address: number, length: number, buffer: Buffer): Promise<I2CReadResult> { throw this.err }
  i2cWrite(address: number, length: number, buffer: Buffer): Promise<I2CWriteResult> { throw this.err }
}
