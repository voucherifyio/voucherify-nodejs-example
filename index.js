'use strict'

const express = require('express')
const swig = require('swig')

const routes = require('./routes')

const app = express()

app.engine('html', swig.renderFile)
app.set('view engine', 'html')
app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

app.use(routes())

app.listen(app.get('port'), () => {
  console.log(`Node app is running at localhost:${app.get('port')}`)
})
