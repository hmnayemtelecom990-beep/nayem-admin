/* =========================================================
   🚀 দেশি অফার - অ্যাডমিন মাস্টার স্ক্রিপ্ট (Trx ID ফিক্সড)
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

// ৩. পারমিশন চেক (বাটন কন্ট্রোল)
function checkPermission() {
    let saved = localStorage.getItem('master_admin_email') || "";
    if (saved.toLowerCase().trim() === MASTER_ADMIN.toLowerCase().trim()) {
        return true;
    } else {
        alert("🚨 অনুমতি নেই!\nআগে গুগল লগইন করে " + MASTER_ADMIN + " ভেরিফাই করুন।");
        return false;
    }
}

// ৪. গুগল লগইন ফাংশন
function adminGoogleAuth() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then((result) => {
        let email = result.user.email.toLowerCase().trim();
        localStorage.setItem('master_admin_email', email);
        currentEmail = email;
        playSuccess();
        alert("✅ ভেরিফিকেশন সফল! এখন সব বাটন কাজ করবে।");
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
        loadTotalCount();
        loadNoticeDisplay();
        loadAllOrders();
        if(currentEmail) {
            const info = document.getElementById('adminProfileInfo');
            if(info) { info.style.display = "block"; info.innerHTML = "লগইনঃ <b>" + currentEmail + "</b>"; }
        }
        showToast("লগইন সফল! 🔓");
    } else {
        document.getElementById('loginError').style.display = 'block';
        setTimeout(() => { document.getElementById('loginError').style.display='none'; }, 3000);
    }
}

// ৬. অর্ডার ম্যানেজমেন্ট (ট্রানজেকশন আইডি সহ)
function loadAllOrders() {
    db.ref('orders').on('value', snap => {
        const list = document.getElementById('adminOrderList');
        const badge = document.getElementById('order-pending-badge');
        if (!list) return;
        list.innerHTML = "";
        let pendingCount = 0;

        if (!snap.exists()) {
            list.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">কোনো অর্ডার নেই!</p>';
            if(badge) badge.style.display = "none";
            return;
        }

        snap.forEach(child => {
            let o = child.val();
            let k = child.key;
            if(o.status === "Pending") pendingCount++;

            // ট্রানজেকশন আইডি ও মেথড বের করা (যাতে কোনোটা মিস না হয়)
            let trx = o.transactionId || o.trxID || o.trx || "নেই";
            let method = o.paymentMethod || o.method || "N/A";

            list.innerHTML += `
                <div class="order-card-item" style="background:#161b22; padding:15px; border-radius:12px; margin-bottom:12px; border:1px solid #333; border-left:5px solid ${o.status==='Success'?'#28a745':'#ffcc00'};">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span style="color:#00ffff; font-size:11px;">ID: ${o.customerId || 'User'}</span>
                        <span style="color:${o.status==='Success'?'#28a745':'#ffcc00'}; font-size:12px; font-weight:bold;">${o.status}</span>
                    </div>
                    
                    <div style="color:#fff; font-weight:bold; font-size:15px; margin-bottom:8px;">📦 ${o.offerName}</div>
                    
                    <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; border: 1px solid #222;">
                        <div style="color:#eee; font-size:13px; margin-bottom:4px;">📱 নাম্বারঃ <b style="color:#fff;">${o.targetNumber}</b></div>
                        <div style="color:#ffcc00; font-size:13px; margin-bottom:4px;">💳 Trx ID: <b style="color:#fff; background:#000; padding:2px 6px; border-radius:4px;">${trx}</b></div>
                        <div style="color:#00f2fe; font-size:12px;">🏦 মেথডঃ ${method} | ৳${o.price}</div>
                    </div>
                    
                    <div style="display:flex; gap:10px; margin-top:12px;">
                        <button onclick="updateStatus('${k}', 'Success')" style="flex:1; background:#28a745; color:#fff; border:none; padding:8px; border-radius:6px; cursor:pointer; font-weight:bold;">সাকসেস</button>
                        <button onclick="updateStatus('${k}', 'Rejected')" style="flex:1; background:#ff4b2b; color:#fff; border:none; padding:8px; border-radius:6px; cursor:pointer; font-weight:bold;">রিজেক্ট</button>
                    </div>
                </div>`;
        });
        if(badge) { badge.innerText = pendingCount; badge.style.display = pendingCount > 0 ? "block" : "none"; }
    });
}

function updateStatus(key, status) {
    if (!checkPermission()) return; 
    db.ref('orders/' + key).update({ status: status }).then(() => {
        if(status === "Success") playSuccess();
        showToast("অর্ডার " + status + " হয়েছে!");
    });
}

// ৭. অফার ম্যানেজমেন্ট
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

// ৮. অন্যান্য ইউটিলিটি
function openModal(id) { document.getElementById(id).classList.remove('hidden'); playClick(); if(id==='userListModal') loadUserList(); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function showToast(m) { const t = document.getElementById('toast'); if(t){ t.innerText=m; t.style.top="20px"; setTimeout(()=>t.style.top="-100px", 3000); } }
function playClick() { document.getElementById('sndClick').play(); }
function playDel() { document.getElementById('sndDelete').play(); }
function playSuccess() { document.getElementById('sndSuccess').play(); }

window.onload = function() {
    document.getElementById('loginOverlay').classList.remove('hidden');
    document.getElementById('mainAdminContent').classList.add('hidden');
};

function loadTotalCount() { db.ref('offers').on('value', snap => { let c=0; snap.forEach(o=>o.forEach(d=>c+=d.numChildren())); document.getElementById('offer-count').innerText="মোট অফারঃ "+c; }); }
function loadNoticeDisplay() { db.ref('dhakaOffer').on('value', s => { const d = document.getElementById('dhaka-notice-display'); if(s.exists()){ d.style.display='block'; document.getElementById('noticeTextShow').innerText=s.val().text; } else { d.style.display='none'; } }); }

// ইউজার লিস্ট ফাংশন (যদি প্রয়োজন হয়)
function loadUserList() {
    const userListDiv = document.getElementById('adminUserList');
    db.ref('users').on('value', snap => {
        userListDiv.innerHTML = "";
        snap.forEach(child => {
            let u = child.val();
            userListDiv.innerHTML += `<div style="padding:10px; border-bottom:1px solid #333; color:#fff;">${u.name} (${u.customerId})</div>`;
        });
    });
}
