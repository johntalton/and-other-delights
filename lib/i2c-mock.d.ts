import { I2CAddress, I2CBufferSource, I2CBus, I2CReadResult, I2CWriteResult } from './i2c';
declare type MockDefinition_RegisterProperty = Array<Record<string, {
    bit?: number;
    bits?: Array<number>;
    enum?: Record<number, string>;
}>>;
declare type MockDefinition_Register = {
    name: string;
    properties: MockDefinition_RegisterProperty;
    readOnly: boolean;
    data: number;
};
export declare type MockDefinition = {
    debug?: boolean;
    commandMask: number;
    register: Record<string, MockDefinition_Register>;
};
export declare type MockBusNumber = number;
/**
 *
 **/
export declare class I2CMockBus implements I2CBus {
    private readonly _name;
    private readonly _busNumber;
    private static readonly _addressMap;
    private _closed;
    constructor(busNumber: MockBusNumber);
    get busNumber(): MockBusNumber;
    get name(): string;
    static addDevice(bus: MockBusNumber, address: I2CAddress, deviceDefinition: MockDefinition): void;
    static openPromisified(busNumber: number): Promise<I2CBus>;
    close(): void;
    writeI2cBlock(address: I2CAddress, command: number, length: number, bufferSource: I2CBufferSource): Promise<I2CWriteResult>;
    readI2cBlock(address: I2CAddress, command: number, length: number): Promise<I2CReadResult>;
    sendByte(address: I2CAddress, byte: number): Promise<void>;
    i2cRead(address: I2CAddress, length: number, bufferSource: I2CBufferSource): Promise<I2CReadResult>;
    i2cWrite(address: I2CAddress, length: number, bufferSource: I2CBufferSource): Promise<I2CWriteResult>;
}
export {};
//# sourceMappingURL=i2c-mock.d.ts.map