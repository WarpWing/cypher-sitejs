const e = require('express')

const app = e()

app.get('/admin/queries', (req, res) => {
    let resp = "<h1><em><u>URL Query strings</u></em></h1><hr>";
    console.log(req.query);
    console.log(`query entries: ${Object.entries(req.query)}`)
    for (const [key, value] in Object.entries(req.query)){
        resp += `<p><b>${key}</b>: <code>${String(value)}</code></p>`;
        console.log(`key: ${key}, entry: ${value}`)
    }
    res.send(resp);
})

app.post('/admin/stop', (req, res) => {
    res.send('👋');
    process.exit(0);
});
