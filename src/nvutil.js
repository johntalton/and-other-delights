
/**
 *
 **/
class NameValueUtil {
  static toName(value, nvmap) {
    const item = nvmap.find(i => i.value === value);
    if(item === undefined) { console.log(nvmap); throw Error('enum mapping failed for ' + value); }
    return item.name;
  }

  static toValue(name, nvmap) {
    const item = nvmap.find(i => i.name === name);
    if(item === undefined) { console.log(nvmap); throw Error('unknonw enum name: ' + name); }
    return item.value;
  }
}

module.exports = { NameValueUtil };
