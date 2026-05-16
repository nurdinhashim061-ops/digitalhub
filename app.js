// =========================================================================
// 1. FIREBASE SDK IMPORTS (KUTUMIA VERSION YA MTANDAONI KWA PAGES)
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// =========================================================================
// 2. CONFIGURATION YAKO HALISI YA FIREBASE (NURDIN CONFIG)
// =========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBZTPWCHIrRQ1eyOfHZulxD9Q8GPzy9YgY",
  authDomain: "digitalhub-15f37.firebaseapp.com",
  projectId: "digitalhub-15f37",
  storageBucket: "digitalhub-15f37.firebasestorage.app",
  messagingSenderId: "1091127316841",
  appId: "1:1091127316841:web:f9ab21430250bcd2252df8"
};

// INITIALIZE INTEGRATIONS
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
const ADMIN_EMAIL = "nurdinhashim061@gmail.com";

// =========================================================================
// 3. SEHEMU YA HUDUMA (ACCORDION TOGGLE MECHANISM)
// =========================================================================
const toggleBtn = document.getElementById("toggle-services-btn");
const contentBox = document.getElementById("services-content");
const arrowIcon = document.getElementById("services-arrow");

if (toggleBtn && contentBox && arrowIcon) {
    toggleBtn.onclick = () => {
        if (contentBox.style.display === "block") {
            contentBox.style.display = "none";
            arrowIcon.classList.remove("rotate");
        } else {
            contentBox.style.display = "block";
            arrowIcon.classList.add("rotate");
        }
    };
}

// =========================================================================
// 4. MTIHANI WA KIKOMO CHA POST (PREMIUM & 3-POST LIMIT MONITOR)
// =========================================================================
async function checkPostLimitAndPremium() {
    if (!currentUser) return { canPost: false, msg: "Tafadhali ingia jukwaani kwanza kufanya hivi!" };

    // A. Kama ni wewe Admin mkuu, huna limit yoyote
    if (currentUser.email === ADMIN_EMAIL) return { canPost: true };

    // B. Kagua kama mtumiaji ana akaunti ya Premium inayofanya kazi kule Firestore
    const userQ = query(collection(db, "users"), where("uid", "==", currentUser.uid));
    const userSnap = await getDocs(userQ);
    
    let isPremium = false;
    if (!userSnap.empty) {
        const userData = userSnap.docs[0].data();
        if (userData.premiumUntil) {
            const expiryDate = new Date(userData.premiumUntil.seconds * 1000);
            if (expiryDate > new Date()) {
                isPremium = true; // Muda wa kifurushi bado upo hewani
            }
        }
    }

    if (isPremium) return { canPost: true };

    // C. Kama sio Premium, kagua idadi ya bidhaa alizopost tayari
    const prodQ = query(collection(db, "products"), where("sellerId", "==", currentUser.uid));
    const prodSnap = await getDocs(prodQ);

    if (prodSnap.size >= 3) {
        return { canPost: false, msg: "limit_reached" };
    }
    return { canPost: true };
}

// POPUP YA PREMIUM YA KUSHUTUKIZA (LIMIT MODAL)
window.showPremiumModal = function() {
    const old = document.getElementById("premium-modal");
    if (old) old.remove();

    const overlay = document.createElement("div");
    overlay.id = "premium-modal";
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:200000; display:flex; align-items:center; justify-content:center; padding:15px;";
    
    overlay.innerHTML = `
        <div style="background:white; padding:25px 20px; border-radius:12px; width:100%; max-width:360px; text-align:center; position:relative; box-sizing:border-box;">
            <button onclick="document.getElementById('premium-modal').remove()" style="position:absolute; top:12px; right:15px; background:none; border:none; font-size:18px; color:#999; cursor:pointer;">✕</button>
            <h3 style="color:#0f172a; font-size:16px; font-weight:800; margin-bottom:10px;"><i class="fa-solid fa-gem" style="color:#0d9488;"></i> KIKOMO KIMEFIKIA!</h3>
            <p style="font-size:12px; color:#666; margin-bottom:15px; line-height:1.4;">Umesha-post bidhaa 3 za bure. Ili uweze kuweka bidhaa ya 4 na kuendelea, lipia Vifurushi vya Premium:</p>
            
            <div style="text-align:left; font-size:12px; display:flex; flex-direction:column; gap:8px; background:#fafafa; padding:12px; border-radius:8px; margin-bottom:15px;">
                <div><b>💎 Mwezi 1:</b> Tsh 10,000/=</div>
                <div><b>💎 Miezi 2:</b> Tsh 20,000/=</div>
                <div><b>🔥 Miezi 3 (Ofa):</b> Tsh 25,000/=</div>
                <hr style="border:0; border-top:1px solid #eee;">
                <div style="font-size:11px; color:#555;">Tuma malipo kwenda: <br><b>0671 020 855 (NURDIN HASHIM)</b></div>
            </div>
            
            <button onclick="window.open('https://wa.me/255671020855?text=Habari%20Admin,%20naomba%20kujiunga%20na%20Kifurushi%20cha%20Premium%20DigitalHub', '_blank')" style="background:#0d9488; color:white; border:none; width:100%; padding:12px; border-radius:6px; font-weight:bold; font-size:13px; cursor:pointer; display:block; text-align:center;">
                <i class="fa-brands fa-whatsapp"></i> Wasiliana na Admin Uwezwe Premium
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
};

// =========================================================================
// 5. POPUP YA KULIPIA BOOST USER SIDE (TSH 5,000)
// =========================================================================
window.triggerBoostPopup = function(title) {
    const old = document.getElementById("boost-modal");
    if (old) old.remove();

    const overlay = document.createElement("div");
    overlay.id = "boost-modal";
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:200000; display:flex; align-items:center; justify-content:center; padding:15px;";
    
    overlay.innerHTML = `
        <div style="background:white; padding:25px 20px; border-radius:12px; width:100%; max-width:350px; text-align:center; position:relative; box-sizing:border-box;">
            <button onclick="document.getElementById('boost-modal').remove()" style="position:absolute; top:12px; right:15px; background:none; border:none; font-size:18px; color:#999; cursor:pointer;">✕</button>
            <h3 style="color:#ff8c00; font-size:15px; font-weight:800; margin-bottom:8px;"><i class="fa-solid fa-fire"></i> BOOST BIDHAA YAKO</h3>
            <p style="font-size:11px; color:#555; margin-bottom:15px;">Inakuza: "${title}" kuwa ya VIP juu kabisa ya soko.</p>
            
            <div style="background:#fff7ed; border:1px dashed #ff8c00; padding:10px; border-radius:6px; font-size:12px; margin-bottom:15px; text-align:left;">
                <b>Gharama:</b> Tsh 5,000/= kwa Wiki moja. <br>
                <b>Malipo:</b> Tuma kwenda <b>0671 020 855 (NURDIN HASHIM)</b>
            </div>
            
            <button onclick="window.open('https://wa.me/255671020855?text=Habari%20Admin,%20nimelipa%20Tsh%205000%20naomba%20kuboost%20bidhaa%20yangu%20ya%20${encodeURIComponent(title)}', '_blank')" style="background:#ff8c00; color:white; border:none; width:100%; padding:12px; border-radius:6px; font-weight:bold; font-size:13px; cursor:pointer; display:block; text-align:center;">
                <i class="fa-brands fa-whatsapp"></i> Nimelipa, Tuma Muamala WhatsApp
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
};

// =========================================================================
// 6. PAKIA BIDHAA SOKONI (BASE64 PICHA SYSTEM)
// =========================================================================
const uploadForm = document.getElementById("upload-form");
if (uploadForm) {
    uploadForm.onsubmit = async (e) => {
        e.preventDefault();
        
        // Kagua limit ya post kwanza kabla ya kuanza kuupload
        const limitCheck = await checkPostLimitAndPremium();
        if(!limitCheck.canPost) {
            if(limitCheck.msg === "limit_reached") {
                showPremiumModal();
            } else {
                alert(limitCheck.msg);
            }
            return;
        }

        const title = document.getElementById("prod-title").value.trim();
        const price = document.getElementById("prod-price").value;
        const category = document.getElementById("prod-category").value;
        const whatsapp = document.getElementById("prod-whatsapp").value.trim();
        const desc = document.getElementById("prod-desc").value.trim();
        const coverFile = document.getElementById("prod-cover").files[0];

        if (!coverFile) return alert("Tafadhali weka picha ya kava!");

        try {
            document.getElementById("submit-prod-btn").innerText = "Inapakia... Subiri...";
            
            const reader = new FileReader();
            reader.readAsDataURL(coverFile);
            reader.onloadend = async () => {
                const base64Image = reader.result;

                await addDoc(collection(db, "products"), {
                    title,
                    price,
                    category,
                    whatsapp,
                    description: desc,
                    coverURL: base64Image,
                    sellerId: currentUser.uid,
                    sellerEmail: currentUser.email,
                    priority: 0, 
                    timestamp: new Date()
                });

                showToast("Bidhaa imewekwa sokoni kwa mafanikio!");
                uploadForm.reset();
                document.getElementById("submit-prod-btn").innerHTML = `<i class="fa-solid fa-rocket"></i> Weka Sokoni Sasa`;
                loadProducts();
                renderMyProducts();
            };
        } catch (err) {
            alert("Kosa la kuweka mzigo: " + err.message);
            document.getElementById("submit-prod-btn").innerHTML = `<i class="fa-solid fa-rocket"></i> Weka Sokoni Sasa`;
        }
    };
}

// =========================================================================
// 7. RENDER SOKO KUU (EXPLORE GRID + CATEGORY CHIPS)
// =========================================================================
async function loadProducts(catFilter = 'all') {
    const grid = document.getElementById("products-grid");
    if (!grid) return;

    grid.innerHTML = "<p style='font-size:12px; color:gray; padding:10px;'>Inafungua soko...</p>";

    let q = query(collection(db, "products"), orderBy("priority", "desc"), orderBy("timestamp", "desc"));
    if (catFilter !== 'all') {
        q = query(collection(db, "products"), where("category", "==", catFilter), orderBy("priority", "desc"), orderBy("timestamp", "desc"));
    }

    const snap = await getDocs(q);
    grid.innerHTML = snap.size === 0 ? "<p style='font-size:12px; color:gray; padding:10px;'>Hakuna bidhaa sokoni kwa sasa.</p>" : "";

    snap.forEach(d => {
        const p = d.data();
        const isVIP = p.priority === 1;
        const isAdmin = currentUser && currentUser.email === ADMIN_EMAIL;

        grid.innerHTML += `
            <div class="digital-card">
                ${isVIP ? `<span class="vip-tag"><i class="fa-solid fa-fire"></i> VIP</span>` : ""}
                <img src="${p.coverURL}" class="digital-card-cover" alt="Cover">
                <div class="digital-card-info">
                    <h4 class="digital-card-title">${p.title}</h4>
                    <p style="font-size:11px; color:#666; margin-top:2px;">${p.description || ''}</p>
                    <div class="digital-card-price">Tsh ${Number(p.price).toLocaleString()}/=</div>
                </div>
                <div class="card-actions-wrapper">
                    <button onclick="window.open('https://wa.me/${p.whatsapp}?text=Habari,%20nahitaji%20kununua%20bidhaa%20yako%20ya%20${encodeURIComponent(p.title)}%20iliyopo%20DigitalHub', '_blank')" class="btn-buy">
                        <i class="fa-solid fa-shopping-cart"></i> Nunua
                    </button>
                    <button onclick="window.triggerBoostPopup('${p.title}')" class="btn-boost-market">
                        <i class="fa-solid fa-bolt"></i> Boost
                    </button>
                    ${isAdmin ? `
                        <div style="display:flex; gap:4px; margin-top:4px; width:100%;">
                            <button onclick="window.adminToggleBoost('${d.id}', ${p.priority})" class="btn-admin-del" style="background:#28a745; flex:1;">
                                ${isVIP ? 'Unboost' : 'Boost Admin'}
                            </button>
                            <button onclick="window.adminDeleteProduct('${d.id}')" class="btn-admin-del" style="flex:1;"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    ` : ""}
                </div>
            </div>
        `;
    });
}

// CHIPS CATEGORY FILTER FUNCTION
window.filterCategory = function(cat) {
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    event.currentTarget.classList.add('active');
    loadProducts(cat);
};

// =========================================================================
// 8. ADMIN CONTROLS (NURDIN POWER INTERFACE)
// =========================================================================
window.adminToggleBoost = async function(id, currentPriority) {
    const newPriority = currentPriority === 1 ? 0 : 1;
    await updateDoc(doc(db, "products", id), { priority: newPriority });
    showToast("Hali ya VIP imebadilishwa na Admin!");
    loadProducts();
};

window.adminDeleteProduct = async function(id) {
    if (confirm("Mkuu Nurdin, una uhakika wa kufuta kabisa bidhaa hii jukwaani?")) {
        await deleteDoc(doc(db, "products", id));
        showToast("Bidhaa imefutwa kabisa!");
        loadProducts();
        renderMyProducts();
    }
};

// =========================================================================
// 9. DASHBOARD: BIDHAA ZANGU ZA MUUZAJI
// =========================================================================
async function renderMyProducts() {
    if(!currentUser) return;
    const list = document.getElementById("my-products-list");
    if(!list) return;

    const q = query(collection(db, "products"), where("sellerId", "==", currentUser.uid));
    const snap = await getDocs(q);
    list.innerHTML = snap.size === 0 ? `<p style="font-size:11px; color:gray;">Hujapandisha bidhaa bado mkuu.</p>` : "";

    snap.forEach(d => {
        const data = d.data();
        list.innerHTML += `
            <div class="my-prod-item" style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f5f5f5;">
                <span style="font-size:12px; font-weight:600;">${data.title} ${data.priority === 1 ? '🔥 (VIP)' : ''}</span>
                <button onclick="window.adminDeleteProduct('${d.id}')" style="background:none; border:none; color:#dc3545; cursor:pointer; font-size:12px;"><i class="fa-solid fa-trash-can"></i> Futa</button>
            </div>
        `;
    });
}

// =========================================================================
// 10. AUTHENTICATION & LOCK LOCKER OVERLAY SYSTEMS
// =========================================================================
function createAuthOverlay() {
    const old = document.getElementById("auth-lock-overlay");
    if (old) return;

    const overlay = document.createElement("div");
    overlay.id = "auth-lock-overlay";
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; color:white; font-family:sans-serif;";
    
    overlay.innerHTML = `
        <div style="text-align:center; max-width:320px; width:100%;">
            <i class="fa-solid fa-cubes-stacked" style="font-size:48px; color:#0d9488; margin-bottom:15px;"></i>
            <h2 style="font-size:22px; font-weight:800; margin-bottom:8px; letter-spacing:-0.5px;">Karibu DigitalHub</h2>
            <p style="font-size:12px; opacity:0.7; margin-bottom:25px; line-height:1.5;">Ingia ili kupata nafasi ya kupitia soko au kupandisha bidhaa zako za kidijitali.</p>
            <button id="google-login-btn" style="background:white; color:#333; border:none; width:100%; padding:14px; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_\"G\"_Logo.svg" style="width:16px; height:16px;" alt="G"> Ingia na Google
            </button>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById("google-login-btn").onclick = async () => {
        try {
            await signInWithPopup(auth, provider);
            // OnAuthStateChanged itafanya kazi ya kuondoa overlay
        } catch (err) {
            alert("Ushindani wa Login: " + err.message);
        }
    };
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const overlay = document.getElementById("auth-lock-overlay");
        if (overlay) overlay.remove();

        // Sajili mtumiaji kwenye users collection kama hayupo bado
        try {
            const userQ = query(collection(db, "users"), where("uid", "==", user.uid));
            const userSnap = await getDocs(userQ);
            if (userSnap.empty) {
                await addDoc(collection(db, "users"), {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                    createdAt: new Date()
                });
            }
        } catch (e) { console.log(e); }

        // Washa Display Views
        const nameBadge = document.getElementById("user-display-name");
        const logoutBtn = document.getElementById("logoutBtn");
        if(nameBadge) { nameBadge.innerText = user.displayName; nameBadge.style.display = "inline-block"; }
        if(logoutBtn) logoutBtn.style.display = "inline-block";

        loadProducts();
        renderMyProducts();
    } else {
        currentUser = null;
        createAuthOverlay();
    }
});

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.onclick = async () => {
        if(confirm("Je, unataka kutoka kwenye akaunti yako?")) {
            await signOut(auth);
            window.location.reload();
        }
    };
}

// =========================================================================
// 11. TAB VIEW INTERFACES SWITCHERS
// =========================================================================
const tabExplore = document.getElementById("tab-explore");
const tabDashboard = document.getElementById("tab-dashboard");
const exploreSection = document.getElementById("explore-section");
const dashboardSection = document.getElementById("dashboard-section");

if (tabExplore && tabDashboard && exploreSection && dashboardSection) {
    tabExplore.onclick = () => {
        tabExplore.classList.add("active");
        tabDashboard.classList.remove("active");
        exploreSection.style.display = "block";
        dashboardSection.style.display = "none";
        loadProducts();
    };

    tabDashboard.onclick = () => {
        tabDashboard.classList.add("active");
        tabExplore.classList.remove("active");
        dashboardSection.style.display = "block";
        exploreSection.style.display = "none";
        renderMyProducts();
    };
}

// LIVE SEARCH BOX FUNCTION
const searchInput = document.getElementById("search-input");
if (searchInput) {
    searchInput.oninput = () => {
        const value = searchInput.value.toLowerCase().trim();
        document.querySelectorAll(".digital-card").forEach(card => {
            const title = card.querySelector(".digital-card-title").innerText.toLowerCase();
            if (title.includes(value)) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        });
    };
}

// TOAST NOTIFICATION GENERATOR
function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.innerText = msg;
    toast.style.display = "block";
    setTimeout(() => { toast.style.display = "none"; }, 3000);
}
