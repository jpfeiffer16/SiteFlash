const fs = require('fs'),
      archiver = require('archiver'),
      path = require('path'),
      mkdirp = require('mkdirp'),
      ProgressBar = require('ascii-progress');

let siteExporter = function(siteName) {
  function exportSite(cb) {
    let dir = path.join(
      './',
      'exports'
    );
    let exportPath = path.join(
      dir,
      `${siteName}.zip`
    );
    let siteDir = path.join(
      './',
      'sites',
      siteName
    );

    mkdirp.sync(dir);
    let output = fs.createWriteStream(
      exportPath
    );
    let archive = archiver('zip', {
      zlib: { level: 9 }
    });

    
    archive.pipe(output);

    fs.readdir(siteDir, function(err, files) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      let bar = new ProgressBar('Zipping [:bar]', { total: files.length });
      output.on('close', () => {
        bar.clear();
        cb(exportPath);
      });
      archive.on('progress', ((e) => {
        bar.tick();
      }));

      archive.directory(
        siteDir,
        siteName
      );
      archive.finalize();
    });
  }

  return {
    exportSite
  };
}

siteExporter.exportAllSites = function(cb) {
  let self = this;
  fs.readdir(path.join(
    './',
    'sites'
  ), (err, dirs) => {
    if (err) {
      console.error(err);
      return;
    }
    dirs.forEach((dirName) => {
      let exporter = new self(dirName);
      exporter.exportSite(cb);
    });
  });
}

module.exports = siteExporter;