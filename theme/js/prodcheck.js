/*
(function () {

  var ProdCheck = {
    baseApiUrl : getBaseApiUrl(),
    baseUIUrl : getBaseUIUrl(),

    init : function() {
      if (baseUIUrl != "https://golly.life") {
        var prodCheck = document.getElementById('prodcheck-msg');
        prodCheck.classList.remove('invisible');
      }
    },

    registerEvent : function (element, event, handler, capture) {
      if (/msie/i.test(navigator.userAgent)) {
        element.attachEvent('on' + event, handler);
      } else {
        element.addEventListener(event, handler, capture);
      }
    }

  };

  ProdCheck.registerEvent(window, 'load', function () {
    ProdCheck.init();
  }, false);

}());
*/
