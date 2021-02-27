import { I2CAddress, I2CBufferSource, I2CBus } from './aod'

const WARN_READ_LENGTH = 32
const WARN_WRITE_LENGTH = 32

const DEFAULT_FILL = 0

function assertBufferSource(bs) {
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
 * Wraps an `I2CBus` to provide address and buffer management.
 **/
interface I2CManagedBus {
  readonly name: string

  close(): void

  readI2cBlock(cmd: number, length: number): Promise<ArrayBuffer>
  writeI2cBlock(cmd: number, bufferSource: I2CBufferSource): Promise<void>

  sendByte(cmd: number): Promise<void>
  i2cRead(length: number): Promise<ArrayBuffer>
  i2cWrite(bufferSource: I2CBufferSource): Promise<void>
}

/**
 * Basic and simple implementation of the `I2CManagedBus` interface.
 **/
export class I2CAddressedBus implements I2CManagedBus {
  private readonly _address: I2CAddress
  private readonly _bus: I2CBus
  private readonly _sharedReadBuffer?: I2CBufferSource

  static async from(bus: I2CBus, address: I2CAddress): Promise<I2CManagedBus> {
    return Promise.resolve(Object.freeze(new I2CAddressedBus(bus, address)))
  }

  constructor(i2cBus: I2CBus, address: I2CAddress, sharedReadBuffer?: I2CBufferSource) {
    this._address = address
    this._bus = i2cBus
    this._sharedReadBuffer = sharedReadBuffer // shared buffer for reading
  }

  get name(): string {
    return this._bus.name + ':0x' + this._address.toString(16)
  }

  private _getReadBuffer(length: number, _fill = DEFAULT_FILL): I2CBufferSource {
    // not using shared buffer, allocate a new instance now
    if(this._sharedReadBuffer === undefined) {
      return new ArrayBuffer(length)
    }

    // return shared buffer if its large enough
    if(length > this._sharedReadBuffer.byteLength) {
      throw new Error('shared buffer to small')
    }

    return this._sharedReadBuffer
  }

  close(): void { return this._bus.close() }

  async readI2cBlock(cmd: number, length: number): Promise<ArrayBuffer> {
    if(length > WARN_READ_LENGTH) { console.warn('over max recommended r length', length) }
    const { bytesRead, buffer } = await this._bus.readI2cBlock(this._address, cmd, length, this._getReadBuffer(length))
    if(bytesRead !== length) { throw new Error('read length mismatch') }
    return buffer.slice(0, bytesRead)
  }

  async writeI2cBlock(cmd: number, bufferSource: I2CBufferSource): Promise<void> {
    assertBufferSource(bufferSource)

    if(bufferSource.byteLength > WARN_WRITE_LENGTH) { console.warn('over max recommend w length') }
    const { bytesWritten } = await this._bus.writeI2cBlock(this._address, cmd, bufferSource.byteLength, bufferSource)
    if(bytesWritten !== bufferSource.byteLength) {
      throw new Error('write length mismatch: ' + bytesWritten + '/' + bufferSource.byteLength)
    }
  }

  async sendByte(value: number): Promise<void> {
    await this._bus.sendByte(this._address, value)
  }

  async i2cRead(length: number): Promise<ArrayBuffer> {
    const { bytesRead, buffer } = await this._bus.i2cRead(this._address, length, this._getReadBuffer(length))
    if(bytesRead !== length) { throw new Error('read length mismatch: ' + bytesRead + '/' + length) }
    return buffer.slice(0, bytesRead)
  }

  async i2cWrite(bufferSource: I2CBufferSource): Promise<void> {
    assertBufferSource(bufferSource)

    const { bytesWritten } = await this._bus.i2cWrite(this._address, bufferSource.byteLength, bufferSource)
    if(bytesWritten !== bufferSource.byteLength) { throw new Error('write length mismatch') }
  }
}
