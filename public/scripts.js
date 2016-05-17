(function (window, $, Voucherify, clientConfig) {
  'use strict'

  const redeemVoucher = function (voucherCode, trackingId) {
    return $.post('/redeem', {
      voucher_code: voucherCode,
      tracking_id: trackingId
    })
  }

  const getVouchers = function () {
    return $.get('/vouchers.json')
  }

  Voucherify.initialize(clientConfig.clientApplicationId, clientConfig.clientPublicKey)
  Voucherify.setIdentity('gustav@purpleson.com')
  Voucherify.render('#voucher-checkout', {
    textPlaceholder: 'e.g. Testing7fjWdr',
    onValidated: function (res) {
      const voucherCode = $('#voucher-checkout .voucherifyCode').val()
      const trackingId = res.tracking_id

      if (res.valid && confirm('Czy chcesz wykorzystać ten Voucher?')) {
        redeemVoucher(voucherCode, trackingId)
          .done(function (res) {
            console.log(res)
          })
          .fail(function (err) {
            console.log(err)
          })
      }
    }
  })

  getVouchers()
    .done(function (res) {
      console.log(res)
    })
    .fail(function (err) {
      console.error(err)
    })

})(window, window.jQuery, window.Voucherify, window.clientConfig)
