const stream = require('stream');
const util = require('util');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const Url = require('url');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

let exportMethod = function(url, content, contentType, parse) {
  let parsedUrls = [];
  console.log(contentType);
  if (parse) {
    let strRepr = content.toString('utf-8');

    switch(contentType) {
      case 'text/css':
        strRepr = parseCss(strRepr, url);
        break;
      case 'text/html':
        strRepr = parseHtml(strRepr, url);
        break;
    }


    // if (~strRepr.indexOf('<body') || ~strRepr.indexOf('<html')) {
    //   let { urls, newHtml } = parseContent(strRepr, url);
    //   parsedUrls = urls;
    //   fs.writeFile(fsTransformUrlToFile(url), newHtml);
    // } else {
    //   fs.writeFile(fsTransformUrlToFile(url), content);
    // }
    fs.writeFile(fsTransformUrlToFile(url), newHtml);
  } else {
    fs.writeFile(fsTransformUrlToFile(url), content);
  }

  return {
    urls: parsedUrls
  };
}

function parseHtml(html, baseUrl) {
  let urls = [];

  let dom = new JSDOM(html);

  //href's
  let hrefElements = dom.window.document.querySelectorAll('[href]');
  hrefElements.forEach((el) => {
    let foundUrl = Url.resolve(baseUrl, el.href);
    urls.push(foundUrl);
    //TODO: Transform and replace here
    el.href = fsTransformUrlToFile(foundUrl);
  });

  //src's
  let srcElements = dom.window.document.querySelectorAll('[src]');
  srcElements.forEach((el) => {
    let foundUrl = Url.resolve(baseUrl, el.src);
    urls.push(foundUrl);
    //TODO: Transform and replace here
    el.src = fsTransformUrlToFile(foundUrl);
  });

  // dom.window.close();

  return {
    urls,
    newHtml: dom.serialize()
  }
}

function parseCss(css, baseUrl) {
  //TODO: Do stuff here
}

function tranformAndEnsureDiskPath(url) {
  let checkPath = fsTransformUrlToDir(url);
  if (fs.existsSync(checkPath)) {
    if (fs.statSync(checkPath).isFile()) {

    }
  } else {
    mkdirp.sync(checkPath);
  }
  return fsTransformUrlToFile(url);
}

function fsTransformUrlToFile(url) {
  //TODO: tranform url to filesystem path here.
  // console.log();
  let crypto = require('crypto');

  let md5sum = crypto.createHash('md5');
  md5sum.update(url);
  
  var parsedUrl = Url.parse(url);
  return path.join(
    __dirname,
    'sites',
    md5sum.digest('hex')
  );
}

// function fsTransformUrlToFile(url) {
//   //TODO: tranform url to filesystem path here.
//   // console.log();
//   var parsedUrl = Url.parse(url);
//   let resultPath = path.join(
//     __dirname,
//     'sites',
//     parsedUrl.host,
//     parsedUrl.path == '/' ? 'index.html' : parsedUrl.path.replace(' ', '_')
//   );
//   if (fs.existsSync(resultPath)) {
//     resultPath += parseInt(Math.random() * 100).toString();
//   }
//   return resultPath;
// }

function fsTransformUrlToDir(url) {
  //TODO: tranform url to filesystem path here.
  // console.log();

  // let checkPath = fsTransformUrlToDir(url);


  var parsedUrl = Url.parse(url);
  let dirpath = '';
  let index = parsedUrl.path.lastIndexOf('/');
  if (index != -1) {
    dirpath = parsedUrl.path.slice(0, index);
  }
  let checkPath = path.join(
    __dirname,
    'sites',
    parsedUrl.host,
    dirpath
  );

  if (fs.existsSync(checkPath)) {
    if (fs.statSync(checkPath).isFile()) {
      checkPath += parseInt(Math.random() * 100).toString();
    }
  }

  return checkPath;
}

// function writeFile(url, content) {
//   var parsedUrl = Url.parse(url);
//   mkdirp.sync(fsTransformUrlToDir(url));

//   fs.writeFile(fsTransformUrlToFile(url), content);
// }

// function resolveUrl(baseUrl, url) {
  
//   //TODO: For now just return the url, but in the future, we need to parse it 
//   //and convert relavive urls to absolute ones

//   if (url.startsWith('http') == 1) {
//     return url;
//   }

//   if (url.startsWith('/')) {
//     url = baseUrl.protocol + "//" + baseUrl.host + url;
//   } else {
//     //TEMP
//     return null;
//   }


//   return url;
// }

module.exports = exportMethod;