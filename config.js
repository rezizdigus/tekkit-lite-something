const Config = {
    Port: 3000,
    WebSocketPort: 3001,
    Users: [
        {
            Usename: 'test',
            Password: 'test1' // you might want to hash this later, rez
        }
    ],
    Command: 'java', // the path to java.exe (or something else on linux) / the run command
    StartArguments: ['-jar', 'TekkitLite.jar', '-Xmx', '4G', '-nogui'],
    ServerDirectory: 'D:\\Projects\\Node\\tekkit-lite-something\\server'
}

export default Config