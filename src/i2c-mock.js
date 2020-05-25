/**
 *
 **/
class MockRegister {
  constructor(key, options) { this.key = key; this.options = options; }
  get valid() { return this.key !== undefined; }
  get name() { return this.options.name; }
  get readOnly() { return this.options.readOnly; }
  get data() { return this.options.data; }
  set data(data) { this.options.data = data; }
}

/**
 *
 **/
class MockRegisterDefinition {
  constructor(definition) {
    this.definition = definition;
    Object.keys(this.definition.register).forEach(key => {
      this.definition.register[key].client = new MockRegister(key, this.definition.register[key]);
    });
  }

  get commandMask() { return this.definition.commandMask; }


  register(register) {
    if(this.definition.register[register.toString()] === undefined) { return new MockRegister(); }
    // console.log(this.definition.register[register.toString()].client.valid);
    return this.definition.register[register.toString()].client;
  }
}

/**
 *
 **/
class MockDevice {
  constructor(busAddress, deviceDef) {
    this.busAddress = busAddress;
    this.definition = new MockRegisterDefinition(deviceDef);
  }

  register(register) {
    return this.definition.register(register);
  }

  writeI2cBlock(address, command, length, buffer) {
    // console.log('Mock Write', address.toString(16), command.toString(16), buffer);

    const maskedCommand = command & this.definition.commandMask;

    [...buffer].filter((_, index) => index < length).forEach((item, index) => {
      if(!this.register(maskedCommand + index).valid) {
        console.log('invalid write address', '0x' + maskedCommand.toString(16), index);
        return;
      }
      if(this.register(maskedCommand + index).readOnly === true) { console.log('readOnly'); return; }
      this.register(maskedCommand + index).data = item;
    });
    const bytesWriten = length;
    return Promise.resolve({ bytesWriten, buffer });
  }

  readI2cBlock(address, command, length) {
    // console.log('Mock Read', address.toString(16), command.toString(16), length);

    const maskedCommand = command & this.definition.commandMask;

    const buffer = Buffer.alloc(length);
    [...new Array(length)].forEach((_, index) => {
      if(!this.register(maskedCommand + index).valid) {
        console.log('invalid read address', '0x' + maskedCommand.toString(16), index);
        return;
      }
      buffer[index] = this.register(maskedCommand + index).data;
    });
    const bytesRead = buffer.length;
    return Promise.resolve({ bytesRead, buffer });
  }

  sendByte(address, byte) {
    //
    console.log('sendByte', address, byte);
    return Promise.resolve();
  }

  i2cRead(address, length, buffer) {
    //
    console.log('i2cRead', address, length)

    const register = 0x00;
    if(!this.register(register).valid) {
      console.log('invalid read address', '0x' + register.toString(16));
      return;
    }

    buffer[0] = this.register(register).data;
    return Promise.resolve({ bytesRead: 1, buffer });
  }

  i2cWrite(address, length, buffer) {
    //
    console.log('i2cWrite', address, length, buffer);
    const register = 0x00;
    if(!this.register(register).valid) {
        console.log('invalid write address', '0x' + register.toString(16));
        return;
      }
    if(this.register(register).readOnly === true) { console.log('readOnly'); return; }
    this.register(register).data = buffer[0];

    const bytesWriten = length;
    return Promise.resolve({ bytesWriten, buffer });
  }
}

/**
 *
 **/
class MockBus {
  constructor(busNumber) {
    this.busNumber = busNumber;
  }

  static addDevice(bus, address, deviceDefinition) {
    if(MockBus.addressMap === undefined) { MockBus.addressMap = {}; }
    if(MockBus.addressMap[bus] === undefined){ MockBus.addressMap[bus] = {}; }
    MockBus.addressMap[bus][address] = new MockDevice(address, deviceDefinition);
  }

  static openPromisified(busNumber) {
    return Promise.resolve(new MockBus(busNumber));
  }

  writeI2cBlock(address, command, length, buffer) {
    return MockBus.addressMap[this.busNumber][address].writeI2cBlock(address, command, length, buffer);
  }

  readI2cBlock(address, command, length) {
    return MockBus.addressMap[this.busNumber][address].readI2cBlock(address, command, length);
  }

  sendByte(address, byte) {
    return MockBus.addressMap[this.busNumber][address].sendByte(address, byte);
  }

  i2cRead(address, length, buffer) {
    return MockBus.addressMap[this.busNumber][address].i2cRead(address, length, buffer);
  }

  i2cWrite(address, length, buffer) {
    return MockBus.addressMap[this.busNumber][address].i2cWrite(address, length, buffer);
  }
}

// you known, for the kids
const I2CMockBus = MockBus;

module.exports = { I2CMockBus };
