const program = require('commander');

program
  .version(require('./package.json').version)
  .option('-s, --site [string]', 'site name')
  .option('-e, --export [boolean]', 'export site')
  .arguments('[url]')
  .action((url) => {
    program.url = url;
  })
  .parse(process.argv);

if (!program.site) {
  program.site = new Date().toISOString();
}

if (program.export) {
  let exporter = require('./src/exporter')(program.site);
  exporter.exportSite(() => {
    console.log('Export done.');
  });
} else {
  if (!program.url) {
    console.error('Must include a url');
    process.exit(1);
  }
  require('./src/spider')(program.url, program.site);
}
