# And Other Delights

A simple set of abstraction and helpers usefull when writing sensor libraries.


[![npm Version](https://img.shields.io/npm/v/@johntalton/and-other-delights.svg)](https://www.npmjs.com/package/@johntalton/and-other-delights)
![GitHub package.json version](https://img.shields.io/github/package-json/v/johntalton/and-other-delights)
![CI](https://github.com/johntalton/and-other-delights/workflows/CI/badge.svg?branch=master&event=push)
![GitHub](https://img.shields.io/github/license/johntalton/and-other-delights)
[![Downloads Per Month](https://img.shields.io/npm/dm/@johntalton/and-other-delights.svg)](https://www.npmjs.com/package/@johntalton/and-other-delights)
![GitHub last commit](https://img.shields.io/github/last-commit/johntalton/and-other-delights)


## Contents
* [BitUtil](#book-itUtil)
* [BusUtil](#book-busutil)
* [ClassSelector](#book-classselector)
* [I2CBus](#book-i2cbus)
* [I2CAddressedBus](#book-i2caddressedbus)
* [I2CMockBus](#book-i2cmockbus)
* [I2CScriptBus](#book-i2cscriptbus)

## :book: BitUtil

A namespace for binary operations.  All otherwize reserved oporators for bit manipulation should be contained withing.  Providing a single lint exception class encapsulation.

##### PackMap

The methods `packBits` and `unpackBits` work given a template of the data offset and length.
This template (`PackMap`) consists of an array of arrays that contain two numbers - the offset and length.

- Offset is calulated from the right most bit, starting at zero
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

A set of helper methods that can make reading and wrting to addressed based register style I²C devices.

#### `normalizeBlock`

#### `readblock`

#### `writeblock`

#### `filmapBlock`

## :book: ClassSelector

#### `static from`

#### `on`

#### `catch`

## :book: I2C

A set of I²C interfaces that provide basic I2C interaction.

They are a (simplification and extention) wrapper for the `i2c-bus` @fivdi implementation.

## :book: I2CBus

Interface to provide a stable api to build other I²C APIs around.

An example usage would be to wrap an existing `I2CBus` concret class.  In this case adding console output.
```typescript
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

A address cache class wrapper for I²C bus interactions.
Providing a `I2CManagedBus` interface to the device and wrapping an `I2CBus`.

```typescript
const ab = new I2CAddressedBus(i2cbus, busAddress)
```

## :book: I2CMockBus

## :book: I2CScriptBus