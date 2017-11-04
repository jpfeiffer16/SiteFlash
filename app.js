const program = require('commander');

program
  .version(require('./package.json').version)
  .option('-s, --site [string]', 'site name')
  .option('-e, --export [boolean]', 'export site')
  .option('-m --middleware [string]', 'middleware to include in requests')
  .arguments('[url]')
  .action((url) => {
    program.url = url;
  })
  .parse(process.argv);

if (program.export) {
  let Exporter = require('./src/exporter');
  if (program.site) {
    let exporter = Exporter(program.site);
    exporter.exportSite((exportFile) => {
      console.log('Export done.');
      console.log(exportFile);
    });
  } else {
    Exporter.exportAllSites((exportFile) => {
      console.log(exportFile);
    });
  }
} else {
  if (!program.url) {
    console.error('Must include a url');
    process.exit(1);
  }
  require('./src/spider')(program.url, program.site, program.middleware);
}
