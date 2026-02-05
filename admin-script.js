/* =========================================================
   🚀 দেশি অফার - অ্যাডমিন মাস্টার স্ক্রিপ্ট (ধামাকা অফার ফিক্সড)
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

const MASTER_ADMIN = "hmnayemtelecom990@gmail.com";
let currentEmail = localStorage.getItem('master_admin_email') || "";

// ২. সিকিউরিটি চেক
function checkPermission() {
    let saved = localStorage.getItem('master_admin_email') || "";
    if (saved.toLowerCase().trim() === MASTER_ADMIN.toLowerCase().trim()) {
        return true;
    } else {
        alert("🚨 অনুমতি নেই! নিচে গিয়ে Google লগইন বাটনে ক্লিক করুন।");
        return false;
    }
}

// ৩. গুগল লগইন
function adminGoogleAuth() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then((result) => {
        let email = result.user.email.toLowerCase().trim();
        localStorage.setItem('master_admin_email', email);
        currentEmail = email;
        playSuccess();
        alert("✅ ভেরিফিকেশন সফল!");
        location.reload(); // সব রিফ্রেশ করে পারমিশন সচল করবে
    }).catch((error) => { alert("❌ লগইন ব্যর্থ: " + error.message); });
}

// ৪. এইচএম লগইন (Hm, nm)
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
            if(info) { info.style.display = "block"; info.innerHTML = "Verified: " + currentEmail; }
        }
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

// ৫. ধামাকা অফার (Notice) আপডেট ফাংশন
function updateNotice() {
    if (!checkPermission()) return; 
    const text = document.getElementById('noticeText').value;
    const price = document.getElementById('noticePrice').value;
    const days = document.getElementById('noticeDays').value;

    if (text && price) {
        // ডাটাবেসে dhakaOffer নামে সেভ হবে
        db.ref('dhakaOffer').set({
            text: text,
            price: price,
            days: days
        }).then(() => {
            playSuccess();
            alert("🚀 ধামাকা অফার পাবলিশ হয়েছে!");
            closeModal('noticeModal');
        });
    } else { alert("সবগুলো বক্স পূরণ করুন!"); }
}

// ধামাকা অফার ডিলিট
function deleteNotice() {
    if (!checkPermission()) return; 
    db.ref('dhakaOffer').remove().then(() => {
        playDel();
        alert("🗑️ অফার মুছে ফেলা হয়েছে!");
        closeModal('noticeModal');
    });
}

// ৬. হোমপেজে ধামাকা অফার দেখানো
function loadNoticeDisplay() {
    db.ref('dhakaOffer').on('value', snap => {
        const displayDiv = document.getElementById('dhaka-notice-display');
        const textShow = document.getElementById('noticeTextShow');
        if (snap.exists()) {
            let d = snap.val();
            displayDiv.style.display = 'block';
            textShow.innerHTML = `${d.text} - ৳${d.price} (${d.days} দিন)`;
        } else {
            displayDiv.style.display = 'none';
        }
    });
}

// ৭. অর্ডার লোড (Transaction ID সহ)
function loadAllOrders() {
    db.ref('orders').on('value', snap => {
        const list = document.getElementById('adminOrderList');
        if (!list) return;
        list.innerHTML = "";
        
        if (!snap.exists()) {
            list.innerHTML = '<p style="text-align:center; color:#888;">অর্ডার নেই!</p>';
            return;
        }

        snap.forEach(child => {
            let o = child.val();
            let k = child.key;
            let trx = o.transactionId || o.trxID || o.trx || "নেই";

            list.innerHTML += `
                <div class="order-card-item" style="background:#161b22; padding:12px; border-radius:10px; margin-bottom:10px; border-left:4px solid ${o.status==='Success'?'#28a745':'#ffcc00'}; border:1px solid #333;">
                    <div style="color:#00ffff; font-size:11px;">ID: ${o.customerId} | ${o.status}</div>
                    <div style="color:#fff; font-weight:bold; margin:5px 0;">${o.offerName}</div>
                    <div style="background:rgba(0,0,0,0.3); padding:8px; border-radius:6px; margin-top:5px;">
                        <div style="color:#eee; font-size:13px;">📱 নাম্বারঃ ${o.targetNumber}</div>
                        <div style="color:#ffcc00; font-size:13px;">💳 Trx ID: <b style="color:#fff;">${trx}</b></div>
                    </div>
                    <div style="display:flex; gap:10px; margin-top:10px;">
                        <button onclick="updateStatus('${k}', 'Success')" style="flex:1; background:#28a745; color:#fff; border:none; padding:8px; border-radius:5px; cursor:pointer;">সাকসেস</button>
                        <button onclick="updateStatus('${k}', 'Rejected')" style="flex:1; background:#ff4b2b; color:#fff; border:none; padding:8px; border-radius:5px; cursor:pointer;">রিজেক্ট</button>
                    </div>
                </div>`;
        });
    });
}

function updateStatus(key, status) {
    if (!checkPermission()) return; 
    db.ref('orders/' + key).update({ status: status }).then(() => {
        if(status === "Success") playSuccess();
    });
}

// ৮. অফার ও অন্যান্য ফাংশন
function addOffer() {
    if (!checkPermission()) return; 
    const title = document.getElementById('offTitle').value;
    const price = document.getElementById('offPrice').value;
    const operator = document.getElementById('offOperator').value;
    const days = document.getElementById('offDays').value;

    const data = { id: Date.now().toString(), title: title, price: price, operator: operator, days: days };
    db.ref('offers/' + operator + '/' + days + '/' + data.id).set(data).then(() => {
        playSuccess(); closeModal('addOfferModal');
    });
}

function loadAdminOffers(sim) {
    const list = document.getElementById('admin-offer-list-modal');
    document.getElementById('viewSimTitle').innerText = sim;
    openModal('viewOffersModal');
    db.ref('offers/' + sim).on('value', snap => {
        list.innerHTML = "";
        snap.forEach(daySnap => { daySnap.forEach(offSnap => {
            const off = offSnap.val();
            list.innerHTML += `<div style="padding:10px; border-bottom:1px solid #333; display:flex; justify-content:space-between; color:#fff;">
                <span>${off.title} (৳${off.price})</span>
                <button onclick="deleteOffer('${off.operator}','${off.days}','${off.id}')" style="color:red; background:none; border:none;">🗑️</button>
            </div>`;
        }); });
    });
}

function deleteOffer(op, d, id) {
    if (!checkPermission()) return; 
    if (confirm("ডিলিট করবেন?")) { db.ref('offers/' + op + '/' + d + '/' + id).remove(); }
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); playClick(); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function playClick() { document.getElementById('sndClick').play(); }
function playDel() { document.getElementById('sndDelete').play(); }
function playSuccess() { document.getElementById('sndSuccess').play(); }
function loadTotalCount() { db.ref('offers').on('value', snap => { let c=0; snap.forEach(o=>o.forEach(d=>c+=d.numChildren())); document.getElementById('offer-count').innerText="মোট অফারঃ "+c; }); }

window.onload = function() {
    document.getElementById('loginOverlay').classList.remove('hidden');
};
