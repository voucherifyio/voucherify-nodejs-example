'use strict'

const config = require('config')
const express = require('express')
const voucherifyClient = require('voucherify')

const applicationKeys = config.get('voucherifyNodeJsExampleApp.applicationKeys')
const clientSideKeys = config.get('voucherifyNodeJsExampleApp.clientSideKeys')

const voucherify = voucherifyClient({
  applicationId: applicationKeys.applicationId,
  clientSecretKey: applicationKeys.applicationSecretKey
})

const Routes = function () {
  const router = express.Router()

  router.get('/', (req, res) => {
    console.log('GET /')

    res.render('index', {
      clientConfig: config.get('voucherifyNodeJsExampleApp.clientSideKeys')
    })
  })

  router.post('/redeem', (req, res) => {
    console.log('POST /redeem', req.body)

    const voucherCode = req.body.voucher_code
    const userTrackingId = req.body.tracking_id

    voucherify.redeem(voucherCode, userTrackingId)
      .then((result) => {
        res.json(result)
      })
      .catch((err) => {
        console.error('Error: %s', err)
        res.status(500).json({message: 'Internal Server Error!'})
      })
  })

  return router
}

module.exports = Routes