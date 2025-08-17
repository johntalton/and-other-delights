export type I2CBufferSource = ArrayBufferLike | ArrayBufferView

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

//
export type I2CCommand = number | [ number, number ]

export interface I2CBus {
	readonly name: string
	readonly supportsScan: boolean
	readonly supportsMultiByteDataAddress: boolean

	close(): void

	scan(): Promise<Array<I2CAddress>>

	sendByte(address: I2CAddress, byteValue: number): Promise<void>

	readI2cBlock(address: I2CAddress, cmd: I2CCommand, length: number, targetBuffer?: I2CBufferSource): Promise<I2CReadResult>
	writeI2cBlock(
		address: I2CAddress,
		cmd: I2CCommand,
		length: number,
		buffer: I2CBufferSource): Promise<I2CWriteResult>

	i2cRead(address: I2CAddress, length: number, targetBuffer?: I2CBufferSource): Promise<I2CReadResult>
	i2cWrite(address: I2CAddress, length: number, buffer: I2CBufferSource): Promise<I2CWriteResult>
}