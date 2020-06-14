/* eslint-disable max-classes-per-file */
import {
  I2CAddress,
  I2CBus, I2CBusNumber,
  I2CReadResult, I2CWriteResult
} from './aod';

// types for static device definition
type MockDefinition_RegisterProperty = Array<Record<string, { bit?: number, bits?: Array<number>, enum?: Record<number, string> }>>;
type MockDefinition_Register = { name: string, properties: MockDefinition_RegisterProperty, readOnly: boolean, data: number };
export type MockDefinition = { commandMask: number, register: Record<string, MockDefinition_Register> };

const INVALID_BYTE = 0x00;

const TO_STIRNG_BASE_HEX = 16;
const BYTES_WRITTEN_ERROR_LENGTH = 0;

/**
 *
 **/
class MockRegister {
  private readonly key: string | undefined;
  private readonly options: undefined | MockDefinition_Register

  constructor(key?: string, options?: MockDefinition_Register) {
    this.key = key;
    this.options = options;
  }
  get valid() { return this.key !== undefined; }
  get name() { return this.options?.name; }
  get readOnly() { return this.options?.readOnly; }
  get data() {
    if(this.options === undefined) { return INVALID_BYTE; }
    return this.options.data;
  }
  set data(data) {
    if(this.options === undefined) { return; }
    this.options.data = data;
  }
}

/**
 *
 **/
class MockRegisterDefinition {
  private readonly definition: MockDefinition;
  private clients: Record<I2CAddress, MockRegister>;

  constructor(definition: MockDefinition) {
    this.definition = definition;

    this.clients = Object.keys(this.definition.register)
    .map(key => {
      return {
        key,
        value: new MockRegister(key, this.definition.register[key])
      };
    })
    .reduce((acc: Record<string, MockRegister>, item) => {
      const { key, value } = item;
      acc[key] = value;
      return acc;
    }, {});
  }

  get commandMask() { return this.definition.commandMask; }


  register(register: number) {
    if(this.clients[register] === undefined) { return new MockRegister(); }
    // console.log(this.definition.register[register.toString()].client.valid);
    return this.clients[register];
  }
}

/**
 *
 **/
class MockDevice implements I2CBus {
  private _busNumber: I2CBusNumber;
  private _busAddress: I2CAddress;
  private _definition: MockRegisterDefinition;
  private _closed = false

  constructor(busNumber: I2CBusNumber, busAddress: I2CAddress, deviceDef: MockDefinition) {
    this._busNumber = busNumber;
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
  get busNumber() { return this._busNumber; }

  close() {
    //
    this._closed = true;
  }

  register(register: number) {
    return this._definition.register(register);
  }

  writeI2cBlock(_address: I2CAddress, command: number, length: number, buffer: Buffer) {
    if(this._closed) { return Promise.reject(new Error('device closed')); }
    // console.log('Mock Write', address.toString(16), command.toString(16), buffer);

    const maskedCommand = command & this._definition.commandMask;

    [...buffer].filter((_, index) => index < length).forEach((item, index) => {

      const actualCommand = maskedCommand + index;

      if(!this.register(actualCommand).valid) {
        console.log('invalid write address', '0x' + maskedCommand.toString(TO_STIRNG_BASE_HEX), index);
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

  readI2cBlock(_address: I2CAddress, command: number, length: number) {
    if(this._closed) { return Promise.reject(new Error('device closed')); }
    // console.log('Mock Read', address.toString(16), command.toString(16), length);

    const maskedCommand = command & this._definition.commandMask;

    const buffer = Buffer.alloc(length);
    [...new Array(length)].forEach((_, index) => {
      if(!this.register(maskedCommand + index).valid) {
        console.log('invalid read address', '0x' + maskedCommand.toString(TO_STIRNG_BASE_HEX), index);
        return;
      }
      buffer[index] = this.register(maskedCommand + index).data;
    });
    const bytesRead = buffer.length;
    return Promise.resolve({ bytesRead, buffer });
  }

  sendByte(_address: I2CAddress, byte: number) {
    if(this._closed) { return Promise.reject(new Error('device closed')); }
    //
    console.log('sendByte', byte);

    // We do not mask the (command) byte as we assume the user knows
    // what they are doing.

    // todo: this may not be correct / use byte ad the address
    if(!this.register(byte).valid) {
      console.log('invalid write address', '0x' + byte.toString(TO_STIRNG_BASE_HEX));
      return Promise.reject(new Error('invalid sendByte address'));
    }

    if(this.register(byte).readOnly === true) {
      console.log('readOnly');
      return Promise.reject(new Error('read only'));
    }


    return Promise.resolve();
  }

  i2cRead(_address: I2CAddress, length: number, buffer: Buffer) {
    if(this._closed) { return Promise.reject(new Error('device closed')); }
    //
    console.log('i2cRead', _address, length);

    const register = 0x00;
    if(!this.register(register).valid) {
      console.log('invalid read address', '0x' + register.toString(16));
      return Promise.resolve({ bytesRead: 0, buffer });
    }

    buffer[0] = this.register(register).data;
    return Promise.resolve({ bytesRead: 1, buffer });
  }

  i2cWrite(_address: I2CAddress, length: number, buffer: Buffer) {
    if(this._closed) { return Promise.reject(new Error('device closed')); }
    //
    console.log('i2cWrite', _address, length, buffer);
    const register = 0x00;
    if(!this.register(register).valid) {
      console.log('invalid write address', '0x' + register.toString(TO_STIRNG_BASE_HEX));
      return Promise.resolve({ bytesWritten: BYTES_WRITTEN_ERROR_LENGTH, buffer });
    }

    if(this.register(register).readOnly === true) {
      console.log('readOnly');
      return Promise.resolve({ bytesWritten: BYTES_WRITTEN_ERROR_LENGTH, buffer });
    }

    const [data] = buffer;
    this.register(register).data = data;

    const bytesWritten = length;
    return Promise.resolve({ bytesWritten, buffer });
  }
}

/**
 *
 **/
// eslint-disable-next-line import/prefer-default-export
export class I2CMockBus implements I2CBus {
  private readonly _busNumber: I2CBusNumber;
  private static readonly _addressMap: Record<I2CBusNumber, Record<I2CAddress, MockDevice>> = {};
  private _closed = false;

  constructor(busNumber: I2CBusNumber) {
    this._busNumber = busNumber;
  }

  get busNumber(): I2CBusNumber { return this._busNumber; }

  static addDevice(bus: I2CBusNumber, address: I2CAddress, deviceDefinition: MockDefinition): void {
    const md = new MockDevice(bus, address, deviceDefinition);

    // if(I2CMockBus._addressMap === undefined) { I2CMockBus._addressMap = {}; }
    if(I2CMockBus._addressMap[bus] === undefined) { I2CMockBus._addressMap[bus] = {}; }
    I2CMockBus._addressMap[bus][address] = md;
  }

  static openPromisified(busNumber: number): Promise<I2CBus> {
    return Promise.resolve(new I2CMockBus(busNumber));
  }

  close(): void {
    // mark as closed, reject all read/write calls
    this._closed = true;
  }

  writeI2cBlock(address: I2CAddress, command: number, length: number, buffer: Buffer): Promise<I2CWriteResult> {
    if(this._closed) { return Promise.reject(new Error('bus closed')); }
    return I2CMockBus._addressMap[this._busNumber][address].writeI2cBlock(address, command, length, buffer);
  }

  readI2cBlock(address: I2CAddress, command: number, length: number): Promise<I2CReadResult> {
    if(this._closed) { return Promise.reject(new Error('bus closed')); }
    return I2CMockBus._addressMap[this._busNumber][address].readI2cBlock(address, command, length);
  }

  sendByte(address: I2CAddress, byte: number): Promise<void> {
    if(this._closed) { return Promise.reject(new Error('bus closed')); }
    return I2CMockBus._addressMap[this._busNumber][address].sendByte(address, byte);
  }

  i2cRead(address: I2CAddress, length: number, buffer: Buffer): Promise<I2CReadResult> {
    if(this._closed) { return Promise.reject(new Error('bus closed')); }
    return I2CMockBus._addressMap[this._busNumber][address].i2cRead(address, length, buffer);
  }

  i2cWrite(address: I2CAddress, length: number, buffer: Buffer): Promise<I2CWriteResult> {
    if(this._closed) { return Promise.reject(new Error('bus closed')); }
    return I2CMockBus._addressMap[this._busNumber][address].i2cWrite(address, length, buffer);
  }
}
