//Static file server to serve up saved sites
const http = require('http'),
      path = require('path'),
      fs = require('fs'),
      Url = require('url'),
      Parser = require('./parser');

let parser = Parser();
let Cachius = require('cachius');


function fsTransformUrlToFileName(url) {
  const URL = require('url');
  let urlObj = URL.parse(url);
  url = urlObj.path;
  let crypto = require('crypto');
  let md5sum = crypto.createHash('md5');
  md5sum.update(url);

  let hash = md5sum.digest('hex');
  
  return hash;
  // return {
  //   fsPath: path.join(dirPath, hash),
  //   webPath: hash
  // }
}

module.exports = function(siteName, port) {
  port = port || 80;
  let dirName = path.join('./', 'sites', siteName);
  //Read the mapping file for the site into memory

  let urlMap = {};
  let mapText = fs.readFileSync(
    path.join(
      dirName,
      'map'
    ),
    'utf8'
  );
  mapText
    .split('\n')
    .forEach(line => {
      let [url, contentType, hash] = line.split('|');
      urlMap[hash] = {
        url,
        contentType
      }
    });

  let info = JSON.parse(
    fs.readFileSync(
      path.join(
        dirName,
        'info.json'
      ),
      'utf8'
    )
  );

  let indexFile = path.join(dirName, 'index.html');

  let requestHandler = function(req, res) {
    if (req.url == '' || req.url == '/') {
      //Respond with the index file
      // fs.createReadStream(indexFile).pipe(res);
      let content = fs.readFileSync(indexFile, 'utf8');
      let parsedResult = parse(content, req.url);
      res.write(parsedResult.newContent);
      res.end();
    // } else if (req.url.match(/^[a-f0-9]{32}$/)) {
    } else {
      //Respond with the proper hashed file here
      // fs.createReadStream(path.join(dirName, fsTransformUrlToFileName(req.path))).pipe(res);
      let hash = fsTransformUrlToFileName(req.url);
      let mapObj = urlMap[hash];
      if (!mapObj || parser.shouldParse(mapObj.contentType)) {
        // let parsedResult = Cachius.cache(() => {
          let results = null;
          try {
            let fileContents = fs.readFileSync(path.join(dirName, hash), 'utf8');
            results = parse(fileContents, req.url);
          } catch(err) {
            console.error(err);
          }
          return results;
        // }, hash);
        if (parsedResult != null && mapObj !== undefined) {
          res.setHeader('Content-Type', mapObj.contentType);
          res.write(parsedResult.newContent);
          res.end();
        } else {
          //Set 404 status and return an error response
          res.status = 404;
          res.end();
        }
      } else {
        fs.createReadStream(path.join(dirName, hash)).pipe(res);
      }
    }
    // } else {
    //   //Set 404 status and return an error response
    //   res.status = 404;
    //   res.end();
    // }
  };


  function parse(content, path) {
    let hash = fsTransformUrlToFileName(path);
    let mapObj = urlMap[hash];
    let parsedContent = {
      urls: [],
      newContent: content
    }
    if (parser.shouldParse(mapObj.contentType)) {
      let parseResult = parser.parse(
        content,
        mapObj.contentType,
        (hashedUrl) => {
          let mappedUrl = urlMap[hashedUrl];
          let result = hashedUrl;
          if (mappedUrl) {
            result = mappedUrl.url;
            let parsedMappedUrl = Url.parse(mappedUrl.url);
            if (parsedMappedUrl.host == info.domain) {
              result = parsedMappedUrl.path;
            }
          }

          return result;
        });
      parsedContent = parseResult;
    }

    return parsedContent;
  }

  http.createServer(requestHandler).listen(port, () => {
    console.log(
      `Static file server listening for site "${ siteName }" on port ${ port }`
    );
  });
}