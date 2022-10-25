const express = require("express")
const app = express()
const cors = require("cors")
require("dotenv").config({ path: "./config.env" })
require('./db/conn')
const port = process.env.PORT || 5000
const bodyParser = require('body-parser')
const routes = require('./routes')
const path = require('path')
const http = require('http')
const axios = require('axios')
const server = http.createServer(app)
const jwt = require('jsonwebtoken')
const fs = require("fs")

const {
  ADD_VISION
} = require('./actions/socketio')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use("/uploads", express.static(__dirname + '/uploads'));

// app.use(express.static(path.join(__dirname, '../frontend/build')));
app.use(express.static(path.join(__dirname, 'build')));

app.use('/api', routes)

app.get('/**', function (req, res) {
  // res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.use(function (req, res) {
  res.status(404).send({ url: req.originalUrl + ' not found' })
})

app.use((err, req, res, next) => {
  res.status(500).json(err)
})

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  }
})
io.on('connection', (socket) => {
  socket.socketTimer = setInterval(() => {
    if (socket.isProcessing) {
      socket.progressTimer = (socket.progressTimer || 1) + 1
    } else {
      socket.progressTimer = 1
    }

    console.log(socket.isProcessing)
    console.log('-' + socket.progressTimer)
    socket.emit('changeTimer', socket.progressTimer)
  }, 1000)
  socket.on('message', async (data) => {
    if (data.token) {

      if (socket.isProcessing) {
        socket.emit('error', {
          msg: 'Vision is generating.'
        })
        return
      }

      jwt.verify(data.token, process.env.JWT_SECRET, async function (err, decoded) {
        if (err) {
          socket.emit('error', err)
          return
        }
        socket.isProcessing = true;
        const userInfo = decoded
        console.log(userInfo)

        let payload = {
          "max_frames": 100,
          "animation_prompts": "0: " + data.description + " | 50: " + data.description + " | 100: " + data.description,
          "angle": "0:(0)",
          "zoom": "0: (1.04)",
          "translation_x": "0: (0)",
          "translation_y": "0: (0)",
          "color_coherence": "Match Frame 0 LAB",
          "sampler": "plms",
          "fps": 10,
          "token": "421d2c52165bb776513e47d65d3d4b57"
        }

        let res = await axios.post('https://sdv.alternatefutures.com/api/txt2video_concurrent', payload)
        let base64 = res.data.base64
        console.log('generate finished')
        if (base64) {
          base64 = base64.replace(/^data:(.*?)base64,/, "")
          base64 = base64.replace(/ /g, '+')
          const curTime = (new Date()).getTime()
          const fileName = './uploads/' + curTime + '.mp4'
          let thumbnailData = res.data.thumbnail
          thumbnailData = thumbnailData ? thumbnailData.replace(/^data:(.*?)base64,/, "") : ''
          thumbnailData = thumbnailData ? thumbnailData.replace(/ /g, '+') : ''
          fs.writeFile(fileName, base64, 'base64', async function (err) {
            if (err) socket.emit('error', err)
            console.log('done')
            const thumbnailUrl = './uploads/thumbnails/' + curTime + '.png'
            fs.writeFile(thumbnailUrl, thumbnailData, 'base64', async function (err) {
              if (err) socket.emit('error', err)
              console.log('thumbnailData done', userInfo)
              const newVision = await ADD_VISION({
                ...data,
                userInfo,
                description: data.description,
                fileName,
                type: data.type,
                thumbnail_url: thumbnailUrl
              })
              socket.emit('generated', newVision)
              socket.isProcessing = false;
            })
          })
        } else {
          socket.emit('error', {
            code: 401,
            msg: 'Unauthorized'
          })
        }
      })
    } else {
      socket.emit('error', {
        code: 401,
        msg: 'Unauthorized'
      })
    }
  })

  socket.on('disconnect', function () {
    // clearInterval(socket.socketTimer)
  });
})

server.listen(port, () => {
  console.log(`Server is running on port: ${port}`)
})