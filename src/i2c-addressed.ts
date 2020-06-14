/* eslint-disable import/prefer-default-export */
import { I2CAddress, I2CBus } from './aod';

const WARN_READ_LENGTH = 32;
const WARN_WRITE_LENGTH = 32;
const BUS_FILE_PREFIX = '/dev/i2c-';

/**
 *
 **/
export class I2CAddressedBus {
  private _address: number;
  private _bus: I2CBus;

  constructor(i2cBus: I2CBus, address: I2CAddress) {
    this._address = address;
    this._bus = i2cBus;
  }

  get name() {
    return 'i2c:' + BUS_FILE_PREFIX + this.bus.busNumber + '/0x' + this.address.toString(16);
  }

  get bus() { return this._bus; }
  get address() { return this._address; }

  close() { return this.bus.close(); }

  read(cmd: number, length: number): Promise<Buffer> {
    if(length > WARN_READ_LENGTH) { console.log('over max recommended r length', length); }
    return this.bus.readI2cBlock(this.address, cmd, length, Buffer.alloc(length))
      .then(({ bytesRead, buffer }) => { return buffer; }); // todo bytesRead
  }

  write(cmd: number, buffer: Buffer): Promise<void> {
    if(buffer === undefined) { return this.writeSpecial(cmd); }
    if(!Buffer.isBuffer(buffer)) { throw new Error('buffer is not a buffer'); }
    if(buffer.length > WARN_WRITE_LENGTH) { console.log('over max recommend w length'); }
    return this.bus.writeI2cBlock(this.address, cmd, buffer.length, buffer)
      .then(({ bytesWritten }) => { return; }); // todo bytesWritten
  }

  writeSpecial(special: number): Promise<void> {
    return this.bus.sendByte(this.address, special);
  }

  readBuffer(length: number): Promise<Buffer> {
    return this.bus.i2cRead(this.address, length, Buffer.alloc(length))
      .then(({ bytesRead, buffer }) => buffer); // todo byteRead
  }

  writeBuffer(buffer: Buffer): Promise<void> {
    return this.bus.i2cWrite(this.address, buffer.length, buffer)
      .then(({ bytesWritten }) => { return; }); // todo bytesWritten
  }
}
