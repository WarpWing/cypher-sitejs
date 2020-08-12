require('./src/eutils');
const e = require('express');

const app = e();

app.use(e.static('site/'));

let port
if (process.env.PORT === undefined){
    port = 8080
} else if (Number.isNaN(Number(process.env.PORT))){
    throw new TypeError('PORT has to be a number.')
} else {
    port = Number(process.env.port)
}


app.listen(port, () => {
    console.log(`Started listening to port ${port}`);
});
