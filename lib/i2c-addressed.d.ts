import { I2CAddress, I2CBufferSource, I2CBus } from './i2c';
export declare type ABOptions = {
    sharedReadBuffer?: I2CBufferSource;
    allocOnRead: boolean;
    allowMixedReadBuffers: boolean;
    maxReadLength: number;
    maxWriteLength: number;
    validateReadWriteLengths: boolean;
};
/**
 * I2CBus layer providing address encapsulation.
 **/
export declare class I2CAddressedBus {
    private readonly address;
    private readonly bus;
    private readonly options;
    static from(bus: I2CBus, address: I2CAddress, options?: Partial<ABOptions>): I2CAddressedBus;
    constructor(bus: I2CBus, address: I2CAddress, options?: Partial<ABOptions>);
    get name(): string;
    private _getReadBuffer;
    close(): void;
    readI2cBlock(cmd: number, length: number, readBufferSource?: I2CBufferSource): Promise<ArrayBuffer>;
    writeI2cBlock(cmd: number, bufferSource: I2CBufferSource): Promise<void>;
    sendByte(value: number): Promise<void>;
    i2cRead(length: number, readBufferSource?: I2CBufferSource): Promise<ArrayBuffer>;
    i2cWrite(bufferSource: I2CBufferSource): Promise<void>;
}
//# sourceMappingURL=i2c-addressed.d.ts.map