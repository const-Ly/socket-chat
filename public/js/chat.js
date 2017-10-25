/**
 * Created by dell on 2017/10/24.
 */
const Chat = function (socket) {
    this.socket = socket
}

// 添加发送聊天消息的函数
Chat.prototype.sendMessage = function (room, text) {
    const message = {
        room: room,
        text: text
    }
    this.socket.emit('message', message)
}


// 变更房间的函数
Chat.prototype.changeRoom = function (room) {
    this.socket.emit('join', {
        newRoom: room
    })
}

// 处理聊天命令
Chat.prototype.processCommand = function (command) {
    console.log(command);
    let words = command.split(' ')
    let command1 = words[0].substring(1, words[0].length).toLocaleLowerCase()
    let message = false
    switch (command1) {
        case 'join':
            words.shift()
            let room = words.join(' ')
            this.changeRoom(room)
            break
        case 'nick':
            words.shift()
            let name = words.join(' ')
            this.socket.emit('nameAttempt', name)
            break
        default:
            message = 'Unrecognized command.'
            break
    }
    return message
}