import { I2CAddress, I2CBufferSource, I2CBus, I2CReadResult, I2CWriteResult } from './i2c';
export declare class ThrowBus implements I2CBus {
    private _name;
    private err;
    static openPromisified(name: string): Promise<I2CBus>;
    constructor(name: string);
    get name(): string;
    close(): void;
    sendByte(_address: I2CAddress, _byte: number): Promise<void>;
    readI2cBlock(_address: I2CAddress, _cmd: number, _length: number, _bufferSource: I2CBufferSource): Promise<I2CReadResult>;
    writeI2cBlock(_address: I2CAddress, _cmd: number, _length: number, _bufferSource: I2CBufferSource): Promise<I2CWriteResult>;
    i2cRead(_address: I2CAddress, _length: number, _bufferSource: I2CBufferSource): Promise<I2CReadResult>;
    i2cWrite(_address: I2CAddress, _length: number, _bufferSource: I2CBufferSource): Promise<I2CWriteResult>;
}
//# sourceMappingURL=i2c-throwbus.d.ts.map