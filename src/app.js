require('dotenv').config({debug: true})
const e = require('express')
const ejs = require('ejs')
const si = require('systeminformation')
const mcache = require('memory-cache')
const {addAsync} = require('@awaitjs/express');

const app = addAsync(e())

// app.use(e.static('site/'));  // Don't need it when using nginx as static server
app.use(e.json()) // for parsing application/json
app.use(e.urlencoded({extended: true})) // for parsing application/x-www-form-urlencoded

let port = undefined
if (process.env.PORT === undefined) {
    port = 8080
} else if (Number.isNaN(Number(process.env.PORT))) {
    throw new TypeError('PORT has to be a number.')
} else {
    port = Number(process.env.PORT)
}

console.log(`[app] PORT is ${port.toString()}`)

// noinspection UnnecessaryReturnStatementJS
let cache = (duration) => {
    return (req, res, next) => {
        let key = '__express__' + req.originalUrl || req.url
        let cachedBody = mcache.get(key)
        if (cachedBody) {
            res.send(cachedBody)
            // return
        } else {
            res.sendResponse = res.send
            res.send = (body) => {
                mcache.put(key, body, duration * 1000);
                res.sendResponse(body)
            }
            next()
        }
    }
}

app.all('/admin/queries', (req, res) => {
    console.log(`[app] ${req.query}`);
    console.log(`[app] query entries: ${Object.entries(req.query)}`)
    let resp = ""
    for (const [key, value] of Object.entries(req.query)) {
        resp += `<p><b>${key}</b>: <code>
                    ${value === "" ? "<span class='text-success'>true</span>" : String(value)}
                 </code></p>`;
    }
    if (resp === "") {
        resp = "Nothing"
    }
    // console.log(`[app] key: ${key}, entry: ${value}`)
    let values = {
        title: "Query Strings",
        header: "<h1><u><em><b>URL query strings</b></em></u></h1>" +
            "<em><i class=\"text-warning\">Note:</i> treating empty queries as <code>true</code></em>",
        body: resp
    }
    ejs.renderFile('src/views/pages.ejs', values, {}, (err, str) => {
        if (err) {
            res.status(500).send({code: 500, reason: 'Unexpected server error'})
            return
        }
        res.send(str);
    })
})

app.all('/admin/stop', (req, res) => {
    if (req.get('content-type') !== 'application/json') {
        res.status(400)
        return res.send({code: 400, reason: 'Content-Type is not application/json'})
    }
    if (req.body.key === process.env.stoppass) {
        res.status(200).send('👋');
        console.log('[app] stopping server')
        process.exit(0);
    } else if (req.body.key === undefined) {
        res.status(401).send({code: 401, reason: 'No passkey is given.'})
    } else {
        res.status(403).send({code: 403, reason: 'Invalid passkey given.'})
    }
});

app.post('/uptime', (req, res) => {
    let thing = req.body
    for (const i in thing) {
        res = 0
    }
})

app.all('/teapot', (req, res) => {
    res.status(418)
    res.send("<h1><b><u><em>I'm a teapot</em></u></b><br></h1>Tip me over and pour me out.")
})

app.getAsync('/info', cache(5), async (req, res) => {
    let stuff = "<ul>"
    let stats = {}
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
                  <li>Total: ${stats.mem.total} bytes (${stats.mem.total/1000000000} GB)</li>
                  <li>Free: ${stats.mem.free} bytes (${stats.mem.free/1000000000} GB)</li>
                  <li>Used: ${stats.mem.used} bytes (${stats.mem.used/1000000000} GB)</li>
                  <li>Active: ${stats.mem.active} bytes (${stats.mem.active/1000000000} GB)</li>
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
                <li>Platform: ${stats.os.platform} ${stats.os.arch}</li>
                <li>Name: ${stats.os.distro} ${stats.os.release} Build ${stats.os.build} ${stats.os.codename}</li>
                <li>Kernal version: ${stats.os.kernel}</li>
                <li>UEFI? ${stats.os.uefi ? "<span class='text-success'>Yes</span>" : 
                    "<span class='text-error'>No</span>"}</li>
                <li>Hostname: ${stats.os.hostname}</li>
              </ul>`
    stuff += `</ul>`
    stuff += "<hr><h6>Legal</h6>" +
        "<p class='text-muted'>" +
        "This site(CypherBot.org) is not endorsed with any company. Any use of their trademarked" +
        "icons are solely for the displayment of their respective operating systems and falls under their " +
        "</p>"
    let values = {
        title: 'System Statistics',
        header: "<h1>System statistics</h1>",
        body: stuff
    }
    ejs.renderFile('src/views/pages.ejs', values, {}, (err, str) => {
        if (err) {
            res.status(500).send({code: 500, reason: 'Unexpected server error', error: err})
            console.dir(err)
            return
        }
        res.send(str);
    })
})

app.listen(port, () => {
    console.log(`[app] Started listening to port ${port}`);
});
