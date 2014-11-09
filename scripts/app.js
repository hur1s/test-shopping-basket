var data = {
	basketProducts: [
		{
			"name": "Cotton T-Shirt",
			"size": "Medium",
			"price": "1.99",
			"quantity": 1,
			"id": 0
		},
		{
			"name": "Baseball Cap",
			"size": "One size",
			"price": "2.99",
			"quantity": 2,
			"id": 1
		},
		{
			"name": "Swim shorts",
			"size": "Medium",
			"price": "3.99",
			"quantity": 1,
			"id": 2
		}
	],
	subtotal: 11.96,
	vat: 2.39,
	total: 14.35
}

// Models
function ProductModel(name, size, price, quantity, id) {
	this.name = name;
	this.size = size;
	this.price = parseFloat(price);
	this.quantity = quantity;
	this.id = id;
}

function BasketModel(products, subtotal, vat, total) {
	var self = this;
	var vatRate = 0.2;
	self.products = products; //array of ProductModel
	self.subtotal = subtotal;
	var subTotalSubscribers = [];
	self.vat = vat;
	var vatSubscribers = [];
	self.total = total;
	var totalSubscribers = [];

	self.updateProductQuantity = function(id, newQuantity) {
		var returnQuantity = null;
		$.each(self.products, function(index, product) {
			if (product.id == id) {
				//product.quantity = parseInt(product.quantity, 10) + parseInt(delta, 10);
				product.quantity = parseInt(newQuantity, 10);
				returnQuantity = product.quantity;
			}
		});
		self.calculateSubTotal();
		return returnQuantity;
	};

	self.removeProduct = function(id) {
		self.products = $.grep(self.products, function(product) {
			return product.id != id;
		});
		self.calculateSubTotal();
		return true;
	}

	self.calculateSubTotal = function() {
		var subtotal = 0;
		$.each(self.products, function(index, product) {
			subtotal = subtotal + (parseInt(product.quantity, 10) * parseFloat(product.price, 10))
		});
		self.subtotal = subtotal.toFixed(2);
		self.calculateVat();
		notifySubscribers(subTotalSubscribers, self.subtotal);
	};

	self.calculateVat = function() {
		var newVat = 0;
		newVat = self.subtotal * vatRate;
		self.vat = newVat.toFixed(2);
		self.calculateTotal();
		notifySubscribers(vatSubscribers, self.vat);
	};

	self.calculateTotal = function() {
		var newTotal = 0;
		newTotal = parseFloat(self.subtotal, 10) + parseFloat(self.vat, 10);
		self.total = newTotal.toFixed(2);
		notifySubscribers(totalSubscribers, self.total);
	};

	var notifySubscribers = function(subscribers, value) {
		$.each(subscribers, function(index, callback) {
			if (typeof callback === "function") {
				callback(value);
			}
		});
	}

	self.subscribeToSubtotal = function(callback) {
		subTotalSubscribers.push(callback);
	}

	self.subscribeToVat = function(callback) {
		vatSubscribers.push(callback);
	}

	self.subscribeToTotal = function(callback) {
		totalSubscribers.push(callback);
	}

	self.calculateSubTotal();
}

var submitService = function() {

	this.submit = function(data) {
		$.post("", function() {
			//console.log(data);
		}).done(function() {
			alert("Submitted basket " + data);
		}).fail(function() {

		});
	}
};

var BasketView = function(model) {

	var self = this;
	var $el = $("#basket");
	var $basketElement = $("#basket");
	var $submitButton = $el.find("[name='buyNow']");
	var basketProducts = [];
	var outstandingErrors = [];
	self.service = new submitService();
	self.model = model;

	$submitButton.on('click', function(event) {
		event.preventDefault();
		if (Modernizr.json) {
			var data = JSON.stringify(self.model);
			self.service.submit(data);
			//console.log(data);
		} else {
			alert("Browser does not support JSON.stringify, need another solution");
		}

	});

	self.addToValidationErrors = function(productId) {
		if ($.inArray(productId, outstandingErrors) == -1) {
			outstandingErrors.push(productId);
		}
		updateValidation();
	};

	self.removeFromValidationErrors = function(productId) {
		if ($.inArray(productId, outstandingErrors) >= 0) {
		 outstandingErrors.splice(($.inArray(productId, outstandingErrors)), 1);
		}
		updateValidation();
	};

	var updateValidation = function() {
		if (outstandingErrors.length > 0) {
			$submitButton.attr("disabled", "disabled");
		} else {
			$submitButton.removeAttr("disabled");
		}
	}

	var assignAlternateRows = function() {
		$.each($basketElement.find(".productRow"), function(index, row) {
			if (index % 2 == 0) {
				$(row).removeClass("alternate");
			} else {
				$(row).addClass("alternate");
			}
		});
	}

	self.removeProduct = function(productId) {
		if (self.model.removeProduct(productId)) {
			$basketElement.find('#item-' + productId).remove();
		}
		assignAlternateRows();
	};

	var subtotalView = function() {
		var $el = $('#subtotal');
		var updateSubtotal = function(subTotal) {
			$el.find('.value').html(formatValueForOutput(subTotal));
		};

		self.model.subscribeToSubtotal(function(subtotal) {
			return updateSubtotal(subtotal);
		});

		//updateSubtotal(self.model.subtotal);
	};

	var vatView = function() {
		var $el = $('#vat');
		var updateVat = function(vat) {
			$el.find('.value').html(formatValueForOutput(vat));
		};

		self.model.subscribeToVat(function(subtotal) {
			return updateVat(subtotal);
		});

		//updateVat(self.model.vat);
	};

	var totalView = function() {
		var $el = $('#total');
		var updateTotal = function(total) {
			$el.find('.value').html(formatValueForOutput(total));
		};

		self.model.subscribeToTotal(function(total) {
			return updateTotal(total);
		});

		//updateTotal(self.model.total);
	};

	// Views
	var productView = function(model) {
		//var $row = $('<div/>').html($('#template').html()).contents();
		var $row = $('#item-' + model.id);
		//$row.addClass('item-' + model.id);
		//$row.find('.product').html(model.name + ', ' + model.size);
		//$row.find('.price').html(model.price);
		var $quantity = $row.find('.quantity');
		var $quantityValue = $row.find('.quantityValue');
		var $total = $row.find('.total');
		var isInError = false;

		var validateInput = function(newValue) {
			var formattedValue = newValue == "" ? 1 : parseInt(newValue, 10);
			return formattedValue;
		}

		var applyQuantityError = function() {
			if (!isInError) {
				$row.addClass("error");
				$row.find("p").html("Quantity range must be between 1 - 10.");
				isInError = true;
			}
		}

		var removeQuantityError = function() {
			if (isInError) {
				$row.removeClass("error");
				$row.find("p").html("");
				isInError = false;
			}
		}

		var increaseDecreaseItemQuantity = function(delta) {
			var newValue = parseInt($quantityValue.val(), 10) + delta;
			$quantityValue.val(newValue).trigger('keyup');
		}

		var calculateItemQuantity = function(newQuantity) {
			model.quantity = self.model.updateProductQuantity(model.id, newQuantity);
			updateProductTotal();
			toggleQuantityButtons(model.quantity);
		};

		var updateItemQuantity = function(quantity) {
			$quantityValue.val(quantity).trigger('change');
		};

		var toggleQuantityButtons = function(quantity) {
			if (quantity > 1) {
				$quantity.find('.decrease').removeClass("disabled");
			} else {
				$quantity.find('.decrease').addClass("disabled");
			}

			if (quantity > 9) {
				$quantity.find('.increase').addClass("disabled");
			} else {
				$quantity.find('.increase').removeClass("disabled");
			}
		};

		var updateProductTotal = function() {
			$total.html(formatValueForOutput((model.price * model.quantity).toFixed(2)));
		}

		var dispose = function() {
			$quantity.find('.increase').off();
			$quantity.find('.decrease').off();
			$row.find('.removeProduct').off();
			$quantityValue.off();
			self.removeProduct(model.id);
		}

		$quantity.find('.increase').on('click', function(event) {
			event.preventDefault();
			if (parseInt($quantityValue.val(), 10) < 10) {
				increaseDecreaseItemQuantity(1);
			}
		});
		$quantity.find('.decrease').on('click', function(event) {
			event.preventDefault();
			if (parseInt($quantityValue.val(), 10) > 1) {
				increaseDecreaseItemQuantity(0 - 1);
			}
		});
		$row.find('.removeProduct').on('click', function(event) {
			event.preventDefault();
			dispose();
		});
		$quantityValue.on('keypress', function(event) {
		    if (event.which < 48 || event.which > 57)
		    {
		        event.preventDefault();
		    }
		});
		$quantityValue.on('keyup', function(event) {
			var quantity = validateInput($(event.target).val());
			if (quantity < 1 || quantity > 10) {
				self.addToValidationErrors(model.id);
				applyQuantityError();
			} else {
				self.removeFromValidationErrors(model.id);
				removeQuantityError();
				calculateItemQuantity(quantity);
			}
		});

		toggleQuantityButtons(model.quantity);
		//updateItemQuantity(model.quantity);

		return $row;
	};

	// constructor
	(function() {
		var $subtotalsView = new subtotalView();
		var $vatView = new vatView();
		var $totalView = new totalView();
		for (index = 0; index < self.model.products.length; index ++) {
			var $product = new productView(self.model.products[index]);
			basketProducts.push(self.model.products[index]);
			//$basketElement.append($product);
		}	
	})();

} 

var formatValueForOutput = function(value) {
	var valueString = "£" + value;
	return valueString;
}

// App init
$(document).ready(function() {

	Modernizr.addTest('json', 'JSON' in window && 'parse' in JSON && 'stringify' in JSON);
	
	var basketProducts = [];
	for (var index = 0; index < data.basketProducts.length; index ++) {
		var item = data.basketProducts[index];
	 	basketProducts.push(new ProductModel(item.name, item.size, item.price,
	 		item.quantity, item.id));
	}

	var basketModel = new BasketModel(basketProducts, 0, 0, 0);
	var basket = new BasketView(basketModel);

});