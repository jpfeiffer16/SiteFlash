const program = require('commander');

program
  .version(require('./package.json').version)
  .option('-s, --site [string]', 'site name')
  .option('-e, --export [boolean]', 'export site')
  .option('-w, --web [boolean]', 'serve site with a web server')
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
} else if (program.web) {
  if (program.site) {
    require('./src/server')(program.site, 8080);
  } else {
    console.error('You must provide a site name');
    process.exit(1);
  }
} else {
  if (!program.url) {
    console.error('Must include a url');
    process.exit(1);
  }
  require('./src/spider')(program.url, program.site);
}
