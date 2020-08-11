require('./src/eutils');
const e = require('express');

const app = e();

app.use(e.static('site/'));

const port = 8080;

app.listen(port, () => {
    console.log(`Started listening to port ${port}`);
});
