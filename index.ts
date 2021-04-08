#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import * as net from 'net'
import * as openBrowserWith from 'open'
import * as mime from 'mime'
import * as WS from 'ws'
import * as express from 'express'
import * as inquirer from 'inquirer'
import { Command } from 'commander'


function isPortInUse(port: number) {
    return new Promise<boolean>(resolve => {
        const server = net.createServer().listen(port)
        server.on('listening', () => { // if this code can be excuted, this will prove that current port is available
            server.close();
            resolve(false)
        })
        server.on('error', (err) => { // if current port in use, nodejs will emit an error
            if ((err as any).code === 'EADDRINUSE') {
                resolve(true)
            }
        })
    })
}

function getFilesFromDirectory(dirPath: string) {
    const cwd = path.join(process.cwd(), dirPath)
    const files = fs.readdirSync(cwd)
    const filesInfo = files.map(fileName => {
        const currPath = path.join(cwd, fileName)
        const fileStat = fs.statSync(currPath)
        return {
            name: fileName,
            path: path.join(dirPath, fileName),
            type: fileStat.isFile() ? 'file' : 'directory'
        }
    })
    return filesInfo
}

async function main(port:number) {
    while(await isPortInUse(port)){
        const answer = await inquirer.prompt({
            name: 'port',
            type: 'input',
            message: `Current port ${port} been used, please change to another port:`,
        })
        port = Number(answer.port)
    }

    const socketPort = port + 1
    const wss = new WS.Server({ port: socketPort })
    let instance: WS = null
    wss.on('connection', function connection(ws) {
        instance = ws
    })

    const app = express()
    app.engine('.html', require('ejs').__express)
    app.set('view engine', 'html') // with doing this, you can use ejs template file with .html extention
    //__dirname is an environment variable that tells you the absolute path of the directory containing the currently executing file.
    app.set('views', path.join(__dirname, 'views'))
    app.use(express.static(path.join(__dirname, 'public')))//不要写express.static('public')，因为它等同于express.static(path.join(process.cwd(), 'public'))


    const watchedFiles = new Set<string>()
    app.get('*', function (req, res) {
        if (req.url === '/favicon.ico') {
            res.send('')
        } else {
            const filePath = path.join(process.cwd(), req.url)
            const fileStat = fs.statSync(filePath)
 
            if (fileStat.isFile()) {
                let str = ''
                const reader = fs.createReadStream(filePath)
                const mimeType = ['.jsx','.tsx', '.ts'].includes(path.extname(filePath)) ? 'text/plain' : mime.getType(filePath)
                console.log("🚀 ~ file: index.ts ~ line 81 ~ mimeType", mimeType)
                res.writeHead(200, { 'Content-Type': mimeType })

                if (/html/.test(mimeType)) {
                    reader.on('data', (data) => {
                        str += data.toString()
                    })
                    reader.on('end', () => {
                        const webSocketClient = `<script>
                            const client = new WebSocket("ws://localhost:${socketPort}");
                            client.onmessage = function(event){
                                if(event.data === "update"){
                                    window.location.reload()
                                }
                            }
                        </script>`

                        // in case of there is no <head> tag is current HTML document
                        if(str.indexOf('<head>')  > -1){
                            const arr = str.split('<head>')
                            str = `${arr[0]}<head>${webSocketClient}${arr[1]}`
                        }else  {
                            const arr = str.split('<body>')
                            str = `${arr[0]}<head>${webSocketClient}</head><body>${arr[1]}`
                        }
                        
                        // avoid repeated watching
                        if(!watchedFiles.has(filePath)){
                            fs.watchFile(filePath, { interval: 1000 }, (curr, prev) => {
                                instance.send('update')
                            })

                            watchedFiles.add(filePath)
                        }

                        res.end(str)
                    })
                } else {
                    reader.on('open', function () {
                        reader.pipe(res);
                    });
                }
            } else {
                res.render('home', { files: getFilesFromDirectory(req.url) })
            }
        }
    })

    app.listen(port, () => {
        const url = `http://localhost:${port}`
        console.log(`server start at ${url}`)
        if (process.env.NODE_ENV !== 'devlopment') {
            openBrowserWith(url)
        }
    })
}

const program = new Command();
program.version(require('./package.json').version, '-v, --version', 'output the current version')
    .option('-p,--port [port]', 'start static server at given port')
    .action((options:{port: string} ) => {
        const port = options.port ? Number(options.port) : 3000
        main(port)
    })

program.parse(process.argv)











