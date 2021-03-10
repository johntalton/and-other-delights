export const EOS_SCRIPT = [
    { method: 'throw', result: 'end of script' }
];
// async function* scriptStream(queue) {
//   port.on('message', msg => {
//     yield msg
//   })
// }
/**
 *
 */
export class I2CScriptBus {
    constructor(script) {
        this._name = '__unnamed__';
        this.scriptIndex = 0;
        this.script = script;
        this.debug = false;
    }
    static async openPromisified(script) {
        return Promise.resolve(new I2CScriptBus(script));
    }
    get name() { return this._name; }
    // appendScript(script: Script): void {
    //   this.script.concat(script)
    // }
    validate(name) {
        const nextNode = this.script[this.scriptIndex];
        if (nextNode.method === 'debug') {
            this.debug = true;
            this.scriptIndex += 1;
        }
        if (nextNode.method === 'no-debug') {
            this.debug = false;
            this.scriptIndex += 1;
        }
        const scriptNode = this.script[this.scriptIndex];
        if (this.debug) {
            console.debug(name, 'scriptNode:', scriptNode);
        }
        if (scriptNode.method === 'throw') {
            throw new Error(scriptNode.result);
        }
        if (scriptNode.method !== name) {
            throw new Error('invalid script step #' + this.scriptIndex + ' ' + name + ' / ' + scriptNode.method);
        }
        this.scriptIndex += 1;
        return scriptNode;
    }
    close() {
        this.validate('close');
    }
    async sendByte(_address, _byte) {
        this.validate('sendByte');
        return Promise.resolve();
    }
    async readI2cBlock(_address, _cmd, _length, _bufferSource) {
        const scriptNode = this.validate('readI2cBlock');
        return Promise.resolve(scriptNode.result);
    }
    async writeI2cBlock(_address, _cmd, _length, _bufferSource) {
        const scriptNode = this.validate('writeI2cBlock');
        return Promise.resolve(scriptNode.result);
    }
    async i2cRead(_address, _length, _bufferSource) {
        const scriptNode = this.validate('i2cRead');
        return Promise.resolve(scriptNode.result);
    }
    async i2cWrite(_address, _length, _bufferSource) {
        const scriptNode = this.validate('i2cWrite');
        return Promise.resolve(scriptNode.result);
    }
}
//# sourceMappingURL=i2c-scriptbus.js.map