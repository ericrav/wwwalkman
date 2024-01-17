import * as cheerio from 'cheerio';
import sanitize from 'sanitize-html';
import juice from 'juice';
import { minify } from 'html-minifier';
import { pipe } from './utils';

const url = process.env.URL!;
const file = '/Users/eric/Downloads/ce.html';
const text = await Bun.file(file).text();

const baseUrl = 'https://criticalengineering.org';
const makeAbsoluteUrl = (url: string) => {
  if (url.startsWith('http')) {
    return url;
  }

  const u = new URL(url, baseUrl);
  return u.href;
}

const html = pipe(
  text,
  str => juice(str, { insertPreservedExtraCss: true  }),
  // str => sanitize(str, {
  //   allowVulnerableTags: true,
  //   allowedTags: sanitize.defaults.allowedTags.concat(['title', 'style']),
  //   allowedAttributes: {
  //     ...sanitize.defaults.allowedAttributes,
  //     '*': ['style', 'class', 'id'],
  //   },
  //   allowedSchemes: ['data', 'http'],
  // }),
  str => cheerio.load(str),
  $ => {
    // $('head').remove();
    $('link').remove();
    $('script').remove();
    $('meta').remove();
    $('svg').remove();

    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        $(el).attr('href', makeAbsoluteUrl(href));
      }
    });

    $('img').each((i, el) => {
      const src = $(el).attr('src');
      if (src) {
        $(el).attr('src', makeAbsoluteUrl(src));
      }
    });

    return $;
  },
  $ => $.html(),
  str => minify(str, {
    // collapseWhitespace: true,
    removeComments: true,
    removeEmptyAttributes: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    minifyCSS: true,
  }),
);

// chunking
// for (let i = 0; i < html.length; i += 1024) {
//   const chunk = html.slice(i, i + 1024)
//   await Bun.write(`./html/ce/${i / 1024}.html`, chunk);
// }

await Bun.write('./html/ce.html', html);

