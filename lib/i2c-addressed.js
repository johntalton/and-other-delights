const BASE_16 = 16;
const WARN_READ_LENGTH = 32;
const WARN_WRITE_LENGTH = 32;
function assertBufferSource(bs) {
    if (bs === undefined) {
        throw new Error('bufferSource undefined');
    }
    const isView = ArrayBuffer.isView(bs);
    const isAB = bs instanceof ArrayBuffer;
    if (!isView && !isAB) {
        throw new Error('bufferSource is not ArrayBuffer or ArrayBufferView');
    }
}
/**
 * I2CBus layer providing address encapsulation.
 **/
export class I2CAddressedBus {
    constructor(bus, address, options = { allocOnRead: true }) {
        this.address = address;
        this.bus = bus;
        this.options = {
            sharedReadBuffer: options.sharedReadBuffer ?? undefined,
            allocOnRead: options.allocOnRead === true,
            allowMixedReadBuffers: false,
            maxReadLength: WARN_READ_LENGTH,
            maxWriteLength: WARN_WRITE_LENGTH,
            validateReadWriteLengths: true
        };
    }
    static from(bus, address, options) {
        return new I2CAddressedBus(bus, address, options);
    }
    get name() {
        return this.bus.name + ':0x' + this.address.toString(BASE_16);
    }
    _getReadBuffer(length, readBufferSource) {
        const hasOptionsBuffer = this.options.sharedReadBuffer !== undefined;
        if (readBufferSource !== undefined && !(hasOptionsBuffer && !this.options.allowMixedReadBuffers)) {
            return readBufferSource;
        }
        if (this.options.sharedReadBuffer !== undefined) {
            return this.options.sharedReadBuffer;
        }
        if (this.options.allocOnRead) {
            return new ArrayBuffer(length);
        }
        throw new Error('no provided read buffer and allocation disabled');
    }
    close() { return this.bus.close(); }
    async readI2cBlock(cmd, length, readBufferSource) {
        if (length > this.options.maxReadLength) {
            throw new Error('read length greater then max configured');
        }
        const readBuffer = this._getReadBuffer(length, readBufferSource);
        const { bytesRead, buffer } = await this.bus.readI2cBlock(this.address, cmd, length, readBuffer);
        if (this.options.validateReadWriteLengths && bytesRead !== length) {
            throw new Error('read length mismatch - ' + bytesRead + ' / ' + length);
        }
        //
        return buffer.slice(0, bytesRead);
    }
    async writeI2cBlock(cmd, bufferSource) {
        assertBufferSource(bufferSource);
        if (bufferSource.byteLength > this.options.maxWriteLength) {
            throw new Error('write length greater then max configured');
        }
        const { bytesWritten } = await this.bus.writeI2cBlock(this.address, cmd, bufferSource.byteLength, bufferSource);
        if (this.options.validateReadWriteLengths && bytesWritten !== bufferSource.byteLength) {
            throw new Error('write length mismatch: ' + bytesWritten + '/' + bufferSource.byteLength);
        }
    }
    async sendByte(value) {
        await this.bus.sendByte(this.address, value);
    }
    async i2cRead(length, readBufferSource) {
        const readBuffer = this._getReadBuffer(length, readBufferSource);
        const { bytesRead, buffer } = await this.bus.i2cRead(this.address, length, readBuffer);
        if (this.options.validateReadWriteLengths && bytesRead !== length) {
            throw new Error('read length mismatch: ' + bytesRead + '/' + length);
        }
        //
        return buffer.slice(0, bytesRead);
    }
    async i2cWrite(bufferSource) {
        assertBufferSource(bufferSource);
        const { bytesWritten } = await this.bus.i2cWrite(this.address, bufferSource.byteLength, bufferSource);
        if (this.options.validateReadWriteLengths && bytesWritten !== bufferSource.byteLength) {
            throw new Error('write length mismatch');
        }
    }
}
//# sourceMappingURL=i2c-addressed.js.map