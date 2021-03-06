/* eslint-disable fp/no-unused-expression */
/* eslint-disable no-undefined */
import { I2CAddress, I2CBufferSource, I2CBus } from './i2c'

const BASE_16 = 16

export type ABOptions = {
  sharedReadBuffer?: I2CBufferSource,
  allocOnRead: boolean,
  allowMixedReadBuffers: boolean,
  maxReadLength: number
  maxWriteLength: number,
  validateReadWriteLengths: boolean

}

const WARN_READ_LENGTH = 32
const WARN_WRITE_LENGTH = 32


function assertBufferSource(bs: I2CBufferSource) {
  if(bs === undefined) {
    throw new Error('bufferSource undefined')
  }
  const isView = ArrayBuffer.isView(bs)
  const isAB = bs instanceof ArrayBuffer

  if(!isView && !isAB) {
    throw new Error('bufferSource is not ArrayBuffer or ArrayBufferView')
  }
}

/**
 * I2CBus layer providing address encapsulation.
 **/
export class I2CAddressedBus {
  private readonly address: I2CAddress
  private readonly bus: I2CBus
  private readonly options: ABOptions

  static from(bus: I2CBus, address: I2CAddress, options?: Partial<ABOptions>): I2CAddressedBus {
    return new I2CAddressedBus(bus, address, options)
  }

  constructor(bus: I2CBus, address: I2CAddress, options: Partial<ABOptions> = { allocOnRead: true }) {
    this.address = address
    this.bus = bus

    this.options = {
      sharedReadBuffer: options.sharedReadBuffer ?? undefined,
      allocOnRead: options.allocOnRead === true,
      allowMixedReadBuffers: false,
      maxReadLength: WARN_READ_LENGTH,
      maxWriteLength: WARN_WRITE_LENGTH,
      validateReadWriteLengths: true
    }
  }

  get name(): string {
    return this.bus.name + ':0x' + this.address.toString(BASE_16)
  }

  private _getReadBuffer(length: number, readBufferSource?: I2CBufferSource): I2CBufferSource {
    const hasOptionsBuffer = this.options.sharedReadBuffer !== undefined

    if(readBufferSource !== undefined && !(hasOptionsBuffer && !this.options.allowMixedReadBuffers)) {
      return readBufferSource
    }

    if(this.options.sharedReadBuffer !== undefined) {
      return this.options.sharedReadBuffer
    }

    if(this.options.allocOnRead) {
      return new ArrayBuffer(length)
    }

    throw new Error('no provided read buffer and allocation disabled')
  }

  close(): void { return this.bus.close() }

  async readI2cBlock(cmd: number, length: number, readBufferSource?: I2CBufferSource): Promise<ArrayBuffer> {
    if(length > this.options.maxReadLength) {
      throw new Error('read length greater then max configured')
    }

    const readBuffer = this._getReadBuffer(length, readBufferSource)

    const { bytesRead, buffer } = await this.bus.readI2cBlock(this.address, cmd, length, readBuffer)

    if(this.options.validateReadWriteLengths && bytesRead !== length) {
      throw new Error('read length mismatch - ' + bytesRead + ' / ' + length)
    }

    //
    return buffer.slice(0, bytesRead)
  }

  async writeI2cBlock(cmd: number, bufferSource: I2CBufferSource): Promise<void> {
    assertBufferSource(bufferSource)

    if(bufferSource.byteLength > this.options.maxWriteLength) {
      throw new Error('write length greater then max configured')
    }

    const { bytesWritten } = await this.bus.writeI2cBlock(this.address, cmd, bufferSource.byteLength, bufferSource)

    if(this.options.validateReadWriteLengths && bytesWritten !== bufferSource.byteLength) {
      throw new Error('write length mismatch: ' + bytesWritten + '/' + bufferSource.byteLength)
    }
  }

  async sendByte(value: number): Promise<void> {
    await this.bus.sendByte(this.address, value)
  }

  async i2cRead(length: number, readBufferSource?: I2CBufferSource): Promise<ArrayBuffer> {
    const readBuffer = this._getReadBuffer(length, readBufferSource)

    const { bytesRead, buffer } = await this.bus.i2cRead(this.address, length, readBuffer)

    if(this.options.validateReadWriteLengths && bytesRead !== length) {
      throw new Error('read length mismatch: ' + bytesRead + '/' + length)
    }

    //
    return buffer.slice(0, bytesRead)
  }

  async i2cWrite(bufferSource: I2CBufferSource): Promise<void> {
    assertBufferSource(bufferSource)

    const { bytesWritten } = await this.bus.i2cWrite(this.address, bufferSource.byteLength, bufferSource)

    if(this.options.validateReadWriteLengths && bytesWritten !== bufferSource.byteLength) {
      throw new Error('write length mismatch')
    }
  }
}
