# And Other Delights
A simple set of abstraction and helpers useful when working with I²C

[![npm Version](https://img.shields.io/npm/v/@johntalton/and-other-delights.svg)](https://www.npmjs.com/package/@johntalton/and-other-delights)
![GitHub package.json version](https://img.shields.io/github/package-json/v/johntalton/and-other-delights/and-other-delights)
[![CI](https://github.com/johntalton/and-other-delights/actions/workflows/CI.yml/badge.svg)](https://github.com/johntalton/and-other-delights/actions/workflows/CI.yml)
![CodeQL](https://github.com/johntalton/and-other-delights/workflows/CodeQL/badge.svg)
![GitHub](https://img.shields.io/github/license/johntalton/and-other-delights)
[![Downloads Per Month](https://img.shields.io/npm/dm/@johntalton/and-other-delights.svg)](https://www.npmjs.com/package/@johntalton/and-other-delights)
![GitHub last commit](https://img.shields.io/github/last-commit/johntalton/and-other-delights)

## Contents

* [BusUtil](#book-busutil)
* [I²C](#book-I²C)
  * [I2CBus](#book-i2cbus)
  * [I2CAddressedBus](#book-i2caddressedbus)
  * [I2CMockBus](#book-i2cmockbus)
  * [I2CScriptBus](#book-i2cscriptbus)

## :book: BusUtil

A set of helper methods that can smooth the process of reading and writing to addressed based register style I²C devices.

##### `BlockDefinition`

A subset of the `BusUtil1` methods performs opperations a set of address length pairs.

Thus, the `Block` is defined as an arrays of 2-length arrays.
```javascript
const block = [[addr, len], ...]
```

The following methods utilize this definition to perform multi-register read/write operations.

#### `readBlock`

Read a `Block` defined register (of lenghts) set.

Give an imaginary device with three registers of differnt lengths this example will read from the addressed device and return a `buffer` containing the data from the device with a length equal to the sum of the definitions register lengths.


```javascript
// get the good stuff
import i2c from '...'
import { I2CAddressedBus } from '@johntalton/and-other-delights'

// setup a make believe device on bus 1 address 66
const busNumber = 1
const busAddress = 0x42
const bus1 = await i2c.openPromisified(busNumber)
const abus1 = await I2CAddressedBus.from(bus1, busAddress)

// defined a register set of 3,5,7 each with different lengths of 2,1 and 3 respectivly
const block = [[3, 2], [5, 1], [7, 3]]
const buffer = await BusUtil.readBlock(abus1, block)

// 2 + 1 + 3 = 6
assert(bufer.length === 6)
```

#### `writeBlock`
Write the given `buffer` to the device registers defined by the `Block`.

The `buffer` is read as a packed set of bytes equal to the sum of the `Blocks` total registers length.

```javascript
// get the good stuff
import i2c from 'i2c-bus'
import { I2CAddressedBus } from '@johntalton/and-other-delights'

// setup a make believe device on bus 1 address 66
const busNumber = 1
const busAddress = 0x42
const bus1 = await i2c.openPromisified(busNumber)
const abus1 = await I2CAddressedBus.from(bus1, busAddress)

// defined a register set of 3,5,7 each with different lengths of 2,1 and 3 respectivly
const block = [[3, 2], [5, 1], [7, 3]]
const buffer = await BusUtil.readBlock(abus1, block)

```

#### `expandBlock`

As a `Block` is an address / lengthed pairing - the need arises to convert it into a single array.

`expandBlock` will fill the un-addressed gaps with a specified fill byte.

## :book: I²C

A set of I²C interfaces that provide basic interaction.

They are a (simplification and extension) wrapper for the `i2c-bus` @fivdi implementation.

## :book: I2CBus

Interface to provide a stable api to build other I²C APIs around.

An example usage would be to wrap an existing `I2CBus` class.  In this case adding console output.

```javascript
class LogBus extends I2CBus {
    static from(bus) { return new LogBus(bus) }
    constructor(bus) { this.bus = bus }

    // ... other class methods

    readI2cBlock(addr, cmd, length, buffer) {
        console.log('Reading I2C Block', add, cmd, length);
        this.bus.readI2cBlock(add, cmd, length, buffer)
    }
}

const bus // "other bus" setup code
const lb = LogBus.from(bus)

// using SomeDevice with LogBus proxy into the base bus
const device = SomeDevice.from(bus, options)
```

## :book: I2CAddressedBus

An address-cache wrapper for I²C bus interactions.
Providing a `I2CManagedBus` interface to the device and wrapping an `I2CBus`.

```javascript
const ab = await I2CAddressedBus.from(i2cbus, busAddress)
```

#### `readI2cBlock`

Reads a blocks of data of `length` given a `command` byte (register address).

Such that the following would read 32-bits from register 0x1A (in a register based device)

```javascript
const result = await ab.readI2cBlock(0x1A, 4)
```

#### `writeI2cBlock`

Write a block of data to a given 'command' (at register address)

The following would write 32-bits for at the given address.

```javascript
await ab.writeI2cBlock(0x1A, Uint8Array.from([3, 5, 7, 9))
```

#### `sendByte`

A single byte write command that tipicaly will write the command (register) value with no additional data.

This is useful for command that expect a register set followed by a `i2cRead` call.

#### `i2cRead`

Reads a block of data of a given `length`.
While implementations and designs differ, many devices use this method in conjunction with `sendBtye` as a set-address/read-data pair.

```javascript
await ab.sendBtye(0x1A)
const data = await ab.i2cRead(4)
```

#### `i2cWrite`

Write the given data.
Implementation specific behavior, however, some devices use this in conjunction with `writeSpecial`.

```javascript
await ab.sendBtye(0x1A)
const data = await ab.i2cWrite(Uint8Array.from([3, 5, 7, 9]))
```

## :book: I2CMockBus

An `I2CBus` implementation that emulates a register layout given a definition file.

Useful for simulating full mocks or persistent data.  Also when complex read / write actions are not suitable for a scripted approach (see `I2CScriptBus`).

## :book: I2CScriptBus

An `I2CBus` implementation that uses an ordered script to govern api call interactions.
