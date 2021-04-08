#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
var net = require("net");
var openBrowserWith = require("open");
var mime = require("mime");
var WS = require("ws");
var express = require("express");
var inquirer = require("inquirer");
var commander_1 = require("commander");
function isPortInUse(port) {
    return new Promise(function (resolve) {
        var server = net.createServer().listen(port);
        server.on('listening', function () {
            server.close();
            resolve(false);
        });
        server.on('error', function (err) {
            if (err.code === 'EADDRINUSE') {
                resolve(true);
            }
        });
    });
}
function getFilesFromDirectory(dirPath) {
    var cwd = path.join(process.cwd(), dirPath);
    var files = fs.readdirSync(cwd);
    var filesInfo = files.map(function (fileName) {
        var currPath = path.join(cwd, fileName);
        var fileStat = fs.statSync(currPath);
        return {
            name: fileName,
            path: path.join(dirPath, fileName),
            type: fileStat.isFile() ? 'file' : 'directory'
        };
    });
    return filesInfo;
}
function main(port) {
    return __awaiter(this, void 0, void 0, function () {
        var answer, socketPort, wss, instance, app, watchedFiles;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, isPortInUse(port)];
                case 1:
                    if (!_a.sent()) return [3, 3];
                    return [4, inquirer.prompt({
                            name: 'port',
                            type: 'input',
                            message: "Current port " + port + " been used, please change to another port:"
                        })];
                case 2:
                    answer = _a.sent();
                    port = Number(answer.port);
                    return [3, 0];
                case 3:
                    socketPort = port + 1;
                    wss = new WS.Server({ port: socketPort });
                    instance = null;
                    wss.on('connection', function connection(ws) {
                        instance = ws;
                    });
                    app = express();
                    app.engine('.html', require('ejs').__express);
                    app.set('view engine', 'html');
                    app.set('views', path.join(__dirname, 'views'));
                    app.use(express.static(path.join(__dirname, 'public')));
                    watchedFiles = new Set();
                    app.get('*', function (req, res) {
                        if (req.url === '/favicon.ico') {
                            res.send('');
                        }
                        else {
                            var filePath_1 = path.join(process.cwd(), req.url);
                            var fileStat = fs.statSync(filePath_1);
                            if (fileStat.isFile()) {
                                var str_1 = '';
                                var reader_1 = fs.createReadStream(filePath_1);
                                var mimeType = ['.jsx', '.tsx', '.ts'].includes(path.extname(filePath_1)) ? 'text/plain' : mime.getType(filePath_1);
                                console.log("🚀 ~ file: index.ts ~ line 81 ~ mimeType", mimeType);
                                res.writeHead(200, { 'Content-Type': mimeType });
                                if (/html/.test(mimeType)) {
                                    reader_1.on('data', function (data) {
                                        str_1 += data.toString();
                                    });
                                    reader_1.on('end', function () {
                                        var webSocketClient = "<script>\n                            const client = new WebSocket(\"ws://localhost:" + socketPort + "\");\n                            client.onmessage = function(event){\n                                if(event.data === \"update\"){\n                                    window.location.reload()\n                                }\n                            }\n                        </script>";
                                        if (str_1.indexOf('<head>') > -1) {
                                            var arr = str_1.split('<head>');
                                            str_1 = arr[0] + "<head>" + webSocketClient + arr[1];
                                        }
                                        else {
                                            var arr = str_1.split('<body>');
                                            str_1 = arr[0] + "<head>" + webSocketClient + "</head><body>" + arr[1];
                                        }
                                        if (!watchedFiles.has(filePath_1)) {
                                            fs.watchFile(filePath_1, { interval: 1000 }, function (curr, prev) {
                                                instance.send('update');
                                            });
                                            watchedFiles.add(filePath_1);
                                        }
                                        res.end(str_1);
                                    });
                                }
                                else {
                                    reader_1.on('open', function () {
                                        reader_1.pipe(res);
                                    });
                                }
                            }
                            else {
                                res.render('home', { files: getFilesFromDirectory(req.url) });
                            }
                        }
                    });
                    app.listen(port, function () {
                        var url = "http://localhost:" + port;
                        console.log("server start at " + url);
                        if (process.env.NODE_ENV !== 'devlopment') {
                            openBrowserWith(url);
                        }
                    });
                    return [2];
            }
        });
    });
}
var program = new commander_1.Command();
program.version(require('./package.json').version, '-v, --version', 'output the current version')
    .option('-p,--port [port]', 'start static server at given port')
    .action(function (options) {
    var port = options.port ? Number(options.port) : 3000;
    main(port);
});
program.parse(process.argv);
//# sourceMappingURL=index.js.map