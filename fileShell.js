const stream = require('stream');
const util = require('util');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const Url = require('url');

let exportMethod = function(url) {
  let urlFoundCb = null;

  function urlFound(cb) {
    urlFoundCb = cb;
  }

  let FSStream = function() {
    stream.Writable.call(this);
  }
  util.inherits(FSStream, stream.Writable);

  FSStream.prototype._write = function (chunk, encoding, done) {

    let {newHtml, urls} = parse(chunk.toString('utf-8'));

    fs.writeFile(fsTransformUrlToFile(url), newHtml, (err) => {
      if (err) {
        console.error(err);
      }
    });
    
    // console.log(urls);
    if (urls.length > 0 && urlFoundCb != null) {
      urls.forEach(function(url) { 
        urlFoundCb(url);
      });
    }
    // fs.writeFile('./test', chunk, { flag: 'a' });
    done();
  }

  FSStream.prototype.urlFound = urlFound;

  // let stream = 
  // stream.on('end', () => {
  //   console.log('Done');
  // });
  return new FSStream();
}

function parse(html) {
  //Extract urls and replace with fs-tranformed urls here.
  let urls = [];
  let urlRegex = /https?:\/\/.+?(?=( |"))/g;
  let hrefRegex = /href=("|').+?("|')/g;
  let srcRegex = /src=("|').+?("|')/g;
  // let urlRegex = /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;


  // console.log(html);
  // console.log(urlRegex.test(html));
  // let matches = html.match(urlRegex);
  // if (matches != null) {
  //   urls = matches.map((url) => {
  //     return url
  //       .toString()
  //       // .replace(/href=/g, '')
  //       // .replace(/src=/g, '')
  //       // .replace(/\\/g, '')
  //       // .replace(/"/g, '');
  //   });
  // }

  // matches = html.match(hrefRegex);
  let indexes = [];
  let match = hrefRegex.exec(html);
  while (match) {
    let trPath = match
      .toString()
      .replace(/href=/g, '')
      // .replace(/src=/g, '')
      .replace(/\\/g, '')
      .replace(/"/g, '');
    let newPath = resolveUrl(tranformAndEnsureDiskPath(
      trPath
    ));
    indexes.push({
      str: `href="${newPath}"`,
      start: match.index,
      end: match.index + match[0].length
    });
  }

  indexes = [];
  match = srcRegex.exec(html);
  while (match) {
    let trPath = match
      .toString()
      // .replace(/href=/g, '')
      .replace(/src=/g, '')
      .replace(/\\/g, '')
      .replace(/"/g, '');
    let newPath = resolveUrl(tranformAndEnsureDiskPath(
      trPath
    ));
    indexes.push({
      str: `src="${newPath}"`,
      start: match.index,
      end: match.index + match[0].length
    });
  }


  // return {
  //   urls,
  //   newHtml: html
  // }

}

function tranformAndEnsureDiskPath(url) {
  mkdirp.sync(fsTransformUrlToDir(url));
  return fsTransformUrlToFile(url);
}

// function fsTransformUrlToFile(url) {
//   //TODO: tranform url to filesystem path here.
//   // console.log();
//   let crypto = require('crypto');

//   let md5sum = crypto.createHash('md5');
//   md5sum.update(url);
  
//   var parsedUrl = Url.parse(url);
//   return path.join(
//     __dirname,
//     'sites',
//     md5sum.digest('hex')
//   );
// }

function fsTransformUrlToFile(url) {
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

function fsTransformUrlToDir(url) {
  //TODO: tranform url to filesystem path here.
  // console.log();
  var parsedUrl = Url.parse(url);
  let dirpath = '';
  let index = parsedUrl.path.lastIndexOf('/');
  if (index != -1) {
    dirpath = parsedUrl.path.slice(0, index);
  }
  return path.join(
    __dirname,
    'sites',
    parsedUrl.host,
    dirpath
  );
}

function writeFile(url, content) {
  var parsedUrl = Url.parse(url);
  mkdirp.sync(fsTransformUrlToDir(url));

  fs.writeFile(fsTransformUrlToFile(url), content);
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

module.exports = exportMethod;