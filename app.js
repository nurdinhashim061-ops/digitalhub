// INITIALIZE FIREBASE & CONFIGS (Hapa weka kodi zako zile za kawaida za Firebase)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    // COPY WEKA DETAILS ZAKO ZA FIREBASE HAPA KAMA KAWAIDA!
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
const ADMIN_EMAIL = "nurdinhashim061@gmail.com";

// ================= TOGGLE ACCORDION FOR SERVICES =================
const toggleBtn = document.getElementById("toggle-services-btn");
const contentBox = document.getElementById("services-content");
const arrowIcon = document.getElementById("services-arrow");

if (toggleBtn) {
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

// ================= KUKAGUA LIMIT YA POST & PREMIUM STATUS =================
async function checkPostLimitAndPremium() {
    if (!currentUser) return { canPost: false, msg: "Tafadhali ingia kwenye akaunti." };

    // 1. Angalia kama ni Admin
    if (currentUser.email === ADMIN_EMAIL) return { canPost: true };

    // 2. Angalia kama ni Premium kwenye Profile yake kule Firebase
    const userQ = query(collection(db, "users"), where("uid", "==", currentUser.uid));
    const userSnap = await getDocs(userQ);
    
    let isPremium = false;
    if (!userSnap.empty) {
        const userData = userSnap.docs[0].data();
        if (userData.premiumUntil) {
            const expiryDate = new Date(userData.premiumUntil.seconds * 1000);
            if (expiryDate > new Date()) {
                isPremium = true; // Bado muda wake haujaisha
            }
        }
    }

    if (isPremium) return { canPost: true };

    // 3. Kama sio Premium, kagua kama ameshafikisha bidhaa 3
    const prodQ = query(collection(db, "products"), where("sellerId", "==", currentUser.uid));
    const prodSnap = await getDocs(prodQ);

    if (prodSnap.size >= 3) {
        return { canPost: false, msg: "limit_reached" };
    }
    return { canPost: true };
}

// POPUP YA KULIPIA KIFURUSHI CHA PREMIUM (LIMIT LOCKER)
window.showPremiumModal = function() {
    const old = document.getElementById("premium-modal");
    if (old) old.remove();

    const overlay = document.createElement("div");
    overlay.id = "premium-modal";
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:200000; display:flex; align-items:center; justify-content:center; padding:15px;";
    
    overlay.innerHTML = `
        <div style="background:white; padding:25px 20px; border-radius:12px; width:100%; max-width:360px; text-align:center; position:relative; font-family:sans-serif;">
            <button onclick="document.getElementById('premium-modal').remove()" style="position:absolute; top:12px; right:15px; background:none; border:none; font-size:18px; color:#999; cursor:pointer;">✕</button>
            <h3 style="color:#0f172a; font-size:16px; font-weight:800; margin-bottom:10px;"><i class="fa-solid fa-gem" style="color:#0d9488;"></i> KIKOMO KIMEFIKIA!</h3>
            <p style="font-size:12px; color:#666; margin-bottom:15px; line-height:1.4;">Umesha-post bidhaa 3 za bure. Ili uweze kuweka bidhaa ya 4 na kuendelea, lipia Vifurushi vya Premium:</p>
            
            <div style="text-align:left; font-size:12px; display:flex; flex-direction:column; gap:8px; background:#fafafa; padding:12px; border-radius:8px; margin-bottom:15px;">
                <div><b>💎 Mwezi 1:</b> Tsh 10,000/=</div>
                <div><b>💎 Miezi 2:</b> Tsh 20,000/=</div>
                <div><b>🔥 Miezi 3 (Ofa):</b> Tsh 25,000/=</div>
                <hr style="border:0; border-top:1px solid #eee;">
                <div style="font-size:11px; color:#555;">Tuma malipo kwenda: <b>0671 020 855 (NURDIN HASHIM)</b></div>
            </div>
            
            <button onclick="window.open('https://wa.me/255671020855?text=Habari%20Admin,%20naomba%20kujiunga%20na%20Kifurushi%20cha%20Premium%20DigitalHub', '_blank')" style="background:#0d9488; color:white; border:none; width:100%; padding:12px; border-radius:6px; font-weight:bold; font-size:13px; cursor:pointer;">
                <i class="fa-brands fa-whatsapp"></i> Wasiliana na Admin Uwezwe Premium
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
};

// ================= POPUP YA KULIPIA BOOST (USER SIDE) =================
window.triggerBoostPopup = function(title) {
    const old = document.getElementById("boost-modal");
    if (old) old.remove();

    const overlay = document.createElement("div");
    overlay.id = "boost-modal";
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:200000; display:flex; align-items:center; justify-content:center; padding:15px;";
    
    overlay.innerHTML = `
        <div style="background:white; padding:25px 20px; border-radius:12px; width:100%; max-width:350px; text-align:center; position:relative; font-family:sans-serif;">
            <button onclick="document.getElementById('boost-modal').remove()" style="position:absolute; top:12px; right:15px; background:none; border:none; font-size:18px; color:#999; cursor:pointer;">✕</button>
            <h3 style="color:#ff8c00; font-size:15px; font-weight:800; margin-bottom:8px;"><i class="fa-solid fa-fire"></i> BOOST BIDHAA YAKO</h3>
            <p style="font-size:11px; color:#555; margin-bottom:15px;">Inakuza: "${title}" kuwa ya VIP juu kabisa ya soko.</p>
            
            <div style="background:#fff7ed; border:1px dashed #ff8c00; padding:10px; border-radius:6px; font-size:12px; margin-bottom:15px; text-align:left;">
                <b>Gharama:</b> Tsh 5,000/= kwa Wiki moja. <br>
                <b>Malipo:</b> Tuma kwenda 0671 020 855 (NURDIN HASHIM)
            </div>
            
            <button onclick="window.open('https://wa.me/255671020855?text=Habari%20Admin,%20nimelipa%20Tsh%205000%20naomba%20kuboost%20bidhaa%20yangu%20ya%20${encodeURIComponent(title)}', '_blank')" style="background:#ff8c00; color:white; border:none; width:100%; padding:12px; border-radius:6px; font-weight:bold; font-size:13px; cursor:pointer;">
                <i class="fa-brands fa-whatsapp"></i> Nimelipa, Tuma Muamala WhatsApp
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
};

// ================= PAKIA BIDHAA SOKONI =================
const uploadForm = document.getElementById("upload-form");
if (uploadForm) {
    uploadForm.onsubmit = async (e) => {
        e.preventDefault();
        
        // Kagua limit kwanza kabla ya kuruhusu kuupload
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
            
            // Tofauti na Cloudinary tuliyoweka mwanzo, hapa tunatumia mbinu ya haraka ya Base64 kuifungia picha ndani ya Firestore ili isipoteze muundo
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
                    priority: 0, // Inaanza kawaida, ikiboostwa inakuwa 1
                    timestamp: new Date()
                });

                showToast("Bidhaa imewekwa sokoni kwa mafanikio!");
                uploadForm.reset();
                document.getElementById("submit-prod-btn").innerHTML = `<i class="fa-solid fa-rocket"></i> Weka Sokoni Sasa`;
                loadProducts();
                renderMyProducts();
            };
        } catch (err) {
            alert("Kosa: " + err.message);
            document.getElementById("submit-prod-btn").innerHTML = `<i class="fa-solid fa-rocket"></i> Weka Sokoni Sasa`;
        }
    };
}

// ================= RENDER SOKO KUU (EXPLORE GRID) =================
async function loadProducts(catFilter = 'all') {
    const grid = document.getElementById("products-grid");
    if (!grid) return;

    grid.innerHTML = "<p style='font-size:12px; color:gray; padding:10px;'>Inafungua soko...</p>";

    // Panga kwa priority kwanza (zilizoboostwa ziwe juu) halafu tarehe
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
                    <span class="badge-file-type">${p.category}</span>
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
                        <div style="display:flex; gap:4px; margin-top:4px;">
                            <button onclick="window.adminToggleBoost('${d.id}', ${p.priority})" class="btn-admin-del" style="background:#28a745;">
                                ${isVIP ? 'Unboost' : 'Boost (Admin)'}
                            </button>
                            <button onclick="window.adminDeleteProduct('${d.id}')" class="btn-admin-del"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    ` : ""}
                </div>
            </div>
        `;
    });
}

// ================= ADMIN CONTROLS (NURDIN POWER) =================
window.adminToggleBoost = async function(id, currentPriority) {
    const newPriority = currentPriority === 1 ? 0 : 1;
    await updateDoc(doc(db, "products", id), { priority: newPriority });
    showToast("Hali ya Boost imebadilishwa na Admin!");
    loadProducts();
};

window.adminDeleteProduct = async function(id) {
    if (confirm("Mkuu Nurdin, una uhakika wa kufuta kabisa bidhaa hii sokoni?")) {
        await deleteDoc(doc(db, "products", id));
        showToast("Bidhaa imefutwa!");
        loadProducts();
    }
};

// ================= RENDER MY PRODUCTS (DASHBOARD) =================
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
            <div class="my-prod-item">
                <span style="font-size:12px; font-weight:600;">${data.title} ${data.priority === 1 ? '🔥 (VIP)' : ''}</span>
                <button onclick="window.adminDeleteProduct('${d.id}')" style="background:none; border:none; color:#dc3545; cursor:pointer; font-size:12px;"><i class="fa-solid fa-trash-can"></i> Futa</button>
            </div>
        `;
    });
}

// UI HANDLERS (TABS AND AUTH)
// (Weka kodi zako za kawaida za kubadilisha Tabs, Google Sign In na Sign Out hapa chini yake)
