// main.js

// --- Global DOMContentLoaded Listener ---
document.addEventListener('DOMContentLoaded', () => {
    // Inject Navbar and Footer
    renderNavbar(window.location.pathname);
    renderFooter();

    // Determine current page and call its specific logic
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === '' || currentPage === 'index.html') {
        initHomePage();
    } else if (currentPage === 'products.html') {
        initProductsPage();
    } else if (currentPage === 'product-detail.html') {
        initProductDetailPage();
    } else if (currentPage === 'cart.html') {
        initCartPage();
    } else if (currentPage === 'about.html') {
        initAboutPage(); // Static page, might just add animations
    } else if (currentPage === 'contact.html') {
        initContactPage();
    }

    // Optional: Universal animation trigger for elements with 'animated' class
    const animatedElements = document.querySelectorAll('.animated');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible'); // Custom class to trigger animation
                // For one-time animation, disconnect after first intersection
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 }); // Trigger when 10% of element is visible

    animatedElements.forEach(element => {
        observer.observe(element);
    });

    // --- Search Functionality Global Listeners ---
    const searchOverlay = document.getElementById('search-overlay');
    const searchInput = document.getElementById('search-input');
    const globalSearchForm = document.getElementById('global-search-form');
    const closeSearchBtn = document.getElementById('close-search');

    // Open Search Overlay
    document.body.addEventListener('click', (event) => {
        if (event.target.closest('.search-toggle-btn')) { // Check if the search icon in navbar was clicked
            searchOverlay.classList.add('active');
            searchInput.focus(); // Focus on the input field
        }
    });

    // Close Search Overlay
    if (closeSearchBtn) {
        closeSearchBtn.addEventListener('click', () => {
            searchOverlay.classList.remove('active');
            searchInput.value = ''; // Clear search input on close
        });
    }

    // Handle Search Form Submission
    if (globalSearchForm) {
        globalSearchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                window.location.href = `products.html?search=${encodeURIComponent(searchTerm)}`;
                searchOverlay.classList.remove('active'); // Close overlay after redirect
            } else {
                showToast('Please enter a search term.', 'info');
            }
        });
    }
    // End Search Functionality Global Listeners
});


// ===========================================================================
// --- 1. Global Helper Functions (showToast) ---
// ===========================================================================

// --- Toast Notification ---
const showToast = (message, type = 'info', duration = 3000) => {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    toast.innerHTML = `
        <div>
            <p class="mb-0 fw-semibold">${message}</p>
        </div>
        <button class="custom-toast-close">&times;</button>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10); // Small delay for CSS transition

    const timeoutId = setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);

    toast.querySelector('.custom-toast-close').addEventListener('click', () => {
        clearTimeout(timeoutId);
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    });
};


// ===========================================================================
// --- 2. Reusable UI Components (Navbar, Footer, ProductCard) ---
// ===========================================================================

// --- Navbar Component ---
function renderNavbar(currentPath) {
    const navbarContainer = document.getElementById('navbar-container');
    if (!navbarContainer) return;

    const navLinks = [
        { name: "Home", path: "index.html" },
        { name: "Products", path: "products.html" },
        { name: "Cart", path: "cart.html" },
        { name: "About", path: "about.html" },
        { name: "Contact", path: "contact.html" },
    ];

    const generateNavItems = () => {
        return navLinks.map(link => `
            <li class="nav-item">
                <a class="nav-link ${currentPath.includes(link.path) ? 'active' : ''}" href="${link.path}">
                    ${link.name}
                </a>
            </li>
        `).join('');
    };

    const cartCount = getCartCount(); // From Cart Management section

    navbarContainer.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-light navbar-custom sticky-top">
            <div class="container">
                <a class="navbar-brand navbar-brand-custom" href="index.html">Fashion<span class="accent-logo">Hub</span></a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <i class="fa-solid fa-bars"></i>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav mx-auto">
                        ${generateNavItems()}
                    </ul>
                    <div class="d-flex align-items-center">
                        <button class="btn btn-link text-primary-dark p-0 me-3 d-none d-lg-block search-toggle-btn" aria-label="Search">
                            <i class="fa-solid fa-magnifying-glass icon-medium"></i>
                        </button>
                        <a href="cart.html" class="position-relative text-primary-dark me-2">
                            <i class="fa-solid fa-bag-shopping icon-medium"></i>
                            ${cartCount > 0 ? `<span class="badge bg-accent-red rounded-pill position-absolute top-0 start-100 translate-middle" style="font-size: 0.7em;">${cartCount}</span>` : ''}
                        </a>
                        <a href="contact.html">
                        <button class="btn btn-link text-primary-dark p-0 d-none d-lg-block" aria-label="User Account">
                            <i class="fa-solid fa-user icon-medium"></i>
                        </button>
                        </a>
                    </div>
                </div>
            </div>
        </nav>
    `;

    // Update cart count dynamically
    window.removeEventListener('cartUpdated', updateNavbarCartCount); // Prevent duplicate listeners
    window.addEventListener('cartUpdated', updateNavbarCartCount);
}

function updateNavbarCartCount() {
    const navbarContainer = document.getElementById('navbar-container');
    if (!navbarContainer) return;

    let cartBadge = navbarContainer.querySelector('.navbar-custom .badge');
    const newCartCount = getCartCount();

    if (newCartCount > 0) {
        if (cartBadge) {
            cartBadge.textContent = newCartCount;
        } else {
            // If badge was removed (e.g., cart became empty then new item added)
            const cartLink = navbarContainer.querySelector('a[href="cart.html"]');
            if (cartLink) {
                const newBadge = document.createElement('span');
                newBadge.className = "badge bg-accent-red rounded-pill position-absolute top-0 start-100 translate-middle";
                newBadge.style.fontSize = "0.7em";
                newBadge.textContent = newCartCount;
                cartLink.appendChild(newBadge);
            }
        }
    } else if (cartBadge) {
        cartBadge.remove();
    }
}


// --- Footer Component ---
function renderFooter() {
    const footerContainer = document.getElementById('footer-container');
    if (!footerContainer) return;

    footerContainer.innerHTML = `
        <footer class="footer-custom mt-5">
            <div class="container py-5">
                <div class="row">
                    <div class="col-lg-4 col-md-6 mb-4 mb-lg-0">
                        <h4 class="navbar-brand-custom mb-3">Fashion<span class="accent-logo">Hub</span></h4>
                        <p class="text-primary-light">Your ultimate destination for trendy fashion. We offer quality products to elevate your style.</p>
                        <div class="social-links mt-4">
                            <a href="https://www.facebook.com/rabiasohail1209/" aria-label="Facebook"><i class="fa-brands fa-facebook-f fa-icon"></i></a>
                            <a href="https://x.com/rabiasohail1209" aria-label="Twitter"><i class="fa-brands fa-x-twitter fa-icon"></i></a>
                            <a href="https://www.instagram.com/rabiasohail642/" aria-label="Instagram"><i class="fa-brands fa-instagram fa-icon"></i></a>
                        </div>
                    </div>
                    <div class="col-lg-2 col-md-6 mb-4 mb-lg-0">
                        <h4>Quick Links</h4>
                        <ul class="list-unstyled">
                            <li><a href="index.html">Home</a></li>
                            <li><a href="products.html">Products</a></li>
                            <li><a href="about.html">About Us</a></li>
                            <li><a href="contact.html">Contact</a></li>
                            <li><a href="cart.html">Cart</a></li>
                        </ul>
                    </div>
                    <div class="col-lg-3 col-md-6 mb-4 mb-lg-0">
                        <h4>Contact Info</h4>
                        <ul class="list-unstyled">
                            <li><i class="fa-solid fa-location-dot fa-icon me-2"></i> 123 Fashion Street, New York, NY 10001</li>
                            <li><i class="fa-solid fa-phone fa-icon me-2"></i> +1 (555) 123-4567</li>
                            <li><i class="fa-solid fa-envelope fa-icon me-2"></i> info@fashionhub.com</li>
                        </ul>
                    </div>
                    <div class="col-lg-3 col-md-6 mb-4 mb-lg-0">
                        <h4>Newsletter</h4>
                        <p class="text-primary-light">Subscribe to our newsletter for latest updates.</p>
                        <form class="d-flex">
                            <input type="email" class="form-control me-2" placeholder="Your Email" aria-label="Email for Newsletter">
                            <button type="submit" class="btn btn-accent-custom">Subscribe</button>
                        </form>
                    </div>
                </div>
                <div class="text-center footer-bottom">
                    <p class="mb-0">&copy; ${new Date().getFullYear()} FashionHub. All rights reserved.</p>
                </div>
            </div>
        </footer>
    `;
}

// --- Product Card Component ---
const defaultProductImage = 'assets/images/placeholder.jpg'; // Placeholder image path

function createProductCard(product) {
    return `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
            <div class="card product-card-custom h-100">
                <a href="product-detail.html?id=${product.id}">
                    <img src="${product.image || defaultProductImage}" class="card-img-top" alt="${product.title}">
                </a>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${product.title}</h5>
                    <p class="card-price mt-auto">$${product.price ? product.price.toFixed(2) : '0.00'}</p>
                    <a href="product-detail.html?id=${product.id}" class="btn btn-primary-custom">View Details</a>
                </div>
            </div>
        </div>
    `;
}


// ===========================================================================
// --- 3. API Interaction (Functions for API calls) ---
// ===========================================================================

const API_BASE_URL = 'https://fakestoreapi.com'; // Using FakeStoreAPI as primary

async function fetchProducts(limit = null, category = null, searchTerm = null) {
    let url = `${API_BASE_URL}/products`;
    const params = [];
    
    if (category && category !== 'all') {
        url = `${API_BASE_URL}/products/category/${category}`;
    }
    
    // Add limit if present
    if (limit) {
        params.push(`limit=${limit}`);
    }
    
    // Add search term if present (Note: FakeStoreAPI does not have native search.
    // We will fetch all and filter in JS if searchTerm is provided.)
    // If using a different API that supports search, this would be `params.push('q=' + searchTerm)`

    if (params.length > 0) {
        url += `?${params.join('&')}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let products = await response.json();

        // Manual filtering for search term if API doesn't support it directly
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            products = products.filter(product => 
                product.title.toLowerCase().includes(lowerCaseSearchTerm) ||
                product.description.toLowerCase().includes(lowerCaseSearchTerm) ||
                product.category.toLowerCase().includes(lowerCaseSearchTerm)
            );
        }

        return products;
    } catch (error) {
        console.error("Error fetching products:", error);
        showToast('Failed to load products. Please try again later.', 'error');
        return [];
    }
}

async function fetchProductById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data || Object.keys(data).length === 0) {
            throw new Error(`Product with ID ${id} not found.`);
        }
        return data;
    } catch (error) {
        console.error(`Error fetching product with ID ${id}:`, error);
        showToast(`Failed to load product details for ID ${id}.`, 'error');
        return null;
    }
}

async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/products/categories`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching categories:", error);
        showToast('Failed to load product categories.', 'error');
        return [];
    }
}


// ===========================================================================
// --- 4. Cart Management Logic (using localStorage) ---
// ===========================================================================

// Cart item structure: { id, title, price, image, quantity }

function getCart() {
    try {
        const cart = localStorage.getItem('shoppingCart');
        return cart ? JSON.parse(cart) : [];
    } catch (e) {
        console.error("Error reading cart from localStorage:", e);
        return [];
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated')); // Notify UI to update
    } catch (e) {
        console.error("Error saving cart to localStorage:", e);
        showToast('Could not save cart changes.', 'error');
    }
}

function addToCart(product) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
        showToast(`${product.title} quantity increased in cart!`, 'info');
    } else {
        cart.push({ ...product, quantity: 1 });
        showToast(`${product.title} added to cart!`, 'success');
    }
    saveCart(cart);
}

function removeFromCart(productId) {
    let cart = getCart();
    const itemToRemove = cart.find(item => item.id === productId);
    if (itemToRemove) {
        cart = cart.filter(item => item.id !== productId);
        saveCart(cart);
        showToast(`${itemToRemove.title} removed from cart.`, 'info');
    }
}

function updateCartItemQuantity(productId, newQuantity) {
    let cart = getCart();
    const item = cart.find(item => item.id === productId);

    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            saveCart(cart);
            showToast(`${item.title} quantity updated to ${newQuantity}.`, 'info');
        }
    }
}

function getCartCount() {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}


// ===========================================================================
// --- 5. Page Specific Logic ---
// ===========================================================================

// --- Home Page (index.html) Logic ---
async function initHomePage() {
    const featuredProductsGrid = document.getElementById('featured-products-grid');

    // Function to render skeleton loaders
    const renderSkeletons = (count) => {
        featuredProductsGrid.innerHTML = Array(count).fill(0).map(() => `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="card product-card-custom h-100 skeleton-loading">
                    <div class="skeleton-img-placeholder"></div>
                    <div class="card-body">
                        <div class="skeleton-text skeleton-title"></div>
                        <div class="skeleton-text skeleton-price"></div>
                        <div class="btn btn-primary-custom w-100 skeleton-text" style="height: 48px;"></div>
                    </div>
                </div>
            </div>
        `).join('');
    };

    renderSkeletons(4); // Show 4 skeletons initially

    try {
        const products = await fetchProducts(4); // Fetch 4 products for featured section

        if (products && products.length > 0) {
            featuredProductsGrid.innerHTML = products.map(product => createProductCard(product)).join('');
        } else {
            featuredProductsGrid.innerHTML = '<div class="col-12 text-center text-muted-gray py-5">No featured products found.</div>';
        }
    } catch (error) {
        console.error("Error loading featured products:", error);
        featuredProductsGrid.innerHTML = '<div class="col-12 text-center text-danger py-5">Failed to load featured products. Please try again.</div>';
    }
}

// --- All Products Page (products.html) Logic ---
async function initProductsPage() {
    const productsGrid = document.getElementById('all-products-grid');
    const categoryFilter = document.getElementById('category-filter');
    const productCountSpan = document.getElementById('product-count');
    const noProductsMessage = document.getElementById('no-products-message');

    let currentCategory = 'all';
    
    // Check for search term in URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search');
    let filteredProducts = [];

    // Function to render skeleton loaders
    const renderSkeletons = (count) => {
        productsGrid.innerHTML = Array(count).fill(0).map(() => `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="card product-card-custom h-100 skeleton-loading">
                    <div class="skeleton-img-placeholder"></div>
                    <div class="card-body">
                        <div class="skeleton-text skeleton-title"></div>
                        <div class="skeleton-text skeleton-price"></div>
                        <div class="btn btn-primary-custom w-100 skeleton-text" style="height: 48px;"></div>
                    </div>
                </div>
            </div>
        `).join('');
        noProductsMessage.classList.add('d-none');
    };

    // Function to fetch and render products
    const renderProducts = async (category = 'all', currentSearchTerm = null) => {
        renderSkeletons(8); // Show 8 skeletons
        productsGrid.classList.remove('justify-content-center'); // Align to start

        try {
            // Pass search term to fetchProducts
            const products = await fetchProducts(null, category, currentSearchTerm);

            if (products && products.length > 0) {
                productsGrid.innerHTML = products.map(product => createProductCard(product)).join('');
                productCountSpan.textContent = `${products.length} Products`;
                noProductsMessage.classList.add('d-none');
            } else {
                productsGrid.innerHTML = '';
                productCountSpan.textContent = '0 Products';
                noProductsMessage.classList.remove('d-none');
                productsGrid.classList.add('justify-content-center'); // Center if no products
            }
        } catch (error) {
            console.error("Error rendering products:", error);
            productsGrid.innerHTML = '<div class="col-12 text-center text-danger py-5">Failed to load products. Please try again.</div>';
            productCountSpan.textContent = '0 Products';
            noProductsMessage.classList.remove('d-none');
        }
    };

    // Populate categories filter
    const populateCategories = async () => {
        try {
            const categories = await fetchCategories();
            if (categories && categories.length > 0) {
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat;
                    option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
                    categoryFilter.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Error populating categories:", error);
            showToast('Failed to load categories for filter.', 'error');
        }
    };

    // Event listener for category change
    categoryFilter.addEventListener('change', (event) => {
        currentCategory = event.target.value;
        renderProducts(currentCategory, searchTerm); // Pass search term as well
    });

    // Initial load
    await populateCategories();
    renderProducts(currentCategory, searchTerm); // Initial render with possible search term
}

// --- Product Detail Page (product-detail.html) Logic ---
async function initProductDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    const productDetailContainer = document.getElementById('product-detail-container');

    if (!productId) {
        productDetailContainer.innerHTML = '<div class="alert alert-danger text-center my-5 animated fadeIn">Product ID is missing in the URL.</div>';
        return;
    }

    try {
        const product = await fetchProductById(productId);

        if (product) {
            productDetailContainer.innerHTML = `
                <div class="row g-5 align-items-center">
                    <div class="col-md-6 animated fadeInLeft">
                        <img src="${product.image || defaultProductImage}" class="img-fluid product-detail-img shadow-sm" alt="${product.title}">
                    </div>
                    <div class="col-md-6 animated fadeInRight">
                        <p class="category-tag mb-2">${product.category}</p>
                        <h1 class="fw-bold mb-3">${product.title}</h1>
                        <p class="price mb-4">$${product.price ? product.price.toFixed(2) : '0.00'}</p>
                        <p class="description mb-4">${product.description}</p>
                        
                        <div class="d-grid gap-3 d-md-block add-to-cart-btn">
                            <button id="add-to-cart-btn" class="btn btn-accent-custom btn-lg me-md-2">
                                <i class="fa-solid fa-cart-plus me-2"></i> Add to Cart
                            </button>
                            <a href="products.html" class="btn btn-outline-primary-custom btn-lg">Continue Shopping</a>
                        </div>
                    </div>
                </div>
            `;

            // Add to Cart functionality
            const addToCartBtn = document.getElementById('add-to-cart-btn');
            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', () => {
                    addToCart({
                        id: product.id,
                        title: product.title,
                        price: product.price,
                        image: product.image,
                    });
                    // Navbar's cart count will be updated via 'cartUpdated' event
                });
            }

        } else {
            productDetailContainer.innerHTML = '<div class="alert alert-warning text-center my-5 animated fadeIn">Product not found.</div>';
        }
    } catch (error) {
        console.error("Error loading product details:", error);
        productDetailContainer.innerHTML = '<div class="alert alert-danger text-center my-5 animated fadeIn">Failed to load product details. Please try again.</div>';
    }
}

// --- Cart Page (cart.html) Logic ---
function initCartPage() {
    const cartItemsList = document.getElementById('cart-items-list');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const orderSummary = document.getElementById('order-summary');
    const cartSubtotalSpan = document.getElementById('cart-subtotal');
    const cartTotalSpan = document.getElementById('cart-total');

    const renderCart = () => {
        const cart = getCart();
        cartItemsList.innerHTML = ''; // Clear previous items

        if (cart.length === 0) {
            emptyCartMessage.classList.remove('d-none');
            orderSummary.classList.add('d-none');
            cartItemsList.classList.add('d-none');
            return;
        }

        emptyCartMessage.classList.add('d-none');
        orderSummary.classList.remove('d-none');
        cartItemsList.classList.remove('d-none');

        cart.forEach(item => {
            const cartItemDiv = document.createElement('div');
            cartItemDiv.className = 'cart-item-card d-flex align-items-center p-3 animated fadeInUp';
            cartItemDiv.innerHTML = `
                <a href="product-detail.html?id=${item.id}" class="flex-shrink-0 me-3">
                    <img src="${item.image || defaultProductImage}" alt="${item.title}" class="cart-item-img">
                </a>
                <div class="flex-grow-1">
                    <h5 class="cart-item-title mb-1">
                        <a href="product-detail.html?id=${item.id}" class="text-decoration-none text-primary-dark">${item.title}</a>
                    </h5>
                    <p class="text-muted-gray mb-1">$${item.price.toFixed(2)}</p>
                    <div class="d-flex align-items-center quantity-control mt-2">
                        <button class="btn btn-outline-secondary btn-sm quantity-minus" data-id="${item.id}"><i class="fa-solid fa-minus"></i></button>
                        <span class="mx-2 fw-bold">${item.quantity}</span>
                        <button class="btn btn-outline-secondary btn-sm quantity-plus" data-id="${item.id}"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>
                <div class="text-end">
                    <p class="cart-item-price mb-2">$${(item.price * item.quantity).toFixed(2)}</p>
                    <button class="btn btn-danger btn-sm remove-item" data-id="${item.id}"><i class="fa-solid fa-trash-can icon-small me-1"></i> Remove</button>
                </div>
            `;
            cartItemsList.appendChild(cartItemDiv);
        });

        updateOrderSummary();
        attachCartEventListeners();
    };

    const updateOrderSummary = () => {
        const subtotal = getCartTotal();
        cartSubtotalSpan.textContent = `$${subtotal.toFixed(2)}`;
        cartTotalSpan.textContent = `$${subtotal.toFixed(2)}`; // Assuming free shipping
    };

    const attachCartEventListeners = () => {
        cartItemsList.querySelectorAll('.quantity-minus').forEach(button => {
            button.onclick = (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                const item = getCart().find(i => i.id === id);
                if (item && item.quantity > 1) {
                    updateCartItemQuantity(id, item.quantity - 1);
                } else if (item && item.quantity === 1) {
                    // Optionally ask for confirmation before removing last item
                    if (confirm('Are you sure you want to remove this item from your cart?')) {
                        removeFromCart(id);
                    }
                }
            };
        });

        cartItemsList.querySelectorAll('.quantity-plus').forEach(button => {
            button.onclick = (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                const item = getCart().find(i => i.id === id);
                if (item) {
                    updateCartItemQuantity(id, item.quantity + 1);
                }
            };
        });

        cartItemsList.querySelectorAll('.remove-item').forEach(button => {
            button.onclick = (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                if (confirm('Are you sure you want to remove this item from your cart?')) {
                    removeFromCart(id);
                }
            };
        });
    };

    // Initial render and re-render on cart updates
    renderCart();
    window.addEventListener('cartUpdated', renderCart);
}

// --- About Page (about.html) Logic ---
function initAboutPage() {
    // About page has static content, so no complex JS needed here
    // main.js already renders navbar and footer.
    // You can add any specific animations or interactions here if required.
    const aboutImage = document.querySelector('.about-image');
    if (aboutImage) {
        aboutImage.classList.add('animated', 'fadeInUp');
        aboutImage.style.animationDelay = '0.3s'; // Example delay
    }

    // Features icons (using Font Awesome now)
    const featureIcons = document.querySelectorAll('.feature-box .icon');
    featureIcons.forEach(iconDiv => {
        // Assume the content inside iconDiv is now text or emoji to map
        const currentContent = iconDiv.textContent.trim();
        let faClass = '';
        switch (currentContent) {
            case '🌟': faClass = 'fa-solid fa-gem'; break;       // Premium Quality
            case '👗': faClass = 'fa-solid fa-shirt'; break;     // Latest Trends
            case '💖': faClass = 'fa-solid fa-heart'; break;     // Customer Love
            // default: faClass = 'fa-solid fa-circle-info'; break; // Fallback
        }
        iconDiv.innerHTML = `<i class="${faClass} icon-large"></i>`; // icon-large class for size
    });
}

// --- Contact Page (contact.html) Logic ---
function initContactPage() {
    const contactForm = document.getElementById('contact-form');

    const validateField = (inputElement, minLength, regex = null) => {
        const value = inputElement.value.trim();
        const feedbackElement = document.getElementById(`${inputElement.id}Feedback`);

        inputElement.classList.remove('is-invalid-custom', 'is-valid');
        feedbackElement.textContent = '';

        if (!value) {
            inputElement.classList.add('is-invalid-custom');
            feedbackElement.textContent = `${inputElement.previousElementSibling.textContent.replace('*', '').trim()} is required.`;
            return false;
        }
        if (minLength && value.length < minLength) {
            inputElement.classList.add('is-invalid-custom');
            feedbackElement.textContent = `${inputElement.previousElementSibling.textContent.replace('*', '').trim()} must be at least ${minLength} characters.`;
            return false;
        }
        if (regex && !regex.test(value)) {
            inputElement.classList.add('is-invalid-custom');
            feedbackElement.textContent = `Please enter a valid ${inputElement.previousElementSibling.textContent.replace('*', '').trim().toLowerCase()}.`;
            return false;
        }
        
        inputElement.classList.add('is-valid'); // Optional: show green border for valid fields
        return true;
    };

    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent default form submission

            const fullNameInput = document.getElementById('fullName');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('message');

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            const isFullNameValid = validateField(fullNameInput, 2);
            const isEmailValid = validateField(emailInput, null, emailRegex);
            const isMessageValid = validateField(messageInput, 10);

            if (isFullNameValid && isEmailValid && isMessageValid) {
                // All validations pass
                showToast('Message sent successfully!', 'success');
                contactForm.reset(); // Clear the form
                // Remove 'is-valid' class after reset
                fullNameInput.classList.remove('is-valid');
                emailInput.classList.remove('is-valid');
                messageInput.classList.remove('is-valid');

                // In a real application, you would send this data to a backend
                console.log('Form Submitted:', {
                    fullName: fullNameInput.value.trim(),
                    email: emailInput.value.trim(),
                    message: messageInput.value.trim()
                });

            } else {
                showToast('Please correct the errors in the form.', 'error');
            }
        });

        // Live validation on blur
        document.getElementById('fullName').addEventListener('blur', (e) => validateField(e.target, 2));
        document.getElementById('email').addEventListener('blur', (e) => validateField(e.target, null, /^[^\s@]+@[^\s@]+\.[^\s@]+$/));
        document.getElementById('message').addEventListener('blur', (e) => validateField(e.target, 10));
    }
}