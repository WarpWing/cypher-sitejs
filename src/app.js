require('dotenv').config({ debug: true })
const e = require('express')
const ejs = require('ejs')
const si = require('systeminformation')
const mcache = require('memory-cache')
// const url = require('url')
// const cookieSession = require('cookie-session')
// const Keygrip = require('keygrip')
const mongod = require('mongodb')
const cookieParser = require('cookie-parser')
const { addAsync } = require('@awaitjs/express')
const sha256 = require('js-sha256').sha256
const utils = require('./utils')


// let keys = []
// for (let i = 0; i<10; i++){
//     keys.unshift(utils.random(30))
// }
// console.dir(keys)

const app = addAsync(e())  // Add async support for express because i'm an idiot and don't want callback hell
// app.use(e.static('site/'));  // Don't need it when using nginx as static server
app.use(e.json()) // for parsing application/json
app.use(e.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(cookieParser(process.env.key))
const mongo = new mongod.MongoClient(process.env.mongourl)
// app.use(cookieSession({
//     keys: Keygrip(keys),
//     sameSite: true,
//     maxAge: 60 * 30  // Users have half an hour to do their thing
// }))

let port
if (process.env.PORT === undefined) {
    port = 8080
} else if (Number.isNaN(Number(process.env.PORT))) {
    throw new TypeError('PORT has to be a number.')
} else {
    port = Number(process.env.PORT)
}

console.log(`[app] PORT is ${port.toString()}`)

// noinspection UnnecessaryReturnStatementJS
const cache = (duration) => {
    return (req, res, next) => {
        const key = '__express__' + req.originalUrl || req.url
        const cachedBody = mcache.get(key)
        if (cachedBody) {
            res.send(cachedBody)
            // return
        } else {
            res.sendResponse = res.send
            res.send = (body) => {
                mcache.put(key, body, duration * 1000)
                res.sendResponse(body)
            }
            next()
        }
    }
}

app.all('/admin/queries', (req, res) => {
    console.log(`[app] ${req.query}`)
    console.log(`[app] query entries: ${Object.entries(req.query)}`)
    let resp = ''
    for (const [key, value] of Object.entries(req.query)) {
        resp += `<p><b>${key}</b>: <code>
                    ${value === '' ? "<span class='text-success'>true</span>" : String(value)}
                 </code></p>`
    }
    if (resp === '') {
        resp = 'Nothing'
    }
    // console.log(`[app] key: ${key}, entry: ${value}`)
    const values = {
        title: 'Query Strings',
        header: '<h1><u><em><b>URL query strings</b></em></u></h1>' +
            '<em><i class="text-warning">Note:</i> treating empty queries as <code>true</code></em>',
        body: resp
    }
    ejs.renderFile('src/views/pages.ejs', values, {}, (err, str) => {
        if (err) {
            res.status(500).send({ code: 500, reason: 'Unexpected server error' })
            return
        }
        res.send(str)
    })
})

app.all('/admin/stop', (req, res) => {
    if (req.get('content-type') !== 'application/json') {
        res.status(400)
        return res.send({ code: 400, reason: 'Content-Type is not application/json' })
    }
    if (req.body.key === process.env.stoppass) {
        res.status(200).send('👋')
        console.log('[app] stopping server')
        process.exit(0)
    } else if (req.body.key === undefined) {
        res.status(401).send({ code: 401, reason: 'No passkey is given.' })
    } else {
        res.status(403).send({ code: 403, reason: 'Invalid passkey given.' })
    }
})

app.post('/uptime', (req, res) => {
    const thing = req.body
    for (const i in thing) {
        res = 0
    }
})

app.all('/teapot', (req, res) => {
    res.status(418)
    const style = `<style>
                    body {
                        background: url("https://cdn.discordapp.com/attachments/698259616458342450/744171641176850553/Screenshot_2020-08-15_at_8.30.08_PM.png");
                        background-size: 30%;
                    }
                 </style>`
    res.send(style + "<h1 style='color: #ffffff;'><b><u><em>I'm a teapot</em></u></b><br></h1>Tip me over and pour me out.")
})

app.getAsync('/sysinfo', cache(5), async (req, res) => {
    let stuff = '<ul>'
    const stats = {}
    stats.system = await si.system()
    stats.cpu = await si.cpu()
    stats.mem = await si.mem()
    stats.bios = await si.bios()
    stats.os = await si.osInfo()
    stats.cpuCurrent = await si.cpuCurrentspeed()
    // Probably should just make a ejs file and use that here instead but bleh
    stuff += `<li>CPU statistics</li>
              <ul>
                <li>Name: ${stats.cpu.manufacturer} ${stats.cpu.brand}</li>
                <li>Cores: ${stats.cpu.cores} (Physical: ${stats.cpu.physicalCores})</li>
                <li>Speed(GHz): ${stats.cpu.speed} normal, ${stats.cpu.speedmin} minimum, ${stats.cpu.speedmax} maximum</li>
                <li>Speed now(GHz): Average all ${stats.cpuCurrent.avg}</li>
              </ul>`
    stuff += `<li>System</li>
              <ul>
                <li>Manufacturer: ${stats.system.manufacturer}</li>
                <li>Model: ${stats.system.model}</li>
                <li>BIOS Vendor: ${stats.bios.vendor}</li>
              </ul>`
    stuff += `<li>Memory</li>
              <ul>
                <li>Physical</li>
                <ul>
                  <li>Total: ${stats.mem.total} bytes (${Math.round(stats.mem.total / 1000000000)} GB)</li>
                  <li>Free: ${stats.mem.free} bytes (${Math.round(stats.mem.free / 1000000000)} GB)</li>
                  <li>Used: ${stats.mem.used} bytes (${Math.round(stats.mem.used / 1000000000)} GB)</li>
                  <li>Active: ${stats.mem.active} bytes (${Math.round(stats.mem.active / 1000000000)} GB)</li>
                </ul>
                <li>Swap</li>
                <ul>
                  <li>Total: ${stats.mem.swaptotal}</li>
                  <li>Used: ${stats.mem.swapused}</li>
                  <li>Available: ${stats.mem.swapfree}</li>
                </ul>
              </ul>`
    stuff += `<li>OS Information</li>
              <ul>
                <li>Platform: <i class="${stats.os.platform === 'linux' ? 'fab fa-linux'
        : stats.os.platform === 'win32' ? 'fab fa-windows'
            : stats.os.platform === 'darwin' ? 'fab fa-apple'
                : 'fas fa-question'}"></i>
                    ${stats.os.platform} ${stats.os.arch}</li>
                <li>Name: ${stats.os.distro} ${stats.os.release} Build ${stats.os.build} ${stats.os.codename}</li>
                <li>Kernal version: ${stats.os.kernel}</li>
                <li>UEFI? ${stats.os.uefi ? "<span class='text-success'>Yes</span>"
        : "<span class='text-error'>No</span>"}</li>
                <li>Hostname: ${stats.os.hostname}</li>
              </ul>`
    stuff += '</ul>'
    stuff += '<hr><h6>Legal</h6>' +
        "<p class='text-muted'>" +
        "The Apple icon (<i class='fab fa-apple'></i>), 'Apple' are trademarks of Apple Inc., registered in the U.S. and other countries.<br>" +
        "The Windows icon (<i class='fab fa-windows'></i>) is a trademark of Microsoft Cooperation.<br>" +
        'Linux is a registered trademark of Linus Torvalds.<br>' +
        'This webpage is created independently and has not been authorized, sponsored or otherwise approved by Apple Inc. or Microsoft Cooperation.<br>' +
        'If you have any questions or if you want your logos and trademarks to be removed from this site, please contact me at ' +
        "<a href='mailto:Kenny Cheung<kcomain@cypherbot.org>'>kcomain@cypherbot.org</a>" +
        '</p>'
    const values = {
        title: 'System Statistics',
        header: '<h1>System statistics</h1>',
        body: stuff
    }
    ejs.renderFile('src/views/pages.ejs', values, {}, (err, str) => {
        if (err) {
            res.status(500).send({ code: 500, reason: 'Unexpected server error', error: err })
            console.dir(err)
            return
        }
        res.send(str)
    })
})

// noinspection JSUnresolvedVariable
app.getAsync('/oauth/discord/', async (req, res) => {
    if (req.query.code === undefined) {
        const state = utils.random(10)
        res.cookie('sessionhash', sha256(state), {
            maxAge: 60 * 30 * 1000,
            sameSite: 'lax',
            path: '/',
            signed: true,
            httpOnly: true
        })
            .redirect('https://discord.com/api/oauth2/authorize?' +
                `client_id=${process.env.cid}` +
                `redirect_uri=${encodeURIComponent(req.protocol + '://' + req.get('host') + req.originalUrl)}&` +
                'response_type=code&' +
                'scope=identify%20guilds%20email&' +
                'prompt=none' +
                `state=${state}`
            )
        console.log('Cookie saved? check headers')
        console.log(`Session: ${state}`)
    } else {
        // Probably returned from oauth site.
        console.dir(req.signedCookies)
        if (req.query.state === undefined) { // require state to be provided
            res.status(400).send('State is not provided?')
        } else if (req.signedCookies.sessionhash !== sha256(req.query.state)) {
            res.status(400).send('Invalid session state')
        } else {
            res.clearCookie('sessionhash')
            // First get the thing yes wait a bit ok
            const tokenres = await fetch()
            mongo.connect((err, client) => {
                const col = client.db('Cypher').collection('data')
            })
            // .redirect('/oauth/discord/success')
            // res.status(200).send("ok")
        }
    }
})

app.listen(port, () => {
    console.log(`[app] Started listening to port ${port}`)
})
