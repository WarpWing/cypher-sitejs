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
const fetch = require('node-fetch')
const moment = require('moment')
const luxon = require('luxon')
const debug = require('debug')

// let keys = []
// for (let i = 0; i<10; i++){
//     keys.unshift(utils.random(30))
// }
// console.dir(keys)

const start = new Date()
const app = addAsync(e()) // Add async support for express because i'm an idiot and don't want callback hell
// app.use(e.static('site/'));  // Don't need it when using nginx as static server
app.use(e.json()) // for parsing application/json
app.use(e.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(cookieParser(process.env.key))
const mongoOptions = {
    socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 }
    // replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }
}
const loggers = {
    http: debug('http'),
    express: debug('express')
}
loggers.app = loggers.http.extend('app')
loggers.oauth = loggers.http.extend('oauth')
if (process.env.DEBUG) {
    debug.enable('*')
}
// noinspection JSCheckFunctionSignatures
const mongo = new mongod.MongoClient(process.env.mongourl, mongoOptions)
// app.use(cookieSession({
//     keys: Keygrip(keys),
//     sameSite: true,
//     maxAge: 60 * 30  // Users have half an hour to do their thing
// }))

const logReqs = (req, res, next) => {
    loggers.http(`${req.ip} ${req.method} ${req.originalUrl}`)
    next()
}

app.use(logReqs)

const urls = {
    discord: {
        authorize: 'https://discord.com/api/oauth2/authorize',
        token: 'https://discord.com/api/oauth2/token',
        revoke: 'https://discord.com/api/oauth2/token/revoke',
        baseapi: 'https://discord.com/api/v6'
    }
}

let port
if (process.env.PORT === undefined) {
    port = 8080
} else if (Number.isNaN(Number(process.env.PORT))) {
    throw new TypeError('PORT has to be a number.')
} else {
    port = Number(process.env.PORT)
}

loggers.app(`[app] PORT is ${port.toString()}`)

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

// ======    /admin    ======
app.all('/admin/queries', (req, res) => {
    let resp = ''
    for (const [key, value] of Object.entries(req.query)) {
        resp += `<p><b>${key}</b>: <code>
                    ${value === '' ? '<span class=\'text-success\'>true</span>' : String(value)}
                 </code></p>`
    }
    if (resp === '') {
        resp = 'Nothing'
    }
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
        loggers.express('[app] stopping server')
        process.exit(0)
    } else if (req.body.key === undefined) {
        res.status(401).send({ code: 401, reason: 'No passkey is given.' })
    } else {
        res.status(403).send({ code: 403, reason: 'Invalid passkey given.' })
    }
})

// ======    /    ======

app.all('/uptime', (req, res) => {
    const data = si.time()
    // noinspection JSCheckFunctionSignatures
    res.send({
        node_uptime: {
            seconds: moment().diff(start, 'seconds', true),
            minutes: moment().diff(start, 'minutes', true),
            hours: moment().diff(start, 'hours', true),
            days: moment().diff(start, 'days', true),
            months: moment().diff(start, 'months', true),
            formatted: luxon.Duration.fromMillis(Number(new Date()) - Number(start), {})
                .toFormat('y \'years\' M \'months\' d \'days\' h \'hours\' m \'minutes\' s \'seconds\' S \'milliseconds\'')
        },
        system_uptime: {
            seconds: moment().diff(Date.now() - (data.uptime * 1000), 'seconds', true),
            minutes: moment().diff(Date.now() - (data.uptime * 1000), 'minutes', true),
            hours: moment().diff(Date.now() - (data.uptime * 1000), 'hours', true),
            days: moment().diff(Date.now() - (data.uptime * 1000), 'days', true),
            months: moment().diff(Date.now() - (data.uptime * 1000), 'months', true),
            formatted: luxon.Duration.fromMillis(data.uptime * 1000, {})
                .toFormat('y \'years\' M \'months\' d \'days\' h \'hours\' m \'minutes\' s \'seconds\' S \'milliseconds\'')
        }
        // debug: {
        //     data,
        //     deducted: Date.now()-data.uptime,
        //     deducted_time: moment(Date.now()-data.uptime)
        // }
    })
})

app.all('/wip', (req, res) => {
    const options = {
        title: 'Work in progress',
        header: '<h1>This page is a work in progress!</h1>',
        body: '<a href=\'/\' role=\'button\' class=\'btn btn-primary\'><i class=\'fas fa-home\'></i> Go Home</a> ' +
            '<a href=\'mailto:kcomain@cypherbot.org\' role=\'button\' class=\'btn btn-success\'><i class=\'fas fa-at\'></i> Send hatemail to developer</a>'
    }
    ejs.renderFile('src/views/pages.ejs', options, {}, (err, str) => {
        if (err) {
            res.status(500).send({ code: 500, reason: 'Unexpected server error', error: err })
            return
        }
        res.send(str)
    })
})

app.all('/teapot', (req, res) => {
    res.status(418)
    const style = `<style>
                    body {
                        background: url("https://cdn.discordapp.com/attachments/698259616458342450/744171641176850553/Screenshot_2020-08-15_at_8.30.08_PM.png");
                        background-size: 30%;
                    }
                 </style>`
    res.send(style + '<h1 style=\'color: #ffffff;\'><b><u><em>I\'m a teapot</em></u></b><br></h1>Tip me over and pour me out.')
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
                <li>UEFI? ${stats.os.uefi ? '<span class=\'text-success\'>Yes</span>'
        : '<span class=\'text-error\'>No</span>'}</li>
                <li>Hostname: ${stats.os.hostname}</li>
              </ul>`
    stuff += '</ul>'
    stuff += '<hr><h6>Legal</h6>' +
        '<p class=\'text-muted\'>' +
        'The Apple icon (<i class=\'fab fa-apple\'></i>), \'Apple\' are trademarks of Apple Inc., registered in the U.S. and other countries.<br>' +
        'The Windows icon (<i class=\'fab fa-windows\'></i>) is a trademark of Microsoft Cooperation.<br>' +
        'Linux is a registered trademark of Linus Torvalds.<br>' +
        'This webpage is created independently and has not been authorized, sponsored or otherwise approved by Apple Inc. or Microsoft Cooperation.<br>' +
        'If you have any questions or if you want your logos and trademarks to be removed from this site, please contact me at ' +
        '<a href=\'mailto:Kenny Cheung<kcomain@cypherbot.org>\'>kcomain@cypherbot.org</a>' +
        '</p>'
    const values = {
        title: 'System Statistics',
        header: '<h1>System statistics</h1>',
        body: stuff
    }
    ejs.renderFile('src/views/pages.ejs', values, {}, (err, str) => {
        if (err) {
            res.status(500).send({ code: 500, reason: 'Unexpected server error', error: err })
            return
        }
        res.send(str)
    })
})

// ======    /oauth    ======

// noinspection JSUnresolvedVariable,JSUnresolvedFunction
app.getAsync('/oauth/discord/', async (req, res) => {
    const redir = encodeURIComponent(req.protocol + '://' + req.get('host') + req.path + ((req.path[req.path.length - 1] === '/') ? '' : '/'))
    if (process.env.NODE_ENV === 'development') {
        loggers.oauth(`Redir: ${encodeURIComponent(req.protocol + '://' + req.get('host') +
            req.path + ((req.path[req.path.length - 1] === '/') ? '' : '/'))}`)
    }

    const client = await mongo.connect()
    const data = client.db('Cypher').collection('data')
    if (req.query.code === undefined) {
        const state = utils.random(20)
        res.cookie('sessionhash', sha256(state), {
            maxAge: 60 * 30 * 1000,
            sameSite: 'lax',
            path: '/',
            signed: true,
            httpOnly: true
        })
            .redirect('https://discord.com/api/oauth2/authorize?' +
                `client_id=${process.env.cid}&` +
                `redirect_uri=${redir}&` +
                'response_type=code&' +
                'scope=identify%20guilds%20email&' +
                'prompt=none&' +
                `state=${state}`
            )
        loggers.oauth('Cookie saved? check headers')
        loggers.oauth(`Session: ${state}`)
        loggers.oauth(`Redir[authstart]: ${redir}`)
    } else {
        // Probably returned from oauth site.
        loggers.app(req.signedCookies)
        if (req.query.state === undefined) { // require state to be provided
            res.status(400).send('State is not provided?')
        } else {
            /* eslint no-lonely-if: "off" */
            // noinspection JSUnresolvedVariable
            if (req.signedCookies.sessionhash !== sha256(req.query.state)) {
                res.status(400).send('Invalid session state <a onclick="window.history.go(-2)" href="#">Go back?</a>' +
                    ` <a href=${decodeURIComponent(redir).split(/\?/)[0]}>Retry?</a>`)
            } else {
                res.clearCookie('sessionhash')
                // First get the thing yes wait a bit ok
                const urlparams = new URLSearchParams({
                    client_id: process.env.cid,
                    client_secret: process.env.csec,
                    grant_type: 'authorization_code',
                    code: req.query.code,
                    redirect_uri: decodeURIComponent(redir), // encodeURIComponent(req.protocol + '://' + req.get('host') + req.originalUrl.split(/\?/)[0]),
                    scope: 'identify guilds email'
                })
                // const fheaders = urlparams.getHeaders()
                const tokenres = await fetch(urls.discord.token, {
                    body: urlparams,
                    method: 'post'
                })
                const resjson = await tokenres.json()
                if (tokenres.status === 400) {
                    res.send(resjson)
                }
                // Get shit from discord api
                const uinfo = await fetch(urls.discord.baseapi + '/users/@me', {
                    headers: {
                        'Authorization': `${resjson.token_type} ${resjson.access_token}`
                    }
                })
                const udata = await uinfo.json()
                const udbdata = await data.findOne()
                if (udbdata !== null && udbdata.expiry > Number(new Date())) {
                    loggers.oauth('User is already in db and it not expired yet, just redirect and set cookie')
                    res.redirect('/wip')
                } else {
                    // loggers.app(uinfo)
                    // noinspection JSUnresolvedVariable
                    await data.insertOne({
                        uid: udata.id,
                        upfp: `https://cdn.discordapp.com/avatars/${udata.id}/${udata.avatar}${(udata.avatar.startsWith('a_') ? '.gif' : '.png')}`,
                        locale: udata.locale,
                        token: resjson.access_token,
                        tokentype: resjson.token_type,
                        refresh: resjson.refresh_token,
                        scope: resjson.scope,
                        expiry: Math.floor(Number(new Date() / 1000)) + Number(resjson.expires_in)
                    })
                }
                if (process.env.NODE_ENV === 'development') {
                    const visualizerurl = new URL(req.protocol + '://' + req.get('host'))
                    visualizerurl.pathname = '/admin/queries'
                    visualizerurl.search = new URLSearchParams(resjson).toString()
                    res.send(`Authentication Complete. <br><h2>DEBUG:</h2>${JSON.stringify(resjson)}<br>` +
                        `<a href="${visualizerurl}">See in queries visualizer</a><br>
                         <ul><li>Expiry Date: ${moment()} ()</li></ul>
`
                    )
                } else {
                    res.redirect('/wip')
                }
            }
        }
    }
})

// ======    /webhook    ======
app.post('/webhook/updown', (req, res) => {
    // const events = []
    for (const i in req.body) {
        try {
            const downtime = luxon.Duration.fromMillis(i.downtime.duration * 1000, {}).toFormat('m \'minutes\' s \'seconds\'')
            const nextcheck = luxon.Duration.fromMillis(Date.parse(i.check.next_check_at) - Date.now(), {}).toFormat('m \'minutes\' s \'seconds\'')
            const content = {
                content: `<@397029587965575170> Thy site ${i.check.url} ist ${(i.event === 'check.down') ? 'down' : 'up'}\n` +
                    `It is down since uh ${moment().fromNow(i.check.down_since)} ${(!i.check.down) ? `and it's now up. (down for ${downtime})` : ''} \n` +
                    `Next check: ${moment(i.check.next_check_at).format()} (${nextcheck})\n` +
                    `Now more json \`\`\`json\n${JSON.stringify(i)}\n\`\`\``
            }
            loggers.app(`Sending item:\n${content}`)
            // noinspection JSUnresolvedFunction
            fetch('https://canary.discordapp.com/api/webhooks/743749236008550411/02NDk07lIja13bUOYsUg0ZA-u-CjbA6_-ECpewgPGRSG7NpwEk0B60wyrWsPZ4Wm6ARw', {
                method: 'post',
                body: JSON.stringify(content),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then((data) => data.text().then((thing) => {
                loggers.app(thing);
                loggers.app(`Status: ${data.status}`)
            }))
        } catch (err) {
            // noinspection JSUnresolvedFunction
            fetch('https://canary.discordapp.com/api/webhooks/743749236008550411/02NDk07lIja13bUOYsUg0ZA-u-CjbA6_-ECpewgPGRSG7NpwEk0B60wyrWsPZ4Wm6ARw', {
                method: 'post',
                body: JSON.stringify({
                    content: '<@397029587965575170> ey your code broke come check error here \n' + err.toString()
                })
            }).then(() => console.log(err))
        }
    }
    res.send('OK') // + events)
})

// ======    /backend    ======
app.all(/^\/backend\/?.*$/, (req, res) => {
    res.redirect(307, '/wip')
})

const server = app.listen(port, () => {
    loggers.app(`Started listening to port ${port}`)
})

// 404-y handler
app.use((req, res, next) => {
    loggers.app(`${req.ip} ${req.method} ${req.originalUrl}: (probably) not found.`)
    res.status(404).send('<h1 style="color: #f45d5b;">404 Not found.</h1><br>Whoops! This is an invalid page. Wanna ' +
        '<a href="#" onclick="window.history.go(-1) role=\'button\'">go back?</a> ooor ' +
        '<a href="/" role=\'button\'>go home?</a> oooooor ' +
        `<button onclick="alert('cyka blyat idi nahui')">call vadim</button><br>` +
        `If you think this page should exist, please contact developer at <a href="mailto:<kcomain@cypherbot.org>">kcomain@cypherbot.org</a>, or dm kcomain#2020 on discord.` +
        "<hr><i>This page is a temporary 404 page. Expect this page to change sooooooon.</i><br>"
    )
})
/*
====================================================
|                      Notice                      |
|--------------------------------------------------|
| You probably would want to add routes above this |
| block, since it might break the 404 catcher.     |
====================================================
 */
let tmin = false

process.on('SIGTERM', () => {
    if (!tmin) {
        loggers.app('\nReceived SIGTERM, closing server. (send the signal again to force kill)')
        tmin = true
        server.close()
        process.exit(0)
    } else {
        console.warning('Force exiting')
        process.exit(255)
    }
})

process.on('SIGINT', () => {
    if (!tmin) {
        loggers.app('\nReceived signal SIGINT, terminating. (send the signal again to force kill)')
        tmin = true
        server.close()
        process.exit(0)
    } else {
        console.warning('Force exiting')
        process.exit(255)
    }
})
