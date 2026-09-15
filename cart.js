(() => {

  const STORAGE_KEY = 'midnightSoulbirdsCart';

  let cart = loadCart();


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


  if (
    !openButton ||
    !closeButton ||
    !drawer ||
    !backdrop ||
    !cartItems ||
    !emptyMessage ||
    !countElement ||
    !subtotalElement
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


  function cartKey(
    productId,
    variation
  ) {

    return (
      `${productId}::${variation}`
    );
  }


  /* =========================
     CART OPERATIONS
     ========================= */

  function addToCart(product) {

    const key =
      cartKey(
        product.productId,
        product.variation
      );


    const existing =
      cart.find(
        item =>
          cartKey(
            item.productId,
            item.variation
          ) === key
      );


    if (existing) {

      existing.quantity =
        Math.min(
          99,
          existing.quantity +
            product.quantity
        );

    } else {

      cart.push(product);
    }


    saveCart();

    renderCart();

    openCart();
  }


  function changeQuantity(
    key,
    delta
  ) {

    const item =
      cart.find(
        entry =>
          cartKey(
            entry.productId,
            entry.variation
          ) === key
      );


    if (!item) {
      return;
    }


    item.quantity += delta;


    if (item.quantity <= 0) {

      cart =
        cart.filter(
          entry =>
            cartKey(
              entry.productId,
              entry.variation
            ) !== key
        );

    } else {

      item.quantity =
        Math.min(
          99,
          item.quantity
        );
    }


    saveCart();

    renderCart();
  }


  function removeItem(key) {

    cart =
      cart.filter(
        entry =>
          cartKey(
            entry.productId,
            entry.variation
          ) !== key
      );


    saveCart();

    renderCart();
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


    cart.forEach(
      item => {

        const key =
          cartKey(
            item.productId,
            item.variation
          );


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
                 * Change the headband
                 * image with the selected
                 * color.
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

            let quantity =
              Number.parseInt(
                quantityDisplay.textContent,
                10
              ) || 1;


            quantity =
              Math.min(
                99,
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

              quantity
            });


            /*
             * Reset product quantity
             * after adding.
             */

            quantityDisplay.textContent =
              '1';
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


  /* =========================
     INITIALIZE
     ========================= */

  renderCart();

})();