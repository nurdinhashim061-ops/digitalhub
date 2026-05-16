// =========================================================================
// 1. FIREBASE SDK IMPORTS (KUTUMIA VERSION YA MTANDAONI KWA PAGES)
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    onAuthStateChanged, 
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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

// Tofauti ya kujua kama yupo kwenye Login au Register mode kwenye Email form
let isRegisterMode = false; 

// =========================================================================
// 2B. MFUMO WA POPUP/ALERT WA KISASA (CUSTOM TOAST PRO)
// =========================================================================
function showToast(msg, type = "success") {
    // Futa popup ya zamani kama ipo
    const oldToast = document.getElementById("pro-toast-popup");
    if (oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.id = "pro-toast-popup";
    
    // Rangi kulingana na aina ya ujumbe
    let bgColor = "linear-gradient(135deg, #0d9488 0%, #115e59 100%)"; // Success (Kijani kibichi)
    let icon = '<i class="fa-solid fa-circle-check" style="font-size: 18px;"></i>';
    
    if (type === "error") {
        bgColor = "linear-gradient(135deg, #e11d48 0%, #9f1239 100%)"; // Error (Nyekundu)
        icon = '<i class="fa-solid fa-circle-exclamation" style="font-size: 18px;"></i>';
    } else if (type === "info") {
        bgColor = "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)"; // Info/Warning (Njano)
        icon = '<i class="fa-solid fa-triangle-exclamation" style="font-size: 18px;"></i>';
    }

    // CSS ya muonekano wa Kisasa kabisa unaoelea
    toast.style = `
        position: fixed; 
        top: 24px; 
        right: 24px; 
        background: ${bgColor}; 
        color: white; 
        padding: 12px 20px; 
        border-radius: 10px; 
        font-family: sans-serif; 
        font-size: 13px; 
        font-weight: 600; 
        box-shadow: 0 10px 25px rgba(0,0,0,0.2); 
        z-index: 9999999; 
        display: flex; 
        align-items: center; 
        gap: 12px; 
        transform: translateY(-20px); 
        opacity: 0; 
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;
    
    toast.innerHTML = `${icon} <span>${msg}</span>`;
    document.body.appendChild(toast);

    // Kuingia kwa urembo (Animation in)
    setTimeout(() => {
        toast.style.transform = "translateY(0)";
        toast.style.opacity = "1";
    }, 50);

    // Kupotea automatic baada ya sekunde 3
    setTimeout(() => {
        toast.style.transform = "translateY(-20px)";
        toast.style.opacity = "0";
        setTimeout(() => { toast.remove(); }, 300);
    }, 3500);
}

// Global exposure ili itumike popote
window.showToast = showToast;

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

    if (currentUser.email === ADMIN_EMAIL) return { canPost: true };

    const userQ = query(collection(db, "users"), where("uid", "==", currentUser.uid));
    const userSnap = await getDocs(userQ);
    
    let isPremium = false;
    if (!userSnap.empty) {
        const userData = userSnap.docs[0].data();
        if (userData.premiumUntil) {
            const expiryDate = new Date(userData.premiumUntil.seconds * 1000);
            if (expiryDate > new Date()) {
                isPremium = true;
            }
        }
    }

    if (isPremium) return { canPost: true };

    const prodQ = query(collection(db, "products"), where("sellerId", "==", currentUser.uid));
    const prodSnap = await getDocs(prodQ);

    if (prodSnap.size >= 3) {
        return { canPost: false, msg: "limit_reached" };
    }
    return { canPost: true };
}

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
// 6. PAKIA BIDHAA SOKONI (BASE64 PICHA & FAILI SYSTEM)
// =========================================================================
const uploadForm = document.getElementById("upload-form");
if (uploadForm) {
    uploadForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const limitCheck = await checkPostLimitAndPremium();
        if(!limitCheck.canPost) {
            if(limitCheck.msg === "limit_reached") {
                showPremiumModal();
            } else {
                showToast(limitCheck.msg, "info");
            }
            return;
        }

        const title = document.getElementById("prod-title").value.trim();
        const price = document.getElementById("prod-price").value;
        const category = document.getElementById("prod-category").value;
        const whatsapp = document.getElementById("prod-whatsapp").value.trim();
        const desc = document.getElementById("prod-desc").value.trim();
        
        const coverFile = document.getElementById("prod-cover").files[0];
        const digitalFile = document.getElementById("prod-file").files[0];

        if (!coverFile || !digitalFile) return showToast("Tafadhali hakikisha umeweka picha ya kava NA faili la bidhaa!", "error");

        try {
            document.getElementById("submit-prod-btn").innerText = "Inapakia... Subiri...";
            
            const coverReader = new FileReader();
            coverReader.readAsDataURL(coverFile);
            coverReader.onloadend = async () => {
                const base64Image = coverReader.result;

                const fileReader = new FileReader();
                fileReader.readAsDataURL(digitalFile);
                fileReader.onloadend = async () => {
                    const base64File = fileReader.result;

                    await addDoc(collection(db, "products"), {
                        title: title,
                        price: price,
                        category: category,
                        whatsapp: whatsapp,
                        description: desc,
                        coverURL: base64Image,
                        downloadableFile: base64File, 
                        fileName: digitalFile.name,
                        sellerId: currentUser.uid,
                        sellerEmail: currentUser.email,
                        priority: 0, 
                        timestamp: new Date()
                    });

                    showToast("Bidhaa na Faili lake zimewekwa sokoni kikamilifu!");
                    uploadForm.reset();
                    document.getElementById("submit-prod-btn").innerHTML = `<i class="fa-solid fa-rocket"></i> Weka Sokoni Sasa`;
                    loadProducts();
                    renderMyProducts();
                };
            };
        } catch (err) {
            showToast("Kosa la kuweka mzigo: " + err.message, "error");
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

    try {
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
            const productTitle = p.title ? p.title : "Bidhaa Isiyo na Jina";

            grid.innerHTML += `
                <div class="digital-card">
                    ${isVIP ? `<span class="vip-tag"><i class="fa-solid fa-fire"></i> VIP</span>` : ""}
                    <img src="${p.coverURL}" class="digital-card-cover" alt="Cover">
                    <div class="digital-card-info">
                        <h4 class="digital-card-title">${productTitle}</h4>
                        <p style="font-size:11px; color:#666; margin-top:2px;">${p.description || ''}</p>
                        <div class="digital-card-price">Tsh ${Number(p.price).toLocaleString()}/=</div>
                    </div>
                    <div class="card-actions-wrapper">
                        <button onclick="window.open('https://wa.me/${p.whatsapp}?text=Habari,%20nahitaji%20kununua%20bidhaa%20yako%20ya%20${encodeURIComponent(productTitle)}%20iliyopo%20DigitalHub', '_blank')" class="btn-buy">
                            <i class="fa-solid fa-shopping-cart"></i> Nunua
                        </button>
                        <button onclick="window.triggerBoostPopup('${productTitle}')" class="btn-boost-market">
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
    } catch (e) {
        grid.innerHTML = `<p style='font-size:12px; color:red; padding:10px;'>Tengeneza Index kwanza kwenye Firebase kurekebisha soko.</p>`;
        console.log(e);
    }
}

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
    // Tumetumia window.confirm hapa kwa sababu ni hatua kubwa ya kiusalama ya Admin kufuta faili
    if (confirm("Mkuu Nurdin, una uhakika wa kufuta kabisa bidhaa hii jukwaani?")) {
        await deleteDoc(doc(db, "products", id));
        showToast("Bidhaa imefutwa kabisa na Admin!", "info");
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

    try {
        const q = query(collection(db, "products"), where("sellerId", "==", currentUser.uid));
        const snap = await getDocs(q);
        list.innerHTML = snap.size === 0 ? `<p style="font-size:11px; color:gray;">Hujapandisha bidhaa bado mkuu.</p>` : "";

        snap.forEach(d => {
            const data = d.data();
            const productTitle = data.title ? data.title : "Bidhaa Isiyo na Jina";
            const isVIP = data.priority === 1 ? ' 🔥 (VIP)' : '';

            list.innerHTML += `
                <div class="my-prod-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f5f5f5;">
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <span style="font-size:12px; font-weight:600; color:#0f172a;">${productTitle}${isVIP}</span>
                        ${data.fileName ? `<span style="font-size:10px; color:gray;"><i class="fa-solid fa-paperclip"></i> ${data.fileName}</span>` : ''}
                    </div>
                    <button onclick="window.adminDeleteProduct('${d.id}')" style="background:none; border:none; color:#dc3545; cursor:pointer; font-size:12px; padding:5px;"><i class="fa-solid fa-trash-can"></i> Futa</button>
                </div>
            `;
        });
    } catch(e) { console.log(e); }
}

// =========================================================================
// 10. AUTHENTICATION (GOOGLE + HYBRID EMAIL-PASSWORD WITH USERNAME SYSTEM)
// =========================================================================
function createAuthOverlay() {
    const old = document.getElementById("auth-lock-overlay");
    if (old) return;

    const overlay = document.createElement("div");
    overlay.id = "auth-lock-overlay";
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:15px; color:white; font-family:sans-serif; box-sizing:border-box; overflow-y:auto;";
    
    overlay.innerHTML = `
        <div style="text-align:center; max-width:340px; width:100%; background:rgba(30, 41, 59, 0.7); padding:25px; border-radius:16px; border:1px solid rgba(255,255,255,0.08); box-shadow:0 12px 30px rgba(0,0,0,0.3); box-sizing:border-box;">
            
            <i class="fa-solid fa-cubes-stacked" style="font-size:42px; color:#0d9488; margin-bottom:12px;"></i>
            <h2 style="font-size:22px; font-weight:800; margin-bottom:4px; letter-spacing:-0.5px;">Karibu DigitalHub</h2>
            <p style="font-size:11.5px; opacity:0.7; margin-bottom:20px; line-height:1.4;">Ingia kwa urahisi kuchunguza soko au kuuza ma-faili ya kidijitali.</p>
            
            <button id="google-login-btn" style="background:white; color:#333; border:none; width:100%; padding:13px; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; box-shadow:0 4px 6px rgba(0,0,0,0.1); margin-bottom:18px;">
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Ingia na Google
            </button>

            <div style="display:flex; align-items:center; text-align:center; margin-bottom:18px; color:rgba(255,255,255,0.4); font-size:11px;">
                <hr style="flex:1; border:none; border-top:1px solid rgba(255,255,255,0.1); margin-right:10px;"> AU <hr style="flex:1; border:none; border-top:1px solid rgba(255,255,255,0.1); margin-left:10px;">
            </div>

            <form id="custom-auth-form" style="display:flex; flex-direction:column; gap:10px; text-align:left;">
                
                <div id="username-field-group" style="display:none; flex-direction:column; gap:4px;">
                    <label style="font-size:11px; color:rgba(255,255,255,0.7);">Jina la Mtumiaji (Username)</label>
                    <input type="text" id="auth-username" placeholder="mfano: nurdin_hashim" style="width:100%; padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:#0f172a; color:white; font-size:12px; box-sizing:border-box;">
                </div>

                <div style="display:flex; flex-direction:column; gap:4px;">
                    <label style="font-size:11px; color:rgba(255,255,255,0.7);">Barua Pepe (Email)</label>
                    <input type="email" id="auth-email" placeholder="mfano@gmail.com" required style="width:100%; padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:#0f172a; color:white; font-size:12px; box-sizing:border-box;">
                </div>
                
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <label style="font-size:11px; color:rgba(255,255,255,0.7);">Nenosiri (Password)</label>
                    <input type="password" id="auth-password" placeholder="******" required minlength="6" style="width:100%; padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:#0f172a; color:white; font-size:12px; box-sizing:border-box;">
                </div>
                
                <button type="submit" id="custom-auth-btn" style="background:#0d9488; color:white; border:none; width:100%; padding:11px; border-radius:6px; font-weight:700; font-size:13px; cursor:pointer; margin-top:5px; transition:all 0.2s;">
                    Ingia Akauntini
                </button>
            </form>

            <p style="font-size:11.5px; margin-top:15px; color:rgba(255,255,255,0.6);">
                <span id="switch-text">Huna akaunti bado?</span> 
                <a href="#" id="switch-auth-mode" style="color:#0d9488; font-weight:700; text-decoration:none; margin-left:4px;">Jisajili Hapa</a>
            </p>

        </div>
    `;
    document.body.appendChild(overlay);

    // KUSHUGHULIKIA SUBMIT YA GOOGLE LOG IN
    document.getElementById("google-login-btn").onclick = async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (err) {
            showToast("Ushindani wa Login: " + err.message, "error");
        }
    };

    // KUSHUGHULIKIA SWITCH TOGGLE (LOGIN VS REGISTER)
    const switchLink = document.getElementById("switch-auth-mode");
    const switchText = document.getElementById("switch-text");
    const submitBtn = document.getElementById("custom-auth-btn");
    const usernameGroup = document.getElementById("username-field-group");
    const usernameInput = document.getElementById("auth-username");
    
    switchLink.onclick = (e) => {
        e.preventDefault();
        isRegisterMode = !isRegisterMode;
        if(isRegisterMode) {
            switchText.innerText = "Tayari una akaunti?";
            switchLink.innerText = "Ingia Hapa";
            submitBtn.innerText = "Tengeneza Akaunti Mpya";
            usernameGroup.style.display = "flex"; // Onyesha input ya username
            usernameInput.required = true;       // Weka kuwa ni lazima ijazwe
        } else {
            switchText.innerText = "Huna akaunti bado?";
            switchLink.innerText = "Jisajili Hapa";
            submitBtn.innerText = "Ingia Akauntini";
            usernameGroup.style.display = "none"; // Ficha input ya username
            usernameInput.required = false;       // Ondoa ulazima
        }
    };

    // KUSHUGHULIKIA SUBMIT YA EMAIL & PASSWORD (CUSTOM AUTH)
    const customForm = document.getElementById("custom-auth-form");
    customForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById("auth-email").value.trim();
        const password = document.getElementById("auth-password").value;
        const username = usernameInput.value.trim();

        try {
            submitBtn.innerText = "Inaprosesi... Subiri...";
            if (isRegisterMode) {
                // 1. Tengeneza akaunti mpya Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // 2. Hifadhi details zake pamoja na Username aliyoandika kwenye Firestore
                await addDoc(collection(db, "users"), {
                    uid: user.uid,
                    email: user.email,
                    name: username, // Tunatumia username aliyojaza yeye
                    createdAt: new Date()
                });

                showToast("Akaunti yako imetengenezwa kwa mafanikio mkuu!");
            } else {
                // Ingia kwenye akaunti ya zamani
                await signInWithEmailAndPassword(auth, email, password);
                showToast("Umeingia jukwaani kwa mafanikio!");
            }
        } catch (err) {
            let errorMsg = err.message;
            if(err.code === "auth/email-already-in-use") errorMsg = "Barua pepe hii ishatumika na mtu mwingine!";
            if(err.code === "auth/invalid-credential") errorMsg = "Barua pepe au nenosiri si sahihi!";
            if(err.code === "auth/weak-password") errorMsg = "Nenosiri ni dhaifu mno, weka herufi zisizopungua 6!";
            
            showToast(errorMsg, "error");
            submitBtn.innerText = isRegisterMode ? "Tengeneza Akaunti Mpya" : "Ingia Akauntini";
        }
    };
}

// KUFATILIA HALI YA USER (AUTH STATE CHANGED LIKER)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const overlay = document.getElementById("auth-lock-overlay");
        if (overlay) overlay.remove();

        let finalName = user.displayName ? user.displayName : user.email.split('@')[0];

        // Tafuta kama tuna jina lake la username tulilohifadhi kwenye Firestore
        try {
            const userQ = query(collection(db, "users"), where("uid", "==", user.uid));
            const userSnap = await getDocs(userQ);
            
            if (!userSnap.empty) {
                const userData = userSnap.docs[0].data();
                if(userData.name) finalName = userData.name; // Chukua lile jina alilojisajili nalo
            } else {
                // Kama ni akaunti ya Google mpya ambayo haipo kwenye users collection yetu bado
                await addDoc(collection(db, "users"), {
                    uid: user.uid,
                    email: user.email,
                    name: finalName,
                    createdAt: new Date()
                });
            }
        } catch (e) { console.log(e); }

        const nameBadge = document.getElementById("user-display-name");
        const logoutBtn = document.getElementById("logoutBtn");
        if(nameBadge) { nameBadge.innerText = finalName; nameBadge.style.display = "inline-block"; }
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
        // Tumetumia confirm hapa ili mtumiaji asibonyeze kwa makosa akatolewa nje ghafla
        if(confirm("Je, unataka kutoka kwenye akaunti yako?")) {
            await signOut(auth);
            showToast("Umetoka kwenye akaunti yako vizuri.", "info");
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

// =========================================================================
// 12. PRIVACY POLICY HIDDEN MODAL MECHANISM (POP-UP SYSTEM)
// =========================================================================
const openPolicyBtn = document.getElementById("open-policy-btn");
if (openPolicyBtn) {
    openPolicyBtn.onclick = (e) => {
        e.preventDefault();

        const old = document.getElementById("legal-policy-modal");
        if (old) old.remove();

        const overlay = document.createElement("div");
        overlay.id = "legal-policy-modal";
        overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:200000; display:flex; align-items:center; justify-content:center; padding:15px;";
        
        overlay.innerHTML = `
            <div style="background:white; padding:25px 20px; border-radius:12px; width:100%; max-width:420px; text-align:left; position:relative; box-sizing:border-box; font-family:sans-serif; max-height:85vh; overflow-y:auto;">
                <button onclick="document.getElementById('legal-policy-modal').remove()" style="position:absolute; top:12px; right:15px; background:none; border:none; font-size:18px; color:#999; cursor:pointer;">✕</button>
                <h3 style="color:#0f172a; font-size:15px; font-weight:800; margin-bottom:12px; border-bottom:1px solid #eee; padding-bottom:6px;"><i class="fa-solid fa-shield-halved" style="color:#0d9488;"></i> Sheria, Vigezo & Sera ya Faragha</h3>
                
                <div style="font-size:11.5px; color:#444; display:flex; flex-direction:column; gap:10px; line-height:1.5;">
                    <p>Karibu DigitalHub. Kwa kutumia jukwaa hili, unakubaliana kikamilifu na vigezo na sheria zifuatazo:</p>
                    <div>
                        <b style="color:#0f172a; display:block; margin-bottom:2px;">1. Maudhui Yanayoruhusiwa</b>
                        Ni marufuku kabisa kupost bidhaa zisizo zako, picha za ngono, programu za udukuzi, au mifumo ya kitapeli. Bidhaa zote zisizokidhi vigezo zetafutwa na Admin mara moja bila taarifa.
                    </div>
                    <div>
                        <b style="color:#0f172a; display:block; margin-bottom:2px;">2. Vifurushi na Malipo</b>
                        Malipo yote ya Boost VIP (Tsh 5,000) na Vifurushi vya Premium (Uanachama) yanatumwa moja kwa moja kwa Admin na hayarudishwi pindi huduma ikishawashwa.
                    </div>
                    <div>
                        <b style="color:#0f172a; display:block; margin-bottom:2px;">3. Sera ya Faragha (Privacy)</b>
                        DigitalHub inalinda kwa kiwango cha juu data zako za barua pepe na taarifa za akaunti yako ya Google. Hatushirikishi, hatuuzi, wala hatitoi taarifa zako kwa mtu yoyote.
                    </div>
                    <div>
                        <b style="color:#0f172a; display:block; margin-bottom:2px;">4. Wajibu wa Biashara</b>
                        Miamala na malipo yote ya bidhaa yanafanyika moja kwa moja kati ya mnunuzi na muuzaji kupitia mitandao ya simu kwenye WhatsApp. DigitalHub haihusiki na makubaliano yoyote ya nje ya jukwaa hili.
                    </div>
                </div>
                <button onclick="document.getElementById('legal-policy-modal').remove()" style="background:#0f172a; color:white; border:none; width:100%; padding:10px; border-radius:6px; font-weight:bold; font-size:12px; cursor:pointer; margin-top:15px; text-align:center;">
                    Nimeelewa na Nimekubali
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
    };
}