const request = require('request'),
      Url = require('url'),
      fileShell = require('./fileShell');

// var Promise = require("bluebird");

// let baseUrl = Url.parse(process.argv[2]);

module.exports = function(baseUrl, siteName) {
  baseUrl = Url.parse(baseUrl);

  if (!baseUrl.href) {
    console.error('Must include a Base URL!');
    process.exit(1);
  }

  let masterUrlList = [];
  // let progressList = [];
  const FSStream = require('./fileShell');

  recurse(baseUrl.href);

  function recurse(url) {
    // var promise = new Promise((resolve, reject) => {
    // progressList.push(promise);
    masterUrlList.push(url);
    request.get({
      url,
      encoding: null
    }, (err, response) => {
      if (err) {
        console.error(err);
        return;
      }
      if (Url.parse(url).host == baseUrl.host) {
        let newUrls = fileShell(
          url,
          response.body,
          response.headers['content-type'],
          siteName,
          true
        ).urls;
        // console.log(url);
        newUrls.forEach((url) => {
          if (!(~masterUrlList.indexOf(url)) && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
            masterUrlList.push(url);
            setTimeout(() => {
              // resolve();
              console.log(url);
              recurse(url);
            }, 1000);
          }
        });
      } else {
        fileShell(
          url,
          response.body,
          response.headers['content-type'],
          siteName,
          false
        );
        // resolve();
      }
    });

    // }); 
  }

  setTimeout(() => {
    const fs = require('fs');
    const path = require('path');
    const crypto = require('crypto');
    let md5sum = crypto.createHash('md5');
    md5sum.update(baseUrl.href);
    let hash = md5sum.digest('hex');
    fs.link(
      path.join('./', 'sites', siteName, hash),
      path.join('./', 'sites', siteName,  'index.html'), 
      (err) => {
        if (err) {
          console.error(err);
          return;
        }
        // console.log('index.html created');
      }
    );
  }, 3000);

  // Promise.all(progressList).then(() => {
  //   console.log('All Done!');
  // });
}