//Middleware to ensure a certain querystring value on each request.
const parse = require('url-parse');
const QueryString = require('querystring-js');
const Url = require('url');


//Format:

module.exports = {
  preRequest: function(state, input) {
    let url = state.url;
    let customParsedUrl = parse(url.href);

    // console.log('Querystring middleware being invoked');
    if (input.trim()) {
      let querystringSections = input.trim().split('=');
      // customParsedUrl.set('test', 'test')
      // console.log(customParsedUrl);
      let querystring = new QueryString(url.search ? url.search : '');
      let finalInput = input.startsWith('?') ? input : '?' + input;
      let params = new QueryString(input);
      let paramsObj = params.getQueryObject();
      for (key in paramsObj) {
        querystring.set(key, paramsObj[key]);
      }

      return {
        request: state.request,
        url:Url.parse(url.protocol + '//' + url.host + url.pathname + querystring.getQueryString())
      }
      
      // console.log(state.url);

      // console.log(querystring.getQueryString());
      // console.log(params.getQueryObject());

      // console.log(querystring);
      // console.log(url);
    }
  }
}