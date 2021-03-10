import { I2CAddress, I2CBufferSource, I2CBus, I2CReadResult, I2CWriteResult } from './i2c';
export declare type ScriptEntry = {
    method: string;
    parameters?: Array<number>;
    result?: number | string | I2CReadResult | I2CWriteResult;
};
export declare type Script = Array<ScriptEntry>;
export declare const EOS_SCRIPT: Script;
/**
 *
 */
export declare class I2CScriptBus implements I2CBus {
    readonly _name: string;
    private script;
    private scriptIndex;
    private debug;
    static openPromisified(script: Script): Promise<I2CBus>;
    constructor(script: Script);
    get name(): string;
    private validate;
    close(): void;
    sendByte(_address: I2CAddress, _byte: number): Promise<void>;
    readI2cBlock(_address: I2CAddress, _cmd: number, _length: number, _bufferSource: I2CBufferSource): Promise<I2CReadResult>;
    writeI2cBlock(_address: I2CAddress, _cmd: number, _length: number, _bufferSource: I2CBufferSource): Promise<I2CWriteResult>;
    i2cRead(_address: I2CAddress, _length: number, _bufferSource: I2CBufferSource): Promise<I2CReadResult>;
    i2cWrite(_address: I2CAddress, _length: number, _bufferSource: I2CBufferSource): Promise<I2CWriteResult>;
}
//# sourceMappingURL=i2c-scriptbus.d.ts.map