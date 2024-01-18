import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability'
import * as cheerio from 'cheerio';
import sanitize from 'sanitize-html';
import juice from 'juice';
import sharp from 'sharp';
import { minify } from 'html-minifier';
import { pipe, pipeAsync } from './utils';

// await scrape('https://www.nytimes.com/interactive/2019/08/23/opinion/data-internet-privacy-tracking.html');

export async function scrape(baseUrl: string ) {
  const makeAbsoluteUrl = (url: string) => {
    if (url.startsWith('http')) {
      return url;
    }

    const u = new URL(url, baseUrl);
    return u.href;
  }

  const text = await fetch(baseUrl).then(res => res.text());

  const html = await  pipeAsync(
    text,
    async str => {
      let $ = cheerio.load(str);
      $('link').remove();
      $('script').remove();
      $('meta').remove();
      $('svg').remove();

      const length = $.html().length;
      console.log('Length: ' + length);

      if (length > 200000) {
        const reader = new Readability(new JSDOM($.html()).window.document);
        const readerDoc = reader.parse();
        if (readerDoc) {
          const title = `<h1>${readerDoc.title}</h1>`;
          const styles = $('style').map((i, el) => $(el).html()).get().join('\n');
          $ = cheerio.load(title + readerDoc.content);
          $.root().append(`<style>${styles}</style>`);
        }
      }

      const baseHtml = `<style>#in-story-masthead {
        display: unset !important;
        opacity: 1 !important;
        visibility: visible !important;
      }</style>`;

      $.root().append(baseHtml);

      $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
          $(el).attr('href', makeAbsoluteUrl(href));
        }
      });

      await Promise.all($('img').map(async (i, el) => {
        const src = $(el).attr('src');
        if (src) {
          const absoluteUrl = makeAbsoluteUrl(src);
          console.log('Downloading image ' + i);
          try {
            const response = await fetch(absoluteUrl);
            const buffer = await (await response.blob()).arrayBuffer();
            const { width = 100, height = 100 } = await sharp(buffer).metadata();
            const resizedImageBuffer = await sharp(buffer)
              .resize({ width: Math.min(width, 120), height: Math.min(height, 100), fit: 'inside' })
              .toFormat('jpeg')
              .toBuffer();
            const base64Image = resizedImageBuffer.toString('base64');
            const dataUrl = `data:image/jpeg;base64,${base64Image}`;
            $(el).attr('src', dataUrl);
            $(el).attr('width', String(width));
            $(el).attr('height', String(height));
            console.log('Updated image ' + i)
          } catch {
            $(el).attr('src', absoluteUrl);
          }
        }
      }));

      return $.html();
    },
    str => {
      try {
        return juice(str, { insertPreservedExtraCss: false, preserveMediaQueries: false, preservePseudos: false });
      } catch {
        try {
          return juice(str, { insertPreservedExtraCss: false, resolveCSSVariables: false, preserveMediaQueries: false, preservePseudos: false  });
        } catch (e) {
          console.error(e);
          return str
        }
      }
    },
    str => sanitize(str, {
      allowVulnerableTags: true,
      allowedTags: sanitize.defaults.allowedTags.concat(['title', 'style']),
      allowedAttributes: {
        ...sanitize.defaults.allowedAttributes,
        '*': ['style', 'class', 'id', 'href'],
      },
      allowedSchemes: ['data', 'http'],
    }),
    str => minify(str, {
      collapseWhitespace: true,
      removeComments: true,
      removeEmptyAttributes: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      minifyCSS: true,
    }),
    str => str.replace(/<([a-z]+) /g, '<$1  '),
  );

  await Bun.write('./html/output.html', html);
}
