const SUPABASE_URL = "https://srqlpuyjyctlhlrhwlbl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_HgiF6vsuAJnnUPMTuwfAfQ_qB0LjVLh";

const client = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let allCars = [];
let selectedCar = null; // { id, name, price }

async function loadCars() {

    const { data, error } = await client
        .from("cars")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    allCars = data;

    // Show the newest 6 cars
    const latestCars = data.slice(0, 6);
    renderCarsToContainer(latestCars, "latest-container");

    renderCarsToContainer(
        data.filter(car => car.category === "HD Logos"),
        "hdlogos-container"
    );

    renderCarsToContainer(
        data.filter(car => car.category === "1 of 1"),
        "oneofone-container"
    );

    renderCarsToContainer(
        data.filter(car => car.category === "Bus"),
        "bus-container"
    );
}

// ----------------------
// Shared card renderer
// (used for latest, categories, and search results)
// ----------------------

function renderCarsToContainer(cars, containerId) {

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    if (cars.length === 0) {
        container.innerHTML = `<p class="no-results">No cars found.</p>`;
        return;
    }

    cars.forEach(car => {

        const badgeClass =
            car.status.toLowerCase() === "available"
                ? "available"
                : "sold";

        const button =
            car.status.toLowerCase() === "available"
                ? `<button
                        class="purchase-btn"
                        data-id="${car.id}"
                        data-name="${car.name}"
                        data-price="${car.price}">
                        Purchase →
                   </button>`
                : `<button disabled class="sold-btn">SOLD OUT</button>`;

        container.innerHTML += `
            <div class="car-card">
                <div class="badge ${badgeClass}">
                    ${car.status.toUpperCase()}
                </div>
                <img src="${car.image}" alt="${car.name}">
                <div class="car-card-content">
                    <h3>${car.name}</h3>
                    <p>₹${car.price}</p>
                    ${button}
                </div>
            </div>
        `;
    });
}

loadCars();

// ----------------------
// Search
// ----------------------

const searchInput = document.getElementById("searchInput");

if (searchInput) {

    searchInput.addEventListener("input", () => {

        const value = searchInput.value.toLowerCase();

        const filtered = allCars.filter(car =>
            car.name.toLowerCase().includes(value)
        );

        const searchResultsSection = document.getElementById("search-results-section");
        const normalSections = document.getElementById("normal-sections");

        if (value.trim() === "") {
            // No search text: show normal category sections, hide search results
            if (searchResultsSection) searchResultsSection.style.display = "none";
            if (normalSections) normalSections.style.display = "block";
        } else {
            // Searching: hide normal sections, show filtered results
            if (searchResultsSection) searchResultsSection.style.display = "block";
            if (normalSections) normalSections.style.display = "none";
            renderCarsToContainer(filtered, "search-results-container");
        }

    });

}

// ----------------------
// Payment Popup
// ----------------------

const popup = document.getElementById("popup");
const closeBtn = document.querySelector(".close");

const popupCarName = document.getElementById("popupCarName");
const popupOriginalPrice = document.getElementById("popupOriginalPrice");
const popupDiscountedRow = document.getElementById("popupDiscountedRow");
const popupDiscountedPrice = document.getElementById("popupDiscountedPrice");
const promoInput = document.getElementById("promoInput");
const promoMessage = document.getElementById("promoMessage");

document.addEventListener("click", (e) => {

    if (e.target.matches(".purchase-btn")) {

        selectedCar = {
            id: e.target.dataset.id,
            name: e.target.dataset.name,
            price: Number(e.target.dataset.price)
        };

        // Reset popup state for the new car
        popupCarName.textContent = selectedCar.name;
        popupOriginalPrice.textContent = `₹${selectedCar.price}`;
        popupDiscountedRow.style.display = "none";
        popupDiscountedPrice.textContent = "";
        promoInput.value = "";
        promoMessage.textContent = "";

        popup.style.display = "flex";
    }

});

closeBtn.addEventListener("click", () => {
    popup.style.display = "none";
});

window.addEventListener("click", (e) => {

    if (e.target === popup) {
        popup.style.display = "none";
    }

});

// ----------------------
// Promo Code
// ----------------------

const applyPromoBtn = document.getElementById("applyPromo");

if (applyPromoBtn) {

    applyPromoBtn.addEventListener("click", async () => {

        if (!selectedCar) {
            promoMessage.textContent = "Please select a car first.";
            return;
        }

        const code = promoInput.value.trim();

        if (!code) {
            promoMessage.textContent = "Enter a promo code.";
            return;
        }

        // Look up the promo code (case-insensitive match)
        const { data, error } = await client
            .from("promo_codes")
            .select("*")
            .ilike("code", code)
            .single();

        if (error || !data) {
            promoMessage.textContent = "Invalid promo code.";
            promoMessage.style.color = "#d32f2f";
            popupDiscountedRow.style.display = "none";
            return;
        }

        if (!data.active) {
            promoMessage.textContent = "This promo code is no longer active.";
            promoMessage.style.color = "#d32f2f";
            popupDiscountedRow.style.display = "none";
            return;
        }

        const discountPercent = Number(data.discount);
        const discountedPrice = selectedCar.price - (selectedCar.price * discountPercent / 100);

        popupDiscountedPrice.textContent = `₹${discountedPrice.toFixed(2)}`;
        popupDiscountedRow.style.display = "block";

        promoMessage.textContent = `Promo applied! ${discountPercent}% off.`;
        promoMessage.style.color = "#4caf50";

    });

}

// ----------------------
// Image Viewer
// ----------------------

const viewer = document.getElementById("imageViewer");
const viewerImg = document.getElementById("viewerImg");

document.addEventListener("click", (e) => {

    if (e.target.matches(".car-card img")) {
        viewer.style.display = "flex";
        viewerImg.src = e.target.src;
    }

});

viewer.addEventListener("click", () => {
    viewer.style.display = "none";
});