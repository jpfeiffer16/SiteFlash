module.exports = function(cacheMethod, obj, property, cb) {
  function cache(value) {
    obj[property] = value;
    cb(obj[property]);
  }

  if (obj[property]) {
    cb(obj[property]);
    return;
  }
  cacheMethod(cache);
}