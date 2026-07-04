const SUPABASE_URL = "https://srqlpuyjyctlhlrhwlbl.supabase.co";
const SUPABASE_KEY = "sb_publishable_HgiF6vsuAJnnUPMTuwfAfQ_qB0LjVLh";

const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const email = document.getElementById("email");
const password = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const message = document.getElementById("message");

loginBtn.addEventListener("click", async () => {

    message.textContent = "";

    const { error } = await client.auth.signInWithPassword({

        email: email.value,

        password: password.value

    });

    if(error){

        message.textContent = error.message;

        return;

    }

    window.location.href = "dashboard.html";

});