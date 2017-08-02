const stream = require('stream'),
      util = require('util'),
      fs = require('fs'),
      path = require('path'),
      mkdirp = require('mkdirp'),
      Url = require('url'),
      jsdom = require("jsdom"),
      { JSDOM } = jsdom;

let exportMethod = function(url, content, contentType, siteName, parse) {
  let parsedUrls = [];
  console.log(contentType);
  if (parse && contentType) {
    let strRepr = content.toString('utf-8');
    // let result = {
    //   urls: [],
    //   newContent: ''
    // };

    // switch(contentType) {
    //   case 'text/css':
    //     result = parseCss(strRepr, url);
    //     break;
    //   case 'text/html':
    //     result = parseHtml(strRepr, url);
    //     break;
    // }

    if (~contentType.indexOf('text/html')) {
      let result = parseHtml(strRepr, url);
      parsedUrls = result.urls;
      fs.writeFile(fsTransformUrlToFile(url).fsPath, result.newContent);
    } else if(~contentType.indexOf('text/css')) { 
      let result = parseCss(strRepr, url);
      parsedUrls = result.urls;
      fs.writeFile(fsTransformUrlToFile(url).fsPath, result.newContent);
    } else {
      fs.writeFile(fsTransformUrlToFile(url).fsPath, content);
    }
  } else {
    fs.writeFile(fsTransformUrlToFile(url).fsPath, content);
  }

  // let parseHtml = parseHtml;
  // let parseCss = parseCss;
  // let fsTransformUrlToFile = fsTransformUrlToFile;


  function parseHtml(html, baseUrl) {
    let urls = [];

    let dom = new JSDOM(html);

    //href's
    let hrefElements = dom.window.document.querySelectorAll('[href]');
    hrefElements.forEach((el) => {
      let foundUrl = Url.resolve(baseUrl, el.href);
      urls.push(foundUrl);
      //TODO: Transform and replace here
      el.href = fsTransformUrlToFile(foundUrl).webPath;
    });

    //src's
    let srcElements = dom.window.document.querySelectorAll('[src]');
    srcElements.forEach((el) => {
      let foundUrl = Url.resolve(baseUrl, el.src);
      urls.push(foundUrl);
      //TODO: Transform and replace here
      el.src = fsTransformUrlToFile(foundUrl).webPath;
    });

    //style's
    let styleElements = dom.window.document.querySelectorAll('[style]');
    styleElements.forEach((el) => {
      let results = parseCss(el.getAttribute('style'), baseUrl);

      el.setAttribute('style', results.newContent);
      if (results.urls.length > 0) {
        urls.concat(results);
      }
    });

    // dom.window.close();

    return {
      urls,
      newContent: dom.serialize()
    }
  }

  function parseCss(css, baseUrl) {
    //TODO: Do stuff here
    let urls = [];
    let newContent = css;
    let urlRegex = /url\(.*?('|")?\)/g
    let match = null;
    while (match = urlRegex.exec(newContent)) {
      let finalMatch = match[0]
        .replace(/url\(("|')?/g, '')
        .replace(/("|')?\)/g, '');
      let foundUrl = Url.resolve(baseUrl, finalMatch)
      urls.push(foundUrl);
      newContent = newContent
        .substring(0, match.index) + 
          "url(\"" + fsTransformUrlToFile(foundUrl).webPath + "\")" +
          newContent.substring(match.index + match[0].length);
      console.log('CSS:');
      console.log(finalMatch);
    }

    return {
      urls,
      newContent
    }
  }

  function fsTransformUrlToFile(url) {
    //TODO: tranform url to filesystem path here.
    // console.log();
    let crypto = require('crypto');

    let md5sum = crypto.createHash('md5');
    md5sum.update(url);
    
    var parsedUrl = Url.parse(url);
    let hash = md5sum.digest('hex');
    let dirPath = path.join(
      './',
      'sites',
      siteName
    );
    mkdirp.sync(dirPath);
    
    return {
      fsPath: path.join(dirPath, hash),
      webPath: hash
    }
  }


  return {
    urls: parsedUrls
  };
}



function tranformAndEnsureDiskPath(url) {
  let checkPath = fsTransformUrlToDir(url);
  if (fs.existsSync(checkPath)) {
    if (fs.statSync(checkPath).isFile()) {

    }
  } else {
    mkdirp.sync(checkPath);
  }
  return fsTransformUrlToFile(url).fsPath;
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

module.exports = exportMethod;