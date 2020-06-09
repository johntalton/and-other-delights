/* eslint-disable import/group-exports */
/* eslint-disable max-classes-per-file */
import { I2CAddress, I2CBus, I2CReadResult, I2CWriteResult } from './aod';

// eslint-disable-next-line import/exports-last
export type MockDefinition = {};

/**
 *
 **/
class MockRegister {
  private key: string | undefined;
  private options: undefined | { name: string, readOnly: boolean, data: number};

  constructor(key: string|undefined = undefined, options = undefined) { this.key = key; this.options = options; }
  get valid() { return this.key !== undefined; }
  get name() { return this.options!.name; }
  get readOnly() { return this.options!.readOnly; }
  get data() { return this.options!.data; }
  set data(data) { this.options!.data = data; }
}

/**
 *
 **/
class MockRegisterDefinition {
  private definition: any;

  constructor(definition: MockDefinition) {
    this.definition = definition;
    Object.keys(this.definition.register).forEach(key => {
      this.definition.register[key].client = new MockRegister(key, this.definition.register[key]);
    });
  }

  get commandMask() { return this.definition.commandMask; }


  register(register: number) {
    if(this.definition.register[register.toString()] === undefined) { return new MockRegister(); }
    // console.log(this.definition.register[register.toString()].client.valid);
    return this.definition.register[register.toString()].client;
  }
}

/**
 *
 **/
class MockDevice implements I2CBus {
  private _busAddress: I2CAddress;
  private _definition: MockRegisterDefinition;

  constructor(busAddress: I2CAddress, deviceDef: MockDefinition) {
    this._busAddress = busAddress;
    this._definition = new MockRegisterDefinition(deviceDef);

    // this.names = {};
    // this.memory = {};
    // this.cursor = NaN;
  }

  checkAddress(busAddress: I2CAddress) {
    if(busAddress !== this._busAddress) { throw new Error('invalid address'); }
  }

  // stub in
  get busNumber() { return -1; }

  close() {}

  register(register: number) {
    return this._definition.register(register);
  }

  writeI2cBlock(_address: I2CAddress, command: number, length: number, buffer: Buffer): Promise<I2CWriteResult> {
    // console.log('Mock Write', address.toString(16), command.toString(16), buffer);

    const maskedCommand = command & this._definition.commandMask;

    [...buffer].filter((_, index) => index < length).forEach((item, index) => {

      const actualCommand = maskedCommand + index;

      if(!this.register(actualCommand).valid) {
        console.log('invalid write address', '0x' + maskedCommand.toString(16), index);
        return;
      }
      if(this.register(actualCommand).readOnly === true) { console.log('readOnly'); return; }

      // depending on the data type this register represents, we will take
      // unique action from here.
      // `bit` or `bits` is modeled a a single 8-bit data register
      //
      this.register(actualCommand).data = item;
    });
    const bytesWritten = length;
    return Promise.resolve({ bytesWritten, buffer });
  }

  readI2cBlock(_address: I2CAddress, command: number, length: number): Promise<I2CReadResult> {
    // console.log('Mock Read', address.toString(16), command.toString(16), length);

    const maskedCommand = command & this._definition.commandMask;

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

  sendByte(_address: I2CAddress, byte: number): Promise<void> {
    //
    console.log('sendByte', byte);
    return Promise.resolve();
  }

  i2cRead(_address: I2CAddress, length: number, buffer: Buffer): Promise<I2CReadResult> {
    //
    console.log('i2cRead', _address, length)

    const register = 0x00;
    if(!this.register(register).valid) {
      console.log('invalid read address', '0x' + register.toString(16));
      return Promise.resolve({ bytesRead: 0, buffer });
    }

    buffer[0] = this.register(register).data;
    return Promise.resolve({ bytesRead: 1, buffer });
  }

  i2cWrite(_address: I2CAddress, length: number, buffer: Buffer): Promise<I2CWriteResult> {
    //
    console.log('i2cWrite', _address, length, buffer);
    const register = 0x00;
    if(!this.register(register).valid) {
        console.log('invalid write address', '0x' + register.toString(16));
        return Promise.resolve({ bytesWritten: 0, buffer });
      }
    if(this.register(register).readOnly === true) {
      console.log('readOnly');
      return Promise.resolve({ bytesWritten: 0, buffer });
    }
    this.register(register).data = buffer[0];

    const bytesWritten = length;
    return Promise.resolve({ bytesWritten, buffer });
  }
}

/**
 *
 **/
// eslint-disable-next-line import/prefer-default-export
export class I2CMockBus implements I2CBus {
  private _busNumber: number;
  private static _addressMap: any;

  constructor(busNumber: number) {
    this._busNumber = busNumber;
  }

  get busNumber() { return this._busNumber; }

  static addDevice(bus: number, address: I2CAddress, deviceDefinition: MockDefinition) {
    if(I2CMockBus._addressMap === undefined) { I2CMockBus._addressMap = {}; }
    if(I2CMockBus._addressMap[bus] === undefined) { I2CMockBus._addressMap[bus] = {}; }
    I2CMockBus._addressMap[bus][address] = new MockDevice(address, deviceDefinition);
  }

  static openPromisified(busNumber: number) {
    return Promise.resolve(new I2CMockBus(busNumber));
  }

  close() {
    // uh.. sure
  }

  writeI2cBlock(address: I2CAddress, command: number, length: number, buffer: Buffer) {
    return I2CMockBus._addressMap[this._busNumber][address].writeI2cBlock(address, command, length, buffer);
  }

  readI2cBlock(address: I2CAddress, command: number, length: number) {
    return I2CMockBus._addressMap[this._busNumber][address].readI2cBlock(address, command, length);
  }

  sendByte(address: I2CAddress, byte: number) {
    return I2CMockBus._addressMap[this._busNumber][address].sendByte(address, byte);
  }

  i2cRead(address: I2CAddress, length: number, buffer: Buffer) {
    return I2CMockBus._addressMap[this._busNumber][address].i2cRead(address, length, buffer);
  }

  i2cWrite(address: I2CAddress, length: number, buffer: Buffer) {
    return I2CMockBus._addressMap[this._busNumber][address].i2cWrite(address, length, buffer);
  }
}
