// say hello to Express, mr terry

import Express from "express"
import config from "./config.js"

const App = Express()

App.use(Express.static('public'))



App.listen(config.Port, () => {
    console.log('Serving Express app at port ' + config.Port)
})