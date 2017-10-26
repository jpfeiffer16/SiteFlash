const request = require('request'),
      Url = require('url'),
      fileShell = require('./fileShell'),
      fs = require('fs'),
      path = require('path'),
      crypto = require('crypto');

module.exports = function(baseUrl, siteName) {
  baseUrl = Url.parse(baseUrl);

  if (!baseUrl.href) {
    console.error('Must include a Base URL!');
    process.exit(1);
  }

  let masterUrlList = [];
  let shell = fileShell(siteName);

  recurse(baseUrl.href, (state) => {
    console.log('Linking index');
    linkIndex();
    createInfo();
  });

  function recurse(url, cb) {
    masterUrlList.push(url);
    request.get({
      url,
      encoding: null
    }, (err, response) => {
      if (err) {
        shell.log(err, console.error);
        return;
      }
      if (Url.parse(url).host == baseUrl.host) {
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
          cb({
            response,
            url: Url.parse(url)
          });
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
    md5sum.update(baseUrl.path);
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

  function createInfo() {
    let info = {
      domain: baseUrl.host
    };
    fs.writeFileSync(
      path.join('./', 'sites', siteName, 'info.json'),
      JSON.stringify(info),
      'utf8'
    );
    shell.log('creating info file -> info.json', console.log);
    shell.log(JSON.stringify(info), console.log);
  }
}