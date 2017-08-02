let program = require('commander');

program
  .version(require('./package.json').version)
  .option('-s, --site [string]', 'Site Name')
  .arguments('[url]')
  .action((url) => {
    program.url = url;
  })
  .parse(process.argv);

if (!program.url) {
  console.error('Must include a url');
  process.exit(1);
}

if (!program.site) {
  program.site = new Date().toISOString();
}

require('./src/spider')(program.url, program.site);
