# Transaction Bus

The transaction bus provides a queue around the wrapped i2c bus. And provides and additional api for exposing a queue transaction.

## Basics

The Transaction bus chains the promise based on the last transaction, effectively serializing the calls to the wrapped i2c bus api.

When single operation are performed, this is of limited use (except when mixed with transactions as they count as such).

And additional api `transaction<T>(async cb: bus => T)` is provided to create a block of bus calls that will serialize over the wrapped bus.

Withe the assumption that add client are using this shared consumption api this can be use to make calls to the bus that span multiple requests.

```typescript
  const hwbus = __hw('i2c')
  const tbus = new I2CTransactionBus(hwbus)

  const updatedMode = await tbus.transaction(async bus => {

    const mode = await bus.readI2cBlock(ADDRESS, MODE_REG, 1)

    // perform Mode Operation and derive node Mode
    const newMode = __op(mode)

    await bus.writeI2cBlock(ADDRESS, MODE_REG, 1, newMode)

    return newMode
  })
```

## Addressed Bus

The Address Bus API simplification can be used in two distinct ways.

The first is in combination with the `I2CTransactionBus`, as both a typical wrapper, and as a wrapper for the bus resulting from a call to `transaction`.

Secondly, a Addressed Transaction Bus can be created that will both extends the api over the address parameter, but will also change the context of how `transaction` works for the bus. Allowing for the transaction to be "Scoped" to the address used.

### Serialized over Bus


```javascript
function updateMode(bus, offset) {
  return bus.transaction(atbus => {
    const mode = await atbus.readI2cBlock(MODE_REG, 1)
    // read the value in the buffer and create a new buffer with the newMode value
    // newMode = mode + offset
    return atbus.writeI2cBlock(ADDRESS, MODE_REG, 1, newMode)
  })
}

const incrementMode = bus => updateMode(bus, 1)
const decrementMode = bus => updateMode(bus, -1)

const hwbus = __hw('i2c')
cosnt tbus = new I2CTransactionBus(hwbus)
const abus1 = new I2CAddressBus(tbus, ADDRESS_1)
const abus2 = new I2CAddressBus(tbus, ADDRESS_2)

setTimeout(() => incrementMode(abus1), 1000 * Math.random() * 3
setTimeout(() => decrementMode(abus1), 1000 * Math.random() * 3
```

Alternatively, using the Transaction bus directly and wrapping the resulting `I2CBus` results in the same effect, serializing all calls across the entire bus.

```javascript
function updateMode(bus, offset) {
  return bus.transaction(tbus => {
    const abus = new I2CAddressedBus(tbus, ADDRESS)
    ...

...


const hwbus = __hw('i2c')
cosnt tbus = new I2CTransactionBus(hwbus)

...

setTimeout(() => incrementMode(tbus), 1000 * Math.random() * 3
setTimeout(() => decrementMode(tbus), 1000 * Math.random() * 3


```

### Serialized over Address

In order to create limited serialization to only addressed devices, the Addressed Transactions bus can be used

```typescript

const hwbus = __hw('i2c')
const tbus = new I2CTransactionBus(hwbus)
const atbus1 = new I2CAddressedTransactionBus(tbus, ADDRESS_1)
const atbus2 = new I2CAddressedTransactionBus(tbus, ADDRESS_2)

...

  atbus1.transaction(bus => {
    // multiple read writes are safe for this device
  })

```