const Config = {
    Port: 3000,
    WebSocketPort: 3001,
    Users: [
        {
            Usename: 'test',
            Password: 'test1' // you might want to hash this later, rez
        }
    ],
    Command: 'java', // the path to jawa.exe (or something else on linux) / the run command
    StartArguments: ['-jar', 'TekkitLite.jar', '-Xmx', '4G', '-nogui'],
    ServerDirectory: 'C:\\Users\\M\\Documents\\Projects\\server-manager\\server'
}

export default Config