(function() {
  'use strict'

  function mrk(input, options = {}) {
    function tokenize(input) {
      const tokens = []

      // Match patterns
      for (let index = 0; index < input.length; index++) {
        const indexBefore = index
        let match = null, metadata = undefined

        for (const [ matchName, fn ] of Object.entries(mrk.patterns)) {
          metadata = undefined

          const isMatch = fn({

            read(n = 1) {
              // Read `n` characters
              const chars = input.substr(index, n)

              index += n
              return chars
            },

            readUntil(c, orEnd = false) {
              // Read until we encounter the character `c`
              let buf = ''

              for (let i = index; i < input.length; i++) {
                if (input[i] === c) {
                  index += buf.length

                  return buf
                }

                buf += input[i]
              }

              if (orEnd) {
                index += buf.length
                return buf
              } else {
                return null // We did not encounter `c`
              }
            },

            look(n = 1) {
              // Read `n` characters ahead - don't change `index`
              return input.substr(index, n)
            },

            rewind(n = 1) {
              // Go back `n` characters
              index -= n
            },

            has(token, beforeToken) {
              // Search for `token` before the first `beforeToken`, backwards
              for (let i = tokens.length - 1; i >= 0; i--) {
                const { name } = tokens[i]

                if (name === beforeToken) return false
                if (name === token) return true
              }

              return false
            },

          }, obj => {
            // Set metadata
            metadata = obj
          })

          if (isMatch) {
            // Match!
            match = matchName
            break
          } else {
            // No match, so let's try the next pattern
            index = indexBefore // Rewind
          }
        }

        if (match) {
          // We matched with something! Let's add it to the token list
          tokens.push({
            name: match,
            text: input.substr(indexBefore, index - indexBefore),

            indexStart: indexBefore,
            indexEnd: --index, // The loop will do index++, so we need to go back a character

            metadata,
          })
        } else {
          // No match -- it must be text
          const lastToken = tokens[tokens.length - 1]
          const char = input[index]

          if (lastToken && lastToken.name === 'text') {
            // Extend the last text token with this char
            lastToken.text += char
            lastToken.indexEnd += char.length
          } else {
            // New text token
            tokens.push({
              name: 'text',
              text: char,

              indexStart: indexBefore,
              indexEnd: indexBefore + char.length,

              metadata: { lonePair: false },
            })
          }
        }
      }

      // Make sure pairs are actually in pairs
      for (let t = 0; t < tokens.length; t++) {
        const token = tokens[t]

        let endingName, hasPair = false
        if (endingName = mrk.pairs[token.name]) {
          // Search for `endingName` before the next token of the same name
          for (let j = t + 1; j < tokens.length; j++) {
            const jtoken = tokens[j]

            if (jtoken.name === token.name) {
              // Nope. We've reached the next token of the same name, so
              // this token does NOT have a pair token :(
              break
            } else if (jtoken.name === endingName) {
              // We found a pair token!!
              hasPair = true
              break
            }
          }

          if (!hasPair) {
            // Revert `token` to a text token, as it does not have a pair
            token.name = 'text'
            token.metadata = { lonePair: true }
          }
        }
      }

      return tokens
    }

    const tokens = tokenize(input)
    return {
      tokens,

      html() {
        let html = ''
        const htmlify = mrk.htmlify

        for (const token of tokens) {
          html += mrk.htmlify[token.name](token)
        }

        return html
      }
    }
  }

  // Escapes special chars in text for rendering to HTML
  mrk.escapeHTML = text => {
    return text
     .replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&#039;')
  }

  // Extend mrk by adding functions to the pattern obj, or removing
  // them, or whatever.
  mrk.patterns = {
    // \n
    newline({ read }) {
      return read() === '\n'
    },

    // *italic...
    italicStart({ read, look, has }) {
      return read() === '*' // Must be single asterisk
        && look() !== '*' // Not bold (double asterisk)
        && !has('italicStart', 'italicEnd') // Not already italics
    },

    // ...italic*
    italicEnd({ read, look, has }) {
      return read() === '*' // Single asterisk
        && look() !== '*' // Not bold (double asterisk)
        && has('italicStart', 'italicEnd') // Currently italics
    },

    // _italic...
    italicUnderscoredStart({ read, look, has }) {
      return read() === '_' // Must be single underscore
        && !has('italicUnderscoredStart', 'italicUnderscoredEnd') // Not already _italics_
    },

    // ...italic_
    italicUnderscoredEnd({ read, look, has }) {
      return read() === '_' // Must be single underscore
        && has('italicUnderscoredStart', 'italicUnderscoredEnd') // Currently _italics_
    },

    // **bold...
    boldStart({ read, look, has }) {
      return read(2) === '**' // 2 asterisks
        && !has('boldStart', 'boldEnd') // Not already bold
    },

    // ...bold**
    boldEnd({ read, look, has }) {
      return read(2) === '**' // 2 asterisks
        && has('boldStart', 'boldEnd') // Currently bold
    },

    // `code`
    code({ read, has }) {
      if(read() === '`') {
        // Eat up every character until another backtick
        let escaped = false, char

        while (char = read()) {
          if (char === '\\' && !escaped) escaped = true
          else if (char === '`' && !escaped) return true
          else escaped = false
        }
      }
    },

    // [name](href)
    link({ read, readUntil }, meta) {
      if (read() !== '[') return

      // All characters up to `]` are the link name
      const name = readUntil(']')

      if (read(2) !== '](') return

      // All characters up to `)` are the link href
      const href = readUntil(')')

      // Set metadata
      meta({ name, href })

      return read() === ')'
    },

    // http[s]://url
    autolink({ read, readUntil, rewind }) {
      // Should start with http:// or https://
      if (read(4) !== 'http') return
      if (read(1) !== 's') rewind(1)
      if (read(3) !== '://') return

      // Eat everything until a space; we can assume that this is a valid URL
      readUntil(' ', true)

      return true
    },
  }

  // Tokens that will be reverted to text if they do not see their paired ending token
  // e.g. italicStart without an italicEnd will become text (with metadata.lonePair = true)
  mrk.pairs = {
    italicStart: 'italicEnd',
    italicUnderscoredStart: 'italicUnderscoredEnd',
    boldStart: 'boldEnd',
  }

  // Declares how to HTML-ify tokens.
  mrk.htmlify = {
    // text
    text: ({ text }) => mrk.escapeHTML(text),

    // newline
    newline: () => '<br/>',

    // *italic* -> <i>
    italicStart: () => '<i>',
    italicEnd: () => '</i>',

    // _italic_ -> <em>
    italicUnderscoredStart: () => '<em>',
    italicUnderscoredEnd: () => '</em>',

    // **bold** -> <b>
    boldStart: () => '<b>',
    boldEnd: () => '</b>',

    // `code` -> <code>
    code: ({ text }) => '<code>' + mrk.escapeHTML(text.substr(1, text.length - 2)) + '</code>',

    // [name](href) -> <a>
    link: ({ metadata }) => `<a href='${mrk.escapeHTML(metadata.href).replace('javascript:', '')}'>${mrk.escapeHTML(metadata.name)}</a>`,

    // autolinked -> <a>
    autolink: ({ text }) => `<a href='${mrk.escapeHTML(text)}'>${mrk.escapeHTML(text)}</a>`,
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = mrk
  } else if (typeof global === 'object') {
    global.mrk = mrk
  } else if (window) {
    window.mrk = mrk
  }
})()
