//
export type I2CReadResult = {
  bytesRead: number
  buffer: ArrayBuffer
}

//
export type I2CWriteResult = {
  bytesWritten: number
  buffer: ArrayBuffer
}

//
export type I2CAddress = number

export interface Bus {
  readonly name: string
  close(): void
}

export interface SMBus extends Bus {
  sendByte(address: I2CAddress, byteValue: number): Promise<void>

  readI2cBlock(address: I2CAddress, cmd: number, length: number, buffer: ArrayBuffer): Promise<I2CReadResult>
  writeI2cBlock(address: I2CAddress, cmd: number, length: number, buffer: ArrayBuffer): Promise<I2CWriteResult>
}

export interface PlainI2CBus extends Bus {
  i2cRead(address: I2CAddress, length: number, buffer: ArrayBuffer): Promise<I2CReadResult>
  i2cWrite(address: I2CAddress, length: number, buffer: ArrayBuffer): Promise<I2CWriteResult>
}

/**
 *
 **/
export interface I2CBus extends PlainI2CBus, SMBus {
}
