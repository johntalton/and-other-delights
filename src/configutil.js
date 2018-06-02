
const fs = require('fs');

/**
 *
 **/
class ConfigUtil {
  static config(path) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, { encoding: 'utf-8', flag: 'r' }, (err, data) => {
        if(err) { reject(err); return; }
        resolve(data);
      });
    })
    .then(JSON.parse)
  }

  static readString(str, fallback) { return str !== undefined ? str : fallback.toString(); }

  static readBoolean(b, fallback) { return b !== undefined ? b : fallback; }

  static readTimeout(ms, s, fallback) {
    if(ms === undefined && s === undefined) { return fallback; }
    const sz = s != undefined ? s : 0
    const msz = ms !== undefined ? ms : 0;
    return sz * 1000 + msz;
  }
}

module.exports = { ConfigUtil };
