import { I2CAddress, I2CBus } from './aod';

const WARN_READ_LENGTH = 32;
const WARN_WRITE_LENGTH = 32;
const BUS_FILE_PREFIX = '/dev/i2c-';

interface I2CManagedBus {
  readonly name: string;

  close(): void;

  read(cmd: number, length: number): Promise<Buffer>;
  write(cmd: number, buffer: Buffer): Promise<void>;

  writeSpecial(cmd: number): Promise<void>;

  readBuffer(length: number): Promise<Buffer>;
  writeBuffer(buffer: Buffer): Promise<void>;
}


/**
 *
 **/
export class I2CAddressedBus implements I2CManagedBus {
  private _address: number;
  private _bus: I2CBus;
  private _sharedReadBuffer?: Buffer;

  constructor(i2cBus: I2CBus, address: I2CAddress, sharedReadBuffer?: Buffer) {
    this._address = address;
    this._bus = i2cBus;
    this._sharedReadBuffer = sharedReadBuffer; // shared buffer for reading
  }

  get name(): string {
    return 'i2c:' + BUS_FILE_PREFIX + this._bus.busNumber + '/0x' + this._address.toString(16);
  }

  // get bus(): I2CBus { return this._bus; }
  // get address(): I2CAddress { return this._address; }

  _getReadBuffer(length: number, fill = 0): Buffer {
    // not using shared buffer, allocate a new instance now
    if(this._sharedReadBuffer === undefined) {
      return Buffer.alloc(length, fill);
    }

    // return shared buffer if its large enough
    if(length > this._sharedReadBuffer.length) { throw new Error('shared buffer to small'); }
    return this._sharedReadBuffer;
  }

  close(): void { return this._bus.close(); }

  read(cmd: number, length: number): Promise<Buffer> {
    if(length > WARN_READ_LENGTH) { console.log('over max recommended r length', length); }
    return this._bus.readI2cBlock(this._address, cmd, length, this._getReadBuffer(length))
      .then(({ bytesRead, buffer }) => { return buffer; }); // todo bytesRead
  }

  write(cmd: number, buffer: Buffer): Promise<void> {
    if(buffer === undefined) { return this.writeSpecial(cmd); }
    if(!Buffer.isBuffer(buffer)) { throw new Error('buffer is not a buffer'); }
    if(buffer.length > WARN_WRITE_LENGTH) { console.log('over max recommend w length'); }
    return this._bus.writeI2cBlock(this._address, cmd, buffer.length, buffer)
      .then(({ bytesWritten }) => { return; }); // todo bytesWritten
  }

  writeSpecial(special: number): Promise<void> {
    return this._bus.sendByte(this._address, special);
  }

  readBuffer(length: number): Promise<Buffer> {
    return this._bus.i2cRead(this._address, length, this._getReadBuffer(length))
      .then(({ bytesRead, buffer }) => buffer); // todo byteRead
  }

  writeBuffer(buffer: Buffer): Promise<void> {
    return this._bus.i2cWrite(this._address, buffer.length, buffer)
      .then(({ bytesWritten }) => { return; }); // todo bytesWritten
  }
}
