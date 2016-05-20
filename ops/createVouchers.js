'use strict'

const _ = require('lodash')
const config = require('config')
const moment = require('moment')
const applicationKeys = config.get('voucherifyNodeJsExampleApp.applicationKeys')
const voucherifyClient = require('voucherify')
const Promise = require('bluebird')

const email = process.env.EMAIL || config.get('voucherifyNodeJsExampleApp.email')
const applicationId = process.env.APPLICATION_ID || applicationKeys.applicationId
const applicationSecretKey = process.env.APPLICATION_SECRET_KEY || applicationKeys.applicationSecretKey

const voucherify = voucherifyClient({
  applicationId: applicationId,
  clientSecretKey: applicationSecretKey
})

const generateRandomVoucher = () => {
  const category = 'voucherify-nodejs-example'

  const amount = {
    type: 'AMOUNT',
    amount_off: _.random(10.00, 40.00, true).toFixed(2) * 100 // 10.00 = 1000
  }

  const percent = {
    type: 'PERCENT',
    percent_off: _.random(10, 100)
  }

  const unit = {
    type: 'UNIT',
    unit_type: _.sample(['time', 'items']),
    unit_off: _.random(1, 10)
  }

  const getDiscount = () => _.sample([amount, percent, unit])

  const getRedemption = () => ({
    quantity : _.sample([_.random(1, 10), null]),
    redeemed_quantity : 0,
    redemption_entries : []
  })

  const getStartDate = () => moment().toISOString()

  const getExpirationDate = () => {
    return moment()
      .add(_.random(1, 24), _.sample(['m', 'h', 'd']))
      .toISOString()
  }

  const getExpirationDateOrNull = () => _.sample([getExpirationDate(), null])

  return {
    discount: getDiscount(),
    category: category,
    redemption: getRedemption(),
    active: true,
    start_date: getStartDate(),
    expiration_date: getExpirationDateOrNull()
  }
}

console.log('===============================')
console.log('===== VOUCHER GENERATING ======')
console.log('===============================')
Promise.map(_.times(5, generateRandomVoucher), (voucherPayload) => {
  const discountType = _.get(voucherPayload, 'discount.type', 'undefined')
  return voucherify.create(voucherPayload)
    .then((addedVoucher) => {
      console.log('=== * Creating voucher: "%s"   : code "%s"', discountType, _.get(addedVoucher, 'code', 'undefined'))
      return addedVoucher
    })
    .catch((err) => {
      console.log('* Creating voucher: "%s" : FAILED', discountType)
      return err
    })
}).then((addedVouchers) => {
  console.log('===============================')
  console.log('======= ADDED VOUCHERS ========')
  console.log('===============================')
  _.each(addedVouchers, (voucher, index) => {
    console.log('=== %s#', index)
    console.log('=== * Code:        %s', _.get(voucher, 'code'))
    console.log('=== * Discount:    %j', _.get(voucher, 'discount'))
    console.log('=== * Start Date:  %s', _.get(voucher, 'start_date'))
    console.log('=== * End Date:    %s', _.get(voucher, 'expiration_date'))
  })
  console.log('===============================')
}).catch((err) => {
  console.log('===============================')
  console.log('===== ERROR DURING ADDING =====')
  console.log('===============================')
  console.error('Error: %s', err)
})