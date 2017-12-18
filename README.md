<h1 align='center'> 🗒️ mrk </h1>

<div align='center'>
  <strong> The happy little extendable markdown parser </strong>
</div>

<div align='center'>
  <h3>
    <a href='https://github.com/heyitsmeuralex/mrk#how-do-i-use-it'>Use it</a>
    |
    <a href='https://heyitsmeuralex.github.io/mrk'>Try it</a>
  </h3>
</div>

mrk is an easily extendable markdown parser created for [Decent](https://github.com/towerofnix/decent). We needed it
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

let html = mrk('Some _markdown_').html()
console.log(html)
```

That's it! You can also directly access the parsed token stream by looking at `mrk(...).tokens`, if you're so inclined.

### I want/to remove Feature X!

You can implement/remove it yourself. mrk was designed to be easily extendable:

* Removing a feature

```js
mrk('Visit http://google.com').html() // Visit <a href='http://google.com'>http://google.com</a>

delete mrk.patterns.autolink // See mrk.js for other patterns/features you can remove

mrk('Visit http://google.com').html() // Visit http://google.com
```

* Adding a new parse rule

Say we wanted to add `~~strikethrough~~` text, GFM-style:

```js
mrk.patterns.strikethroughStart = ({ read, has }) {
  // If this function returns a truthy value, it will be parsed as a strikethroughStart token
  // See mrk.js for how `read` and `has` work, plus other functions you get access to.

  return read(2) === '~~' // Next 2 characters should be `~~`
    && !has('strikethroughStart', 'strikethroughEnd') // Not already strikethrough!
}

mrk.patterns.strikethroughEnd= ({ read, has }) {
  return read(2) === '~~' // Next 2 characters should be `~~`
    && has('strikethroughStart', 'strikethroughEnd') // Must have a strikethroughStart before this token
}

// If there is a strikethroughStart token on its own without a strikethroughEnd token to be paired
// to, it will be discarded and parsed as text.
mrk.pairs.strikethroughStart = 'strikethroughEnd'

// Declares how to convert these tokens into HTML strings.
mrk.htmlify.strikethroughStart = () => '<s>'
mrk.htmlify.strikethroughEnd = () => '</s>'

// :tada:
mrk('~~hello~~').html() // => <s>hello</s>
```

### License

MIT :tada:
