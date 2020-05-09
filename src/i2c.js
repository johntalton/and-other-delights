
const WARN_READ_LENGTH = 32;
const WARN_WRITE_LENGTH = 32;

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
      .then(({ bytesWritten, buffer }) => { return buffer; }); // todo bytesWritten
  }

  writeSpecial(special) {
    return this.bus.sendByte(this.address, special);
  }
}

module.exports = { I2CBus, I2CAddressedBus };
