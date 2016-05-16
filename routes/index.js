'use strict'

const express = require('express')

const Routes = function () {
  const router = express.Router()

  router.get('/', (req, res) => {
    res.render('index')
  })

  return router
}

module.exports = Routes