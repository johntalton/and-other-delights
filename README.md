# And Other Delights

A simple set of abstraction and helpers usefull when writing sensor libraries.


[![npm Version](https://img.shields.io/npm/v/@johntalton/and-other-delights.svg)](https://www.npmjs.com/package/@johntalton/and-other-delights)
![GitHub package.json version](https://img.shields.io/github/package-json/v/johntalton/and-other-delights)
![CI](https://github.com/johntalton/and-other-delights/workflows/CI/badge.svg?branch=master&event=push)
![GitHub](https://img.shields.io/github/license/johntalton/and-other-delights)
[![Downloads Per Month](https://img.shields.io/npm/dm/@johntalton/and-other-delights.svg)](https://www.npmjs.com/package/@johntalton/and-other-delights)
![GitHub last commit](https://img.shields.io/github/last-commit/johntalton/and-other-delights)

## :gear: BitUtil

Doing binary / bitwize work is pushed down to this layer to focus all reserved operators to a single interface.  With methods descrbing intention over function.

### `packbits`

### `unpackbits`

## :gear: BusUtil

A set of helper methods that can make reading and wrting to addressed based register style I²C devices.

### `normalizeBlock`

### `readblock`

### `writeblock`

### `filmapBlock`

## :gear: ClassSelector

### `static from`

### `on`

### `catch`

## :gear: I2C

A set of I²C interfaces that provide basic I2C interaction.

They are a (simplification and extention) wrapper for the `i2c-bus` @fivdi implementation.

### `interface I2CBus`

## :gear: I2CAddressedBus

A address cache class wrapper for I²C buss interactions.

## :gear: I2CMockBus

## :gear: I2CScriptBus