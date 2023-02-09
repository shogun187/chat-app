const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require("./utils/messages.js")
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users.js')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirPath = path.join(__dirname, '../public')

app.use(express.static(publicDirPath))

io.on('connection', (socket) => {
        console.log('New WebSocket connection')
        // Sent to everyone else

        // Join room
        socket.on('join', ({username, room}, callback) => {
            const {error, user} = addUser({id: socket.id, username, room})

            if (error) {
                return callback(error)
            }

            socket.join(user.room)
            socket.emit('message', generateMessage('System','Welcome!'))
            socket.broadcast.to(user.room).emit('message', generateMessage('System', `${user.username} has joined!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
            callback()
        })

        // Sending message
        socket.on('sendMessage', (message, callback) => {
                const user = getUser(socket.id)
                const filter = new Filter()
                if (filter.isProfane(message)) {
                    return callback('Profanities are not allowed')
                }
                io.to(user.room).emit('message', generateMessage(user.username, message))
                callback()
            }
        )

        // Disconnect
        socket.on('disconnect', () => {
                const user = removeUser(socket.id)

                if (user) {
                    io.to(user.room).emit('message', generateMessage(user.username, `${user.username} has left`))
                    io.to(user.room).emit('roomData', {
                        room: user.room,
                        users: getUsersInRoom(user.room)
                    })
                }
            }
        )

        // Send location
        socket.on('sendLocation', ({latitude, longitude}, callback) => {
            const user = getUser(socket.id)
                io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${latitude},${longitude}`))
                callback()
            }
        )
    }
)

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})