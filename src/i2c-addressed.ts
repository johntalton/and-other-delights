/* eslint-disable import/prefer-default-export */
import { I2CAddress, I2CBus } from './aod';

const WARN_READ_LENGTH = 32;
const WARN_WRITE_LENGTH = 32;
const BUS_FILE_PREFIX = '/dev/i2c-';

// extend interface so that access to i2c-bus
// internals can be used to access bus number
interface FivdiI2CBus extends I2CBus {
  _bus: { _busNumber: number };
}

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

  get name() { return 'i2c:' + BUS_FILE_PREFIX + (this.bus as FivdiI2CBus)._bus._busNumber + '/0x' + this.address.toString(16); }

  get bus() { return this._bus; }
  get address() { return this._address; }

  close() { return this.bus.close(); }

  read(cmd: number, length: number) {
    if(length > WARN_READ_LENGTH) { console.log('over max recommended r length', length); }
    return this.bus.readI2cBlock(this.address, cmd, length, Buffer.alloc(length))
      .then(({ bytesRead, buffer }) => { return buffer; }); // todo bytesRead
  }

  write(cmd: number, buffer: Buffer) {
    if(buffer === undefined) { return this.writeSpecial(cmd); }
    if(!Buffer.isBuffer(buffer)) {
      buffer = Array.isArray(buffer) ? Buffer.from(buffer) : Buffer.from([buffer]);
    }
    if(buffer.length > WARN_WRITE_LENGTH) { console.log('over max recommend w length'); }
    return this.bus.writeI2cBlock(this.address, cmd, buffer.length, buffer)
      .then(({ bytesWritten, buffer }) => { return; }); // todo bytesWritten
  }

  writeSpecial(special: number) {
    return this.bus.sendByte(this.address, special);
  }

  readBuffer(length: number) {
    return this.bus.i2cRead(this.address, length, Buffer.alloc(length))
      .then(({ bytesRead, buffer }) => buffer); // todo byteRead
  }

  writeBuffer(buffer: Buffer) {
    return this.bus.i2cWrite(this.address, buffer.length, buffer)
      .then(({ bytesWritten, buffer }) => { return; }); // todo bytesWritten
  }
}
