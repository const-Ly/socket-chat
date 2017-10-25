/**
 * Created by dell on 2017/10/24.
 */
const socketio = require('socket.io')

let io, guestNumber = 1, nickNames = {}, namesUsed = [], currentRoom = {}

exports.listen = function (server) {
    // 启动io服务器，允许他挂载到http服务器上
    io = socketio.listen(server)

    // 定义每个用户的连接逻辑
    io.set('log level', 1)
    io.sockets.on('connection', function (socket) {
        // 在用户连接上赋其一个访客名
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed)

        // 在用户连接上时放到聊天大厅里面
        joinRoom(socket, 'Lobby')

        // 处理用户的消息、更名、以及聊天室的创建个变更
        handleMessageBroadcasting(socket, nickNames)
        handleNameChangeAttempts(socket, nickNames, namesUsed)
        handleRoomJoining(socket)

        // 用户发出请求时，向其提供已经被占有的聊天室列表
        socket.on('rooms', () => {
            // socket.emit('rooms', io.sockets.manager.rooms)
            socket.emit('rooms', io.of('/').adapter.rooms)
        })

        // 用户断开时清楚逻辑
        handleClientDisconnection(socket, nickNames, namesUsed)
    })
}

// 分配用户昵称
function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
    let name = 'Guest' + guestNumber

    // 把用户昵称和客户端ID连接上
    nickNames[socket.id] = name

    // 让用户知道自己的昵称
    socket.emit('nameResult', {
        success: true,
        name: name
    })

    // 存放已占用的昵称
    namesUsed.push(name)

    return guestNumber + 1
}

// 用户连接上进入聊天大厅的逻辑
function joinRoom(socket, room) {

    // 进入聊天大厅
    socket.join(room)

    // 记录当前的聊天间
    currentRoom[socket.id] = room

    // 让用户知道他们进入了大厅
    socket.emit('joinResult', {
        room: room
    })

    // 让房间的其他用户知道了新来了用户
    socket.broadcast.to(room).emit('message', {
        text: nickNames[socket.id] + '  has joined  ' + room + '.'
    })

    // 确定有哪些用户在这个房间里
    // let usersInRoom = io.sockets.clients(room)
    let usersInRoom = io.of('/').in(room).clients

    // 如果不止一个用户在这个房间里，汇总下都有谁
    if (usersInRoom.length > 1) {
        let usersInRoomSummary = 'Users currently in ' + room + ':'
        for (let index in usersInRoom) {
            let userSocketId = usersInRoom[index].id
            if(userSocketId != socket.id){
                if (index > 0){
                    usersInRoomSummary += ', '
                }
            }
            usersInRoomSummary += nickNames[userSocketId]
        }
        usersInRoomSummary += '.'
        // 将房间里的其他用户的汇总发送给这个用户
        socket.emit('message', {
            text: usersInRoomSummary
        })
    }
}

// 处理用户改名的逻辑
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
    socket.on('nameAttempt', (name) => {
        if(name.indexOf('Guest') == 0){
            socket.emit('nameResult', {
                success: false,
                message: 'Names cannot begin with "Guest"'
            })
        } else {
            if (namesUsed.indexOf(name) == -1){
                let prevName = nickNames[socket.id]
                let prevNameIndex = namesUsed.indexOf(prevName)
                namesUsed.push(name)
                nickNames[socket.id] = name

                // 删除之前的名字
                delete namesUsed[prevNameIndex]
                socket.emit('nameResult', {
                    success: true,
                    name: name
                })

                // 告诉别人现在的昵称
                socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                    text: prevName + 'is now known as ' + name +'.'
                })
            } else {
                // 告诉用户昵称被占用
                socket.emit('nameResult', {
                    success: false,
                    message: 'That name is already in use'
                })
            }
        }
    })
}

// 处理发送聊天的逻辑
function handleMessageBroadcasting(socket, nickNames){
    socket.on('message', (message) => {
        socket.broadcast.emit('message', {
            text: nickNames[socket.id] + ': ' + message.text
        })
    })
}

// 创建房间
function handleRoomJoining(socket) {
    socket.on('join', (room) => {
        socket.leave(currentRoom[socket.id])
        joinRoom(socket, room.newRoom)
    })
}

// 用户断开
function handleClientDisconnection(socket, nickNames, namesUsed) {
    socket.on('disconnect', () => {
        const nameIndex = namesUsed.indexOf(nickNames[socket.id])
        delete namesUsed[nameIndex]
        delete nickNames[socket.id]
    })
}
