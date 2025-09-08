# And Other Delights
A simple set of abstraction and helpers useful when working with I²C

[![npm Version](https://img.shields.io/npm/v/@johntalton/and-other-delights.svg)](https://www.npmjs.com/package/@johntalton/and-other-delights)
![GitHub package.json version](https://img.shields.io/github/package-json/v/johntalton/and-other-delights)
[![CI](https://github.com/johntalton/and-other-delights/actions/workflows/CI.yml/badge.svg)](https://github.com/johntalton/and-other-delights/actions/workflows/CI.yml)
![CodeQL](https://github.com/johntalton/and-other-delights/workflows/CodeQL/badge.svg)
![GitHub](https://img.shields.io/github/license/johntalton/and-other-delights)
[![Downloads Per Month](https://img.shields.io/npm/dm/@johntalton/and-other-delights.svg)](https://www.npmjs.com/package/@johntalton/and-other-delights)
![GitHub last commit](https://img.shields.io/github/last-commit/johntalton/and-other-delights)

## Contents

* [I²C](#book-I²C)
  * [I2CBus](#book-i2cbus)
  * [I2CAddressedBus](#book-i2caddressedbus)
  * [I2CBusSoft16](#book-i2cbussoft16)


## :book: I2CBus

This is the top level interface for `I2CBus` implementations.  There are several concert version that conform to this, and a wide range of other abstraction that can provided capabilities around it.

- [MCP221](https://github.com/johntalton/i2c-bus-mcp2221) can provide I²C interface
- The Excamera Labs I2CDriver also exposes a [`I2CBus`](https://github.com/johntalton/i2c-bus-excamera-i2cdriver)
- NodeJS version based on `i2c-bus` [I2CBusFivdi](https://github.com/johntalton/i2c-bus-fivdi)
- A Virtualized Managed [`I2CBus`](https://github.com/johntalton/2c-bus-tca9548a) for the TCA9548 Multiplexer
- A Proxy implementation over [`MessagePort`](https://github.com/johntalton/i2c-bus-) in order to provide further abstraction, and a [Web Service](https://github.com/johntalton/i2c-bus-service) that uses it.

## :book: I2CAddressedBus

An addressed wrapper for I²C bus interactions.
Providing a `I2CAddressedBus` interface to the device and wrapping an `I2CBus`.

```javascript
const ab = await I2CAddressedBus.from(i2cbus, busAddress)
const buffer = await ab.readI2cBlock(command, length)
```

## :book: I2CBusSoft16

Some `I2CBus` concret implementation do not directly support 16-bit register addresses in the `readI2cBlock` and `writeI2cBlock` methods.  This wrapper bus can be used to provided that feature by directly calling `i2cWrite` and `i2cRead` directly.

This may introduce differences in the interaction and timing of specific devices or underlying implementation expectation.

```javascript
const bus = /* I2CBus that may-or-may-not implement 16-bit addresses */
const bus16 = new I2CBusSoft16(bus)

// read 8 bytes from a 16-bit address 0x0402
// this will only use software version
// if not supported by the underlying `bus`
const buffer = await bus16.readI2cBlock([ 4, 2 ], 8)
```