import jwt from 'jsonwebtoken';
import { CONFIG } from '../config.js';

export const generateAccessToken = (user) => {
  return jwt.sign(
   { fullName: user.fullName, Job: user.Job, id: new Date().valueOf() },
      CONFIG.accessTokenSecret,
      {
      expiresIn: CONFIG.accessTokenExpiresInMinutes + 'm',
    }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign({ sub: user.id }, CONFIG.refreshTokenSecret, {
    expiresIn: CONFIG.refreshTokenExpiresInMinutes + 'm',
  });
};

export const decodeRefreshToken = (token) => {
  return jwt.verify(token, CONFIG.refreshTokenSecret);
};

export const isAuthenticated = (req) => {
  let token = '';
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    token = req.headers.authorization.split(' ')[1];
  }
  try {
   
    jwt.verify(token, CONFIG.accessTokenSecret);
  } catch (err) {
    return false;
  }
  return true;
};

 export const AuthenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error: Token not provided."));
  }

  const user = verifyToken(token);
  if (!user) {
    return next(new Error("Authentication error: Invalid token."));
  }
  socket.user = user;
  next();
};
 const verifyToken = (token) => {
    try {
      return jwt.verify(token, CONFIG.accessTokenSecret);
    } catch (error) {
      return null;
    }
  };

 