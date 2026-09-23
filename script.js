/**
 * FlyWheels Collection • Client Controller
 * Apple-Themed Interactions, Scroll Reveal, & Supabase Integration
 */

const SUPABASE_URL = "https://srqlpuyjyctlhlrhwlbl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_HgiF6vsuAJnnUPMTuwfAfQ_qB0LjVLh";

const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

let allCars = [];
let selectedCar = null; // { id, name, price }
let scrollObserver = null;

// Helper: Escape HTML to avoid injection
function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// -----------------------------------------------------------------------------
// Initialize IntersectionObserver for Apple-style Scroll Reveal
// -----------------------------------------------------------------------------
function initScrollObserver() {
    if (scrollObserver) {
        scrollObserver.disconnect();
    }

    const options = {
        root: null,
        rootMargin: "0px 0px -40px 0px",
        threshold: 0.1
    };

    scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                // Unobserve after revealing to optimize performance
                scrollObserver.unobserve(entry.target);
            }
        });
    }, options);

    document.querySelectorAll(".scroll-reveal:not(.is-visible)").forEach(el => {
        scrollObserver.observe(el);
    });
}

// -----------------------------------------------------------------------------
// Fetch & Load Cars from Supabase
// -----------------------------------------------------------------------------
async function loadCars() {
    try {
        const { data, error } = await client
            .from("cars")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error loading cars from Supabase:", error);
            showErrorState("Could not load vehicles. Please refresh the page.");
            return;
        }

        allCars = data || [];

        // 1. HD Logos Category
        const hdLogos = allCars.filter(car => car.category && car.category.toLowerCase().trim() === "hd logos");
        renderCarsToContainer(hdLogos, "hdlogos-container", "HD Logos");
        updateCount("count-hdlogos", hdLogos.length);

        // 2. Custom Builds Category (Previously missing from script)
        const builds = allCars.filter(car => car.category && (car.category.toLowerCase().trim() === "builds" || car.category.toLowerCase().trim() === "build"));
        renderCarsToContainer(builds, "builds-container", "Custom Builds");
        updateCount("count-builds", builds.length);

        // 3. 1 of 1 Category
        const oneOfOne = allCars.filter(car => car.category && car.category.toLowerCase().trim() === "1 of 1");
        renderCarsToContainer(oneOfOne, "oneofone-container", "1 of 1");
        updateCount("count-oneofone", oneOfOne.length);

        // 4. Bus Category
        const bus = allCars.filter(car => car.category && car.category.toLowerCase().trim() === "bus");
        renderCarsToContainer(bus, "bus-container", "Bus");
        updateCount("count-bus", bus.length);

        // 5. LATEST ARRIVALS (Shown after categories as requested)
        // Shows newest 6 cars overall
        const latestCars = allCars.slice(0, 6);
        renderCarsToContainer(latestCars, "latest-container", "Latest Arrivals");
        updateCount("count-latest", latestCars.length);

        // Re-attach scroll observer to all newly injected cards
        initScrollObserver();

    } catch (err) {
        console.error("Unexpected error in loadCars:", err);
    }
}

function updateCount(elementId, count) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = `${count} vehicle${count === 1 ? '' : 's'}`;
    }
}

function showErrorState(msg) {
    const containers = ["hdlogos-container", "builds-container", "oneofone-container", "bus-container", "latest-container"];
    containers.forEach(id => {
        const c = document.getElementById(id);
        if (c) c.innerHTML = `<p class="no-results">${msg}</p>`;
    });
}

// -----------------------------------------------------------------------------
// Shared Card Renderer (With 2-column mobile optimization and zoom triggers)
// -----------------------------------------------------------------------------
function renderCarsToContainer(cars, containerId, categoryTitle = "") {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    if (!cars || cars.length === 0) {
        container.innerHTML = `
            <div class="empty-category-card">
                <span style="font-size: 1.5rem; display: block; margin-bottom: 6px;">✨</span>
                Exclusive ${categoryTitle || 'custom'} drops arriving soon. Stay tuned!
            </div>
        `;
        return;
    }

    const fragment = document.createDocumentFragment();

    cars.forEach((car, index) => {
        const isAvailable = (car.status || "").toLowerCase().trim() === "available";
        const badgeClass = isAvailable ? "available" : "sold";
        const statusLabel = isAvailable ? "Available" : "Sold Out";

        const buttonHtml = isAvailable
            ? `<button
                    class="purchase-btn"
                    data-id="${car.id}"
                    data-name="${escapeHtml(car.name)}"
                    data-price="${car.price}">
                    <span>Order Now</span>
                    <span style="font-size: 0.9em;">→</span>
               </button>`
            : `<button disabled class="sold-btn">Sold Out</button>`;

        const card = document.createElement("div");
        card.className = "car-card scroll-reveal";
        // Stagger animation timing slightly for smooth Apple appearance
        card.style.transitionDelay = `${(index % 4) * 0.08}s`;

        card.innerHTML = `
            <div class="card-media" title="Tap to view fullscreen">
                <div class="badge ${badgeClass}">
                    ${statusLabel}
                </div>
                <img 
                    src="${car.image}" 
                    alt="${escapeHtml(car.name)}" 
                    loading="lazy"
                    onerror="this.onerror=null; this.src='images/hero.jpg';"
                >
                <div class="zoom-overlay-hint">
                    <span class="zoom-badge">🔍 Zoom</span>
                </div>
            </div>
            <div class="car-card-content">
                <h3 title="${escapeHtml(car.name)}">${escapeHtml(car.name)}</h3>
                <div class="car-card-footer">
                    <div class="car-price-row">
                        <span class="car-price-label">Price</span>
                        <span class="car-price">₹${car.price}</span>
                    </div>
                    ${buttonHtml}
                </div>
            </div>
        `;

        fragment.appendChild(card);
    });

    container.appendChild(fragment);
}

// -----------------------------------------------------------------------------
// Search & Spotlight Suggestions
// -----------------------------------------------------------------------------
const searchInput = document.getElementById("searchInput");
const searchClearBtn = document.getElementById("searchClearBtn");
const searchSuggestions = document.getElementById("searchSuggestions");
const searchResultsSection = document.getElementById("search-results-section");
const normalSections = document.getElementById("normal-sections");
const searchResultsContainer = document.getElementById("search-results-container");
const searchResultsTitle = document.getElementById("search-results-title");
const clearSearchLink = document.getElementById("clearSearchLink");

function performSearch() {
    if (!searchInput) return;

    const value = searchInput.value.trim().toLowerCase();

    if (searchClearBtn) {
        searchClearBtn.style.display = value.length > 0 ? "flex" : "none";
    }

    if (value === "") {
        // Reset to normal category browsing view
        if (searchResultsSection) searchResultsSection.style.display = "none";
        if (normalSections) normalSections.style.display = "block";
        if (searchSuggestions) searchSuggestions.style.display = "none";
        initScrollObserver();
        return;
    }

    // Filter matching cars
    const filtered = allCars.filter(car => 
        (car.name && car.name.toLowerCase().includes(value)) ||
        (car.category && car.category.toLowerCase().includes(value))
    );

    // Update search results section
    if (normalSections) normalSections.style.display = "none";
    if (searchResultsSection) searchResultsSection.style.display = "block";

    if (searchResultsTitle) {
        searchResultsTitle.textContent = `Search Results (${filtered.length} found)`;
    }

    renderCarsToContainer(filtered, "search-results-container", "Search Results");
    initScrollObserver();

    // Render suggestions dropdown (top 5 matches)
    if (searchSuggestions) {
        if (filtered.length > 0) {
            searchSuggestions.innerHTML = filtered.slice(0, 5).map(car => `
                <div class="search-item" data-name="${escapeHtml(car.name)}">
                    <span>${escapeHtml(car.name)}</span>
                    <span class="search-item-cat">${escapeHtml(car.category || 'CPM')} • ₹${car.price}</span>
                </div>
            `).join("");
            searchSuggestions.style.display = "block";
        } else {
            searchSuggestions.innerHTML = `
                <div class="search-item" style="cursor: default; color: var(--text-muted);">
                    No matching vehicles found.
                </div>
            `;
            searchSuggestions.style.display = "block";
        }
    }
}

if (searchInput) {
    searchInput.addEventListener("input", performSearch);

    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            resetSearch();
        }
    });
}

function resetSearch() {
    if (searchInput) {
        searchInput.value = "";
    }
    if (searchClearBtn) {
        searchClearBtn.style.display = "none";
    }
    if (searchSuggestions) {
        searchSuggestions.style.display = "none";
    }
    if (searchResultsSection) {
        searchResultsSection.style.display = "none";
    }
    if (normalSections) {
        normalSections.style.display = "block";
    }
    initScrollObserver();
}

if (searchClearBtn) {
    searchClearBtn.addEventListener("click", () => {
        resetSearch();
        searchInput.focus();
    });
}

if (clearSearchLink) {
    clearSearchLink.addEventListener("click", resetSearch);
}

// Click on search suggestion item
if (searchSuggestions) {
    searchSuggestions.addEventListener("click", (e) => {
        const item = e.target.closest(".search-item");
        if (item && item.dataset.name) {
            searchInput.value = item.dataset.name;
            searchSuggestions.style.display = "none";
            performSearch();
        }
    });
}

// Close suggestions when clicking outside
document.addEventListener("click", (e) => {
    if (searchSuggestions && !e.target.closest(".search-box-wrapper")) {
        searchSuggestions.style.display = "none";
    }
});

// -----------------------------------------------------------------------------
// Category Filter Pills (Apple Segmented Bar Navigation)
// -----------------------------------------------------------------------------
const categoryPills = document.querySelectorAll(".cat-pill");

categoryPills.forEach(pill => {
    pill.addEventListener("click", () => {
        // Toggle active visual state
        categoryPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");

        const targetId = pill.dataset.target;

        // If in search mode, reset to normal categories first
        if (searchResultsSection && searchResultsSection.style.display === "block") {
            resetSearch();
        }

        if (targetId === "all") {
            const collectionEl = document.getElementById("collection");
            if (collectionEl) {
                collectionEl.scrollIntoView({ behavior: "smooth" });
            }
        } else {
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    });
});

// Category Scroll-Spy: Update active pill as user scrolls through sections
window.addEventListener("scroll", () => {
    const sections = [
        { id: "hdlogos-section", pill: document.querySelector('.cat-pill[data-target="hdlogos-section"]') },
        { id: "builds-section", pill: document.querySelector('.cat-pill[data-target="builds-section"]') },
        { id: "oneofone-section", pill: document.querySelector('.cat-pill[data-target="oneofone-section"]') },
        { id: "bus-section", pill: document.querySelector('.cat-pill[data-target="bus-section"]') },
        { id: "latest-section", pill: document.querySelector('.cat-pill[data-target="latest-section"]') },
    ];

    const scrollPos = window.scrollY + 160;

    for (let i = sections.length - 1; i >= 0; i--) {
        const sec = document.getElementById(sections[i].id);
        if (sec && sec.offsetTop <= scrollPos) {
            categoryPills.forEach(p => p.classList.remove("active"));
            if (sections[i].pill) sections[i].pill.classList.add("active");
            return;
        }
    }

    // Default to 'all' if above first category
    if (window.scrollY < 400) {
        const allPill = document.querySelector('.cat-pill[data-target="all"]');
        if (allPill && !allPill.classList.contains("active")) {
            categoryPills.forEach(p => p.classList.remove("active"));
            allPill.classList.add("active");
        }
    }
}, { passive: true });

// -----------------------------------------------------------------------------
// Payment Popup Modal
// -----------------------------------------------------------------------------
const popup = document.getElementById("popup");
const popupCloseBtn = document.getElementById("popupCloseBtn");
const popupBackdrop = document.querySelector(".popup-backdrop");

const popupCarName = document.getElementById("popupCarName");
const popupOriginalPrice = document.getElementById("popupOriginalPrice");
const popupDiscountedRow = document.getElementById("popupDiscountedRow");
const popupDiscountedPrice = document.getElementById("popupDiscountedPrice");
const promoInput = document.getElementById("promoInput");
const promoMessage = document.getElementById("promoMessage");
const applyPromoBtn = document.getElementById("applyPromo");

document.addEventListener("click", (e) => {
    const btn = e.target.closest(".purchase-btn");
    if (btn) {
        selectedCar = {
            id: btn.dataset.id,
            name: btn.dataset.name,
            price: Number(btn.dataset.price)
        };

        // Reset popup state
        popupCarName.textContent = selectedCar.name;
        popupOriginalPrice.textContent = `₹${selectedCar.price}`;
        popupDiscountedRow.style.display = "none";
        popupDiscountedPrice.textContent = "";
        promoInput.value = "";
        promoMessage.textContent = "";
        promoMessage.className = "promo-message";

        popup.style.display = "flex";
        document.body.style.overflow = "hidden"; // Prevent background scroll
    }
});

function closePopup() {
    if (popup) {
        popup.style.display = "none";
        document.body.style.overflow = "";
    }
}

if (popupCloseBtn) popupCloseBtn.addEventListener("click", closePopup);
if (popupBackdrop) popupBackdrop.addEventListener("click", closePopup);

window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popup && popup.style.display === "flex") {
        closePopup();
    }
});

// -----------------------------------------------------------------------------
// Promo Code Application
// -----------------------------------------------------------------------------
if (applyPromoBtn) {
    applyPromoBtn.addEventListener("click", async () => {
        if (!selectedCar) {
            promoMessage.textContent = "Please select a vehicle first.";
            promoMessage.style.color = "#FF453A";
            return;
        }

        const code = promoInput.value.trim();

        if (!code) {
            promoMessage.textContent = "Please enter a promo code.";
            promoMessage.style.color = "#FF453A";
            return;
        }

        applyPromoBtn.disabled = true;
        applyPromoBtn.textContent = "Checking...";

        try {
            // Case-insensitive query to Supabase promo_codes table
            const { data, error } = await client
                .from("promo_codes")
                .select("*")
                .ilike("code", code)
                .single();

            if (error || !data) {
                promoMessage.textContent = "Invalid promo code.";
                promoMessage.style.color = "#FF453A";
                popupDiscountedRow.style.display = "none";
                return;
            }

            if (!data.active) {
                promoMessage.textContent = "This promo code has expired.";
                promoMessage.style.color = "#FF453A";
                popupDiscountedRow.style.display = "none";
                return;
            }

            const discountPercent = Number(data.discount);
            const discountedPrice = selectedCar.price - (selectedCar.price * discountPercent / 100);

            popupDiscountedPrice.textContent = `₹${discountedPrice.toFixed(0)}`;
            popupDiscountedRow.style.display = "flex";

            // Visual strike on original price
            popupOriginalPrice.style.textDecoration = "line-through";
            popupOriginalPrice.style.opacity = "0.6";

            promoMessage.textContent = `✓ Code applied! You saved ${discountPercent}%.`;
            promoMessage.style.color = "#30D158";

        } catch (err) {
            console.error("Promo code check failed:", err);
            promoMessage.textContent = "Error verifying promo code.";
            promoMessage.style.color = "#FF453A";
        } finally {
            applyPromoBtn.disabled = false;
            applyPromoBtn.textContent = "Apply";
        }
    });
}

// -----------------------------------------------------------------------------
// Fullscreen Image Viewer Modal
// -----------------------------------------------------------------------------
const viewer = document.getElementById("imageViewer");
const viewerImg = document.getElementById("viewerImg");
const viewerCloseBtn = document.getElementById("viewerCloseBtn");

document.addEventListener("click", (e) => {
    const cardMedia = e.target.closest(".card-media");
    if (cardMedia) {
        const img = cardMedia.querySelector("img");
        if (img && img.src && viewer && viewerImg) {
            viewerImg.src = img.src;
            viewer.style.display = "flex";
            document.body.style.overflow = "hidden";
        }
    }
});

function closeViewer() {
    if (viewer) {
        viewer.style.display = "none";
        document.body.style.overflow = "";
    }
}

if (viewerCloseBtn) viewerCloseBtn.addEventListener("click", closeViewer);

if (viewer) {
    viewer.addEventListener("click", (e) => {
        // If clicking outside the actual image, close viewer
        if (e.target === viewer || e.target.classList.contains("viewer-inner")) {
            closeViewer();
        }
    });
}

window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && viewer && viewer.style.display === "flex") {
        closeViewer();
    }
});

// -----------------------------------------------------------------------------
// Navbar Glass Scroll Effect
// -----------------------------------------------------------------------------
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
    if (navbar) {
        if (window.scrollY > 40) {
            navbar.classList.add("nav-scrolled");
        } else {
            navbar.classList.remove("nav-scrolled");
        }
    }
}, { passive: true });

// -----------------------------------------------------------------------------
// Boot Application
// -----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    loadCars();
    initScrollObserver();
});

// Immediate load in case DOM is already parsed
if (document.readyState === "complete" || document.readyState === "interactive") {
    loadCars();
    initScrollObserver();
}