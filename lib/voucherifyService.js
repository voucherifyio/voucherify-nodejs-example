'use strict'

const _ = require('lodash')
const config = require('config').get('voucherifyNodeJsExampleApp')
const moment = require('moment')
const Promise = require('bluebird')
const voucherifyClient = require('voucherify')

const applicationKeys = config.get('applicationKeys')

const testVouchersCategory = config.get('testVouchersCategory')
const numberOfSuppliedTestVouchers = config.get('numberOfSuppliedTestVouchers')
const email = process.env.EMAIL || config.get('email')
const applicationId = process.env.APPLICATION_ID || applicationKeys.applicationId
const applicationSecretKey = process.env.APPLICATION_SECRET_KEY || applicationKeys.applicationSecretKey

const voucherify = voucherifyClient({
  applicationId: applicationId,
  clientSecretKey: applicationSecretKey
})

const isVoucherRedeemed = (voucher) => {
  return _.get(voucher, 'redemption.quantity') === _.get(voucher, 'redemption.redeemed_quantity')
}

function VoucherService () {
  this.createRandomVoucher = function () {
    return voucherify.create(this.generateVoucherBody())
      .then((newVoucher) => {
        console.log('[VoucherifyService] New voucher: %s', _.get(newVoucher, 'code'))
        return newVoucher
      })
      .catch((err) => {
        console.log('[VoucherifyService] Error: %s', err)
      })
  }

  this.getVouchers = function () {
    return voucherify.list({category: testVouchersCategory})
  }

  this.getValidVouchers = function () {
    return this.getVouchers()
      .then((vouchers) => _.filter(vouchers, (voucher) => !isVoucherRedeemed(voucher)))
  }

  this.redeemVoucher = function (voucherCode, userTrackingId) {
    return voucherify.redeem(voucherCode, userTrackingId)
      .then((result) => {
        const voucher = _.get(result, 'voucher')

        if (_.isEmpty(voucher)) {
          return Promise.reject(new Error('No voucher object after redemption'))
        }

        if (isVoucherRedeemed(voucher)) {
            return this.createRandomVoucher()
        }

        return voucher
      })
  }

  this.generateVoucherBody = function () {
    const amount = {
      type: 'AMOUNT',
      amount_off: _.random(10.00, 40.00, true).toFixed(2) * 100 // 10.00 = 1000
    }

    const percent = {
      type: 'PERCENT',
      percent_off: _.random(10, 100)
    }

    /*const unit = {
      type: 'UNIT',
      unit_type: _.sample(['time', 'items']),
      unit_off: _.random(1, 10)
    }*/

    const getDiscount = () => _.sample([amount, percent])

    const getRedemption = () => ({
      quantity: _.random(1, 5),
      redeemed_quantity: 0,
      redemption_entries: []
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
      category: testVouchersCategory,
      redemption: getRedemption(),
      active: true,
      start_date: getStartDate()
    }
  }

  this.init = function () {
    return this.getValidVouchers()
      .then((vouchers) => {
        if (_.isEmpty(vouchers)) {
          return Promise.all(_.times(numberOfSuppliedTestVouchers, this.createRandomVoucher.bind(this)))
        }

        if (_.size(vouchers) < numberOfSuppliedTestVouchers){
          const nbOfMissingVouchers = numberOfSuppliedTestVouchers - _.size(vouchers)
          return Promise.all(_.times(nbOfMissingVouchers, this.createRandomVoucher.bind(this)))
        }
      })
  }

  this.init()

  return this
}

module.exports = new VoucherService()
