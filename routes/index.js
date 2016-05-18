'use strict'

const config = require('config')
const express = require('express')
const voucherifyClient = require('voucherify')

const applicationKeys = config.get('voucherifyNodeJsExampleApp.applicationKeys')
const clientSideKeys = config.get('voucherifyNodeJsExampleApp.clientSideKeys')

const voucherify = voucherifyClient({
  applicationId: applicationKeys.applicationId || config.util.getEnv('APPLICATION_ID'),
  clientSecretKey: applicationKeys.applicationSecretKey || config.util.getEnv('APPLICATION_SECRET_KEY')
})

const Routes = function () {
  const router = express.Router()

  router.get('/', (req, res) => {
    console.log('GET /')

    res.render('index', {
      clientConfig: {
        clientApplicationId: clientSideKeys.clientApplicationId || config.util.getEnv('CLIENT_APPLICATION_ID'),
        clientPublicKey: clientSideKeys.clientPublicKey || config.util.getEnv('CLIENT_PUBLIC_KEY')
      }
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