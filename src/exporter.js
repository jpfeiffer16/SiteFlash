const fs = require('fs'),
      archiver = require('archiver'),
      path = require('path'),
      mkdirp = require('mkdirp');

module.exports = function(siteName) {
  function exportSite(cb) {
    let dir = path.join(
      './',
      'exports'
    );
    mkdirp.sync(dir);
    let output = fs.createWriteStream(
      path.join(
        dir,
        `${siteName}.zip`
      )
    );
    let archive = archiver('zip', {
      zlib: { level: 9 }
    });
    output.on('close', cb);

    archive.pipe(output);
    archive.directory(
      path.join(
        './',
        'sites',
        siteName
      ),
      siteName
    );
    archive.finalize();
  }

  return {
    exportSite
  };
}