//TODO: We can user commander later once we need it.
// const commander = require('commander');
const request = require('request');
const Url = require('url');
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
  console.log(url);
  let stream = FSStream(url);
  stream.urlFound((foundUrl) => {
    console.log(foundUrl);
    let absUrl = resolveUrl(foundUrl);
    let parsedUrl = Url.parse(absUrl);
    if (parsedUrl.host == baseUrl.host) {
      if (masterUrlList.indexOf(absUrl) == -1) {
        setTimeout(() => {
          recurse(absUrl);
        }, 1000);
      }
    }
  });
  request.get(url).pipe(stream);
  // request.get(url, (err, response) => {
  //   // console.log(content);
  //   if (err) {
  //     //TODO: Handle this better in the future.
  //     console.error(err);
  //     return;
  //   }

  //   if (!response.body) {
  //     //TODO: Handle this better too.
  //     console.error('There was no content for this request');
  //     return;
  //   }

  //   let { urls, newHtml } = parse(response.body);
  //   writeFile(url, newHtml);

  //   urls.forEach((url) => {
  
  //   });

  // });
}

function resolveUrl(url) {
  //TODO: For now just return the url, but in the future, we need to parse it 
  //and convert relavive urls to absolute ones

  if (url.startsWith('http') == 1) {
    return url;
  }

  if (url.startsWith('/')) {
    url = baseUrl.protocol + "//" + baseUrl.host + url;
  }


  return url;
}

const path = require('path');

