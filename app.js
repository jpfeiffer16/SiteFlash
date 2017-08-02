let program = require('commander');

program
  .version(require('./package.json').version)
  .option('-s, --site [string]', 'Site Name')
  .arguments('[url]')
  .action((url) => {
    program.url = url;
  })
  .parse(process.argv);


// console.log(program.site);
// console.log(program.url);
// console.log(process.argv);


if (!program.url) {
  console.error('Must include a url');
  process.exit(1);
}

if (!program.site) {
  program.site = Date.now().toString();
}

require('./src/spider')(program.url, program.site);


