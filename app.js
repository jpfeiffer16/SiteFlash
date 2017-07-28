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

recurse(baseUrl.href);

// request.get(baseUrl, (err, html) => {
  
// });


function recurse(url) {
  masterUrlList.push(url);
  console.log(url);
  request.get(url, (err, response) => {
    // console.log(content);
    if (err) {
      //TODO: Handle this better in the future.
      console.error(err);
      return;
    }

    if (!response.body) {
      //TODO: Handle this better too.
      console.error('There was no content for this request');
      return;
    }
    
    let {urls, newHtml} = parse(response.body);
    writeFile(url, newHtml);

    urls.forEach((url) => {
      let absUrl = resolveUrl(url);
      let parsedUrl = Url.parse(absUrl);
      if (parsedUrl.host == baseUrl.host) {
        if (masterUrlList.indexOf(absUrl) == -1) {
          setTimeout(() => {
            recurse(absUrl);
          }, 1000);
        }
      }
    });
    
  });
}

function parse(html) {
  //Extract urls and replace with fs-tranformed urls here.
  let urls = [];
  let urlRegex = /https?:\/\/.+?(?=( |"))|href=("|').+?("|')|src=("|').+?("|')/g;
  // let urlRegex = /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
  

  // console.log(html);
  // console.log(urlRegex.test(html));
  var matches = html.match(urlRegex);
  if (matches != null) {
    urls = matches.map((url) => {
      return url
        .replace('\'', '')
        .replace('"', '')
        .replace('href=', '')
        .replace('src=', '');
    });
  }

  return {
    urls,
    newHtml: html
  }
  
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

function fsTransformUrl(url) {
  //TODO: tranform url to filesystem path here.
  // console.log();
  var parsedUrl = Url.parse(url);
  return path.join(
    __dirname,
    'sites',
    parsedUrl.host,
    parsedUrl.path == '/' ? 'index.html' : parsedUrl.path.replace(' ', '_')
  );
}


const mkdirp = require('mkdirp');
const fs = require('fs');

function writeFile(url, content) {
  var parsedUrl = Url.parse(url);
  mkdirp.sync(path.join(
    __dirname,
    'sites',
    parsedUrl.host,
    parsedUrl.path.replace(' ', '_')
  ));

  fs.writeFile(fsTransformUrl(url), content);
}