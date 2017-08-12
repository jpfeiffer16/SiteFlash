//Static file server to serve up saved sites
const http = require('http'),
      path = require('path'),
      fs = require('fs');


module.exports = function(siteName, port) {
  port = port || 80;
  let dirName = path.join('./', 'sites', siteName);
  let indexFile = path.join(dirName, 'index.html');

  let requestHandler = function(req, res) {
    if (request.path == '' || request.path == '/') {
      //Respond with the index file
      fs.createReadStream(indexFile).pipe(res);
    } else if (req.path.match(/^[a-f0-9]{32}$/)) {
      //Respond with the proper hashed file here
      fs.createReadStream(path.join(dirName, req.path)).pipe(res);
    } else {
      //Set 404 status and return an error response
      res.status = 404;
      res.end();
    }
  };

  http.createServer(requestHandler).listen(port, () => {
    console.log(
      `Static file server listening for site "${ siteName }" on port ${ port }`
    );
  });
}