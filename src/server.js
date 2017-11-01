//Static file server to serve up saved sites
const http = require('http'),
      path = require('path'),
      fs = require('fs'),
      Url = require('url'),
      Parser = require('./parser');

let parser = Parser();
let cache = require('./cache');

// function fsTransformUrlToFileName(url) {
//   const URL = require('url');
//   let urlObj = URL.parse(url);
//   url = urlObj.path;
//   let crypto = require('crypto');
//   let md5sum = crypto.createHash('md5');
//   md5sum.update(url);

//   let hash = md5sum.digest('hex');
  
//   return hash;
//   // return {
//   //   fsPath: path.join(dirPath, hash),
//   //   webPath: hash
//   // }
// }

module.exports = function(siteName, port) {
  port = port || 80;
  let dirName = path.join('./', 'sites', siteName);
  //Read the mapping file for the site into memory

  let mapList = [];
  let hashMap = {};
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
      let [url, domain, path, contentType, hash] = line.split('|');
      let mapObj = {
        url,
        domain,
        path,
        contentType,
        hash
      };
      mapList.push(mapObj);
      hashMap[hash] = mapObj;
      urlMap[path] = mapObj;
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
      res.setHeader('Content-Type', 'text/html');
      res.write(parsedResult.newContent);
      res.end();
    // } else if (req.url.match(/^[a-f0-9]{32}$/)) {
    } else {
      //Respond with the proper hashed file here
      // fs.createReadStream(path.join(dirName, fsTransformUrlToFileName(req.path))).pipe(res);
      // let hash = fsTransformUrlToFileName(req.url);
      // let mapObj = urlMap[req.url];
      let mapObjs = mapList.filter(i => i.domain ==  info.domain && i.path == req.url);
      if (mapObjs.length > 0 && parser.shouldParse(mapObjs[0].contentType)) {
        mapObj = mapObjs[0];
        cache((cache) => {
          fs.readFile(path.join(dirName, mapObj.hash), 'utf8', (err, content) => {
            if (err) {
              console.error(err);
              //Set 404 status and return an error response
              res.status = 404;
              res.end();
            } else {
              let parsedResult = parse(content, req.url);
              cache(parsedResult.newContent);
            }
          });
        }, mapObj, 'cache', (content) =>  {
          
          res.setHeader('Content-Type', mapObj.contentType);
          res.write(content);
          res.end();
        });
      } else if(mapObjs.length > 0) {
        fs.createReadStream(path.join(dirName, mapObjs[0].hash)).pipe(res);
      } else {
        res.status = 400;
        res.end();
      }
    }
    // } else {
    //   //Set 404 status and return an error response
    //   res.status = 404;
    //   res.end();
    // }
  };


  function parse(content, path) {
    // let hash = fsTransformUrlToFileName(path);
    // let mapObj = urlMap[path];
    let mapObj = mapList.filter(i => i.domain ==  info.domain && i.path == path)[0];
    let parsedContent = {
      urls: [],
      newContent: content
    }
    if (parser.shouldParse(mapObj.contentType)) {
      let parseResult = parser.parse(
        content,
        mapObj.contentType,
        (hashedUrl) => {
          let mappedUrl = hashMap[hashedUrl];
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