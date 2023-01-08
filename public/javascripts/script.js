// const { response } = require("../../app");
const nameError = document.getElementById('name-error');
const emailErr = document.getElementById('email-err');
const phoneErr = document.getElementById('phone-err');
const addressErr = document.getElementById('address-err');
const submitErr = document.getElementById('submit-err');
const passwordErr = document.getElementById('password-err')
const otpErr = document.getElementById('otp-err')
const submit2Err = document.getElementById('submit2-err');
const addnameError = document.getElementById('addname-error');
const addphoneErr = document.getElementById('addphone-err');
const addpincodeErr = document.getElementById('addpincode-error');
const addsubmitErr = document.getElementById('addsubmit-err');
const editsubmitErr = document.getElementById('editsubmit-err');
const selectErr = document.getElementById('select-error');
const productSubmitErr = document.getElementById('productSubmit-err');
const PriceErr = document.getElementById('price-error');
const OfferPriceErr = document.getElementById('offerprice-error');
const RamErr = document.getElementById('ram-error');
const StorageErr = document.getElementById('storage-error');
const ColorErr = document.getElementById('color-error');
const StockErr = document.getElementById('stock-error');
const BrandErr = document.getElementById('brand-error');
const DiscriptionErr = document.getElementById('discription-error');
const codeErr = document.getElementById('code-error');
const dateErr = document.getElementById('date-error');



function validateName() {
  var name = document.getElementById('contact-name').value;
  var reqired = 3
  var left = reqired - name.length

  if (name.length == 0) {
    nameError.innerHTML = 'name is reqired';
    return false;
  }
  if (left > 0) {
    nameError.innerHTML = 'write full name';
    return false;
  }
  nameError.innerHTML = '<i class="fas fa-check-circle"></i>';
  return true;
}

function validatePhone() {

  var phone = document.getElementById('contact-phone').value;

  if (phone.length == 0) {
    phoneErr.innerHTML = 'phone number is required';
    return false;
  }
  if (phone.length > 10) {
    phoneErr.innerHTML = 'phone number invalid';
    return false;
  }
  if (phone.length !== 10) {
    phoneErr.innerHTML = 'phone number should be 10 digit';
    return false;
  }

  if (!phone.match(/^[0-9]{10}$/)) {
    phoneErr.innerHTML = 'Only digits';
    return false;
  }
  phoneErr.innerHTML = '<i class="fas fa-check-circle"></i>';
  return true;

}

function validateEmail() {

  var email = document.getElementById('contact-email').value;

  if (email.length == 0) {
    emailErr.innerHTML = 'email is required';
    return false;
  }

  if (!email.match(/^[A-Za-z\._\-[0-9]*[@][A-Za-z]*[\.][a-z]{2,4}$/)) {
    emailErr.innerHTML = 'Email invalid';
    return false;
  }
  emailErr.innerHTML = '<i class="fas fa-check-circle"></i>';
  return true;

}


function validatePassword() {

  var Password = document.getElementById('contact-password').value;

  if (Password.length < 4) {
    passwordErr.innerHTML = 'password minimum 4 characters required';
    return false;
  }
  passwordErr.innerHTML = '<i class="fas fa-check-circle"></i>';
  return true;
}

function validateForm() {
  if (!validateName() || !validateEmail() || !validatePhone() || !validatePassword()) {
    submitErr.innerHTML = '';
    return false;
  }
}

function editValidateForm() {
  if (!validateName() || !validateEmail() || !validatePhone()) {
    editsubmitErr.innerHTML = '';
    return false;
  }
}

function validateotp() {
  var otp = document.getElementById('contact-otp').value;

  if (otp.length < 4) {
    otpErr.innerHTML = 'invalid';
    return false;
  }
  otpErr.innerHTML = '';
  return true;
}

function validateFormotp() {
  if (!validateotp()) {
    submit2Err.innerHTML = '';
    return false;
  }
}
function addToWishlist(proId) {

  $.ajax({
    url: '/wishlist/' + proId,
    method: 'get',
    success: (response) => {
      console.log(response);
      if (response.remove) {
        swal("Product removed from wishlist");
      }
    }
  })

}

function removeWishProduct(WishId, proId, userId) { 
  $.ajax({
    url: '/remove-wishlist-product',
    data: {
      user: userId,
      wishlist: WishId,
      product: proId
    },
    method: 'post',
    success: (response) => {
      if (response.removeProduct) {
        swal("Product removed from wislist")
        location.reload()
      } 
      else {
        console.log(response);
      }
    }
  })
}

function addToCart(proId) {

  $.ajax({
    url: '/cart/' + proId,
    method: 'get',
    success: (response) => {
      console.log(response);
      if (response.status) {  
        let count = $('#cart-count').html()
        count = parseInt(count) + 1
        $("#cart-count").html(count)
      }
    }
  })

}

function changeQuantity(cartId, proId, userId, count) {
  e.preventDefault()
  let quantity = parseInt(document.getElementById(proId).innerHTML)
  count = parseInt(count)
  console.log(count)
  $.ajax({
    url: '/change-product-quantity',
    data: {
      user: userId,
      cart: cartId,
      product: proId,
      count: count,
      quantity: quantity
    }, 
    method: 'post',
    success: (response) => {
      if (response.removeProduct) {
        swal("Product removed from cart")
        location.reload()
      } else {
        document.getElementById(proId).innerHTML = quantity + count
        document.getElementById('total').innerHTML = response.total
      }
    }
  })
}

function removeProduct(cartId, proId, userId) {
  let quantity = parseInt(document.getElementById(proId).innerHTML)
  $.ajax({
    url: '/remove-product',
    data: {
      user: userId,
      cart: cartId,
      product: proId,
      quantity: quantity
    },
    method: 'post',
    success: (response) => {
      if (response.removeProduct) {
        swal("Product removed from cart")
        location.reload()
      } else {
        console.log(response);
      }
    }
  })
}

$("#cupon-form").submit((e) => {
  console.log('response');
  e.preventDefault()
  $.ajax({
    url: '/apply-cupon',
    method: 'post',
    data: $('#cupon-form').serialize(),
    success: (response) => {
      if (response.cuponErr) {
        document.getElementById('cupon-error').innerHTML = response.cuponErr
      } else if (response.userErr) {
        document.getElementById('cupon-error').innerHTML = response.userErr
      } else {
        document.getElementById('total').innerHTML = response.total
        document.getElementById('totaltwo').value = response.total
        document.getElementById('cupon-success').innerHTML = "coupon Applied"
      }
    }
  })
})
///// WALLET
// function checkWallet(walletAmount,Total) {
//   // var walletAmount = document.getElementById('wallet').value;
//   // alert(typeof(Total) )
//   var method = document.getElementById('wallet').name;
//   // alert(typeof(walletAmount))
//   if (walletAmount < Total) {
//     console.log("mrum");
//     alert("mrum ")
//     let total = Total-walletAmount
//     if(method=="payment-method"){
//       document.getElementById('wallet').name = "Wallet-use"
//     }else{
//       document.getElementById('wallet').name = "payment-method"
//     }
//     document.getElementById('wllet-value').value = total
//   }else{
//     // alert("sedrftvgybhuj")
//     document.getElementById('wallet').name = "payment-method"
//     document.getElementById('wllet-value').value = 0
//   }
// }

///// ADDRESS VALIDATION ------>>>>>>>>>>>

function validateAddPhone() {

  var phone = document.getElementById('contact-addphone').value;

  if (phone.length == 0) {
    addphoneErr.innerHTML = 'phone number is required';
    return false;
  }
  if (phone.length > 10) {
    addphoneErr.innerHTML = 'phone number invalid';
    return false;
  }
  if (phone.length !== 10) {
    addphoneErr.innerHTML = 'phone number should be 10 digit';
    return false;
  }

  if (!phone.match(/^[0-9]{10}$/)) {
    addphoneErr.innerHTML = 'Only digits';
    return false;
  }
  addphoneErr.innerHTML = '<i class="fas fa-check-circle"></i>';
  return true;

}

function validateAddName() {
  var name = document.getElementById('contact-addname').value;
  var reqired = 3
  var left = reqired - name.length

  if (name.length == 0) {
    addnameError.innerHTML = 'name is reqired';
    return false;
  }
  if (left > 0) {
    addnameError.innerHTML = 'write full name';
    return false;
  }
  addnameError.innerHTML = '<i class="fas fa-check-circle"></i>';
  return true;
}

function validateAddPincode() {

  var phone = document.getElementById('contact-addpincode').value;

  if (phone.length == 0) {
    addpincodeErr.innerHTML = 'Pincode is required';
    return false;
  }
  if (!phone.match(/^[0-9]{6}$/)) {
    addpincodeErr.innerHTML = 'Only digits';
    return false;
  }
  if (phone.length > 6) {
    addpincodeErr.innerHTML = 'Pincode invalid';
    return false;
  }
  if (phone.length !== 6) {
    addpincodeErr.innerHTML = 'Pincode should be 10 digit';
    return false;
  }

  addpincodeErr.innerHTML = '<i class="fas fa-check-circle"></i>';
  return true;

}

function validateAddAddress() {

  var message = document.getElementById('contact-message').value;

  if (message.length == 0) {
    addressErr.innerHTML = 'Address is required';
    return false;
  }
  if (message.length < 5) {
    addressErr.innerHTML = 'Enter full Address';
    return false;
  }

  addressErr.innerHTML = '<i class="fas fa-check-circle"></i>';
  return true;

}

function validateAddForm() {
  if (!validateAddName() || !validateAddPhone() || !validateAddPincode() || !validateAddAddress()) {
    addsubmitErr.innerHTML = '';
    return false;
  }
}


///////// category ---------->>>>>>>>>>>
function validateCatName() {
  var name = document.getElementById('contact-name').value;
  var reqired = 2
  var left = reqired - name.length

  if (name.length == 0) {
    nameError.innerHTML = 'category name is reqired';
    return false;
  }
  if (left > 0) {
    nameError.innerHTML = 'Enter full name';
    return false;
  }
  nameError.innerHTML = '';
  return true;
}

function validateCatForm() {
  if (!validateCatName()) {
    submitErr.innerHTML = '';
    return false;
  }
}
//// offer
function validateOfferName() {
  var name = document.getElementById('contact-name').value;
  var reqired = 2
  var left = reqired - name.length

  if (name.length == 0) {
    nameError.innerHTML = 'reqired';
    return false;
  }
  if (name >= 91) {
    nameError.innerHTML = 'Offer limit maximum 90%';
    return false;
  }

  if (!name.match(/^[0-9]{2}$/)) {
    nameError.innerHTML = 'Only digits';
    return false;
  }
  nameError.innerHTML = '';
  return true;
}

function validateOfferForm() {
  if (!validateOfferName()) {
    submitErr.innerHTML = '';
    return false;
  }
}
// cuppon 
function validateCuponCode() {
  var code = document.getElementById('contact-code').value;
  var reqired = 2

  if (code.length == 0) {
    codeErr.innerHTML = 'reqired';
    return false;
  }
  if (code.length <= 3) {
    codeErr.innerHTML = 'cupon code limit 4';
    return false;
  }
  if (code.length >= 5) {
    codeErr.innerHTML = 'cupon code limit 4';
    return false;
  }
  codeErr.innerHTML = '';
  return true;
}
function validateCuponDate() {
  var date = document.getElementById('contact-date').value;
  if (date.length == 0) {
    dateErr.innerHTML = 'reqired';
    return false;
  }
  if (date.length <= 9) {
    dateErr.innerHTML = 'Enter full date';
    return false;
  }
  dateErr.innerHTML = '';
  return true;
}
function validateCuponForm() {
  if (!validateOfferName() || !validateCuponCode() || !validateCuponDate()) {
    submitErr.innerHTML = '';
    return false;
  }
}

// applay cupon
function validateApplyCuponForm() {
  if (!validateCuponCode()) {
    submitErr.innerHTML = '';
    return false;
  }
}
//product

function validatePrice() {
  var Price = document.getElementById('contact-price').value;
  if (Price.length == 0) {
    PriceErr.innerHTML = 'fill the coloum price';
    return false;
  }
  PriceErr.innerHTML = '';
  return true;
}

function validateOfferPrice() {
  var Price = document.getElementById('contact-offerprice').value;
  if (Price.length == 0) {
    OfferPriceErr.innerHTML = 'fill the coloum offer price';
    return false;
  }
  OfferPriceErr.innerHTML = '';
  return true;
}

function validateRam() {
  var Ram = document.getElementById('contact-ram').value;
  if (Ram.length == 0) {
    RamErr.innerHTML = 'fill the coloum ram';
    return false;
  }
  RamErr.innerHTML = '';
  return true;
}

function validateStorage() {
  var Storage = document.getElementById('contact-storage').value;
  if (Storage.length == 0) {
    StorageErr.innerHTML = 'fill the coloum storage';
    return false;
  }
  StorageErr.innerHTML = '';
  return true;
}

function validateDiscription() {

  var Discription = document.getElementById('contact-discription').value;

  if (Discription.length == 0) {
    DiscriptionErr.innerHTML = 'Discription is required';
    return false;
  }
  if (Discription.length < 5) {
    DiscriptionErr.innerHTML = 'Enter full Discription';
    return false;
  }

  DiscriptionErr.innerHTML = '<i class="fas fa-check-circle"></i>';
  return true;

}

function validateColor() {
  var Color = document.getElementById('contact-color').value;
  if (Color.length == 0) {
    ColorErr.innerHTML = 'fill the coloum color';
    return false;
  }
  ColorErr.innerHTML = '';
  return true;
}

function validateStock() {
  var Stock = document.getElementById('contact-stock').value;
  if (Stock.length == 0) {
    StockErr.innerHTML = 'fill the coloum stock';
    return false;
  }
  StockErr.innerHTML = '';
  return true;
}

function validateBrand() {
  var Brand = document.getElementById('contact-brand').value;
  if (Brand.length == 0) {
    BrandErr.innerHTML = 'fill the coloum brand';
    return false;
  }
  BrandErr.innerHTML = '';
  return true;
}



function validateProductForm() {
  if (!validateName() || !validateDiscription() || !validatePrice() || !validateOfferPrice() || !validateRam() || !validateStorage() || !validateColor() || !validateStock() || !validateBrand()) {
    productSubmitErr.innerHTML = '';
    return false;
  }
}
