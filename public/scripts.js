(function (window, $, Voucherify, clientConfig, userIdentity) {
  'use strict'

  var sampleProductPrice = 32.40
  var sampleShipmentPrice = 12

  var getVouchers = function () {
    return $.get('/vouchers.json')
  }

  var redeemVoucher = function (voucherCode, trackingId) {
    return $.post('/redeem', {
      voucher_code: voucherCode,
      tracking_id: trackingId
    })
  }

  var ProductModel = function (price, countChangeHandler) {
    var _self = this

    _self.init = function (price) {
      _self.price = price
      _self.count = 1
      _self.countChangeHandler = countChangeHandler

      _self.render()

      return _self
    }

    _self.render = function () {
      $('#products-count').val(_self.count)
    }

    $('#products-count').on('change', function () {
      _self.count = $(this).val()
      _self.countChangeHandler(_self.count, _self.price)
    })

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

      $('#voucher-checkout').html('')

      Voucherify.initialize(clientConfig.clientApplicationId, clientConfig.clientPublicKey)
      Voucherify.setIdentity(this.identity)
      Voucherify.render('#voucher-checkout', {
        textValidate: 'Validate voucher',
        textPlaceholder: 'Use your voucher code here',
        onValidated: this.onValidatedHandler.bind(this)
      })

      return this
    }

    return this.init()
  }

  var VoucherifySampleShop = function (identity) {
    var _self = this

    function setDiscountForCashVouchers () {
      if (_self.res.discount.type !== "UNIT" || _self.res.valid !== true) {
        _self.setDiscountPrice(Voucherify.utils.calculatePrice(_self.totalPrice, _self.res))
        _self.setDiscount(Voucherify.utils.calculateDiscount(_self.totalPrice, _self.res))
      }
    }

    _self.init = function () {
      _self.product = new ProductModel(sampleProductPrice, function (count, price) {
        _self.setTotalPrice(count * price)

        setDiscountForCashVouchers()
      })

      _self.voucher = new VoucherCode(identity, function (res) {
        _self.res = res

        if(!_self.freeShipment && _self.res.discount.type === "UNIT" && _self.res.valid === true) {
          _self.setFreeShipment(true)
        }

        setDiscountForCashVouchers()
      })

      _self.shipmentPrice = sampleShipmentPrice

      _self.freeShipment = false

      _self.totalPrice = _self.product.count * _self.product.price

      _self.discount = 0

      _self.discountPrice = 0

      _self.res = null

      getVouchers()
        .done((vouchersList) => {
          _self.setVouchersList(vouchersList)
        })
        .fail((err) => {
          console.error(err)
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

    _self.setVouchersList = function (newVouchersList) {
      _self.vouchersList = newVouchersList
      _self.render()
    }

    _self.setShipmentPrice = function (shipmentPrice) {
      _self.shipmentPrice = shipmentPrice
      _self.render()
    }

    _self.setFreeShipment = function (freeShipment) {
      _self.freeShipment = freeShipment
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

      if (_self.freeShipment) {
        $('#free-shipment-label')
          .show(500)
        $('#shipment-price')
          .addClass('free-active')
      } else {
        $('#free-shipment-label')
          .hide(0)
        $('#shipment-price')
          .removeClass('free-active')
      }

      $('#regular-price').text(_self.product.price.toFixed(2))
      $('#discount-price').text((_self.discount * -1).toFixed(2))
      $('#old-total-price').text(_self.totalPrice.toFixed(2))
      $('#shipment-price').text(_self.shipmentPrice.toFixed(2))
      $('#total-price').text(((_self.discountPrice || _self.totalPrice)).toFixed(2))
      $('#summary-price').text(((_self.discountPrice || _self.totalPrice) + (_self.freeShipment ? 0 :_self.shipmentPrice)).toFixed(2))

      $('#vouchers-list').html(_self.vouchersList.map((voucher) => {
        return $('<div>')
          .addClass('voucher-item')
          .html(function () {
            var result = []

            result.push($('<div>')
              .addClass('voucher-code')
              .append('<span><b>' + voucher.code + '</b></span>'))

            switch (voucher.discount.type) {
              case 'AMOUNT' :
                result.push($('<div>')
                  .addClass('voucher-amount')
                  .append('<i class="fa fa-money"></i>')
                  .append('<span class="amount-off">' + (voucher.discount.amount_off / 100).toFixed(2) + '</span>'))
                break
              case 'PERCENT' :
                result.push($('<div>')
                  .addClass('voucher-percent')
                  .append('<span class="percent-off">' + voucher.discount.percent_off + '</span>')
                  .append('<i class="fa fa-percent"></i>'))
                break
              case 'UNIT' :
                result.push($('<div>')
                  .addClass('voucher-unit')
                  .append('<i class="fa fa-th"></i>')
                  .append('<span class="unit-off">Free</span>')
                  .append('<span class="unit-type">Shipment</span>'))
                break
            }

            var voucherDiscount = Voucherify.utils.calculateDiscount(_self.totalPrice, voucher)

            if (voucherDiscount) {
              result.push($('<div>')
                .addClass('voucher-discount')
                .append('<b>Discount</b>: ')
                .append('<span>' + voucherDiscount + '</span>'))
            }

            if (voucher.redemption.quantity) {
              result.push($('<div>')
                .addClass('voucher-redemption')
                .append('<b>Used</b>: ')
                .append('<span>' + voucher.redemption.redemption_entries.length + '/' + voucher.redemption.quantity + ' times</span>'))
            }

            return result
          })
      }))
    }

    _self.showSummary = function (res) {
      var $summaryTab = $('#summary-tab')
      var summaryPrice = ((_self.discountPrice || _self.totalPrice) + (_self.freeShipment ? 0 :_self.shipmentPrice)).toFixed(2)
      var summaryMessage = '<b>Congratulations!</b> Your voucher has been redeemed successfully! Final price was <b>' + summaryPrice + ' EUR</b>'

      $('#summary-message', $summaryTab).html(summaryMessage)
      $('#response-code', $summaryTab).text(JSON.stringify(res, null, 2))

      $('#shop-tab').hide(500, function () {
        $summaryTab.show(500)
      })
    }

    _self.showShop = function () {
      $('#summary-tab').hide(500, function () {
        $('#shop-tab').show(500)
      })

      _self.init()
    }

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

    $('#back-button').on('click', function () {
      _self.showShop()
    })

    return _self.init()
  }

  return new VoucherifySampleShop(userIdentity)

})(window, window.jQuery, window.Voucherify, window.clientConfig, window.userIdentity)
