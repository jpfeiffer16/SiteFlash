describe('cacheTests', () => {
  let cache = require('../src/cache');
  let cacheObj = {};

  it('should add a cached result to object', () => {
    cache(
      (cacheCall) => {
        cacheCall('test');
      },
      cacheObj,
      'test',
      (result) => {
        //Don't need to do anything here
      }
    );
    expect(cacheObj.test).toEqual('test');
  })
});