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


  const ProductModel = function (price, countChangeHandler) {
    this.price = 0
    this.count = 1

    const $productsCountInput = $('#products-count')

    this.init = function (price) {
      const _self = this
      _self.price = price
      _self.count = $productsCountInput.val()
      _self.countChangeHandler = countChangeHandler

      $productsCountInput.on('change', function () {
        _self.count = $(this).val()
        _self.countChangeHandler(_self.count * _self.price)
      })

      return _self
    }

    this.getPrice = function () {
      return this.price
    }

    this.getCount = function () {
      return this.count
    }

    return this.init(price)
  }

  const VoucherCode = function (voucherCode) {
    this.voucherCode = voucherCode

    this.getCode = function () {
      return this.voucherCode
    }

    return this
  }
  
  const VoucherifySampleShop = function () {
    this.totalPrice = 0
    this.discountPrice = 0
    this.product = null

    this.init = function () {
      this.product = new ProductModel(32.43, this.setTotalPrice.bind(this))
      this.setTotalPrice(this.product.getCount() * this.product.getPrice())
    }

    this.setTotalPrice = function (totalPrice) {
      this.totalPrice = totalPrice
      this.render()
    }

    this.render = function () {
      if (this.discountPrice === 0) {
        $('.discount-price')
          .hide()
      } else {
        $('.discount-price')
          .show()
      }

      $('#total-price').text(this.totalPrice.toFixed(2))
      $('#regular-price').text(this.product.getPrice().toFixed(2))
      $('#discount-price').text(this.discountPrice.toFixed(2))
    }

    this.init()

    return this
  }

  const voucherifyShop = new VoucherifySampleShop()

  return voucherifyShop

})(window, window.jQuery, window.Voucherify, window.clientConfig)
