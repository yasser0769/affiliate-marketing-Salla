(function () {
  var APP_BASE_URL = 'https://YOUR-APP-DOMAIN.com';
  var HARD_CODED_STORE_ID = '';

  function getProductId() {
    var input = document.querySelector('input[name="id"]');
    return input && input.value ? String(input.value) : '';
  }

  function getStoreId() {
    if (window.salla && window.salla.config && window.salla.config.store && window.salla.config.store.id) {
      return String(window.salla.config.store.id);
    }
    return HARD_CODED_STORE_ID;
  }

  function insertButton(mapping) {
    if (document.getElementById('external-buy-btn')) return;

    var target = document.querySelector('salla-add-product-button.sticky-product-bar__btn');
    var fallback = document.querySelector('form.product-form');

    var button = document.createElement('button');
    button.id = 'external-buy-btn';
    button.type = 'button';
    button.textContent = mapping.button_text || 'اشترِ من الخارج';
    button.style.display = 'block';
    button.style.width = '100%';
    button.style.marginTop = '12px';
    button.style.padding = '14px 16px';
    button.style.textAlign = 'center';
    button.style.borderRadius = '10px';
    button.style.fontWeight = '700';
    button.style.fontSize = '16px';
    button.style.border = '1px solid #e5e7eb';
    button.style.background = '#111827';
    button.style.color = '#fff';
    button.style.cursor = 'pointer';

    button.addEventListener(
      'click',
      function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (mapping.open_new_tab) {
          window.open(mapping.button_url, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = mapping.button_url;
        }
      },
      true
    );

    if (target && target.parentNode) {
      target.insertAdjacentElement('afterend', button);
      return;
    }

    if (fallback && fallback.parentNode) {
      fallback.insertAdjacentElement('afterend', button);
    }
  }

  function init() {
    var productId = getProductId();
    var storeId = getStoreId();
    if (!productId || !storeId || !APP_BASE_URL) return;

    var url = APP_BASE_URL + '/public/external-button?store_id=' + encodeURIComponent(storeId) + '&product_id=' + encodeURIComponent(productId);
    fetch(url, { method: 'GET' })
      .then(function (response) {
        if (response.status === 204) return null;
        if (!response.ok) return null;
        return response.json();
      })
      .then(function (json) {
        if (!json || !json.button_url) return;
        insertButton(json);
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
