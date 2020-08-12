require('./src/eutils');
const e = require('express');

const app = e();

app.use(e.static('site/'));

let port
if (process.env.PORT === undefined){
    port = 8080
} else if (typeof process.env.PORT != "number"){
    throw new Error("PORT must be a number.")
} else {
    port = Number(process.env.PORT)
}


app.listen(port, () => {
    console.log(`Started listening to port ${port}`);
});
