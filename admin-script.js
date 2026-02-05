/* =========================================================
   🚀 দেশি অফার - অ্যাডমিন মাস্টার স্ক্রিপ্ট (ফাইনাল ফিক্স)
============================================================ */

// ১. ফায়ারবেস কনফিগারেশন
var firebaseConfig = {
  apiKey: "AIzaSyAHO3ZPYWzTyEcPPNXv4rlxq4ut9fqfeJg",
  authDomain: "hmnayem-b9e55.firebaseapp.com",
  databaseURL: "https://hmnayem-b9e55-default-rtdb.firebaseio.com",
  projectId: "hmnayem-b9e55",
  storageBucket: "hmnayem-b9e55.firebasestorage.app",
  messagingSenderId: "287770671177",
  appId: "1:287770671177:web:7db5b8737e943bb07e2798"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// ২. সিকিউরিটি ভেরিয়েবল
const MASTER_ADMIN = "hmnayemtelecom990@gmail.com";
let currentEmail = localStorage.getItem('master_admin_email') || "";

// ৩. পারমিশন চেক (এটিই সব বাটনের প্রাণ)
function checkPermission() {
    let saved = localStorage.getItem('master_admin_email') || "";
    if (saved.toLowerCase().trim() === MASTER_ADMIN.toLowerCase().trim()) {
        return true;
    } else {
        alert("🚨 অনুমতি নেই!\nদয়া করে গুগল লগইন বাটনে ক্লিক করে " + MASTER_ADMIN + " জিমেইলটি সিলেক্ট করুন।");
        return false;
    }
}

// ৪. গুগল লগইন ফাংশন
function adminGoogleAuth() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then((result) => {
        let email = result.user.email.toLowerCase().trim();
        
        // মেমোরিতে জিমেইল সেভ করা হচ্ছে
        localStorage.setItem('master_admin_email', email);
        currentEmail = email;
        
        playSuccess();
        alert("✅ ভেরিফিকেশন সফল! এখন আপনি সব কাজ করতে পারবেন।");
        
        const profileInfo = document.getElementById('adminProfileInfo');
        if(profileInfo) {
            profileInfo.style.display = "block";
            profileInfo.innerHTML = "লগইনঃ <b>" + email + "</b>";
        }
    }).catch((error) => {
        alert("❌ লগইন ব্যর্থ: " + error.message);
    });
}

// ৫. এইচএম ইউজারনেম পাসওয়ার্ড লগইন
function checkLogin() {
    const u = document.getElementById('adminUser').value;
    const p = document.getElementById('adminPass').value;
    
    if (u === 'Hm' && p === 'nm') {
        playSuccess();
        document.getElementById('loginOverlay').classList.add('hidden');
        document.getElementById('mainAdminContent').classList.remove('hidden');
        
        // ডাটা লোড করা
        loadTotalCount();
        loadNoticeDisplay();
        loadAllOrders();
        
        // আগে জিমেইল সেভ থাকলে তা দেখানো
        if(currentEmail) {
            const info = document.getElementById('adminProfileInfo');
            if(info) {
                info.style.display = "block";
                info.innerHTML = "লগইনঃ <b>" + currentEmail + "</b>";
            }
        }
        showToast("লগইন সফল! 🔓");
    } else {
        document.getElementById('loginError').style.display = 'block';
        setTimeout(() => { document.getElementById('loginError').style.display='none'; }, 3000);
    }
}

// ৬. অর্ডার ম্যানেজমেন্ট (সাকসেস/রিজেক্ট বাটন)
function loadAllOrders() {
    db.ref('orders').on('value', snap => {
        const list = document.getElementById('adminOrderList');
        const badge = document.getElementById('order-pending-badge');
        if (!list) return;
        list.innerHTML = "";
        let pending = 0;

        if (!snap.exists()) {
            list.innerHTML = '<p style="text-align:center; color:#888;">কোনো অর্ডার নেই!</p>';
            return;
        }

        snap.forEach(child => {
            let o = child.val();
            let k = child.key;
            if(o.status === "Pending") pending++;

            list.innerHTML += `
                <div class="order-card-item" style="background:#161b22; padding:12px; border-radius:10px; margin-bottom:10px; border:1px solid #333; border-left:4px solid ${o.status==='Success'?'#28a745':'#ffcc00'};">
                    <div style="color:#00ffff; font-size:11px;">ID: ${o.customerId} | Status: ${o.status}</div>
                    <div style="color:#fff; font-weight:bold; margin:5px 0;">${o.offerName}</div>
                    <div style="color:#eee; font-size:13px;">📱 ${o.targetNumber} | 💰 ৳${o.price}</div>
                    <div style="display:flex; gap:10px; margin-top:10px;">
                        <button onclick="updateStatus('${k}', 'Success')" style="flex:1; background:#28a745; color:#fff; border:none; padding:8px; border-radius:5px; cursor:pointer;">সাকসেস</button>
                        <button onclick="updateStatus('${k}', 'Rejected')" style="flex:1; background:#ff4b2b; color:#fff; border:none; padding:8px; border-radius:5px; cursor:pointer;">রিজেক্ট</button>
                    </div>
                </div>`;
        });
        if(badge) { badge.innerText = pending; badge.style.display = pending > 0 ? "block" : "none"; }
    });
}

function updateStatus(key, status) {
    if (!checkPermission()) return; 
    db.ref('orders/' + key).update({ status: status }).then(() => {
        if(status === "Success") playSuccess();
        showToast("অর্ডার " + status + " হয়েছে!");
    });
}

// ৭. অফার ম্যানেজমেন্ট (অ্যাড ও ডিলিট)
function addOffer() {
    if (!checkPermission()) return; 
    const title = document.getElementById('offTitle').value;
    const price = document.getElementById('offPrice').value;
    const operator = document.getElementById('offOperator').value;
    const days = document.getElementById('offDays').value;

    if (!title || !price) { showToast("তথ্য দিন!"); return; }

    const data = {
        id: Date.now().toString(),
        title: title,
        price: price,
        dokanPrice: document.getElementById('offDokanPrice').value || "0",
        condition: document.getElementById('offCondition').value || "N/A",
        operator: operator,
        days: days
    };

    db.ref('offers/' + operator + '/' + days + '/' + data.id).set(data).then(() => {
        playSuccess();
        showToast("অফার যোগ হয়েছে!");
        closeModal('addOfferModal');
    });
}

function loadAdminOffers(sim) {
    const list = document.getElementById('admin-offer-list-modal');
    document.getElementById('viewSimTitle').innerText = sim;
    openModal('viewOffersModal');
    list.innerHTML = '<p style="text-align:center; color:#00ffff;">লোড হচ্ছে...</p>';

    db.ref('offers/' + sim).on('value', snap => {
        list.innerHTML = "";
        snap.forEach(daySnap => {
            daySnap.forEach(offSnap => {
                const off = offSnap.val();
                list.innerHTML += `
                <div style="background:#161b22; padding:10px; border-radius:8px; margin-bottom:8px; display:flex; align-items:center; border:1px solid #333;">
                    <div style="flex:1; color:#fff;">${off.title} (৳${off.price})</div>
                    <button onclick="deleteOffer('${off.operator}','${off.days}','${off.id}')" style="background:none; border:none; color:red; font-size:18px;">🗑️</button>
                </div>`;
            });
        });
    });
}

function deleteOffer(op, d, id) {
    if (!checkPermission()) return; 
    if (confirm("ডিলিট করতে চান?")) {
        db.ref('offers/' + op + '/' + d + '/' + id).remove().then(() => {
            playDel();
            showToast("ডিলিট হয়েছে!");
        });
    }
}

// ৮. অন্যান্য ফাংশন
function openModal(id) { document.getElementById(id).classList.remove('hidden'); playClick(); if(id==='userListModal') loadUserList(); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function showToast(m) { const t = document.getElementById('toast'); if(t){ t.innerText=m; t.style.top="20px"; setTimeout(()=>t.style.top="-100px", 3000); } }
function playClick() { document.getElementById('sndClick').play(); }
function playDel() { document.getElementById('sndDelete').play(); }
function playSuccess() { document.getElementById('sndSuccess').play(); }

window.onload = function() {
    // প্রতিবার অ্যাপে ঢুকলে পাসওয়ার্ড চাইবে
    document.getElementById('loginOverlay').classList.remove('hidden');
    document.getElementById('mainAdminContent').classList.add('hidden');
};

// ডাটা লোডারগুলো
function loadTotalCount() { db.ref('offers').on('value', snap => { let c=0; snap.forEach(o=>o.forEach(d=>c+=d.numChildren())); document.getElementById('offer-count').innerText="মোট অফারঃ "+c; }); }
function loadNoticeDisplay() { db.ref('dhakaOffer').on('value', s => { const d = document.getElementById('dhaka-notice-display'); if(s.exists()){ d.style.display='block'; document.getElementById('noticeTextShow').innerText=s.val().text; } else { d.style.display='none'; } }); }
function loadUserList() { /* আপনার ইউজার লিস্ট কোড */ }
