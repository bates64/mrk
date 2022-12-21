<h1 align='center'> 🗒️ mrk </h1>

<div align='center'>
  <strong> The tiny, extensible markdown parser </strong>
</div>

<div align='center'>
  <h3>
    <a href='#how-do-i-use-it'>Usage</a>
    |
    <a href='https://mrk.nanaian.town'>Try in your browser</a>
    |
    <a href='https://github.com/nanaian/mrk/wiki'>Extensions</a>
  </h3>
</div>

mrk is a tiny, easily-extensible markdown parser created for [Decent](https://github.com/decent-chat/decent). We needed it
for a few reasons:

* We didn't want to have to bring in an **npm** module or do anything fancy to use it
* We needed to be able to **disable features** and add new ones easily
* We wanted access to the parsed **token stream**
* We wanted something small, simple, and **easy to extend**

### How do I use it?

Include [mrk.js](mrk.js) in your page, or `npm install mrkjs`:
Usage is as follows:

```js
// require('mrk.js') or <script src='mrk.js'></script>

let mark = mrk()
let html = mark('Some _markdown_').html()
console.log(html)
```

That's it! You can also directly access the parsed token stream by looking at `mark(...).tokens`, if you're so inclined.

### Can I haz `Promise`?

Yes!!

```js
const mrk = require('mrk.js/async')
const mark = mrk()

mark('Awesome!').then(parsed => {
  console.log('tokens:', parsed.tokens)

  return parsed.html()
}).then(html => {
  console.log('HTML:', html)
})
```

### I want/to remove Feature X!

You can implement/remove it yourself. mrk was designed to be easily extendable:

#### Removing a feature

```js
mark('Visit http://google.com').html() // Visit <a href='http://google.com'>http://google.com</a>

delete mark.patterns.autolink // See mrk.js for other patterns/features you can remove

mark('Visit http://google.com').html() // Visit http://google.com
```

#### Adding a new parse rule

Say we wanted to add `~~strikethrough~~` text, GFM-style:

```js
// Pass `mrk()` extensions to patterns, pairs, or htmlify
const markWithStrikethrough = mrk({
  extendPatterns: {
    strikethroughStart: ({ read, has }) => {
      // If this function returns a truthy value, it will be parsed as a strikethroughStart token
      // See mrk.js for how `read` and `has` work, plus other functions you get access to.

      return read(2) === '~~' // Next 2 characters should be `~~`
        && !has('strikethroughStart', 'strikethroughEnd') // Not already strikethrough!
    },

    strikethroughEnd: ({ read, has }) => {
      return read(2) === '~~' // Next 2 characters should be `~~`
        && has('strikethroughStart', 'strikethroughEnd') // Must have a strikethroughStart before this token
    },
  },

  extendPairs: {
    // If there is a strikethroughStart token on its own without a strikethroughEnd token to be paired
    // to, it will be discarded and parsed as text.
    strikethroughStart: 'strikethroughEnd'
  },

  extendHtmlify: {
    // Declares how to convert these tokens into HTML strings.
    strikethroughStart = () => '<s>',
    strikethroughEnd = () => '</s>'
  }
})

// :tada:
mrk('~~hello~~').html() // => <s>hello</s>
```

If you end up creating an extension for mrk for your project and it's generic enough,
[please consider adding it to the list](https://github.com/nanaian/mrk/wiki) of
community extensions for mrk. I'd appreciate it!

### License

MIT :tada:
