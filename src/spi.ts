/** biome-ignore-all lint/style/useConsistentMethodSignatures: no pretty */



// SPI MODE0 - data are captured on rising edge and propagated on falling edge
// SPI MODE1 - data are captured on falling edge and propagated on rising edge
// SPI MODE2 - data are captured on falling edge and propagated on rising edge
// SPI MODE3 - data are captured on rising edge and propagated on falling edge

export const MODE_POLARITY_LOW = 0b00
export const MODE_POLARITY_HIGH = 0b10

export const MODE_PHASE_0 = 0x00
export const MODE_PHASE_1 = 0x01

export const MODE_0 = 0b00 // MODE_POLARITY_LOW | MODE_PHASE_0
export const MODE_1 = 0b01 // MODE_POLARITY_LOW | MODE_PHASE_1
export const MODE_2 = 0b10 // MODE_POLARITY_HIGH | MODE_PHASE_0
export const MODE_3 = 0b11 //  MODE_POLARITY_HIGH | MODE_PHASE_1

export type Mode = typeof MODE_0 | typeof MODE_1 | typeof MODE_2 | typeof MODE_3

export const DEFAULT_SPI_MODE: Mode = MODE_0


export interface SPIOptions {
	mode: Mode
	speedHz: number
}

export type SPIBufferSource = ArrayBuffer|ArrayBufferView<ArrayBuffer>

export interface SPITransaction {
	sendBuffer?: SPIBufferSource
	receiveBuffer?: SPIBufferSource
	receiveBufferLength: number
}
export interface TransferRequest {
	writeBuffer?: ArrayBufferView<ArrayBuffer>
	readLength?: number
}
export interface TransferResult {
	bytesWritten?: number

	byteRead?: number

	readBuffer?: ArrayBufferView<ArrayBuffer>

	writeBuffer?: ArrayBufferView<ArrayBuffer>
}

export interface SPIBus {
	transfer(transaction: SPITransaction): Promise<void>
}
