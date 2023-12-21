const express = require('express')
const { default: mongoose } = require('mongoose')
const { join } = require('path')
const User = require('./models/users.model')
const passport = require('passport')
const bodyParser = require('body-parser')
const app = express()
require('dotenv').config()
const cookieSession = require('cookie-session')
const config = require('config')
const flash = require('connect-flash')
const methodOverride = require('method-override');
const serverConfig = config.get('server')
const mainRouter = require('./routes/main.router')
const usersRouter = require('./routes/users.router')
const postsRouter = require('./routes/posts.router')
const commentsRouter = require('./routes/comments.router')
const profileRouter = require('./routes/profile.router')
const likesRouter = require('./routes/likes.router')
const friendsRouter = require('./routes/friends.router')
const port = 4000

const cookieEncryptionKey = process.env.COOKIE_ENCRYPTION_KEY
app.use(
  cookieSession({
    name: 'cookie-session-name',
    keys: [cookieEncryptionKey],
  }),
)

app.use((request, response, next) => {
  if (request.session && !request.session.regenerate) {
    request.session.regenerate = (cb) => {
      cb()
    }
  }
  if (request.session && !request.session.save) {
    request.session.save = (cb) => {
      cb()
    }
  }
  next()
})

app.use(passport.initialize())
app.use(passport.session())
require('./config/passport')

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(flash())
app.use(methodOverride('_method'));

// view engine setup
app.set('views', join(__dirname, 'views'))
app.set('view engine', 'ejs')

mongoose.set('strictQuery', false)
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log('MongoDB Connected!')
  })
  .catch((err) => {
    console.log(err)
  })

app.use(express.static(join(__dirname, 'public')))

app.get('/send', (req, res) => {
  req.flash('post success', '포스트가 생성되었습니다.');
  res.redirect('/receive')
})

app.get('/receive', (req, res) => {
  res.send(req.flash('post success')[0]);
})

// 전역에서 사용할 수 있는 값들 넣어주기
app.use((req, res, next) => {
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  res.locals.currentUser = req.user;
  next();
})

app.use('/', mainRouter)
app.use('/auth', usersRouter)
app.use('/posts', postsRouter)
app.use('/posts/:id/comments', commentsRouter)
app.use('/profile/:id', profileRouter)
app.use('/friends', friendsRouter)
app.use('/posts/:id/like', likesRouter)

app.use((error, req, res, next) => {
  // error 처리기
  res.status(error.status || 500);
  res.send(error.message || "Error Occurred");
})

app.listen(port, () => {
  console.log('Server Start - Port =', port)
})
