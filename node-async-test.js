const mrk = require('./async')
const mark = mrk()

mark('Awesome!').then(parsed => {
  console.log('tokens:', parsed.tokens)

  return parsed.html()
}).then(html => {
  console.log('HTML:', html)
})
