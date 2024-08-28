document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const shopContainer = document.getElementById('shop-container');
    const header = document.getElementById('header');
    const productsContainer = document.getElementById('products');
    const cartContainer = document.getElementById('cart');
    const checkoutButton = document.getElementById('checkout-button');
    const searchInput = document.getElementById('search-input');
    const cartIcon = document.getElementById('cart-icon');
    const cartModal = document.getElementById('cart-modal');
    const closeCartModal = document.getElementById('close-cart-modal');
    const shippingZipInput = document.getElementById('shipping-zip');
    const calculateShippingButton = document.getElementById('calculate-shipping');
    const shippingCostElement = document.getElementById('shipping-cost');
    const totalCostElement = document.getElementById('total-cost');

    let products = [];
    let cart = [];
    let currentUser = null;

    // Função para buscar e exibir produtos
    function fetchAndDisplayProducts() {
        fetch('https://fakestoreapi.com/products')
            .then(response => response.json())
            .then(data => {
                products = data;
                displayProducts(products);
            })
            .catch(error => console.error('Erro ao buscar produtos:', error));
    }

    // Função para exibir os produtos na loja
    function displayProducts(productsList) {
        productsContainer.innerHTML = '';
        productsList.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product';
            productDiv.innerHTML = `
                <img src="${product.image}" alt="${product.title}">
                <div class="product-info">
                    <span>${product.title} - R$ ${product.price.toFixed(2)}</span>
                    <button onclick="addToCart(${product.id})">Adicionar ao Carrinho</button>
                </div>
            `;
            productsContainer.appendChild(productDiv);
        });
    }

    // Função para adicionar produto ao carrinho
    window.addToCart = function(productId) {
        const product = products.find(p => p.id === productId);
        if (product) {
            cart.push(product);
            showNotification('Produto adicionado ao carrinho');
            updateCart();
        }
    };

    // Função para exibir notificações
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);

        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    // Função para atualizar o carrinho
    function updateCart() {
        cartContainer.innerHTML = '';
        let total = 0;
        const cartItemsCount = {};

        cart.forEach(item => {
            if (!cartItemsCount[item.id]) {
                cartItemsCount[item.id] = {
                    ...item,
                    quantity: 0
                };
            }
            cartItemsCount[item.id].quantity++;
            total += item.price;
        });

        Object.values(cartItemsCount).forEach(item => {
            const listItem = document.createElement('li');
            listItem.className = 'cart-item';
            listItem.innerHTML = `
                <img src="${item.image}" alt="${item.title}" class="cart-item-image">
                <div class="cart-item-details">
                    <span class="cart-item-title">${item.title} - R$ ${item.price.toFixed(2)}</span>
                    <span class="cart-item-quantity">Quantidade: ${item.quantity}</span>
                </div>
            `;
            cartContainer.appendChild(listItem);
        });

        const totalElement = document.createElement('div');
        totalElement.id = 'cart-total';
        totalElement.textContent = `Total: R$ ${total.toFixed(2)}`;
        cartContainer.appendChild(totalElement);

        // Atualizar o total com frete quando o frete é calculado
        updateTotalWithShipping();
    }

    // Função para calcular o frete
    function calculateShipping() {
        const zipCode = shippingZipInput.value.replace(/\D/g, ''); // Remove caracteres não numéricos
        if (zipCode.length !== 8) {
            shippingCostElement.textContent = 'Por favor, insira um CEP válido com 8 dígitos.';
            totalCostElement.textContent = 'Total com Frete: R$ 0,00';
            return;
        }

        fetch(`https://viacep.com.br/ws/${zipCode}/json/`)
            .then(response => response.json())
            .then(data => {
                if (data.erro) {
                    shippingCostElement.textContent = 'CEP não encontrado.';
                    totalCostElement.textContent = 'Total com Frete: R$ 0,00';
                    return;
                }

                // Determina a região com base no estado
                const state = data.uf;
                let region = '';
                if (['AC', 'AM', 'AP', 'MA', 'MT', 'PA', 'RO', 'RR', 'TO'].includes(state)) {
                    region = 'Norte';
                } else if (['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'].includes(state)) {
                    region = 'Nordeste';
                } else if (['GO', 'MS', 'MT'].includes(state)) {
                    region = 'Centro-Oeste';
                } else if (['ES', 'MG', 'RJ', 'SP'].includes(state)) {
                    region = 'Sudeste';
                } else if (['PR', 'RS', 'SC'].includes(state)) {
                    region = 'Sul';
                }

                // Define o custo de frete com base na região
                let shippingCost = 0;
                switch (region) {
                    case 'Norte':
                        shippingCost = 30.00;
                        break;
                    case 'Nordeste':
                        shippingCost = 25.00;
                        break;
                    case 'Centro-Oeste':
                        shippingCost = 20.00;
                        break;
                    case 'Sudeste':
                        shippingCost = 15.00;
                        break;
                    case 'Sul':
                        shippingCost = 18.00;
                        break;
                    default:
                        shippingCostElement.textContent = 'Região não identificada.';
                        totalCostElement.textContent = 'Total com Frete: R$ 0,00';
                        return;
                }

                shippingCostElement.textContent = `Frete: R$ ${shippingCost.toFixed(2)}`;

                // Atualizar o total com o frete
                updateTotalWithShipping(shippingCost);
            })
            .catch(error => {
                console.error('Erro ao buscar CEP:', error);
                shippingCostElement.textContent = 'Erro ao calcular o frete.';
                totalCostElement.textContent = 'Total com Frete: R$ 0,00';
            });
    }

    // Função para atualizar o total com o frete
    function updateTotalWithShipping(shippingCost = 0) {
        const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
        const totalWithShipping = cartTotal + shippingCost;
        totalCostElement.textContent = `Total com Frete: R$ ${totalWithShipping.toFixed(2)}`;
    }

    // Adiciona o evento para calcular o frete
    calculateShippingButton.addEventListener('click', calculateShipping);

    // Função para realizar o login
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        currentUser = loginForm.querySelector('input[type="text"]').value;
        loginContainer.style.display = 'none';
        header.style.display = 'flex';
        shopContainer.style.display = 'block';
        fetchAndDisplayProducts();
    });

    // Função para realizar o registro
    registerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        alert('Registro realizado com sucesso!');
        registerContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    });

    // Alternar entre as telas de login e registro
    showRegisterLink.addEventListener('click', () => {
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'block';
    });

    showLoginLink.addEventListener('click', () => {
        registerContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    });

    // Função de pesquisa
    searchInput.addEventListener('input', () => {
        const searchQuery = searchInput.value.toLowerCase();
        const filteredProducts = products.filter(product => product.title.toLowerCase().includes(searchQuery));
        displayProducts(filteredProducts);
    });

    // Função para finalizar a compra
    checkoutButton.addEventListener('click', () => {
        if (cart.length > 0) {
            alert('Compra finalizada com sucesso!');
            cart = [];
            updateCart();
            closeCartModal.click();
        } else {
            alert('Seu carrinho está vazio.');
        }
    });

    // Exibir o modal do carrinho
    cartIcon.addEventListener('click', () => {
        cartModal.style.display = 'flex';
    });

    // Fechar o modal do carrinho
    closeCartModal.addEventListener('click', () => {
        cartModal.style.display = 'none';
    });

    // Fechar o modal do carrinho ao clicar fora dele
    window.addEventListener('click', (event) => {
        if (event.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });
});
