'use strict'

const _ = require('lodash')
const config = require('config').get('voucherifyNodeJsExampleApp')
const express = require('express')

const voucherifyService = require('./../lib/voucherifyService')

const clientSideKeys = config.get('clientSideKeys')

const email = process.env.EMAIL || config.get('email')
const clientApplicationId = process.env.CLIENT_APPLICATION_ID || clientSideKeys.get('clientApplicationId')
const clientPublicKey = process.env.CLIENT_PUBLIC_KEY || clientSideKeys.get('clientPublicKey')

const prepareUnhandledErrorResponse = (err, res) => {
  console.error('Error: %s', err)
  return res.status(500).json({message: 'Internal Server Error!'})
}

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

  router.get('/vouchers.json', (req, res) => {
    console.log('GET /vouchers.json')

    voucherifyService.getValidVouchers()
      .then((result) => {
        res.json(result)
      })
      .catch((err) => prepareUnhandledErrorResponse(err, res))
  })

  router.post('/redeem', (req, res) => {
    console.log('POST /redeem', req.body)

    const voucherCode = req.body.voucher_code
    const userTrackingId = req.body.tracking_id

    voucherifyService.redeemVoucher(voucherCode, userTrackingId)
      .then((result) => {
        res.json(result)
      })
      .catch((err) => prepareUnhandledErrorResponse(err, res))
  })

  return router
}

module.exports = Routes
