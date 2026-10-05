document.addEventListener('DOMContentLoaded', () => {
    // State
    let products = [];
    let cart = JSON.parse(localStorage.getItem('ie_cart')) || [];
    let currentGender = 'all';
    let currentCategory = 'all';
    let currentSearch = '';

    // DOM Elements
    const productsGrid = document.getElementById('productsGrid');
    const genderFilters = document.getElementById('genderFilters');
    const categoryFilters = document.getElementById('categoryFilters');
    const searchInput = document.getElementById('searchInput');
    const cartToggle = document.getElementById('cartToggle');
    const closeCartBtn = document.getElementById('closeCart');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartCount = document.getElementById('cartCount');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const cartFooter = document.getElementById('cartFooter');
    const btnCheckout = document.getElementById('btnCheckout');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    // Number placeholder
    const WHATSAPP_NUMBER = "5571991898348"; // Updated number

    // Initialize
    fetchProducts();
    updateCartUI();

    // Event Listeners
    cartToggle.addEventListener('click', toggleCart);
    closeCartBtn.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);
    btnCheckout.addEventListener('click', checkoutWhatsApp);

    // Fetch Products
    async function fetchProducts() {
        try {
            const response = await fetch('products.json?v=' + new Date().getTime());
            if (!response.ok) throw new Error("Failed to load products");
            products = await response.json();
            
            setupGenderFilters();
            renderCategories();
            renderProducts();
        } catch (error) {
            console.error("Error loading products:", error);
            productsGrid.innerHTML = `<div style="text-align:center; width:100%; color:var(--color-secondary);">
                <p>Erro ao carregar o catÃ¡logo. Tente atualizar a pÃ¡gina.</p>
            </div>`;
        }
    }

        // Search Listener
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase().trim();
            renderProducts();
        });
    }

    // Setup Filters
    function setupGenderFilters() {
        const btns = genderFilters.querySelectorAll('.filter-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active state
                btns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Update state and render
                currentGender = e.target.dataset.gender;
                currentCategory = 'all'; // Reset category when gender changes
                renderCategories();
                renderProducts();
            });
        });
    }

    function renderCategories() {
        categoryFilters.innerHTML = '';
        
        let availableProducts = products;
        if (currentGender !== 'all') {
            availableProducts = products.filter(p => p.gender === currentGender);
        }

        // Get unique categories
        const categories = [...new Set(availableProducts.map(p => p.category))];
        
        if (categories.length === 0) return;

        // Add 'All' button
        const btnAll = document.createElement('button');
        btnAll.className = `filter-btn ${currentCategory === 'all' ? 'active' : ''}`;
        btnAll.textContent = 'Todas';
        btnAll.addEventListener('click', () => {
            currentCategory = 'all';
            updateCategoryActiveState(btnAll);
            renderProducts();
        });
        categoryFilters.appendChild(btnAll);

        // Add specific categories
        categories.sort().forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `filter-btn ${currentCategory === cat ? 'active' : ''}`;
            btn.textContent = cat;
            btn.addEventListener('click', () => {
                currentCategory = cat;
                updateCategoryActiveState(btn);
                renderProducts();
            });
            categoryFilters.appendChild(btn);
        });
    }

    function updateCategoryActiveState(activeBtn) {
        const btns = categoryFilters.querySelectorAll('.filter-btn');
        btns.forEach(b => b.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    // Render Products
    function renderProducts() {
        let filteredProducts = products;
        
        if (currentGender !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.gender === currentGender);
        }
        
                if (currentCategory !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.category === currentCategory);
        }

        if (currentSearch !== '') {
            filteredProducts = filteredProducts.filter(p => {
                const sCode = p.code ? p.code.toLowerCase() : '';
                const sName = p.name ? p.name.toLowerCase() : '';
                return sCode.includes(currentSearch) || sName.includes(currentSearch);
            });
        }

        productsGrid.innerHTML = '';

        if (filteredProducts.length === 0) {
            productsGrid.innerHTML = `<p style="text-align:center; width:100%; color:var(--color-secondary);">Nenhum produto encontrado.</p>`;
            return;
        }

        filteredProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            const isMale = product.gender === 'masculino';
            const sizesInfoHTML = isMale ? `<div class="product-sizes-info">Tamanhos: P, M, G, GG</div>` : '';
            const codeHTML = product.code ? `<div class="product-code" style="font-size: 0.75rem; color: var(--color-secondary); margin-bottom: 0.25rem;">CÃ³d: ${product.code}</div>` : '';

            card.innerHTML = `
                <div class="product-image-wrapper">
                    <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.src='ASSETS/logoSemFundo.png'; this.style.objectFit='contain'; this.style.padding='2rem';">
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category} ${product.gender === 'masculino' ? 'Masc' : 'Fem'}</div>
                    <h3 class="product-title" style="margin-bottom: 0;">${product.name}</h3>
                    ${codeHTML}
                    ${sizesInfoHTML}
                    <button class="btn-add-cart" data-id="${product.id}">
                        <i class="fa-solid fa-plus"></i> Adicionar
                    </button>
                </div>
            `;
            
            // Add to cart event
            card.querySelector('.btn-add-cart').addEventListener('click', () => addToCart(product));
            
            productsGrid.appendChild(card);
        });
    }

    // Cart Functions
    function toggleCart() {
        cartSidebar.classList.toggle('active');
        cartOverlay.classList.toggle('active');
        if (cartSidebar.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    function addToCart(product) {
        // Check if item already exists
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }
        
        saveCart();
        updateCartUI();
        showToast("Produto adicionado Ã  sacola!");
    }

    function updateQuantity(id, change) {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                removeFromCart(id);
            } else {
                saveCart();
                updateCartUI();
            }
        }
    }

    function removeFromCart(id) {
        cart = cart.filter(item => item.id !== id);
        saveCart();
        updateCartUI();
    }

    function saveCart() {
        localStorage.setItem('ie_cart', JSON.stringify(cart));
    }

    function updateCartUI() {
        // Update count
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        
        // Update items list
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.appendChild(emptyCartMessage);
            cartFooter.classList.add('hidden');
        } else {
            cartFooter.classList.remove('hidden');
            
            cart.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                
                const sizesHTML = item.gender === 'masculino' ? `<div class="cart-item-size">Tamanhos Disp: P, M, G, GG</div>` : '';
                
                itemEl.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='ASSETS/logoSemFundo.png'">
                    <div class="cart-item-details">
                        <div>
                            <div class="cart-item-title">${item.name}</div>
                            ${sizesHTML}
                        </div>
                        <div class="cart-item-actions">
                            <div class="qty-control">
                                <button class="qty-btn" onclick="window.updateCartQuantity('${item.id}', -1)">-</button>
                                <span class="qty-input">${item.quantity}</span>
                                <button class="qty-btn" onclick="window.updateCartQuantity('${item.id}', 1)">+</button>
                            </div>
                            <button class="remove-item" onclick="window.removeCartItem('${item.id}')">Remover</button>
                        </div>
                    </div>
                `;
                cartItemsContainer.appendChild(itemEl);
            });
        }
    }

    // Expose functions to window for onclick handlers in innerHTML
    window.updateCartQuantity = updateQuantity;
    window.removeCartItem = removeFromCart;

    // Toast Notification
    function showToast(msg) {
        toastMessage.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // WhatsApp Checkout
    function checkoutWhatsApp() {
        if (cart.length === 0) return;
        
        let message = "OlÃ¡ IE! Gostaria de encomendar os seguintes itens:\n\n";
        
        cart.forEach((item, index) => {
            let itemDetails = `${index + 1}. ${item.name} (Qtd: ${item.quantity})`;
            if (item.code) {
                itemDetails += ` - Cod: ${item.code}`;
            }
            message += itemDetails + '\n';
            if (item.gender === 'masculino') {
                message += `   *Nota: O tamanho serÃ¡ definido com o vendedor.*\n`;
            }
            message += `   Ref: ${item.category}\n\n`;
        });
        
        message += "Gostaria de prosseguir com a compra!";
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
    }
});

