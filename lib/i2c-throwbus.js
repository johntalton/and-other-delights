export class ThrowBus {
    constructor(name) {
        this._name = name;
        this.err = new Error('throw bus ' + name);
    }
    static openPromisified(name) {
        return Promise.resolve(new ThrowBus(name));
    }
    get name() { return this._name; }
    close() { throw this.err; }
    async sendByte(_address, _byte) { throw this.err; }
    async readI2cBlock(_address, _cmd, _length, _bufferSource) { throw this.err; }
    async writeI2cBlock(_address, _cmd, _length, _bufferSource) { throw this.err; }
    async i2cRead(_address, _length, _bufferSource) { throw this.err; }
    async i2cWrite(_address, _length, _bufferSource) { throw this.err; }
}
//# sourceMappingURL=i2c-throwbus.js.map