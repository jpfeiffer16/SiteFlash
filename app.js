//TODO: We can user commander later once we need it.
// const commander = require('commander');
const request = require('request');
const Url = require('url');
const fileShell = require('./fileShell');
let baseUrl = Url.parse(process.argv[2]);

if (!baseUrl.href) {
  console.error('Must include a Base URL!');
  process.exit(1);
}

let masterUrlList = [];
const FSStream = require('./fileShell');

recurse(baseUrl.href);

// request.get(baseUrl, (err, html) => {

// });



function recurse(url) {
  masterUrlList.push(url);
  // let stream = FSStream(url, baseUrl);
  // stream.urlFound((foundUrl) => {
  //   if (!foundUrl) return;
  //   console.log(foundUrl);
  //   let absUrl = foundUrl;
  //   let parsedUrl = Url.parse(absUrl);
  //   if (parsedUrl.host == baseUrl.host) {
  //     if (masterUrlList.indexOf(absUrl) == -1) {
  //       masterUrlList.push(absUrl);
  //       setTimeout(() => {
  //         console.log(absUrl);
  //         recurse(absUrl);
  //       }, 1000);
  //     }
  //   }
  // });
  // request.get(url).pipe(stream);
  request.get({
    url,
    encoding: null
  }, (err, response) => {
    if (err) {
      console.error(err);
      return;
    }
    if (Url.parse(url).host == baseUrl.host) {
      let newUrls = fileShell(url, response.body, response.headers['content-type'], true).urls;
      console.log(url);
      newUrls.forEach((url) => {
        if (!(~masterUrlList.indexOf(url))) {
          masterUrlList.push(url);
          setTimeout(() => {
            recurse(url);
          }, 1000);
        }
      });
    } else {
      fileShell(url, response.body, false);
    }
  });
}