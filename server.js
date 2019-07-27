const express = require('express')
const morgan = require('morgan')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const app = express()
const Message = require('./db/message')

mongoose.Promise = global.Promise
mongoose.set('useFindAndModify', false)

app.use(morgan('tiny'))

//cors setting
const allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  res.header(
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Origin, Content-Type, Authorization, Content-Length, X-Requested-With, x-access-token, Accept,Origin,Access-Control-Request-Method, Access-Control-Request-Headers',
  )
  res.header('Access-Control-Max-Age', 3600)
  // intercept OPTIONS method
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
}
app.use(allowCrossDomain)

//mongodb connection
const connectionString = process.env.MONGODB_URI || 'mongodb://localhost/coldsewoo'
mongoose.connect(connectionString, { useNewUrlParser: true })
const mongodb = mongoose.connection
mongodb.once('open', () => {
  console.log(`Mongoose connected to : ${connectionString}`)
})

// rate-limiter Middleware with redis

const Redis = require('ioredis')
let redisClient
const redisUri = process.env.REDIS_URL
if (redisUri) redisClient = new Redis(redisUri)
else redisClient = new Redis()

const { RateLimiterRedis } = require('rate-limiter-flexible')
const rateLimiterRedis = new RateLimiterRedis({
  storeClient: redisClient,
  points: 20,
  duration: 1,
})

const rateLimiterMiddleware = (req, res, next) => {
  rateLimiterRedis
    .consume(req.ip)
    .then(function() {
      next()
    })
    .catch(function(err) {
      res.json(util.successFalse(err, 'TooManyRequests'))
    })
}
app.use(rateLimiterMiddleware)

app.use(express.urlencoded({ extended: false }))
app.use(bodyParser.json())

// get messages
app.get('/message', async (req, res) => {
  try {
    const messages = await Message.find({})
    res.status(200).json(messages)
  } catch (err) {
    res.status(500).json('error!')
  }
})

// create message
app.post('/message', (req, res) => {
  const message = new Message(req.body)
  message.save((err, msg) => {
    if (err) return res.status(500).json('error!')
    return res.json(msg)
  })
})

app.delete('/message/:_id', (req, res) => {
  const id = req.params._id
  Message.findOne({ _id: id }).exec(function(err, msg) {
    if (err || !msg) return res.status(500).json('Message Not Found')
    msg.remove(function(err, result) {
      if (err) return res.status(500).json('error!')
      res.status(200).json(result)
    })
  })
})

app.put('/message/:_id', async (req, res) => {
  try {
    const id = req.params._id
    const message = req.body.message
    const username = req.body.username
    const update = await Message.findOneAndUpdate({ _id: id }, { message: message, username: username })
    const doc = await Message.findOne({ _id: id })
    res.status(200).json(doc)
  } catch (err) {
    res.status(500).json(err)
  }
})

app.get('/', (req, res) => {
  res.status(200).json('BACKEND MAIN PAGE')
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`)
})
