const stream = require('stream'),
      util = require('util'),
      fs = require('fs'),
      path = require('path'),
      mkdirp = require('mkdirp'),
      Url = require('url'),
      jsdom = require("jsdom"),
      
      Parser = require('./parser');

let parser = Parser();

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
      // let parsedUrls = [];
      let parseResult = parser.parse(strRepr, contentType, (repUrl) => {
        parsedUrls.push(Url.resolve(url, repUrl));
        return fsTransformUrlToFile(repUrl).webPath;
      });
      let hashResult = fsTransformUrlToFile(url);
      fs.writeFile(
        hashResult.fsPath,
        parseResult.newContent,
        doneWritting
      );
      writeToHashMapFile(url, contentType, hashResult.webPath);
    } else {
      let hashResult = fsTransformUrlToFile(url);
      fs.writeFile(
        hashResult.fsPath,
        content,
        doneWritting
      );
      writeToHashMapFile(url, contentType, hashResult.webPath);
    }

    return {
      urls: parsedUrls
    };
  }

  function log(obj, cb) {
    logStream.write(`${ obj }\n`);
    cb(obj);
  }

  function fsTransformUrlToFile(url) {
    const URL = require('url');
    let parsedUrl = Url.parse(url);
    url = parsedUrl.path;
    
    let crypto = require('crypto');
    let md5sum = crypto.createHash('md5');

    md5sum.update(url);

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
  
  function writeToHashMapFile(url, contentType, hash) {
    fs.appendFileSync(
      path.join(
        dirpath,
        'map'
      ),
      `${ url }|${ contentType }|${ hash }\n`
    );
  }

  return {
    process,
    log
  }
}

module.exports = exportMethod;