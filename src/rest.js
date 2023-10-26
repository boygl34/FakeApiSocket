import formidable from 'formidable';
import { copyFile, unlink } from 'fs/promises';
import {
  generateAccessToken,
  generateRefreshToken,
  decodeRefreshToken,
} from '../utils/jwt-authenticate.js';

const handleUploadFile = async (req, file) => {
  const uploadFolder = 'uploads';

  try {
    // Copy file from temp folder to uploads folder (not rename to allow cross-device link)
    await copyFile(file.filepath, `./public/${uploadFolder}/${file.originalFilename}`);
    // Remove temp file
    await unlink(file.filepath);
    // Return new path of uploaded file
    file.filepath = `${req.protocol}://${req.get('host')}/${uploadFolder}/${file.name}`;

    return file;
  } catch (err) {
    throw err;
  }
};

export const testHandler = (db, req, res) => {
  res.jsonp('Hello world!');
};

export const loginHandler = (db, req, res) => {
  const { username, email, password: pwd } = req.body;

  const user = db.data.Users?.find(
    (u) => (u.username === username || u.email === email) && u.password === pwd
  );

  if (user && user.password === pwd) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const { password, ...userWithoutPassword } = user;

    res.jsonp({
      ...userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } else {
    res.status(400).jsonp({ message: 'Tên đăng nhập hoặc mật khẩu không đúng!' });
  }
};

export const refreshTokenHandler = (req, res) => {
  const { token } = req.body;

  if (token) {
    try {
      const payload = decodeRefreshToken(token);
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      res.jsonp({
        accessToken,
        refreshToken,
      });
    } catch (error) {
      res.status(400).jsonp({ error });
    }
  } else {
    res.status(400).jsonp({ message: 'Refresh Token is invalid!' });
  }
};

export const registerHandler = (db, req, res) => {
  const { username, email, password } = req.body;
  const users = db.data.Users;

  if (!password && (!email || !username)) {
    res.status(400).jsonp({ message: 'Please input all required fields!' });
    return;
  }

  const existUsername = users?.find((user) => username && user.username === username);

  if (existUsername) {
    res.status(400).jsonp({
      message: 'The username already exists. Please use a different username!',
    });
    return;
  }

  const existEmail = users?.find((user) => email && user.email === email);

  if (existEmail) {
    res.status(400).jsonp({
      message: 'The email address is already being used! Please use a different email!',
    });
    return;
  }

  let maxId = 0;
  for (let u of users) {
    if (u.id > maxId) {
      maxId = u.id;
    }
  }
  const newUser = { id: maxId + 1, ...req.body };

  users?.push(newUser);
  db.write();
  res.jsonp(newUser);
};



export const socketEmit = (io, req, res) => {
  io.emit('socket-emit', req.body);
  res.jsonp({ msg: 'Message sent over websocket connection',data:req.body });
};
