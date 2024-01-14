import sanitize from 'sanitize-html';

export const h = (str: string) =>
  sanitize(str, {
    allowVulnerableTags: true,
    allowedTags: sanitize.defaults.allowedTags.concat(['script', 'style']),
    disallowedTagsMode: 'escape',
    allowedSchemes: ['data', 'http'],
  });


