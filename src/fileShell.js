const stream = require('stream'),
      util = require('util'),
      fs = require('fs'),
      path = require('path'),
      mkdirp = require('mkdirp'),
      Url = require('url'),
      jsdom = require("jsdom"),
      { JSDOM } = jsdom;

let exportMethod = function(siteName) {
  let dirpath = path.join(
    './',
    'sites',
    siteName
  );
  mkdirp.sync(dirpath);
  let logStream = fs.createWriteStream(
    path.join(
      dirpath,
      'log.txt'
    )
  );

  let doneWritting = function(err) {
    //NOTE: Do more stuff here if necessary
    if (err) {
      // console.error(err);
      log(err, console.error);
    }
  }

  function process(url, content, contentType, parse) {
    let parsedUrls = [];
    // console.log(contentType);
    if (parse && contentType) {
      let strRepr = content.toString('utf-8');

      if (~contentType.indexOf('text/html')) {
        let result = parseHtml(strRepr, url);
        parsedUrls = result.urls;
        fs.writeFile(
          fsTransformUrlToFile(url).fsPath,
          result.newContent,
          doneWritting
        );
      } else if(~contentType.indexOf('text/css')) { 
        let result = parseCss(strRepr, url);
        parsedUrls = result.urls;
        fs.writeFile(
          fsTransformUrlToFile(url).fsPath,
          result.newContent,
          doneWritting
        );
      } else {
        fs.writeFile(
          fsTransformUrlToFile(url).fsPath,
          content,
          doneWritting
        );
      }
    } else {
      fs.writeFile(
        fsTransformUrlToFile(url).fsPath,
        content,
        doneWritting
      );
    }

    return {
      urls: parsedUrls
    };
  }

  function log(obj, cb) {
    logStream.write(`${ obj }\n`);
    cb(obj);
  }

  function parseHtml(html, baseUrl) {
    let urls = [];

    let dom = new JSDOM(html);

    //href's
    let hrefElements = dom.window.document.querySelectorAll('[href]');
    hrefElements.forEach((el) => {
      if (el.href != '#' && !el.href.startsWith('javascript:')) {
        let foundUrl = Url.resolve(baseUrl, el.href);
        urls.push(foundUrl);
        el.href = fsTransformUrlToFile(foundUrl).webPath;
      }
    });

    //src's
    let srcElements = dom.window.document.querySelectorAll('[src]');
    srcElements.forEach((el) => {
      let foundUrl = Url.resolve(baseUrl, el.src);
      urls.push(foundUrl);
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

    let comment = dom.window.document.createComment(`PAGE: ${ baseUrl }`);
    dom.window.document.appendChild(comment);
    
    // dom.window.close();

    return {
      urls,
      newContent: dom.serialize()
    }
  }

  function parseCss(css, baseUrl) {
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
          `url("${ fsTransformUrlToFile(foundUrl).webPath}")` +
          newContent.substring(match.index + match[0].length);
    }

    return {
      urls,
      newContent
    }
  }

  function fsTransformUrlToFile(url) {
    let crypto = require('crypto');
    let md5sum = crypto.createHash('md5');

    md5sum.update(url);

    let parsedUrl = Url.parse(url);
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
    process,
    log
  }
}

module.exports = exportMethod;