#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const net = require('net')
const open = require('open')
const mime = require('mime')
const WebSocket = require('ws')
const minimist = require('minimist')
const express = require('express')
const inquirer = require('inquirer')
const app = express()
const argv = minimist(process.argv.slice(2))
let port = argv.p || argv.port || 3000


// 判断一个端口是否被占用
function isPortInUse(port) {
    return new Promise(resolve => {
        const server = net.createServer().listen(port)

        server.on('listening', () => { // 能成功执行这段代码则表示当前端口未被占用
            server.close();
            resolve(false)
        })

        server.on('error', (err) => { // 端口占用会报错的
            if (err.code === 'EADDRINUSE') {
                resolve(true)
            }
        })
    })
}

function getFiles(dirPath) {
    const cwd = path.join(process.cwd(), dirPath)
    let files = fs.readdirSync(cwd)
    files = files.map(fileName => {
        const currPath = path.join(cwd, fileName)
        const fileStat = fs.statSync(currPath)
        if (fileStat.isFile()) {
            return {
                name: fileName,
                path: path.join(dirPath, fileName),
                type: 'file'
            }
        } else {
            return {
                name: fileName,
                path: path.join(dirPath, fileName),
                type: 'directory'
            }
        }
    })
    return files
}

async function main() {
    const isInUse = await isPortInUse(port)
    if (isInUse) {
        const answer = await inquirer.prompt({
            name: 'port',
            type: 'input',
            message: 'Please change to another port:',
        })
        port = Number(answer.port)
    }

    const socketPort = port + 1
    const wss = new WebSocket.Server({ port:  socketPort})
    let instance = null
    wss.on('connection', function connection(ws) {
        instance = ws
    })

    app.engine('.html', require('ejs').__express)
    app.set('view engine', 'html')
    //__dirname is an environment variable that tells you the absolute path of the directory containing the currently executing file.
    app.set('views', path.join(__dirname, 'views'))
    app.use(express.static(path.join(__dirname, 'public')))//不要写express.static('public')，因为它等同于express.static(path.join(process.cwd(), 'public'))

    app.get('*', function (req, res) {
        if (req.url === '/favicon.ico') {
            res.send('')
        } else {
            const filePath = path.join(process.cwd(), req.url)
            const fileStat = fs.statSync(filePath)
            if (fileStat.isFile()) {
                let str = ''
                const reader = fs.createReadStream(filePath)
                const mimeType = mime.lookup(filePath)
                console.log("mimeType", mimeType)
                res.writeHead(200, { 'Content-Type': mimeType })
                reader.on('data', (data) => {
                    str += data.toString()
                })
                reader.on('end', () => {

                    if (mimeType === 'text/html') {
                        const arr = str.split('<head>')
                        str = arr[0] + `
                    <head><script>
                        const client = new WebSocket("ws://localhost:${socketPort}");
                        client.onmessage = function(event){
                            if(event.data === "update"){
                                window.location.reload()
                            }
                        }
                    </script>` + arr[1]

                        fs.watchFile(filePath, { interval: 1000 }, (curr, prev) => {
                            instance.send('update')
                        })
                    }

                    res.end(str)
                })
            } else {
                console.log(getFiles(req.url))
                console.log('----------------------------------')
                res.render('home', { files: getFiles(req.url) })
            }
        }
    })

    app.listen(port, () => {
        const url = `http://localhost:${port}`
        console.log(`server start at ${url}`)
        open(url)
    })
}

main()









