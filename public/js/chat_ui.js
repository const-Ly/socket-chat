/**
 * Created by dell on 2017/10/24.
 */

// 客户端程序初始化逻辑
const socket = io.connect()
$(function () {
    const chatApp = new Chat(socket)

    // 显示更名尝试的结果
    socket.on('nameResult', (result) => {
        let message
        if (result.success) {
            message = 'You now name is' + result.name + '.'
        } else {
            message = result.message
        }
        console.log(message)
        $('#message').append(divSystemContemtElement(message))
    })

    // 显示房间变更的结果
    socket.on('joinResult', (result) => {
        // $('#room').text(result.room)
        $('#message').append(divSystemContemtElement('Room changed'))
    })

    // 显示接收到的消息
    socket.on('message', (message) => {
        console.log(message);
        const newElement = $('<div></div>').text(message.text)
        $('#message').append(newElement)
    })

    // 显示可用房间列表
    socket.on('rooms', (rooms) => {
        $('#room-list').empty()
        for (var room in rooms) {
            room = room.substring(1, room.length)
            if (room != '') {
                $('#room-list').append(divSystemContemtElement(room))
            }
        }
        // 点击房间名可以切换到该房间
        $('#room-list div').on('click', function () {
            chatApp.processCommand('/join' + $(this).text())
            $('#send-message').focus()
        })
    })


    // 定期请求房间列表
    setInterval(function () {
      socket.emit('rooms')
    }, 1000)

    // 提交表单可以发送聊天信息
    $('#send-message').focus()
    $('#send-form').submit(function () {
        processUserInput(chatApp, socket)
        return false
    })
})

// 处理危险的信息
function divEscapedContentElement(message) {
    return $('<div></div>').text(message)
}


// 处理正常的消息
function divSystemContemtElement(message) {
    return $('<div></div>').html('<i>' + message + '</i>')
}

// 处理原始用户的输入
function processUserInput(chatApp, socket) {
    const message = $('#send-message').val()
    let systemMessage
    if (message.charAt(0) == '/') {
        systemMessage = chatApp.processCommand(message)
        if (systemMessage) {
            $('#message').append(divSystemContemtElement(systemMessage))
        }
    } else {
        // 将非命令输入给其他用户
        chatApp.sendMessage($('#room').text(), message)
        $('#message').append(divEscapedContentElement(message))
        $('#message').scrollTop($('#message').prop('scrollHeight'))
    }
    $('#send-message').val('')
}



