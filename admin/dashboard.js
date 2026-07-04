const SUPABASE_URL = "https://srqlpuyjyctlhlrhwlbl.supabase.co";
const SUPABASE_KEY = "sb_publishable_HgiF6vsuAJnnUPMTuwfAfQ_qB0LjVLh";

const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
let editingCarId = null;
// ------------------
// Check Login
// ------------------

async function checkUser() {

    const { data } = await client.auth.getUser();

    if (!data.user) {
        window.location.href = "login.html";
    }

}

checkUser();

// ------------------
// Logout
// ------------------

document.getElementById("logoutBtn").addEventListener("click", async () => {

    await client.auth.signOut();

    window.location.href = "login.html";

});

// ------------------
// Upload / Update Car
// ------------------

document.getElementById("uploadCar").addEventListener("click", async () => {

    const name = document.getElementById("carName").value.trim();
    const price = document.getElementById("carPrice").value;
    const category = document.getElementById("carCategory").value;
    const status = document.getElementById("carStatus").value;
    const imageFile = document.getElementById("carImage").files[0];

    // ----------------------------
    // EDIT MODE (image optional)
    // ----------------------------
    if (editingCarId) {

        if (!name || !price) {
            alert("Fill all fields.");
            return;
        }

        const updatePayload = {
            name,
            price: Number(price),
            category,
            status
        };

        // If admin also chose a new image while editing, upload it too
        if (imageFile) {
            const fileName = Date.now() + "_" + imageFile.name;

            const { error: uploadError } = await client.storage
                .from("cars")
                .upload(fileName, imageFile);

            if (uploadError) {
                console.error(uploadError);
                alert(uploadError.message);
                return;
            }

            const { data: publicData } = client.storage
                .from("cars")
                .getPublicUrl(fileName);

            updatePayload.image = publicData.publicUrl;
        }

        const { error } = await client
            .from("cars")
            .update(updatePayload)
            .eq("id", editingCarId);

        if (error) {
            console.error(error);
            alert(error.message);
            return;
        }

        alert("Car Updated!");

        editingCarId = null;
        document.getElementById("uploadCar").textContent = "Upload Car";

        document.getElementById("carName").value = "";
        document.getElementById("carPrice").value = "";
        document.getElementById("carImage").value = "";

        loadAdminCars();
        return;
    }

    // ----------------------------
    // ADD MODE (new car, image required)
    // ----------------------------
    if (!name || !price || !imageFile) {
        alert("Fill all fields.");
        return;
    }

    const fileName = Date.now() + "_" + imageFile.name;

    // Upload image
    const { error: uploadError } = await client.storage
        .from("cars")
        .upload(fileName, imageFile);

    if (uploadError) {
        console.error(uploadError);
        alert(uploadError.message);
        return;
    }

    // Get public URL
    const { data: publicData } = client.storage
        .from("cars")
        .getPublicUrl(fileName);

    const imageUrl = publicData.publicUrl;

    // Save in database
    const { error } = await client
        .from("cars")
        .insert({
            name,
            price: Number(price),
            category,
            status,
            image: imageUrl
        });

    if (error) {
        console.error(error);
        alert(error.message);
        return;
    }

    alert("Car Uploaded Successfully!");

    document.getElementById("carName").value = "";
    document.getElementById("carPrice").value = "";
    document.getElementById("carImage").value = "";

    loadAdminCars();

});

async function loadAdminCars() {

    const { data, error } = await client
        .from("cars")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const carsList = document.getElementById("carsList");

    carsList.innerHTML = "";

    data.forEach(car => {

        carsList.innerHTML += `

        <div class="admin-car">

            <img src="${car.image}" alt="${car.name}">

            <h3>${car.name}</h3>

            <p><strong>₹${car.price}</strong></p>

            <p>${car.category}</p>

            <p>Status: ${car.status}</p>

            ${car.status === "Sold Out"
                ? `<p>Promo Used: ${car.promo_used ? car.promo_used : "None"}</p>`
                : ""
            }

            <div class="admin-buttons">

                <button
    class="edit-btn"
    data-id="${car.id}"
    data-name="${car.name}"
    data-price="${car.price}"
    data-category="${car.category}"
    data-status="${car.status}">
    Edit
</button>

                <button class="status-btn" data-id="${car.id}">
                    ${car.status === "Available" ? "Mark Sold" : "Mark Available"}
                </button>

                <button class="delete-btn" data-id="${car.id}">
                    Delete
                </button>

            </div>

        </div>

        `;

    });

    // Refresh the sales dashboard stats whenever the car list reloads
    loadSalesDashboard(data);

}
loadAdminCars();
document.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("delete-btn")) return;

    const id = e.target.dataset.id;

    const confirmDelete = confirm("Delete this car?");

    if (!confirmDelete) return;

    const { error } = await client
        .from("cars")
        .delete()
        .eq("id", id);

    if (error) {

        alert(error.message);

        return;

    }

    alert("Car deleted.");

    loadAdminCars();

});
document.addEventListener("click", (e) => {

    if (!e.target.classList.contains("edit-btn")) return;

    editingCarId = e.target.dataset.id;

    document.getElementById("carName").value = e.target.dataset.name;
    document.getElementById("carPrice").value = e.target.dataset.price;
    document.getElementById("carCategory").value = e.target.dataset.category;
    document.getElementById("carStatus").value = e.target.dataset.status;

    document.getElementById("uploadCar").textContent = "Update Car";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});
document.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("status-btn")) return;

    const id = e.target.dataset.id;

    // Get current car
    const { data, error } = await client
        .from("cars")
        .select("status")
        .eq("id", id)
        .single();

    if (error) {
        alert(error.message);
        return;
    }

    const newStatus =
        data.status === "Available"
            ? "Sold Out"
            : "Available";

    const updatePayload = { status: newStatus };

    if (newStatus === "Sold Out") {

        // Ask the admin whether a promo code was used for this sale
        const promoUsed = prompt(
            "Did the buyer use a promo code? Enter the code, or leave blank for none:"
        );

        // If admin cancels the prompt, promoUsed will be null - treat as no promo
        updatePayload.promo_used = promoUsed ? promoUsed.trim().toUpperCase() : null;

    } else {

        // Going back to Available - clear any previous promo record
        updatePayload.promo_used = null;

    }

    const { error: updateError } = await client
        .from("cars")
        .update(updatePayload)
        .eq("id", id);

    if (updateError) {
        alert(updateError.message);
        return;
    }

    loadAdminCars();
    loadCars();

});
// =======================
// PROMO CODES
// =======================

async function loadPromos() {

    const { data, error } = await client
        .from("promo_codes")
        .select("*")
        .order("code");

    if (error) {
        console.error(error);
        return;
    }

    const promoList = document.getElementById("promoList");
    promoList.innerHTML = "";

    data.forEach(promo => {

        promoList.innerHTML += `

        <div class="promo-card">

            <h3>${promo.code}</h3>

            <p>${promo.discount}% OFF</p>

            <p>${promo.active ? "✅ Active" : "❌ Disabled"}</p>

            <button
                class="deletePromo"
                data-id="${promo.id}">
                Delete
            </button>

        </div>

        `;

    });

}

loadPromos();

// ------------------------
// ADD PROMO
// ------------------------

document.getElementById("addPromo").addEventListener("click", async () => {

    const code = document.getElementById("promoCode").value.trim().toUpperCase();
    const discount = Number(document.getElementById("promoDiscount").value);

    if (!code || !discount) {
        alert("Fill all fields");
        return;
    }

    const { error } = await client
        .from("promo_codes")
        .insert([
            {
                code,
                discount,
                active: true
            }
        ]);

    if (error) {
        alert(error.message);
        return;
    }

    document.getElementById("promoCode").value = "";
    document.getElementById("promoDiscount").value = "";

    loadPromos();

});

// ------------------------
// DELETE PROMO
// ------------------------

document.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("deletePromo")) return;

    if (!confirm("Delete this promo code?")) return;

    const { error } = await client
        .from("promo_codes")
        .delete()
        .eq("id", e.target.dataset.id);

    if (error) {
        alert(error.message);
        return;
    }

    loadPromos();

});

// =======================
// SALES DASHBOARD
// =======================

function loadSalesDashboard(cars) {

    const total = cars.length;
    const available = cars.filter(c => c.status === "Available").length;
    const sold = cars.filter(c => c.status === "Sold Out").length;

    const totalEl = document.getElementById("totalCarsCount");
    const availableEl = document.getElementById("availableCarsCount");
    const soldEl = document.getElementById("soldCarsCount");

    if (totalEl) totalEl.textContent = total;
    if (availableEl) availableEl.textContent = available;
    if (soldEl) soldEl.textContent = sold;

    const soldList = document.getElementById("soldCarsList");
    if (!soldList) return;

    const soldCars = cars.filter(c => c.status === "Sold Out");

    if (soldCars.length === 0) {
        soldList.innerHTML = `<p class="no-results">No cars sold yet.</p>`;
        return;
    }

    soldList.innerHTML = "";

    soldCars.forEach(car => {

        soldList.innerHTML += `

        <div class="sold-car-row">

            <span class="sold-car-name">${car.name}</span>

            <span class="sold-car-price">₹${car.price}</span>

            <span class="sold-car-promo">
                ${car.promo_used ? `🏷️ ${car.promo_used}` : "No promo"}
            </span>

        </div>

        `;

    });

}