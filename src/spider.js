const request = require('request'),
      Url = require('url'),
      fileShell = require('./fileShell'),
      fs = require('fs'),
      path = require('path'),
      crypto = require('crypto');

module.exports = function(baseUrl, siteName, middleware) {
  let middlewares = [];
  baseUrl = Url.parse(baseUrl);

  if (!baseUrl.href) {
    console.error('Must include a Base URL!');
    process.exit(1);
  }

  if (middleware.trim()) {
    let params = [];
    let values = [];
    middleware
      .trim()
      .split(':')
      .forEach((item, i) => {
        // i % 2 > 0 ? values.push(item) : params.push(item);
        i % 2 > 0 ? values.push(item) : params.push(item);
      });
    params.forEach((param, i) => {
      middlewares.push({
        module: require(path.join(
          __dirname,
          'middleware',
          param
        )),
        input: values[i]
      });
    });
  }

  let masterUrlList = [];
  let shell = fileShell(siteName);

  recurse(baseUrl.href, (state) => {
    console.log('Linking index');
    linkIndex();
  });

  function recurse(url, cb) {
    let thisParsedUlr = Url.parse(url);
    let stateObj = {
      response: null,
      url: thisParsedUlr
    };

    masterUrlList.push(url);

    //Invoke middleware pre-request
    middlewares.forEach((middleware) => {
      if (middleware.module.preRequest) {
        stateObj = middleware.module.preRequest(stateObj, middleware.input);
        // console.log('State obj:');
        // console.log(stateObj);
      }
    });
    url = stateObj.url.href;
    request.get({
      url,
      encoding: null
    }, (err, response) => {
      if (err) {
        shell.log(err, console.error);
        return;
      }
      if (thisParsedUlr.host == baseUrl.host) {
        stateObj.response = response;

        //Invoke middleware post-request
        middlewares.forEach((middleware) => {
          if (middleware.module.postRequest) {
            stateObj = middleware.module.postRequest(stateObj, middleware.input);
          }
        });
        url = stateObj.url.href;

        let newUrls = shell.process(
          url,
          response.body,
          response.headers['content-type'],
          true
        ).urls;
        newUrls.forEach((url) => {
          if (
            !(~masterUrlList.indexOf(url)) && 
            !url.startsWith('mailto:') &&
            !url.startsWith('about:') &&
            !url.startsWith('data:') &&
            !url.startsWith('tel:')
          ) {
            masterUrlList.push(url);
            setTimeout(() => {
              console.log(url);
              recurse(url);
            }, 1000);
          }
        });
        if (cb) {
          cb(stateObj);
        }
      } else {
        shell.process(
          url,
          response.body,
          response.headers['content-type'],
          false
        );
      }
    });
  }

  function linkIndex() {
    let md5sum = crypto.createHash('md5');
    md5sum.update(baseUrl.href);
    let hash = md5sum.digest('hex');
    fs.link(
      path.join('./', 'sites', siteName, hash),
      path.join('./', 'sites', siteName,  'index.html'), 
      (err) => {
        if (err) {
          shell.log(err, console.error);
          return;
        }
        shell.log(`index.html -> ${ hash }`, console.log);
      }
    );
  }
}