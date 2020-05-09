
const WARN_READ_LENGTH = 32;
const WARN_WRITE_LENGTH = 32;
const BUS_FILE_PREFIX = '/dev/i2c-';

/**
 *
 **/
class I2CBus {
}

/**
 *
 **/
class I2CAddressedBus {
  constructor(i2cBus, address) {
    this._address = address;
    this._bus = i2cBus;
  }

  get name() { return 'i2c:' + BUS_FILE_PREFIX + '?/' + this.address; }
  
  get bus() { return this._bus; }
  get address() { return this._address; }

  close() { return this.bus.close(); }

  read(cmd, length) {
    if(length > WARN_READ_LENGTH) { console.log('over max recommended r length', length); }
    return this.bus.readI2cBlock(this.address, cmd, length, Buffer.alloc(length))
      .then(({ bytesRead, buffer }) => { return buffer; }); // todo bytesREad
  }

  write(cmd, buffer) {
    if(buffer === undefined) { return this.writeSpecial(cmd); }
    if(!Buffer.isBuffer(buffer)) {
      buffer = Array.isArray(buffer) ? Buffer.from(buffer) : Buffer.from([buffer]);
    }
    if(buffer.length > WARN_WRITE_LENGTH) { console.log('over max recommend w length'); }
    return this.bus.writeI2cBlock(this.address, cmd, buffer.length, buffer)
      .then(({ bytesWritten, buffer }) => { return; }); // todo bytesWritten
  }

  writeSpecial(special) {
    return this.bus.sendByte(this.address, special);
  }
  
  readBuffer(length) {
    return this.bus.i2cRead(this.address, length, Buffer.alloc(length))
      .then(({ bytesRead, buffer }) => buffer); // todo byteRead
  }
  
  writeBuffer(buffer) {
    return this.bus.i2cWrite(this.address, buffer.length, buffer)
      .then(({ bytesWritten, buffer }) => { return; }); // todo bytesWritten
  }
}

module.exports = { I2CBus, I2CAddressedBus };
