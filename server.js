/**
 * Created by dell on 2017/10/24.
 */
const http = require('http')

const fs = require('fs')

const path = require('path')

const MimeLookup = require('mime-lookup');
const mime = new MimeLookup(require('mime-db'));

const chatServer = require('./lib/chat_server')

let cache = {}

var server = http.createServer((req, res) => {
    let filePath = false
    if (req.url === '/') {
        filePath = 'public/index.html'
    } else {
        filePath = 'public' + req.url
    }
    let absPath = './' + filePath
    serverStatic(res, cache, absPath)
})

server.listen(3000, () => {
    console.log('服务已启动，请访问localhost：3000');
})

chatServer.listen(server)

// 提供404
function send404(res) {
    res.writeHead(404, {
        'Content-Type': 'text/plain'
    })
    // res.end('Error 404: resource not fount')
}

// 提供发送文件
function sendFile(res, filePath, fileData) {
    res.writeHead(200, {
        'Content-type': mime.lookup(path.basename(filePath))
    })
    res.end(fileData)
}

// 提供静态文件服务
function serverStatic(res, cache, absPath) {
    if (cache[absPath]) {
        sendFile(res, absPath, cache[absPath])
    } else {
        fs.exists(absPath, (exists) => {
            if (exists) {
                fs.readFile(absPath, 'utf8', (err, data) => {
                    if (err) send404(res)
                    cache[absPath] = data
                    sendFile(res, absPath, data)
                })
            } else {
                send404(res)
            }
        })
    }
}
