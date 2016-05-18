(function (window, $, Voucherify, clientConfig) {
  'use strict'

  var redeemVoucher = function (voucherCode, trackingId) {
    return $.post('/redeem', {
      voucher_code: voucherCode,
      tracking_id: trackingId
    })
  }

  var ProductModel = function (price, countChangeHandler) {
    this.price = 0
    this.count = 1

    var $productsCountInput = $('#products-count')

    this.init = function (price) {
      var _self = this
      _self.price = price
      _self.count = $productsCountInput.val()
      _self.countChangeHandler = countChangeHandler

      $productsCountInput.on('change', function () {
        _self.count = $(this).val()
        _self.countChangeHandler(_self.count, _self.price)
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

  var VoucherCode = function (discountChangeHandler) {
    this.voucherCode = null

    this.trackingId = null

    this.valid = false

    this.res = null

    this.getCode = function () {
      return this.voucherCode
    }

    this.getTrackingId = function () {
      return this.trackingId
    }

    this.isValid = function () {
      return this.valid === true
    }

    this.onValidatedHandler = function (res) {
      this.res = res
      this.voucherCode = $('#voucher-checkout .voucherifyCode').val()
      this.trackingId = res.tracking_id
      this.valid = res.valid

      this.discountChangeHandler(this.res)

      return this
    }

    this.init = function () {
      var _self = this

      _self.discountChangeHandler = discountChangeHandler

      Voucherify.initialize(clientConfig.clientApplicationId, clientConfig.clientPublicKey)
      Voucherify.setIdentity('gustav@purpleson.com')
      Voucherify.render('#voucher-checkout', {
        textPlaceholder: 'e.g. Testing7fjWdr',
        onValidated: _self.onValidatedHandler.bind(_self)
      })

      return _self
    }

    return this.init()
  }
  
  var VoucherifySampleShop = function () {
    var _self = this

    _self.totalPrice = 0
    _self.discount = 0
    _self.discountPrice = 0
    _self.product = null
    _self.voucher = null
    _self.res = null

    _self.init = function () {
      _self.product = new ProductModel(32.43, function (count, price) {
        _self.setTotalPrice(count * price)

        if (_self.res !== null) {
          _self.setDiscountPrice(Voucherify.utils.calculatePrice(_self.totalPrice, _self.res))
          _self.setDiscount(Voucherify.utils.calculateDiscount(_self.totalPrice, _self.res))
        }
      })

      _self.voucher = new VoucherCode(function (res) {
        _self.res = res
        _self.setDiscountPrice(Voucherify.utils.calculatePrice(_self.totalPrice, _self.res))
        _self.setDiscount(Voucherify.utils.calculateDiscount(_self.product.getCount() * _self.product.getPrice(), _self.res))
      })

      _self.setTotalPrice(_self.product.getCount() * _self.product.getPrice())

      $('#buy-product-button').on('click', function () {
        if (_self.voucher.isValid() && confirm('Czy chcesz wykorzystać ten Voucher?')) {
          redeemVoucher(_self.voucher.getCode(), _self.voucher.getTrackingId())
            .done(function (res) {
              console.log(res)
            })
            .fail(function (err) {
              console.log(err)
            })
        }
      })

      return _self
    }

    _self.setDiscountPrice = function (discountPrice) {
      _self.discountPrice = discountPrice
      _self.render()
    }

    _self.setDiscount = function (discount) {
      _self.discount = discount
      _self.render()
    }

    _self.setTotalPrice = function (totalPrice) {
      _self.totalPrice = totalPrice
      _self.render()
    }

    _self.render = function () {
      if (_self.discount === 0) {
        $('.old-price-value')
          .hide(500)
        $('.discount-price')
          .hide(500)
      } else {
        $('.old-price-value')
          .show(500)
        $('.discount-price')
          .show(500)
      }

      $('#regular-price').text(_self.product.getPrice().toFixed(2))
      $('#discount-price').text(_self.discount.toFixed(2) * -1)
      $('#old-total-price').text(_self.totalPrice.toFixed(2))
      $('#total-price').text((_self.discountPrice || _self.totalPrice).toFixed(2))
    }

    return _self.init()
  }

  return new VoucherifySampleShop()

})(window, window.jQuery, window.Voucherify, window.clientConfig)
