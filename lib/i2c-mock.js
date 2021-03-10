const INVALID_BYTE = 0x00;
const TO_STRING_BASE_HEX = 16;
const BYTES_WRITTEN_ERROR_LENGTH = 0;
/**
 *
 **/
class MockRegister {
    constructor(key, options) {
        this.key = key;
        this.options = options;
    }
    get valid() { return this.key !== undefined; }
    get name() { return this.options?.name; }
    get readOnly() { return this.options?.readOnly; }
    get data() {
        if (this.options === undefined) {
            return INVALID_BYTE;
        }
        return this.options.data;
    }
    set data(data) {
        if (this.options === undefined) {
            return;
        }
        this.options.data = data;
    }
}
/**
 *
 **/
class MockRegisterDefinition {
    constructor(definition) {
        this.definition = definition;
        this.clients = Object.keys(this.definition.register)
            .map(key => {
            return {
                key,
                value: new MockRegister(key, this.definition.register[key])
            };
        })
            .reduce((acc, item) => {
            const { key, value } = item;
            acc[key] = value;
            return acc;
        }, {});
    }
    get commandMask() { return this.definition.commandMask; }
    get debug() { return this.definition.debug !== undefined ? this.definition.debug : false; }
    register(register) {
        if (this.clients[register] === undefined) {
            return new MockRegister();
        }
        // console.log(this.definition.register[register.toString()].client.valid)
        return this.clients[register];
    }
}
/**
 *
 **/
class MockDevice {
    constructor(busNumber, busAddress, deviceDef) {
        this._closed = false;
        this._name = '__unnamed__';
        this._busNumber = busNumber;
        this._busAddress = busAddress;
        this._definition = new MockRegisterDefinition(deviceDef);
        // this.names = {}
        // this.memory = {}
        // this.cursor = NaN
    }
    get name() { return this._name; }
    checkAddress(busAddress) {
        if (busAddress !== this._busAddress) {
            throw new Error('invalid address');
        }
    }
    // stub in
    get busNumber() { return this._busNumber; }
    close() {
        //
        this._closed = true;
    }
    register(register) {
        return this._definition.register(register);
    }
    writeI2cBlock(_address, command, length, bufferSource) {
        if (this._definition.debug) {
            console.log('writeI2cBloc', _address, command, length, bufferSource);
        }
        if (this._closed) {
            return Promise.reject(new Error('device closed'));
        }
        // console.log('Mock Write', address.toString(16), command.toString(16), buffer)
        const maskedCommand = command & this._definition.commandMask;
        // TOD required semi as this is a dangling array buffer that does not assign
        const buffer = ArrayBuffer.isView(bufferSource) ? bufferSource.buffer : bufferSource;
        const typedArray = new Uint8Array(buffer);
        typedArray.filter((_, index) => index < length).forEach((item, index) => {
            const actualCommand = maskedCommand + index;
            if (!this.register(actualCommand).valid) {
                console.log('invalid write address', '0x' + maskedCommand.toString(TO_STRING_BASE_HEX), index);
                return;
            }
            if (this.register(actualCommand).readOnly === true) {
                console.log('readOnly');
                return;
            }
            // depending on the data type this register represents, we will take
            // unique action from here.
            // `bit` or `bits` is modeled a a single 8-bit data register
            //
            this.register(actualCommand).data = item;
        });
        const bytesWritten = length;
        return Promise.resolve({ bytesWritten, buffer });
    }
    readI2cBlock(_address, command, length) {
        if (this._definition.debug) {
            console.log('readI2cBlock', _address, command, length);
        }
        if (this._closed) {
            return Promise.reject(new Error('device closed'));
        }
        // console.log('Mock Read', address.toString(16), command.toString(16), length)
        const maskedCommand = command & this._definition.commandMask;
        const buffer = Buffer.alloc(length);
        [...new Array(length)].forEach((_, index) => {
            if (!this.register(maskedCommand + index).valid) {
                console.log('invalid read address', '0x' + maskedCommand.toString(TO_STRING_BASE_HEX), index);
                return;
            }
            buffer[index] = this.register(maskedCommand + index).data;
        });
        const bytesRead = buffer.length;
        return Promise.resolve({ bytesRead, buffer });
    }
    sendByte(_address, byte) {
        if (this._definition.debug) {
            console.log('sendByte', _address, byte);
        }
        if (this._closed) {
            return Promise.reject(new Error('device closed'));
        }
        //
        console.log('sendByte', byte);
        // We do not mask the (command) byte as we assume the user knows
        // what they are doing.
        // todo: this may not be correct / use byte ad the address
        if (!this.register(byte).valid) {
            console.log('invalid write address', '0x' + byte.toString(TO_STRING_BASE_HEX));
            return Promise.reject(new Error('invalid sendByte address'));
        }
        if (this.register(byte).readOnly === true) {
            console.log('readOnly');
            return Promise.reject(new Error('read only'));
        }
        return Promise.resolve();
    }
    i2cRead(_address, length, bufferSource) {
        if (this._definition.debug) {
            console.log('i2cRead', _address, length, bufferSource);
        }
        if (this._closed) {
            return Promise.reject(new Error('device closed'));
        }
        //
        console.log('i2cRead', _address, length);
        const register = 0x00;
        if (!this.register(register).valid) {
            console.log('invalid read address', '0x' + register.toString(16));
            return Promise.resolve({ bytesRead: 0, buffer: new ArrayBuffer(0) });
        }
        const buffer = ArrayBuffer.isView(bufferSource) ? bufferSource.buffer : bufferSource;
        const typedBuffer = new Uint8Array(buffer);
        typedBuffer[0] = this.register(register).data;
        return Promise.resolve({ bytesRead: 1, buffer });
    }
    i2cWrite(_address, length, bufferSource) {
        if (this._definition.debug) {
            console.log('i2cWrite', _address, length, bufferSource);
        }
        if (this._closed) {
            return Promise.reject(new Error('device closed'));
        }
        //
        console.log('i2cWrite', _address, length, bufferSource);
        const register = 0x00;
        if (!this.register(register).valid) {
            console.log('invalid write address', '0x' + register.toString(TO_STRING_BASE_HEX));
            return Promise.resolve({ bytesWritten: BYTES_WRITTEN_ERROR_LENGTH, buffer: new ArrayBuffer(0) });
        }
        if (this.register(register).readOnly === true) {
            console.log('readOnly');
            return Promise.resolve({ bytesWritten: BYTES_WRITTEN_ERROR_LENGTH, buffer: new ArrayBuffer(0) });
        }
        const buffer = new Uint8Array(ArrayBuffer.isView(bufferSource) ? bufferSource.buffer : bufferSource);
        const [first] = buffer;
        this.register(register).data = first;
        const bytesWritten = length;
        return Promise.resolve({ bytesWritten, buffer: buffer });
    }
}
/**
 *
 **/
export class I2CMockBus {
    constructor(busNumber) {
        this._closed = false;
        this._name = '__unnamed__';
        this._busNumber = busNumber;
    }
    get busNumber() { return this._busNumber; }
    get name() { return this._name; }
    static addDevice(bus, address, deviceDefinition) {
        const md = new MockDevice(bus, address, deviceDefinition);
        // if(I2CMockBus._addressMap === undefined) { I2CMockBus._addressMap = {} }
        if (I2CMockBus._addressMap[bus] === undefined) {
            I2CMockBus._addressMap[bus] = {};
        }
        I2CMockBus._addressMap[bus][address] = md;
    }
    static async openPromisified(busNumber) {
        return Promise.resolve(new I2CMockBus(busNumber));
    }
    close() {
        // mark as closed, reject all read/write calls
        this._closed = true;
    }
    async writeI2cBlock(address, command, length, bufferSource) {
        if (this._closed) {
            return Promise.reject(new Error('bus closed'));
        }
        return I2CMockBus._addressMap[this._busNumber][address].writeI2cBlock(address, command, length, bufferSource);
    }
    async readI2cBlock(address, command, length) {
        if (this._closed) {
            return Promise.reject(new Error('bus closed'));
        }
        return I2CMockBus._addressMap[this._busNumber][address].readI2cBlock(address, command, length);
    }
    async sendByte(address, byte) {
        if (this._closed) {
            return Promise.reject(new Error('bus closed'));
        }
        return I2CMockBus._addressMap[this._busNumber][address].sendByte(address, byte);
    }
    async i2cRead(address, length, bufferSource) {
        if (this._closed) {
            return Promise.reject(new Error('bus closed'));
        }
        return I2CMockBus._addressMap[this._busNumber][address].i2cRead(address, length, bufferSource);
    }
    async i2cWrite(address, length, bufferSource) {
        if (this._closed) {
            return Promise.reject(new Error('bus closed'));
        }
        return I2CMockBus._addressMap[this._busNumber][address].i2cWrite(address, length, bufferSource);
    }
}
I2CMockBus._addressMap = {};
//# sourceMappingURL=i2c-mock.js.map