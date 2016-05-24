'use strict'

const _ = require('lodash')
const config = require('config').get('voucherifyNodeJsExampleApp')
const moment = require('moment')
const Promise = require('bluebird')
const voucherifyClient = require('voucherify')

const applicationKeys = config.get('applicationKeys')

const testVouchersCategory = config.get('testVouchersCategory')
const numberOfSuppliedTestVouchers = config.get('numberOfSuppliedTestVouchers')

const voucherify = voucherifyClient({
  applicationId: process.env.APPLICATION_ID || applicationKeys.applicationId,
  clientSecretKey: process.env.APPLICATION_SECRET_KEY || applicationKeys.applicationSecretKey
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

    const unit = {
      type: 'UNIT',
      unit_type: 'time',
      unit_off: 1
    }

    return {
      discount: _.sample([amount, percent, unit]),
      category: testVouchersCategory,
      redemption: ({
        quantity: _.random(1, 5),
        redeemed_quantity: 0,
        redemption_entries: []
      }),
      active: true,
      start_date: moment().toISOString()
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
