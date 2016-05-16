(function (window, $, Voucherify) {
  'use strict'

  const clientConfig = window.clientConfig || {}

  $(function () {
    Voucherify.initialize(clientConfig.clientApplicationId, clientConfig.clientPublicKey)
    Voucherify.render('#voucher-checkout', {
      onValidated: function (response) {
        const newPrice = Voucherify.utils.calculatePrice(20, response)
        console.log(newPrice)
      }
    })
  })
})(window, window.jQuery, window.Voucherify)