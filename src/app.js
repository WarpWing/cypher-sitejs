const e = require('express')

const app = e()

app.use(e.static('site/'));

let port
if (process.env.PORT === undefined) {
    port = 8080
} else if (Number.isNaN(Number(process.env.PORT))) {
    throw new TypeError('PORT has to be a number.')
} else {
    port = Number(process.env.port)
}


app.listen(port, () => {
    console.log(`Started listening to port ${port}`);
});

app.all('/admin/queries', (req, res) => {
    let resp = "<h1><em><u>URL Query strings</u></em></h1><hr>";
    console.log(req.query);
    console.log(`query entries: ${Object.entries(req.query)}`)
    for (const [key, value] of Object.entries(req.query)) {
        resp += `<p><b>${key}</b>: <code>${String(value)}</code></p>`;
        console.log(`key: ${key}, entry: ${value}`)
    }
    res.send(resp);
})

app.post('/admin/stop', (req, res) => {
    res.send('👋');
    process.exit(0);
});
