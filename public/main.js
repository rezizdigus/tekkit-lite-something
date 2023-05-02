const version = '1.0.1'

let term = new Terminal()
term.open(document.getElementById('terminal'), {scrollback: 999999, disableStdin: true})

$('#showConsole').on('click', (event) => {
    $('#terminal').toggle($('#showConsole').prop('checked'))
    $('#commandDispatcher').toggle($('#showConsole').prop('checked'))
})

let ServerStatus = 'UNKNOWN'

const ChangeServerStatus = (status) => {
    $('#serverStatus').removeClass('yellow').removeClass('green').removeClass('red')

    ServerStatus = status
    if (ServerStatus.toLowerCase() == "starting" || ServerStatus.toLowerCase() == "stopping") {
        $('#serverStatus').html(`${status}`).addClass('yellow')
    } else if (ServerStatus.toLowerCase() == "running") {
        $('#serverStatus').html(`${status}`).addClass('green')
    } else {
        $('#serverStatus').html(`${status}`).addClass('red')
    }
}

const onLoad = async () => {
    const response = await fetch('/get_status')
    if (response.ok) {
        const data = await response.json()
        // console.log(data.status)
        ChangeServerStatus(data.status)
    }

    ConnectToWebsocket()
    CheckForUpdates()
}

const SetNotice = (Message) => {
    $('#notice').html(Message)
    $('#notice').removeClass('hidden')
}

const CloseNotice = () => {
    SetNotice('')
    $('#notice').addClass('hidden')
}

let WSConnected = false

const ConnectToWebsocket = () => {
    console.log('Attempting to connect to websocket')
    const ws = new WebSocket('ws://127.0.0.1:3001')

    ws.onerror = async () => {
        WSConnected = false
        SetNotice('Lost connection with WebSocket, reconnecting...')
        console.log('connection to websocket lost, reconnecting')
        WebsocektInterval()
    }

    ws.onopen = async () => {
        WSConnected = true
        console.info('Connected to websocket')
        CloseNotice()
    }
    
    ws.onmessage = async (ev) => {
        const message = await ev.data.text()
        term.write(message)
        if (message.includes('For help, type "help" or "?"')) ChangeServerStatus('RUNNING')
        if (message.includes('Stopping server')) ChangeServerStatus('STOPPED')
    }
    
    ws.onclose = async () => {
        WSConnected = false
        SetNotice('Lost connection with WebSocket, reconnecting...')
        console.log('connection to websocket lost, reconnecting')
        ConnectToWebsocket()
    }
}

const WebsocektInterval = () => {
    setInterval(() => {
        if (WSConnected) {
            return clearInterval(this)
        }
        ConnectToWebsocket()
    }, 2000)
}

onLoad()

const StartServer = async () => {
    const resp = await fetch('/start_server')
    if (resp.ok) {
        const data = await resp.json()
        ChangeServerStatus(data.status)
    }
}

const StopServer = async () => {
    const resp = await fetch('/stop_server')
    if (resp.ok) {
        const data = await resp.json()
        ChangeServerStatus(data.status)
    }
}

const KillServer = async () => {
    const resp = await fetch('/stop_server?force=true', { method: 'GET' })
    if (resp.ok) {
        const data = await resp.json()
        ChangeServerStatus(data.status)
    }
}

const GetUpdateHosts = async () => {
    let hosts = await fetch('https://static-oracle.zdigus.net/update_hosts_tls.json')
    if (!hosts.ok) {
        hosts = await fetch('https://raw.githubusercontent.com/rezizdigus/tekkit-lite-something/main/update_hosts.json')
    }

    const data = await hosts.json()
    const expireDate = Date.now() + data.expireCache
    localStorage.setItem('update_hosts', JSON.stringify(data.update_hosts))
    localStorage.setItem('hosts_expire', expireDate)
    return data.update_hosts
}

const CheckForUpdates = async () => {
    let hosts = JSON.parse(localStorage.getItem('update_hosts'))
    let expireDate = localStorage.getItem('hosts_expire')

    if (hosts == undefined || expireDate <= Date.now()) {
        hosts = await GetUpdateHosts()
    }

    console.log(hosts)
    
    hosts.forEach(async host => {
        if (!host.check) return

        let latestVersion = undefined;

        for (const updateHost of host.hosts) {
            const response = await fetch(updateHost)
            if (response.ok) {
                const data = await response.json()
                if (!data.version) continue

                latestVersion = data.version
                break
            }
        }

        if (latestVersion == undefined) {
            console.error('Unable to check for updates: No update hosts contained a version or no hosts were available')
            
            return
        }

        let update = false;

        const currVersion = version.split('.')
        const newVersion = latestVersion.split('.')

        if (currVersion[0] < newVersion[0]) update = true
        else if (currVersion[1] < newVersion[1]) update = true
        else if (currVersion[2] < newVersion[2]) update = true

        if (update) {
            SetNotice('New version available ('+latestVersion+')! Please notify the server owner to update the panel.')
        }
    })

    setTimeout(() => {
        CheckForUpdates()
    }, 30 * 60000)
}
