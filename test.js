// const jsdom = require("jsdom");
// const { JSDOM } = jsdom;
const fs = require('fs');
const css = require('css');

// let start = Date.now();
// console.log(start);



// fs.readFile('./test.html', 'utf-8', (err, data) => {
//   // const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
//   const dom = new JSDOM(data);
//   let end = Date.now();
//   console.log(end);
//   console.log(end - start);
//   // console.log(dom.window.document.querySelector("#footer").textContent);
// });

fs.readFile('./test.css', 'utf-8', (err, data) => {
  var ast = css.parse(data);
  fs.writeFileSync('test.json', JSON.stringify(ast));
  console.log(ast);
});

