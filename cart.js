(() => {

  const STORAGE_KEY = 'midnightSoulbirdsCart';

  let cart = loadCart();

  const INVENTORY_URL =
    'https://midnight-soulbirds-store.kssummer.workers.dev/inventory';

  let inventory = {};


  /* =========================
     ELEMENTS
     ========================= */

  const openButton =
    document.getElementById('cart-open-button');

  const closeButton =
    document.getElementById('cart-close-button');

  const drawer =
    document.getElementById('cart-drawer');

  const backdrop =
    document.getElementById('cart-backdrop');

  const cartItems =
    document.getElementById('cart-items');

  const emptyMessage =
    document.getElementById('cart-empty');

  const countElement =
    document.getElementById('cart-count');

  const subtotalElement =
    document.getElementById('cart-subtotal');

  const checkoutButton =
    document.getElementById('cart-checkout-button');


  if (
    !openButton ||
    !closeButton ||
    !drawer ||
    !backdrop ||
    !cartItems ||
    !emptyMessage ||
    !countElement ||
    !subtotalElement ||
    !checkoutButton
  ) {
    return;
  }


  /* =========================
     STORAGE
     ========================= */

  function loadCart() {

    try {

      const saved =
        JSON.parse(
          localStorage.getItem(
            STORAGE_KEY
          )
        );

      return Array.isArray(saved)
        ? saved
        : [];

    } catch {

      return [];
    }
  }


  function saveCart() {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(cart)
    );
  }


  /* =========================
     HELPERS
     ========================= */

  function money(cents) {

    return new Intl.NumberFormat(
      'en-US',
      {
        style: 'currency',
        currency: 'USD'
      }
    ).format(
      cents / 100
    );
  }


  function cartKey(item) {
    return item.variationId;
  }


  /* =========================
     INVENTORY
     ========================= */

  function getStock(variationId) {

    const quantity =
      inventory[variationId];

    return Number.isFinite(quantity)
      ? quantity
      : null;
  }


  function quantityInCart(variationId) {

    const item =
      cart.find(
        entry =>
          entry.variationId === variationId
      );

    return item
      ? item.quantity
      : 0;
  }


  function remainingStock(variationId) {

    const stock =
      getStock(variationId);

    if (stock === null) {
      return null;
    }

    return Math.max(
      0,
      stock - quantityInCart(variationId)
    );
  }


  function updateInventoryUI() {

    document
      .querySelectorAll(
        '.shop-product'
      )
      .forEach(
        card => {

          const buttons =
            [
              ...card.querySelectorAll(
                '.option-button'
              )
            ];

          const addButton =
            card.querySelector(
              '.add-to-cart'
            );

          const quantityDisplay =
            card.querySelector(
              '.product-quantity-value'
            );


          /*
           * Update variation buttons.
           */

          buttons.forEach(
            button => {

              const variationId =
                button.dataset.variationId;

              const stock =
                getStock(
                  variationId
                );


              /*
               * Remember the original label.
               */

              if (
                !button.dataset.originalText
              ) {
                button.dataset.originalText =
                  button.textContent.trim();
              }


              /*
               * Explicit stock of zero means
               * this variation is sold out.
               */

              if (stock === 0) {

                button.disabled =
                  true;

                button.classList.add(
                  'sold-out'
                );

                button.classList.remove(
                  'selected'
                );

                button.textContent =
                  `${button.dataset.originalText} — Sold Out`;

              } else {

                button.disabled =
                  false;

                button.classList.remove(
                  'sold-out'
                );

                button.textContent =
                  button.dataset.originalText;
              }
            }
          );


          /*
           * Find the selected available
           * variation.
           */

          let selected =
            card.querySelector(
              '.option-button.selected:not(:disabled)'
            );


          /*
           * If the selected variation is
           * sold out, select the first
           * available variation instead.
           */

          if (!selected) {

            selected =
              buttons.find(
                button =>
                  !button.disabled
              );

            if (selected) {

              selected.classList.add(
                'selected'
              );


              /*
               * Keep the headband image in
               * sync with its selected color.
               */

              if (
                card.dataset.productId ===
                  'headband'
              ) {

                updateHeadbandImage(
                  selected.dataset.value
                );
              }
            }
          }


          /*
           * No available variations means
           * the entire product is sold out.
           */

          if (!selected) {

            if (addButton) {

              addButton.disabled =
                true;

              addButton.textContent =
                'Sold Out';
            }

            return;
          }


          if (addButton) {

            addButton.disabled =
              false;

            addButton.textContent =
              'Add to Cart';
          }


          /*
           * Clamp the product quantity
           * selector to remaining stock.
           */

          if (quantityDisplay) {

            const remaining =
              remainingStock(
                selected.dataset.variationId
              );

            if (remaining !== null) {

              const current =
                Number.parseInt(
                  quantityDisplay.textContent,
                  10
                ) || 1;

              quantityDisplay.textContent =
                Math.max(
                  1,
                  Math.min(
                    current,
                    Math.max(
                      remaining,
                      1
                    )
                  )
                );
            }
          }
        }
      );
  }


  async function loadInventory() {

    try {

      const response =
        await fetch(
          INVENTORY_URL
        );

      const data =
        await response.json();


      if (
        !response.ok ||
        !data.inventory
      ) {

        throw new Error(
          data.error ||
          'Unable to retrieve inventory.'
        );
      }


      inventory =
        data.inventory;


      /*
       * Reconcile the existing cart with
       * the latest Square inventory.
       */

      let cartChanged =
        false;


      cart =
        cart.filter(
          item => {

            const stock =
              getStock(
                item.variationId
              );


            /*
             * Unknown inventory is left
             * untouched.
             */

            if (stock === null) {
              return true;
            }


            /*
             * Remove variations that have
             * completely sold out.
             */

            if (stock <= 0) {

              cartChanged =
                true;

              return false;
            }


            /*
             * Reduce quantity if inventory
             * dropped below what's currently
             * in the cart.
             */

            if (
              item.quantity >
              stock
            ) {

              item.quantity =
                stock;

              cartChanged =
                true;
            }


            return true;
          }
        );


      if (cartChanged) {
        saveCart();
      }


      updateInventoryUI();

      renderCart();

    } catch (error) {

      console.error(
        'Inventory failed:',
        error
      );
    }
  }


  /* =========================
     CART OPERATIONS
     ========================= */

  function addToCart(product) {

    const key =
      cartKey(product);

    const existing =
      cart.find(
        item =>
          cartKey(item) === key
      );


    if (existing) {

      const stock =
        getStock(
          product.variationId
        );

      const maximum =
        stock === null
          ? 99
          : stock;

      existing.quantity =
        Math.min(
          maximum,
          existing.quantity +
            product.quantity
        );

    } else {

      cart.push(product);
    }


    saveCart();

    renderCart();

    updateInventoryUI();

    openCart();
  }


  function changeQuantity(
    key,
    delta
  ) {

    const item =
      cart.find(
        entry =>
          cartKey(entry) === key
      );


    if (!item) {
      return;
    }


    item.quantity +=
      delta;


    if (item.quantity <= 0) {

      cart =
        cart.filter(
          entry =>
            cartKey(entry) !== key
        );

    } else {

      const stock =
        getStock(
          item.variationId
        );

      const maximum =
        stock === null
          ? 99
          : stock;

      item.quantity =
        Math.min(
          maximum,
          item.quantity
        );
    }


    saveCart();

    renderCart();

    updateInventoryUI();
  }


  function removeItem(key) {

    cart =
      cart.filter(
        entry =>
          cartKey(entry) !== key
      );

    saveCart();

    renderCart();

    updateInventoryUI();
  }


  /* =========================
     CART DISPLAY
     ========================= */

  function renderCart() {

    cartItems.replaceChildren();


    const totalQuantity =
      cart.reduce(
        (sum, item) =>
          sum + item.quantity,
        0
      );


    const subtotal =
      cart.reduce(
        (sum, item) =>
          sum +
          item.price *
          item.quantity,
        0
      );


    countElement.textContent =
      totalQuantity;


    subtotalElement.textContent =
      money(subtotal);


    emptyMessage.hidden =
      cart.length !== 0;


    checkoutButton.disabled =
      cart.length === 0;


    cart.forEach(
      item => {

        const key =
          cartKey(item);


        const row =
          document.createElement(
            'div'
          );

        row.className =
          'cart-item';


        /*
         * Top row
         */

        const top =
          document.createElement(
            'div'
          );

        top.className =
          'cart-item-top';


        const description =
          document.createElement(
            'div'
          );


        const name =
          document.createElement(
            'div'
          );

        name.className =
          'cart-item-name';

        name.textContent =
          item.name;


        const variation =
          document.createElement(
            'div'
          );

        variation.className =
          'cart-item-variation';

        variation.textContent =
          item.variation;


        const lineTotal =
          document.createElement(
            'strong'
          );

        lineTotal.textContent =
          money(
            item.price *
            item.quantity
          );


        description.append(
          name,
          variation
        );


        top.append(
          description,
          lineTotal
        );


        /*
         * Quantity controls
         */

        const controls =
          document.createElement(
            'div'
          );

        controls.className =
          'cart-item-controls';


        const qty =
          document.createElement(
            'div'
          );

        qty.className =
          'cart-qty-controls';


        const minus =
          document.createElement(
            'button'
          );

        minus.type =
          'button';

        minus.className =
          'cart-qty-button';

        minus.textContent =
          '−';

        minus.setAttribute(
          'aria-label',
          `Decrease ${item.name} quantity`
        );

        minus.addEventListener(
          'click',
          () =>
            changeQuantity(
              key,
              -1
            )
        );


        const number =
          document.createElement(
            'span'
          );

        number.textContent =
          item.quantity;


        const plus =
          document.createElement(
            'button'
          );

        plus.type =
          'button';

        plus.className =
          'cart-qty-button';

        plus.textContent =
          '+';

        plus.setAttribute(
          'aria-label',
          `Increase ${item.name} quantity`
        );


        /*
         * Disable the cart + button when
         * we've reached known stock.
         */

        const stock =
          getStock(
            item.variationId
          );

        if (
          stock !== null &&
          item.quantity >= stock
        ) {
          plus.disabled =
            true;
        }


        plus.addEventListener(
          'click',
          () =>
            changeQuantity(
              key,
              1
            )
        );


        qty.append(
          minus,
          number,
          plus
        );


        /*
         * Remove
         */

        const remove =
          document.createElement(
            'button'
          );

        remove.type =
          'button';

        remove.className =
          'cart-remove-button';

        remove.textContent =
          'Remove';

        remove.addEventListener(
          'click',
          () =>
            removeItem(key)
        );


        controls.append(
          qty,
          remove
        );


        row.append(
          top,
          controls
        );


        cartItems.appendChild(
          row
        );
      }
    );
  }


  /* =========================
     CART DRAWER
     ========================= */

  function openCart() {

    drawer.classList.add(
      'open'
    );

    drawer.setAttribute(
      'aria-hidden',
      'false'
    );

    backdrop.hidden =
      false;

    document.body.classList.add(
      'cart-open'
    );

    closeButton.focus();
  }


  function closeCart() {

    drawer.classList.remove(
      'open'
    );

    drawer.setAttribute(
      'aria-hidden',
      'true'
    );

    backdrop.hidden =
      true;

    document.body.classList.remove(
      'cart-open'
    );
  }


  /* =========================
     OPTION BUTTONS
     ========================= */

  document
    .querySelectorAll(
      '.option-buttons'
    )
    .forEach(
      group => {

        const buttons =
          group.querySelectorAll(
            '.option-button'
          );


        buttons.forEach(
          button => {

            button.addEventListener(
              'click',
              () => {

                /*
                 * Disabled sold-out buttons
                 * shouldn't normally generate
                 * clicks, but protect against
                 * it anyway.
                 */

                if (button.disabled) {
                  return;
                }


                buttons.forEach(
                  other =>
                    other.classList.remove(
                      'selected'
                    )
                );


                button.classList.add(
                  'selected'
                );


                const product =
                  button.closest(
                    '.shop-product'
                  );


                /*
                 * Change the headband image
                 * with the selected color.
                 */

                if (
                  product &&
                  product.dataset.productId ===
                    'headband'
                ) {

                  updateHeadbandImage(
                    button.dataset.value
                  );
                }


                updateInventoryUI();
              }
            );
          }
        );
      }
    );


  /* =========================
     PRODUCT QUANTITY
     ========================= */

  document
    .querySelectorAll(
      '.shop-product'
    )
    .forEach(
      card => {

        const quantityDisplay =
          card.querySelector(
            '.product-quantity-value'
          );

        const minusButton =
          card.querySelector(
            '.quantity-minus'
          );

        const plusButton =
          card.querySelector(
            '.quantity-plus'
          );


        if (
          !quantityDisplay ||
          !minusButton ||
          !plusButton
        ) {
          return;
        }


        minusButton.addEventListener(
          'click',
          () => {

            let quantity =
              Number.parseInt(
                quantityDisplay.textContent,
                10
              ) || 1;


            quantity =
              Math.max(
                1,
                quantity - 1
              );


            quantityDisplay.textContent =
              quantity;
          }
        );


        plusButton.addEventListener(
          'click',
          () => {

            const selectedOption =
              card.querySelector(
                '.option-button.selected'
              );


            if (!selectedOption) {
              return;
            }


            const remaining =
              remainingStock(
                selectedOption.dataset.variationId
              );


            let quantity =
              Number.parseInt(
                quantityDisplay.textContent,
                10
              ) || 1;


            const maximum =
              remaining === null
                ? 99
                : Math.max(
                    1,
                    remaining
                  );


            quantity =
              Math.min(
                maximum,
                quantity + 1
              );


            quantityDisplay.textContent =
              quantity;
          }
        );
      }
    );


  /* =========================
     ADD TO CART
     ========================= */

  document
    .querySelectorAll(
      '.shop-product'
    )
    .forEach(
      card => {

        const addButton =
          card.querySelector(
            '.add-to-cart'
          );

        const quantityDisplay =
          card.querySelector(
            '.product-quantity-value'
          );


        if (
          !addButton ||
          !quantityDisplay
        ) {
          return;
        }


        addButton.addEventListener(
          'click',
          () => {

            const selectedOption =
              card.querySelector(
                '.option-button.selected'
              );


            if (!selectedOption) {
              return;
            }


            const variationId =
              selectedOption.dataset.variationId;


            if (!variationId) {

              console.error(
                'Selected product variation is missing its Square variation ID.'
              );

              return;
            }


            const quantity =
              Math.max(
                1,
                Math.min(
                  99,
                  Number.parseInt(
                    quantityDisplay.textContent,
                    10
                  ) || 1
                )
              );


            const remaining =
              remainingStock(
                variationId
              );


            /*
             * Known zero remaining stock means
             * the item cannot be added.
             */

            if (
              remaining !== null &&
              remaining <= 0
            ) {

              updateInventoryUI();

              return;
            }


            /*
             * Don't add more than the
             * remaining inventory.
             */

            const quantityToAdd =
              remaining === null
                ? quantity
                : Math.min(
                    quantity,
                    remaining
                  );


            addToCart({

              productId:
                card.dataset.productId,

              name:
                card.dataset.productName,

              price:
                Number.parseInt(
                  card.dataset.price,
                  10
                ),

              variation:
                selectedOption.dataset.value,

              variationId:
                variationId,

              quantity:
                quantityToAdd
            });


            /*
             * Reset product quantity
             * after adding.
             */

            quantityDisplay.textContent =
              '1';

            updateInventoryUI();
          }
        );
      }
    );


  /* =========================
     HEADBAND IMAGE
     ========================= */

  function updateHeadbandImage(
    color
  ) {

    const image =
      document.getElementById(
        'headband-product-image'
      );


    if (!image) {
      return;
    }


    const headbandImages = {

      Purple:
        'images/merch/MSB_Headband_Purple.png',

      Black:
        'images/merch/MSB_Headband_Black.png',

      White:
        'images/merch/MSB_Headband_White.png'
    };


    if (!headbandImages[color]) {
      return;
    }


    image.src =
      headbandImages[color];


    image.alt =
      `Midnight Soul Birds Headband in ${color.toLowerCase()}`;
  }


  /* =========================
     CHECKOUT
     ========================= */

  const CHECKOUT_URL =
    'https://midnight-soulbirds-store.kssummer.workers.dev/checkout';


  async function checkout() {

    if (
      cart.length === 0 ||
      checkoutButton.getAttribute(
        'aria-busy'
      ) === 'true'
    ) {
      return;
    }


    const originalText =
      checkoutButton.textContent;


    checkoutButton.textContent =
      'Opening Checkout…';

    checkoutButton.setAttribute(
      'aria-busy',
      'true'
    );


    try {

      const response =
        await fetch(
          CHECKOUT_URL,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({
              items: cart.map(
                item => ({
                  variationId:
                    item.variationId,

                  quantity:
                    item.quantity
                })
              )
            })
          }
        );


      const data =
        await response.json();


      /*
       * Inventory may have changed since
       * the customer loaded the shop.
       */

      if (response.status === 409) {

        checkoutButton.removeAttribute(
          'aria-busy'
        );

        checkoutButton.textContent =
          originalText;

        await loadInventory();

        alert(
          'Some items in your cart are no longer available in the requested quantity. Inventory has been updated. Please review your cart.'
        );

        return;
      }


      if (
        !response.ok ||
        !data.url
      ) {

        throw new Error(
          data.error ||
          'Unable to create checkout.'
        );
      }


      window.location.href =
        data.url;


    } catch (error) {

      console.error(
        'Checkout failed:',
        error
      );


      checkoutButton.removeAttribute(
        'aria-busy'
      );


      checkoutButton.textContent =
        originalText;


      alert(
        'Unable to start checkout. Please try again.'
      );
    }
  }


  /* =========================
     EVENTS
     ========================= */

  openButton.addEventListener(
    'click',
    openCart
  );


  closeButton.addEventListener(
    'click',
    closeCart
  );


  backdrop.addEventListener(
    'click',
    closeCart
  );


  document.addEventListener(
    'keydown',
    event => {

      if (
        event.key ===
          'Escape' &&
        drawer.classList.contains(
          'open'
        )
      ) {

        closeCart();
      }
    }
  );


  checkoutButton.addEventListener(
    'click',
    checkout
  );


  /* =========================
     INITIALIZE
     ========================= */

  window.addEventListener(
    'pageshow',
    () => {

      checkoutButton.removeAttribute(
        'aria-busy'
      );

      checkoutButton.textContent =
        'Checkout';

      renderCart();

      loadInventory();
    }
  );


  renderCart();

  loadInventory();

})();