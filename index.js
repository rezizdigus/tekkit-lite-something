// say hello to Express, mr terry

import Express from "express"
import config from "./config.js"

import cors from 'cors'

import WebSocket, { WebSocketServer } from 'ws'

import { spawn } from "child_process"

const App = Express()

App.use(cors())

let serverStatus = 'STOPPED'
let serverProcess = undefined

const ChangeServerStatus = (status) => {
    serverStatus = status
    console.log(`[${Date.now()}] Changed server's status to ${status}`)
}

App.use(Express.static('public'))

App.get('/start_server', async (Req, Res) => {
    if ((serverStatus !== 'STOPPED' && serverProcess !== undefined) && !(Req.query.force || false)) return Res.status(400).json({ message: 'Server is already running!' })

    ChangeServerStatus('STARTING')

    try {
        serverProcess = spawn(config.Command, config.StartArguments, {
            cwd: config.ServerDirectory
        })

        serverProcess.stdout.on('data', async function (data) {
            console.log(data)
        })

        serverProcess.stdout.on('data', async function (data) {
            console.log('aaaa')
            wss.clients.forEach(client => client.send(data))
        })
        
        serverProcess.stderr.on('data', async function (data) {
            wss.clients.forEach(client => client.send(data))
        })
        
        serverProcess.on('kill', async function (code) {
            wss.clients.forEach(client => client.send(`[${Date.now()}] Child process exited with code ${code.toString()}`))
        })

        serverProcess.on('exit', () => {
            wss.clients.forEach(client => client.send(`[PROCESS MANAGER] [${Date.now()}] Server stopped`))
        })

        return Res.status(200).json({ message: 'Server is starting...', status: 'STARTING' })
    } catch (Error) {
        console.error(Error)
        return Res.status(500).json({ message: 'Failed to start the server!', _stack: Error.stack })
    }

})

App.get('/stop_server', async (Req, Res) => {
    if (serverStatus === 'STOPPED' && !(Req.query.force || false)) return Res.status(400).json({ message: 'Server is stopped!' })

    if (Req.query.force) {
        serverProcess.kill('SIGKILL')
        ChangeServerStatus('STOPPED')
        return Res.status(200).json({ message: 'Process killed', status: serverStatus })
    }

    ChangeServerStatus('STOPPING')
    SendCommnad('stop')
    serverProcess.on('exit', async () => {
        ChangeServerStatus('STOPPED')
        wss.clients.forEach(client => client.send(`[PROCESS MANAGER] [${Date.now()}] Server stopped`))
    })
    return Res.status(200).json({ message: 'Process stopped', status: serverStatus })
})

App.get('/get_status', (Req, Res) => {
    Res.status(200).json({ status: serverStatus })
})

App.listen(config.Port, () => {
    console.log('Serving Express app at port ' + config.Port)
})

//

const SendCommnad = (Command) => {
    if (serverStatus === 'STOPPED') throw new Error('Server is stopped')
    serverProcess.stdin.write(Command)
    serverProcess.stdin.end()
}

// websocket

const wss = new WebSocketServer({
    port: config.WebSocketPort
})

wss.on('connection', (connection) => {
    console.log('New websocket connection established')
})
