/* eslint-disable immutable/no-this */
/* eslint-disable fp/no-this */
/* eslint-disable fp/no-unused-expression */
/* eslint-disable immutable/no-mutation */
/* eslint-disable fp/no-mutation */
/* eslint-disable fp/no-nil */
/* eslint-disable fp/no-class */
/* eslint-disable max-classes-per-file */
import {
	I2CAddress,
	I2CBufferSource,
	I2CBus,
	I2CReadResult,
	I2CWriteResult
} from './i2c'

// types for static device definition
type MockDefinition_RegisterProperty = Array<Record<string, { bit?: number, bits?: Array<number>, enum?: Record<number, string> }>>
type MockDefinition_Register = { name: string, properties: MockDefinition_RegisterProperty, readOnly: boolean, data: number }
export type MockDefinition = { debug?: boolean, commandMask: number, register: Record<string, MockDefinition_Register> }

export type MockBusNumber = number

const INVALID_BYTE = 0x00

const TO_STRING_BASE_HEX = 16
const BYTES_WRITTEN_ERROR_LENGTH = 0

/**
 *
 **/
class MockRegister {
	private readonly key: string | undefined
	private readonly options: undefined | MockDefinition_Register

	constructor(key?: string, options?: MockDefinition_Register) {
		this.key = key
		this.options = options
	}
	get valid() { return this.key !== undefined }
	get name() { return this.options?.name }
	get readOnly() { return this.options?.readOnly }
	get data() {
		if (this.options === undefined) { return INVALID_BYTE }
		return this.options.data
	}
	set data(data) {
		if (this.options === undefined) { return }
		this.options.data = data
	}
}

/**
 *
 **/
class MockRegisterDefinition {
	private readonly definition: MockDefinition
	private clients: Record<I2CAddress, MockRegister>

	constructor(definition: MockDefinition) {
		this.definition = definition

		this.clients = Object.keys(this.definition.register)
			.map(key => {
				return {
					key,
					value: new MockRegister(key, this.definition.register[key])
				}
			})
			.reduce((acc: Record<string, MockRegister>, item) => {
				const { key, value } = item
				acc[key] = value
				return acc
			}, {})
	}

	get commandMask() { return this.definition.commandMask }

	get debug() { return this.definition.debug !== undefined ? this.definition.debug : false }

	register(register: number) {
		if (this.clients[register] === undefined) { return new MockRegister() }
		// console.log(this.definition.register[register.toString()].client.valid)
		return this.clients[register]
	}
}

/**
 *
 **/
class MockDevice implements I2CBus {
	private _name: string
	private _busNumber: MockBusNumber
	private _busAddress: I2CAddress
	private _definition: MockRegisterDefinition
	private _closed = false

	constructor(busNumber: MockBusNumber, busAddress: I2CAddress, deviceDef: MockDefinition) {
		this._name = '__unnamed__'
		this._busNumber = busNumber
		this._busAddress = busAddress
		this._definition = new MockRegisterDefinition(deviceDef)

		// this.names = {}
		// this.memory = {}
		// this.cursor = NaN
	}

	get name() { return this._name }

	checkAddress(busAddress: I2CAddress) {
		if (busAddress !== this._busAddress) { throw new Error('invalid address') }
	}

	// stub in
	get busNumber() { return this._busNumber }

	close() {
		//
		this._closed = true
	}

	register(register: number) {
		return this._definition.register(register)
	}

	writeI2cBlock(_address: I2CAddress, command: number, length: number, bufferSource: I2CBufferSource) {
		if (this._definition.debug) { console.log('writeI2cBloc', _address, command, length, bufferSource) }
		if (this._closed) { return Promise.reject(new Error('device closed')) }
		// console.log('Mock Write', address.toString(16), command.toString(16), buffer)

		const maskedCommand = command & this._definition.commandMask

		// TOD required semi as this is a dangling array buffer that does not assign
		const buffer = ArrayBuffer.isView(bufferSource) ? bufferSource.buffer : bufferSource
		const typedArray = new Uint8Array(buffer)
		typedArray.filter((_, index) => index < length).forEach((item, index) => {

			const actualCommand = maskedCommand + index

			if (!this.register(actualCommand).valid) {
				console.log('invalid write address', '0x' + maskedCommand.toString(TO_STRING_BASE_HEX), index)
				return
			}
			if (this.register(actualCommand).readOnly === true) { console.log('readOnly'); return }

			// depending on the data type this register represents, we will take
			// unique action from here.
			// `bit` or `bits` is modeled a a single 8-bit data register
			//
			this.register(actualCommand).data = item
		})

		const bytesWritten = length
		return Promise.resolve({ bytesWritten, buffer })
	}

	readI2cBlock(_address: I2CAddress, command: number, length: number) {
		if (this._definition.debug) { console.log('readI2cBlock', _address, command, length) }
		if (this._closed) { return Promise.reject(new Error('device closed')) }
		// console.log('Mock Read', address.toString(16), command.toString(16), length)

		const maskedCommand = command & this._definition.commandMask

		const buffer = Buffer.alloc(length)

		// TODO another dangling semi used to denote un-assigned array to forEach
		;[...new Array(length)].forEach((_, index) => {
			if (!this.register(maskedCommand + index).valid) {
				console.log('invalid read address', '0x' + maskedCommand.toString(TO_STRING_BASE_HEX), index)
				return
			}
			buffer[index] = this.register(maskedCommand + index).data
		})

		const bytesRead = buffer.length
		return Promise.resolve({ bytesRead, buffer })
	}

	sendByte(_address: I2CAddress, byte: number) {
		if (this._definition.debug) { console.log('sendByte', _address, byte) }
		if (this._closed) { return Promise.reject(new Error('device closed')) }
		//
		console.log('sendByte', byte)

		// We do not mask the (command) byte as we assume the user knows
		// what they are doing.

		// todo: this may not be correct / use byte ad the address
		if (!this.register(byte).valid) {
			console.log('invalid write address', '0x' + byte.toString(TO_STRING_BASE_HEX))
			return Promise.reject(new Error('invalid sendByte address'))
		}

		if (this.register(byte).readOnly === true) {
			console.log('readOnly')
			return Promise.reject(new Error('read only'))
		}


		return Promise.resolve()
	}

	i2cRead(_address: I2CAddress, length: number, bufferSource: I2CBufferSource): Promise<I2CReadResult> {
		if (this._definition.debug) { console.log('i2cRead', _address, length, bufferSource) }
		if (this._closed) { return Promise.reject(new Error('device closed')) }
		//
		console.log('i2cRead', _address, length)

		const register = 0x00
		if (!this.register(register).valid) {
			console.log('invalid read address', '0x' + register.toString(16))
			return Promise.resolve({ bytesRead: 0, buffer: new ArrayBuffer(0) })
		}

		const buffer: ArrayBuffer = ArrayBuffer.isView(bufferSource) ? bufferSource.buffer : bufferSource

		const typedBuffer = new Uint8Array(buffer)
		typedBuffer[0] = this.register(register).data
		return Promise.resolve({ bytesRead: 1, buffer })
	}

	i2cWrite(_address: I2CAddress, length: number, bufferSource: I2CBufferSource): Promise<I2CWriteResult> {
		if (this._definition.debug) { console.log('i2cWrite', _address, length, bufferSource) }
		if (this._closed) { return Promise.reject(new Error('device closed')) }
		//
		console.log('i2cWrite', _address, length, bufferSource)
		const register = 0x00
		if (!this.register(register).valid) {
			console.log('invalid write address', '0x' + register.toString(TO_STRING_BASE_HEX))
			return Promise.resolve({ bytesWritten: BYTES_WRITTEN_ERROR_LENGTH, buffer: new ArrayBuffer(0) })
		}

		if (this.register(register).readOnly === true) {
			console.log('readOnly')
			return Promise.resolve({ bytesWritten: BYTES_WRITTEN_ERROR_LENGTH, buffer: new ArrayBuffer(0) })
		}

		const buffer = new Uint8Array(ArrayBuffer.isView(bufferSource) ? bufferSource.buffer : bufferSource)
		const [first] = buffer
		this.register(register).data = first

		const bytesWritten = length
		return Promise.resolve({ bytesWritten, buffer: buffer })
	}
}

/**
 *
 **/
export class I2CMockBus implements I2CBus {
	private readonly _name: string
	private readonly _busNumber: MockBusNumber
	private static readonly _addressMap: Record<MockBusNumber, Record<I2CAddress, MockDevice>> = {}
	private _closed = false

	constructor(busNumber: MockBusNumber) {
		this._name = '__unnamed__'
		this._busNumber = busNumber
	}

	get busNumber(): MockBusNumber { return this._busNumber }
	get name(): string { return this._name }

	static addDevice(bus: MockBusNumber, address: I2CAddress, deviceDefinition: MockDefinition): void {
		const md = new MockDevice(bus, address, deviceDefinition)

		// if(I2CMockBus._addressMap === undefined) { I2CMockBus._addressMap = {} }
		if (I2CMockBus._addressMap[bus] === undefined) { I2CMockBus._addressMap[bus] = {} }
		I2CMockBus._addressMap[bus][address] = md
	}

	static async openPromisified(busNumber: number): Promise<I2CBus> {
		return Promise.resolve(new I2CMockBus(busNumber))
	}

	close(): void {
		// mark as closed, reject all read/write calls
		this._closed = true
	}

	async writeI2cBlock(address: I2CAddress, command: number, length: number, bufferSource: I2CBufferSource): Promise<I2CWriteResult> {
		if (this._closed) { return Promise.reject(new Error('bus closed')) }
		return I2CMockBus._addressMap[this._busNumber][address].writeI2cBlock(address, command, length, bufferSource)
	}

	async readI2cBlock(address: I2CAddress, command: number, length: number): Promise<I2CReadResult> {
		if (this._closed) { return Promise.reject(new Error('bus closed')) }
		return I2CMockBus._addressMap[this._busNumber][address].readI2cBlock(address, command, length)
	}

	async sendByte(address: I2CAddress, byte: number): Promise<void> {
		if (this._closed) { return Promise.reject(new Error('bus closed')) }
		return I2CMockBus._addressMap[this._busNumber][address].sendByte(address, byte)
	}

	async i2cRead(address: I2CAddress, length: number, bufferSource: I2CBufferSource): Promise<I2CReadResult> {
		if (this._closed) { return Promise.reject(new Error('bus closed')) }
		return I2CMockBus._addressMap[this._busNumber][address].i2cRead(address, length, bufferSource)
	}

	async i2cWrite(address: I2CAddress, length: number, bufferSource: I2CBufferSource): Promise<I2CWriteResult> {
		if (this._closed) { return Promise.reject(new Error('bus closed')) }
		return I2CMockBus._addressMap[this._busNumber][address].i2cWrite(address, length, bufferSource)
	}
}
