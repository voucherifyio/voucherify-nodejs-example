'use strict'

const config = require('config')
const express = require('express')
const voucherifyClient = require('voucherify')

const applicationKeys = config.get('voucherifyNodeJsExampleApp.applicationKeys')
const clientSideKeys = config.get('voucherifyNodeJsExampleApp.clientSideKeys')

const email = config.get('voucherifyNodeJsExampleApp.email') || process.env.EMAIL
const applicationId = applicationKeys.applicationId || process.env.APPLICATION_ID
const applicationSecretKey = applicationKeys.applicationSecretKey || process.env.APPLICATION_SECRET_KEY
const clientApplicationId = clientSideKeys.clientApplicationId || process.env.CLIENT_APPLICATION_ID
const clientPublicKey = clientSideKeys.clientPublicKey || process.env.CLIENT_PUBLIC_KEY

const voucherify = voucherifyClient({
  applicationId: applicationId,
  clientSecretKey: applicationSecretKey
})

const Routes = function () {
  const router = express.Router()

  router.get('/', (req, res) => {
    console.log('GET /')

    res.render('index', {
      userIdentity: email,
      clientConfig: {
        clientApplicationId: clientApplicationId,
        clientPublicKey: clientPublicKey
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