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

    return this.init(price)
  }

  var VoucherCode = function (identity, discountChangeHandler) {
    this.voucherCode = null

    this.identity = null

    this.trackingId = null

    this.valid = false

    this.res = null

    this.isValid = function () {
      return this.valid === true
    }

    this.onValidatedHandler = function (res) {
      this.res = res
      this.voucherCode = res.code
      this.trackingId = res.tracking_id
      this.valid = res.valid

      this.discountChangeHandler(this.res)

      return this
    }

    this.init = function () {
      this.identity = identity
      this.discountChangeHandler = discountChangeHandler

      Voucherify.initialize(clientConfig.clientApplicationId, clientConfig.clientPublicKey)
      Voucherify.setIdentity(this.identity)
      Voucherify.render('#voucher-checkout', {
        textPlaceholder: 'e.g. Testing7fjWdr',
        onValidated: this.onValidatedHandler.bind(this)
      })

      return this
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

      _self.voucher = new VoucherCode('user@identity', function (res) {
        _self.res = res
        _self.setDiscountPrice(Voucherify.utils.calculatePrice(_self.totalPrice, _self.res))
        _self.setDiscount(Voucherify.utils.calculateDiscount(_self.product.count * _self.product.price, _self.res))
      })

      _self.setTotalPrice(_self.product.count * _self.product.price)

      $('#buy-product-button').on('click', function () {
        if (_self.voucher.isValid() && confirm('Would you like to redeem this voucher?') ||
          !_self.voucher.isValid() && confirm('Would you like to buy without discount?')) {
          redeemVoucher(_self.voucher.voucherCode, _self.voucher.trackingId)
            .done(function (res) {
              _self.showSummary(res)
            })
            .fail(function (err) {
              console.error(err)
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
          .hide(0)
        $('.discount-price')
          .hide(0)
      } else {
        $('.old-price-value')
          .show(500)
        $('.discount-price')
          .show(500)
      }

      $('#regular-price').text(_self.product.price.toFixed(2))
      $('#discount-price').text(_self.discount.toFixed(2) * -1)
      $('#old-total-price').text(_self.totalPrice.toFixed(2))
      $('#total-price').text((_self.discountPrice || _self.totalPrice).toFixed(2))
    }

    _self.showSummary = function (res) {
      var $summaryTab = $('#summary-tab')
      var summaryMessage = '<b>Congratulations!</b> Your voucher has been redeemed successfully! Final price was <b>' + (_self.discountPrice || _self.totalPrice).toFixed(2) + ' EUR</b>'
      
      $('#summary-message', $summaryTab).html(summaryMessage)
      $('#response-code', $summaryTab).text(JSON.stringify(res, null, 2))

      $('#shop-tab').hide(500, function () {
        $summaryTab.show(500)
      })
    }

    return _self.init()
  }

  return new VoucherifySampleShop()

})(window, window.jQuery, window.Voucherify, window.clientConfig)
