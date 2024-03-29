import { graphqlHTTP } from 'express-graphql';
import http from 'http';
import jsonServer from 'json-server';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { Server } from 'socket.io';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { CONFIG } from './config.js';
import { isAuthenticated, AuthenticateSocket } from './utils/jwt-authenticate.js';
import { schema, setupRootValue } from './src/graphql.js';
import {
  loginHandler,
  registerHandler,
  refreshTokenHandler,
  socketEmit,
  testHandler
} from './src/rest.js';
import socketHandler from './src/socket-io.js';
const db = new Low(new JSONFile(CONFIG.databaseFile));
await db.read();

const app = jsonServer.create();
const router = jsonServer.router(CONFIG.databaseFile);
const middlewares = jsonServer.defaults();
const port = process.env.PORT || CONFIG.defaultPort;
const server = http.createServer(app);

// Init socket io server
const io = new Server(server, {
  cors: { origin: '*' },
});
let socket
io.use(AuthenticateSocket).on('connection', (socket) => {
  socket = socket
  socketHandler(socket, io, db);
});

// Config proxy middlewares
app.use(
  CONFIG.proxyUrl,
  createProxyMiddleware({
    target: CONFIG.proxyServer,
    changeOrigin: true,
  })
);

// Init graphql
app.use('/graphql', graphqlHTTP({ schema, rootValue: setupRootValue(db), graphiql: true }));

// Set default middlewares (logger, static, cors and no-cache)
app.use(middlewares);

// Handle POST, PUT and PATCH request
app.use(jsonServer.bodyParser);

// Save createdAt and updatedAt automatically
app.use((req, res, next) => {
  if (['PUT', 'PATCH', 'POST', 'DELETE'].includes(req.method)) {
    if (req.url.indexOf('/XuatKho') >= 0) {
      io.to("Phòng PT").emit("Lấy Dữ Liệu Xuất Kho")
    }
    if (req.url.indexOf('/TrongXuong') >= 0) {
      io.to("Vip").emit("Lấy Dữ Liệu")
      io.to(req.body.CoVanDichVu).emit("Lấy Dữ Liệu")
    }
  }
  next();

});

// Test web socket request
app.post('/socket-emit', (req, res) => {
  socketEmit(io, req, res);
});

// Test request (change the response in src/rest.js)
app.get('/test', (req, res) => {
  testHandler(db, req, res);
});

// Register request
app.post('/register', (req, res) => {
  registerHandler(db, req, res);
});

// Login request
app.post('/login', (req, res) => {
  loginHandler(db, req, res);
});

// Renew Token request
app.post('/refresh-token', (req, res) => {
  refreshTokenHandler(req, res);
});



// Access control
app.use((req, res, next) => {
  const protectedResources = db.data.protectedResources;
  if (!protectedResources) {
    next();
    return;
  }

  const resource = req.path.slice(1).split('/')[0];
  const protectedResource =
    protectedResources[resource] && protectedResources[resource].map((item) => item.toUpperCase());
  const reqMethod = req.method.toUpperCase();

  if (protectedResource && protectedResource.includes(reqMethod)) {
    if (isAuthenticated(req)) {
      next();
    } else {
      res.sendStatus(401);
    }
  } else {
    next();
  }
});

// Rewrite routes
const urlRewriteFile = new JSONFile(CONFIG.urlRewriteFile);
const rewriteRules = await urlRewriteFile.read();
app.use(jsonServer.rewriter(rewriteRules));

// Setup others routes
app.use(router);

// Start server
server.listen(port, () => {
  console.log('Server is running on port ' + port);
});
