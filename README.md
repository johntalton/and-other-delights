# And Other Delights
A simple set of abstraction and helpers useful when writing sensor libraries.

[![npm Version](https://img.shields.io/npm/v/@johntalton/and-other-delights.svg)](https://www.npmjs.com/package/@johntalton/and-other-delights)
![GitHub package.json version](https://img.shields.io/github/package-json/v/johntalton/and-other-delights/and-other-delights)
![CI](https://github.com/johntalton/and-other-delights/workflows/CI/badge.svg)
![CodeQL](https://github.com/johntalton/and-other-delights/workflows/CodeQL/badge.svg)
![GitHub](https://img.shields.io/github/license/johntalton/and-other-delights)
[![Downloads Per Month](https://img.shields.io/npm/dm/@johntalton/and-other-delights.svg)](https://www.npmjs.com/package/@johntalton/and-other-delights)
![GitHub last commit](https://img.shields.io/github/last-commit/johntalton/and-other-delights)
[![Package Quality](https://npm.packagequality.com/shield/%40johntalton%2Fand-other-delights.svg)](https://packagequality.com/#?package=@johntalton/and-other-delights)

## Contents
* [BitUtil](#book-itUtil)
* [BusUtil](#book-busutil)
* [I²C](#book-I²C)
  * [I2CBus](#book-i2cbus)
  * [I2CAddressedBus](#book-i2caddressedbus)
  * [I2CMockBus](#book-i2cmockbus)
  * [I2CScriptBus](#book-i2cscriptbus)

## :book: BitUtil
A namespace for binary operations.  All otherwise reserved operators for bit manipulation should be contained within.  Providing a single lint exception class encapsulation.

##### PackMap
The methods `packBits` and `unpackBits` work given a template of the data offset and length.
This template (`PackMap`) consists of an array of arrays that contain two numbers - the offset and length.

- Offset is calculated from the right most bit, starting at zero
- Length is number of bits to copy into destination.

Offset index numbering
| 7 | 6 | 5 | 4 | 3 | 2 | 1 | 0 |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|

The following `PackMap` `[[ 5, 2 ], [ 2, 2 ]]` with the source data `[3, 2]` will produce `0b00_11_0_10_0`
| 7 | 6 | 5 | 4 | 3 | 2 | 1 | 0 |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 0  | 0  | `1` | `1` | 0 | `1` | `0` | 0  |

A bit-flags style `PackMap` could be expressed as `[ [6, 1], [5, 1], [3, 1], [2, 1]]`.
Using the source data of `[ENABLED, ENABLED, DISABLED, ENABLED]` (aka `[1, ,1 ,0, 1]`)
| 7 | 6 | 5 | 4 | 3 | 2 | 1 | 0 |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 0  | `1`  | `1` | 0 | `0` | `1` | 0 | 0 |

The following methods `packBits` and `unpackBits` work using these templates definitions.

### `packBits` and `unpackBits`
Packs or Unpacks multiple number values of specified length (in bits) into or out of a single 8-bit number given a `PackMap` template.

```javascript
const template = [ [6, 1], [5, 3], [1, 2] ]
```

| 7 | 6 | 5 | 4 | 3 | 2 | 1 | 0 |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 0  | `X`  | `Y` | `Y` | `Y` | 0 | `Z` | `Z` |

```javascript
const source = [1, 3, 2]
const expected = 0b0_1_011_0_10 // 0x5A
const outRegister = BitUtil.packBits(template, source)
expect(outRegister).to.equal(expected)
```

And thus:
```javascript
const inRegister = 0x5A
const [one, three, two] = BitUtil.unpackBits(template, inRegister)
expect(one).to.equal(1)
expect(two).to.equal(2)
expect(three).to.equal(3)
```

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
#### `read`
Reads a blocks of data of `length` given a `command` byte (register address).

Such that the following would read 32-bits from register 0x1A (in a register based device)
```javascript
const register = await ab.read(0x1A, 4)
```

#### `write`
Write a block of data to a given 'command' (at register address)

The following would write 32-bits for at the given address.
```javascript
await ab.write(0x1A, Buffer.from([3, 5, 7, 9))
```

#### `writeSpecial`
A special write command - also known as `sendByte` - that will write the command (register) value with no additional data.

This is useful for command that expect a register set followed by a `readBuffer` call.

#### `readBuffer`
Reads a block of data of a given `length`.
While implementations and designs differ, many devices use this method in conjunction with `writeSpecail` as a set-address/read-data pair.

```javascript
await ab.writeSpecial(0x1A)
const data = await ab.readBuffer(4)
```

#### `writeBuffer`
Write the given data.
Implementation specific behavior, however, some devices use this in conjunction with `writeSpecial`.

```javascript
await ab.writeSpecial(0x1A)
const data = await ab.writeBuffer(Buffer.from([3, 5, 7, 9]))
```

## :book: I2CMockBus
An `I2CBus` implementation that emulates a register layout given a definition file.

Useful for simulating full mocks or persistent data.  Also when complex read / write actions are not suitable for a scripted approach (see `I2CScriptBus`).

## :book: I2CScriptBus
An `I2CBus` implementation that uses an ordered script to govern api call interactions.

## :book: ClassSelector
**Try not to use this.** It is a poor attempt to write a more functional way of selecting `class` definitions based on conditions.

It can serve as a usefull standin for limited language support for expressive `switch`/`case`.
