/*
  electricfieldon site settings
  Safe, small customisations live here so they don't require edits to app.js.

  featuredPostIds: the "Begin here" list on the contents page. The first one is the frontispiece picture.
  collections: the chapters, in book order. Names must match the collection names in data.js.
  To change navigation labels or destinations, edit the navigation entries below.
  Keep hrefs relative to this folder (for example: "archive.html").
*/
window.PORTFOLIO_CONFIG = {
  siteName: 'electricfieldon',
  siteSubtitle: 'A WRITING ARCHIVE',
  // The line printed on the book cover.
  coverLine: 'Poems, shayari and small fragments of feeling, kept beyond the feed',
  instagram: {
    label: 'Instagram',
    url: 'https://www.instagram.com/electricfieldon/'
  },
  navigation: [
    { label: 'Featured', homeHref: '#featured', archiveHref: 'index.html#featured', currentOn: 'featured' },
    { label: 'Browse by mood', homeHref: '#collections', archiveHref: 'index.html#collections', currentOn: 'mood' },
    { label: 'All writing', homeHref: 'archive.html', archiveHref: 'archive.html', currentOn: 'archive' }
  ],
  footerTagline: 'A small library for words that stay.',
  featuredPostIds: [
    '18131672362827668',
    '18074391296563116',
    '18125390806695445',
    '18129392350728020'
  ],
  collections: [
    { name: 'Fragments of Love', sub: 'Love, longing & the unsaid', symbol: '♡', kicker: '01' },
    { name: 'Quiet Thoughts', sub: 'Life, self & the world', symbol: '✳', kicker: '02' },
    { name: 'Hindi & Shayari', sub: 'Words in Hindi and Urdu', symbol: 'अ', kicker: '03' },
    { name: 'Finding Light', sub: 'Healing, hope & beginning again', symbol: '✳', kicker: '04' },
    { name: 'After Hours', sub: 'The darker, softer corners', symbol: '☾', kicker: '05' }
  ]
};
