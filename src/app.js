const e = require('express')
require('dotenv').config({ debug: true })

const app = e()

// app.use(e.static('site/'));  // Don't need it when using nginx as static server
app.use(e.json()) // for parsing application/json
app.use(e.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

let port = undefined
if (process.env.PORT === undefined) {
    port = 8080
} else if (Number.isNaN(Number(process.env.PORT))) {
    throw new TypeError('PORT has to be a number.')
} else {
    port = Number(process.env.PORT)
}

console.log(`[app] PORT is ${port.toString()}`)

app.all('/admin/queries', (req, res) => {
    let resp = "<h1><em><u>URL Query strings</u></em></h1><hr>";
    console.log(`[app] ${req.query}`);
    console.log(`[app] query entries: ${Object.entries(req.query)}`)
    for (const [key, value] of Object.entries(req.query)) {
        resp += `<p><b>${key}</b>: <code>${String(value)}</code></p>`;
        // console.log(`[app] key: ${key}, entry: ${value}`)
    }
    res.send(resp);
})

app.post('/admin/stop', (req, res) => {
    if (req.get('content-type') !== 'application/json'){
        res.status(400)
        return res.send({code: 400, reason: 'Content-Type is not application/json'})
    }
    if (req.body.key === process.env.stoppass) {
        res.status(204)
        res.send('👋');
        console.log('[app] stopping server')
        process.exit(0);
    } else if (req.body.key === undefined){
        res.status(401)
        res.header('Content-Type', 'application/json')
        res.send({code: 401, reason: 'No passkey is given.'})
    } else {
        res.status(403)
        res.header('Content-Type', 'application/json')
        res.send({code: 403, reason: 'Invalid passkey given.'})
    }
});

app.post('/uptime', (req, res) => {
    res.send('Work in progress.')
})

app.all('/teapot', (req, res) => {
    res.status(418)
    res.send("<h1><b><u><em>I'm a teapot</em></u></b><br></h1>Tip me over and pour me out.")
})

app.listen(port, () => {
    console.log(`[app] Started listening to port ${port}`);
});
