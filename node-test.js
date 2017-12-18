const mrk = require('./mrk')
const inspect = obj => {
  console.log(require('util').inspect(obj, { colors: true, depth: null }))
  return obj
}

console.log('Input: Hello, `world`!\n')
inspect(mrk('Hello, `world`!').tokens)
console.log('\nHTML: ' + mrk('Hello, `world`!').html())
