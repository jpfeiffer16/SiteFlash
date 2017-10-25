let Parser = function() {
  //Generic parse method
  function parse(url, contentType, replaceMethod) {
    //Call out to specific parsers here.
  }


  function parseHtml(html, replaceMethod) {
    let urls = [];

    let dom = new JSDOM(html);

    //href's
    let hrefElements = dom.window.document.querySelectorAll('[href]');
    hrefElements.forEach((el) => {
      if (el.href != '#' && !el.href.startsWith('javascript:')) {
        let foundUrl = Url.resolve(baseUrl, el.href);
        urls.push(foundUrl);
        el.href = replaceMethod(foundUrl);
      }
    });

    //src's
    let srcElements = dom.window.document.querySelectorAll('[src]');
    srcElements.forEach((el) => {
      let foundUrl = Url.resolve(baseUrl, el.src);
      urls.push(foundUrl);
      el.src = replaceMethod(foundUrl);
    });

    //style's
    let styleElements = dom.window.document.querySelectorAll('[style]');
    styleElements.forEach((el) => {
      let results = parseCss(el.getAttribute('style'), replaceMethod);

      el.setAttribute('style', results.newContent);
      if (results.urls.length > 0) {
        urls.concat(results);
      }
    });

    let comment = dom.window.document.createComment(`PAGE: ${ baseUrl }`);
    dom.window.document.appendChild(comment);
    
    // dom.window.close();

    return {
      urls,
      newContent: dom.serialize()
    }
  }


  function parseCss(css, replaceMethod) {
    let urls = [];
    let newContent = css;
    let urlRegex = /url\(.*?('|")?\)/g
    let match = null;
    while (match = urlRegex.exec(newContent)) {
      let finalMatch = match[0]
        .replace(/url\(("|')?/g, '')
        .replace(/("|')?\)/g, '');
      let foundUrl = Url.resolve(baseUrl, finalMatch)
      urls.push(foundUrl);
      newContent = newContent
        .substring(0, match.index) + 
          `url("${ replaceMethod(foundUrl) }")` +
          newContent.substring(match.index + match[0].length);
    }

    return {
      urls,
      newContent
    }
  }

}

module.exports = Parser;