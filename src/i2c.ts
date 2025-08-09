export type I2CBufferSource = ArrayBuffer | ArrayBufferView

//
export type I2CReadResult = {
	bytesRead: number
	buffer: I2CBufferSource
}

//
export type I2CWriteResult = {
	bytesWritten: number
	buffer: I2CBufferSource
}

//
export type I2CAddress = number

export interface Bus {
	readonly name: string
	close(): void
}

export interface I2CBus extends Bus {
	sendByte(address: I2CAddress, byteValue: number): Promise<void>

	readI2cBlock(address: I2CAddress, cmd: number, length: number, targetBuffer?: I2CBufferSource): Promise<I2CReadResult>
	writeI2cBlock(
		address: I2CAddress,
		cmd: number,
		length: number,
		buffer: I2CBufferSource): Promise<I2CWriteResult>

	i2cRead(address: I2CAddress, length: number, targetBuffer?: I2CBufferSource): Promise<I2CReadResult>
	i2cWrite(address: I2CAddress, length: number, buffer: I2CBufferSource): Promise<I2CWriteResult>
}

export interface I2CScannableBus extends I2CBus {
	scan(): Promise<Array<I2CAddress>>
}
