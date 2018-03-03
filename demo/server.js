const Koa = require('koa');
const send = require('koa-send');
const axios = require('axios');

const PORT = 4009;
const app = new Koa();

app.use(async (ctx, next) => {
  const { path } = ctx;
  if (path.startsWith('/dist/')) {
    return send(ctx, path, { root: `${__dirname}/..` });
  } else {
    return send(ctx, path, { root: __dirname });
  }
});

app.listen(PORT, 'localhost', () => {
  console.log(`Listen at http://localhost:${PORT}`);
});
