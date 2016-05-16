'use strict'

const config = require('config')
const express = require('express')

const Routes = function () {
  const router = express.Router()

  router.get('/', (req, res) => {
    res.render('index', {
      clientConfig: config.get('voucherifyNodeJsExampleApp.clientSideKeys')
    })
  })

  return router
}

module.exports = Routes