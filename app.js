// ================= FIREBASE SDK IMPORTS =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc,
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

import { 
  getStorage, 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js";

// ================= FIREBASE CONFIGURATION =================
// ⚠️ WEKA DATA ZAKO HALISI ZA PROJECT MPYA HAPA:
const firebaseConfig = {
   apiKey: "AIzaSyBZTPWCHIrRQ1eyOfHZulxD9Q8GPzy9YgY",
  authDomain: "digitalhub-15f37.firebaseapp.com",
  projectId: "digitalhub-15f37",
  storageBucket: "digitalhub-15f37.firebasestorage.app",
  messagingSenderId: "1091127316841",
  appId: "1:1091127316841:web:f9ab21430250bcd2252df8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ================= GLOBAL CONFIGS =================
let currentUser = null;
let allProducts = [];
const ADMIN_EMAIL = "nurdinhashim061@gmail.com"; 
const ADMIN_WHATSAPP = "255671020855"; // Namba yako ya WhatsApp ya kupokea thibitisho

// ================= UTILS (COMPRESSION & TOAST) =================
async function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 400; 
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * (MAX_WIDTH / img.width);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
        };
    });
}

function showToast(msg, type="success") {
  const t = document.getElementById("toast");
  if(!t) return;
  t.innerText = msg; 
  t.style.background = type === "success" ? "#28a745" : "#dc3545";
  t.style.display = "block"; 
  setTimeout(() => t.style.display="none", 3000);
}

// ================= LOCK INTERFACE (LOGIN BLOCKER) =================
function injectAuthLock() {
  if (document.getElementById("auth-lock-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "auth-lock-overlay";
  overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:#f4f6f9; z-index:99999; display:flex; align-items:center; justify-content:center; font-family:system-ui, sans-serif; padding:15px; box-sizing:border-box;";
  
  overlay.innerHTML = `
    <div style="background:white; padding:30px 24px; border-radius:16px; width:100%; max-width:350px; box-shadow:0 10px 30px rgba(0,0,0,0.05); border:1px solid #eaeaea; text-align:center;">
      <h2 style="color:#00008b; margin:0 0 4px 0; font-size:24px; font-weight:800; letter-spacing:-0.5px;">📦 DigitalHub</h2>
      <p style="color:#666; font-size:12px; margin:0 0 24px 0; font-weight:500;">Ingia kupakua au kuuza bidhaa za kidijitali</p>
      
      <div style="display:flex; gap:10px; margin-bottom:20px; border-bottom:2px solid #f5f5f5;">
        <button id="lock-tab-login" style="flex:1; background:none; color:#00008b; border:none; border-bottom:3px solid #00008b; padding:8px; font-weight:700; cursor:pointer; font-size:13px;">Ingia</button>
        <button id="lock-tab-reg" style="flex:1; background:none; color:#999; border:none; padding:8px; font-weight:700; cursor:pointer; font-size:13px;">Jisajili</button>
      </div>

      <form id="lock-form" style="display:flex; flex-direction:column; gap:12px; text-align:left;">
        <div id="lock-reg-fields" style="display:none; flex-direction:column; gap:12px;">
          <input type="text" id="lock-biz-name" placeholder="Jina Lako kamili au la Biashara" style="padding:11px 12px; border-radius:8px; border:1px solid #dcdcdc; font-size:13px; background:#fafafa; outline:none; width:100%; box-sizing:border-box;">
          <input type="text" id="lock-phone" placeholder="Namba ya Kupokelea Hela (M-Pesa/Tigo)" style="padding:11px 12px; border-radius:8px; border:1px solid #dcdcdc; font-size:13px; background:#fafafa; outline:none; width:100%; box-sizing:border-box;">
        </div>
        <input type="email" id="lock-email" placeholder="Barua Pepe (Email)" style="padding:11px 12px; border-radius:8px; border:1px solid #dcdcdc; font-size:13px; background:#fafafa; outline:none; width:100%; box-sizing:border-box;" required>
        <input type="password" id="lock-pass" placeholder="Nywila (Password)" style="padding:11px 12px; border-radius:8px; border:1px solid #dcdcdc; font-size:13px; background:#fafafa; outline:none; width:100%; box-sizing:border-box;" required>
        
        <button type="submit" id="lock-submit-btn" style="background:#00008b; color:white; padding:12px; border:none; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer; margin-top:5px; box-shadow:0 4px 12px rgba(0,0,139,0.15);">Ingia Jukwaani</button>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  let isLogin = true;
  const regFields = document.getElementById("lock-reg-fields");
  const tabLogin = document.getElementById("lock-tab-login");
  const tabReg = document.getElementById("lock-tab-reg");
  const submitBtn = document.getElementById("lock-submit-btn");

  tabLogin.onclick = () => {
    isLogin = true;
    regFields.style.display = "none";
    tabLogin.style.borderBottom = "3px solid #00008b"; tabLogin.style.color = "#00008b";
    tabReg.style.borderBottom = "none"; tabReg.style.color = "#999";
    submitBtn.innerText = "Ingia Jukwaani";
  };

  tabReg.onclick = () => {
    isLogin = false;
    regFields.style.display = "flex";
    tabReg.style.borderBottom = "3px solid #00008b"; tabReg.style.color = "#00008b";
    tabLogin.style.borderBottom = "none"; tabLogin.style.color = "#999";
    submitBtn.innerText = "Unda Akaunti Bure";
  };

  document.getElementById("lock-form").onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById("lock-email").value.trim();
    const pass = document.getElementById("lock-pass").value.trim();

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, pass);
        showToast("Karibu DigitalHub!");
      } else {
        const name = document.getElementById("lock-biz-name").value.trim();
        const phone = document.getElementById("lock-phone").value.trim();
        if (!name || !phone) return alert("Tafadhali jaza nafasi zote!");

        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(res.user, { displayName: name });
        
        await setDoc(doc(db, "users", res.user.uid), {
          uid: res.user.uid,
          name: name,
          phone: phone,
          email: email,
          wallet: 0,
          createdAt: new Date().toISOString()
        });
        showToast("Akaunti imeundwa tayari!");
      }
    } catch (err) { alert("Kosa: " + err.message); }
  };
}
// ================= ACCORDION EFFECT FOR SERVICES =================
const toggleServicesBtn = document.getElementById("toggle-services-btn");
const servicesContent = document.getElementById("services-content");
const servicesArrow = document.getElementById("services-arrow");

if (toggleServicesBtn) {
    toggleServicesBtn.onclick = () => {
        if (servicesContent.style.display === "block") {
            servicesContent.style.display = "none";
            servicesArrow.classList.remove("rotate");
        } else {
            servicesContent.style.display = "block";
            servicesArrow.classList.add("rotate");
        }
    };
}

// ================= AUTH STATE NAVIGATION =================
onAuthStateChanged(auth, async (user) => {
    currentUser = user || null;
    const lockOverlay = document.getElementById("auth-lock-overlay");
    const logoutBtn = document.getElementById("logoutBtn");
    const userBadge = document.getElementById("user-display-name");

    if (user) {
        if (lockOverlay) lockOverlay.remove();
        logoutBtn.style.display = "block";
        userBadge.style.display = "block";
        userBadge.innerText = user.displayName || "Mwanachama";
        
        loadProducts();
        syncWallet();
        renderMyProducts();
    } else {
        injectAuthLock();
        logoutBtn.style.display = "none";
        userBadge.style.display = "none";
    }
});

document.getElementById("logoutBtn").onclick = () => signOut(auth);

// ================= TABS SWITCHING (SOKO VS DASHBOARD) =================
const tabExplore = document.getElementById("tab-explore");
const tabDashboard = document.getElementById("tab-dashboard");
const exploreSection = document.getElementById("explore-section");
const dashboardSection = document.getElementById("dashboard-section");

tabExplore.onclick = () => {
    tabExplore.classList.add("active"); tabDashboard.classList.remove("active");
    exploreSection.style.display = "block"; dashboardSection.style.display = "none";
};

tabDashboard.onclick = () => {
    tabDashboard.classList.add("active"); tabExplore.classList.remove("active");
    dashboardSection.style.display = "block"; exploreSection.style.display = "none";
};

// ================= WALLET SYNC & WITHDRAWAL =================
async function syncWallet() {
    if (!currentUser) return;
    const uDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (uDoc.exists()) {
        const bal = uDoc.data().wallet || 0;
        document.getElementById("wallet-balance").innerText = `Tsh ${bal.toLocaleString()}/=`;
    }
}

document.getElementById("withdraw-btn").onclick = async () => {
    const uDoc = await getDoc(doc(db, "users", currentUser.uid));
    const currentBal = uDoc.exists() ? (uDoc.data().wallet || 0) : 0;
    
    if (currentBal < 5000) return alert("Huwezi kutoa chini ya Tsh 5,000/= mkuu!");

    const msg = `Habari Admin,\nNamba yangu ya akaunti ni: *${currentUser.uid}*\nNaomba kutoa salio langu la mauzo la: *Tsh ${currentBal.toLocaleString()}/=* kwenda namba yangu ya simu: *${uDoc.data().phone}*`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
};

// ================= UPLOAD PRODUCT (STORAGE + FIRESTORE) =================
document.getElementById("upload-form").onsubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const title = document.getElementById("prod-title").value.trim();
    const price = Number(document.getElementById("prod-price").value.trim());
    const category = document.getElementById("prod-category").value;
    const description = document.getElementById("prod-desc").value.trim();
    const coverFile = document.getElementById("prod-cover").files[0];
    const itemFile = document.getElementById("prod-file").files[0];

    const submitBtn = document.getElementById("submit-prod-btn");
    submitBtn.disabled = true; submitBtn.innerText = "Inapakia faili jukwaani...";

    try {
        // 1. Compress na Pakia Picha ya Kava
        const compressedCover = await compressImage(coverFile);
        
        // 2. Pakia Faili Halisi (PDF/ZIP) Kwenye Firebase Storage
        const fileRef = storageRef(storage, `digital_files/${currentUser.uid}_${Date.now()}_${itemFile.name}`);
        const uploadSnap = await uploadBytes(fileRef, itemFile);
        const finalFileURL = await getDownloadURL(uploadSnap.ref);

        // 3. Hifadhi Data zote Kwenye Firestore
        await addDoc(collection(db, "products"), {
            title,
            price,
            category,
            description,
            coverURL: compressedCover,
            fileURL: finalFileURL, // Hili ndio faili litakalodownlodiwa mteja akilipia
            sellerId: currentUser.uid,
            sellerName: currentUser.displayName || "Muuza Bidhaa",
            priority: 0, // 1 ikiwa Boosted
            createdAt: serverTimestamp()
        });

        showToast("Bidhaa imewekwa sokoni! ✅");
        document.getElementById("upload-form").reset();
        loadProducts();
        renderMyProducts();
        tabExplore.click(); // Mrejeshe mteja sokoni kuona alichopost
    } catch (err) {
        alert("Kosa limejitokeza: " + err.message);
    } finally {
        submitBtn.disabled = false; submitBtn.innerText = "Weka Sokoni Sasa";
    }
};

// ================= RENDERING & SEARCH ENGINE =================
window.loadProducts = async function(catFilter = "all") {
    try {
        const q = query(collection(db, "products"), orderBy("priority", "desc"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        allProducts = [];
        snap.forEach(d => allProducts.push({ id: d.id, ...d.data() }));

        let filtered = allProducts;
        if (catFilter !== 'all') filtered = allProducts.filter(p => p.category === catFilter);
        renderMarketGrid(filtered);
    } catch (err) { console.error(err); }
};

window.filterCategory = (cat) => {
    document.querySelectorAll(".cat-chip").forEach(c => c.classList.remove("active"));
    event.target.classList.add("active");
    loadProducts(cat);
};

document.getElementById("search-input").oninput = (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p => p.title.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
    renderMarketGrid(filtered);
};

function renderMarketGrid(products) {
    const grid = document.getElementById("products-grid");
    if (!grid) return;
    grid.innerHTML = products.length === 0 ? `<p style="text-align:center; padding:40px; color:gray; font-size:12px;">Hakuna bidhaa sokoni kwa sasa...</p>` : "";

    products.forEach(p => {
        grid.innerHTML += `
            <div class="digital-card">
                ${p.priority === 1 ? `<div class="vip-tag"><i class="fa-solid fa-fire"></i> VIP</div>` : ""}
                <img src="${p.coverURL}" class="digital-card-cover">
                <div class="digital-card-info">
                    <span class="badge-file-type ${p.category}">${p.category}</span>
                    <h4 class="digital-card-title">${p.title}</h4>
                    <p class="digital-card-seller">Muuza: <b>${p.sellerName}</b></p>
                    <div class="digital-card-price">Tsh ${Number(p.price).toLocaleString()}/=</div>
                </div>
                <button class="btn-buy" onclick="triggerPesaPalPurchase('${p.id}', '${p.title}', ${p.price}, '${p.sellerId}')">
                     <i class="fa-solid fa-cart-shopping"></i> Nunua
                </button>
            </div>
        `;
    });
}

// ================= THE PESAPAL LOOP AND WALLET UPDATE =================
window.triggerPesaPalPurchase = async function(prodId, title, price, sellerId) {
    // 1. Boksi la Kijanja la Malipo la PesaPal (Loop Mode ya Kipro)
    const oldModal = document.getElementById("pesapal-modal");
    if (oldModal) oldModal.remove();

    const overlay = document.createElement("div");
    overlay.id = "pesapal-modal";
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); z-index:100000; display:flex; align-items:center; justify-content:center; font-family:system-ui, sans-serif; padding:15px; box-sizing:border-box;";

    overlay.innerHTML = `
        <div style="background:white; padding:25px 20px; border-radius:12px; width:100%; max-width:350px; text-align:center; position:relative;">
          <button onclick="document.getElementById('pesapal-modal').remove()" style="position:absolute; top:12px; right:15px; background:none; border:none; font-size:18px; color:#999; cursor:pointer;">✕</button>
          
          <h3 style="color:#00008b; margin:0 0 8px 0; font-size:16px; font-weight:800;">🔒 PESAPAL SECURE GATEWAY</h3>
          <p style="color:#555; font-size:12px; margin:0 0 15px 0;">Unanunua: <b>"${title}"</b></p>
          
          <div style="background:#f8f9fa; border:1px dashed #00008b; border-radius:8px; padding:12px; margin-bottom:15px; text-align:left;">
            <div style="font-size:14px; font-weight:bold; color:#333;">Kiasi cha Kulipa: <span style="color:#28a745;">Tsh ${price.toLocaleString()}/=</span></div>
            <div style="font-size:11px; color:#666; margin-top:4px;">Lipia kupitia mitandao yote ya Simu au Kadi ya Benki kwa usalama.</div>
          </div>

          <div style="text-align:left; display:flex; flex-direction:column; gap:6px; margin-bottom:15px;">
            <label style="font-size:11px; font-weight:700; color:#333;">Kumbukumbu ya Muamala / Ref ya PesaPal:</label>
            <input type="text" id="pesapal-ref" placeholder="Weka muamala au jina lako la malipo" style="padding:10px; border-radius:6px; border:1px solid #ccc; font-size:13px; width:100%; box-sizing:border-box; outline:none;">
          </div>

          <button id="pesapal-confirm-btn" style="background:#28a745; color:white; border:none; width:100%; padding:12px; border-radius:6px; font-weight:bold; font-size:13px; cursor:pointer;">
             Thibitisha & Download
          </button>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById("pesapal-confirm-btn").onclick = async () => {
        const ref = document.getElementById("pesapal-ref").value.trim();
        if(!ref) return alert("Tafadhali weka uthibitisho wa malipo!");

        const confirmBtn = document.getElementById("pesapal-confirm-btn");
        confirmBtn.disabled = true; confirmBtn.innerText = "Inahakiki...";

        try {
            // HESABU ZA KAMISHENI YA 10%
            const platformFee = price * 0.10; // 10% inabaki kwako Admin
            const sellerEarning = price - platformFee; // 90% inaenda kwa muuzaji

            // SASA: Ongeza hiyo hela kwenye Wallet ya yule muuzaji kwenye Firebase
            if (sellerId !== ADMIN_EMAIL) {
                const sellerDocRef = doc(db, "users", sellerId);
                const sDoc = await getDoc(sellerDocRef);
                if (sDoc.exists()) {
                    const currentWallet = sDoc.data().wallet || 0;
                    await updateDoc(sellerDocRef, { wallet: currentWallet + sellerEarning });
                }
            }

            // PATA LINK YA DOWNLOAD YA LILE FAILI LA KIDIJITALI MOJA KWA MOJA
            const pDoc = await getDoc(doc(db, "products", prodId));
            if (pDoc.exists() && pDoc.data().fileURL) {
                showToast("Malipo Yamehakikiwa! Faili linafunguka... ✅");
                overlay.remove();
                
                // Mfungulie faili lake kwenye window mpya ili adownload papo hapo
                window.open(pDoc.data().fileURL, '_blank');
            } else {
                alert("Marekebisho: Faili halikupatikana lakini muamala umepokelewa.");
            }
        } catch (err) {
            alert("Kosa: " + err.message);
        }
    };
};

// ================= RENDER PRODUCTS OWNED BY SELLER =================
async function renderMyProducts() {
    if(!currentUser) return;
    const list = document.getElementById("my-products-list");
    if(!list) return;

    const q = query(collection(db, "products"), where("sellerId", "==", currentUser.uid));
    const snap = await getDocs(q);
    list.innerHTML = snap.size === 0 ? `<p style="font-size:11px; color:gray;">Hujapandisha bidhaa bado.</p>` : "";

    snap.forEach(d => {
        const data = d.data();
        list.innerHTML += `
            <div class="my-prod-item">
                <span style="font-size:12px; font-weight:600;">${data.title}</span>
                <button onclick="window.deleteProduct('${d.id}')" style="background:none; border:none; color:red; font-size:12px; cursor:pointer;"><i class="fa-solid fa-trash-can"></i> Futa</button>
            </div>
        `;
    });
}

window.deleteProduct = async (id) => {
    if (confirm("Je, una uhakika wa kufuta bidhaa hii sokoni?")) {
        await deleteDoc(doc(db, "products", id));
        loadProducts();
        renderMyProducts();
        showToast("Imefutwa!");
    }
};