require('./src/app')
require('dotenv').config()

console.log('[*] Loaded src.app')
if (process.env.NODE_ENV === 'development') {
    console.log('[*] developer mode ON')
}
