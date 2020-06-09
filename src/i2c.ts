/* eslint-disable import/group-exports */
//
export interface I2CReadResult {
  bytesRead: number;
  buffer: Buffer;
}

//
export interface I2CWriteResult {
  bytesWritten: number;
  buffer: Buffer;
}

//
export type I2CAddress = number;

/**
 *
 **/
export interface I2CBus {
  readonly busNumber: number;

  close(): void;

  sendByte(address: I2CAddress, byte: number): Promise<void>;

  readI2cBlock(address: I2CAddress, cmd: number, length: number, buffer: Buffer): Promise<I2CReadResult>;
  writeI2cBlock(address: I2CAddress, cmd: number, length: number, buffer: Buffer): Promise<I2CWriteResult>;

  i2cRead(address: I2CAddress, length: number, buffer: Buffer): Promise<I2CReadResult>;
  i2cWrite(address: I2CAddress, length: number, buffer: Buffer): Promise<I2CWriteResult>;
}
