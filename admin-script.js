/* =========================================================
   🚀 দেশি অফার - অ্যাডমিন মাস্টার স্ক্রিপ্ট (ফাইনাল ভার্সন)
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

// ২. সিকিউরিটি ও পারমিশন সিস্টেম
const MASTER_ADMIN = "hmnayemtelecom990@gmail.com";
let currentEmail = localStorage.getItem('master_admin_email') || "";

function checkPermission() {
    let saved = localStorage.getItem('master_admin_email') || "";
    if (saved.toLowerCase().trim() === MASTER_ADMIN.toLowerCase().trim()) {
        return true;
    } else {
        alert("🚨 অনুমতি নেই!\nদয়া করে নিচে 'Google দিয়ে লগইন' করে " + MASTER_ADMIN + " ভেরিফাই করুন।");
        return false;
    }
}

// গুগল লগইন ফাংশন
function adminGoogleAuth() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then((result) => {
        let email = result.user.email.toLowerCase().trim();
        localStorage.setItem('master_admin_email', email);
        currentEmail = email;
        playSuccess();
        alert("✅ ভেরিফিকেশন সফল! এখন সব বাটন কাজ করবে।");
        location.reload(); 
    }).catch((error) => {
        alert("❌ লগইন ব্যর্থ: " + error.message);
    });
}

// ৩. টোস্ট ও লগইন ফাংশন
function showToast(message) {
    const toast = document.getElementById('toast');
    if(toast) {
        toast.innerText = message;
        toast.style.top = "20px";
        setTimeout(() => { toast.style.top = "-100px"; }, 3000);
    }
}

function checkLogin() {
  const user = document.getElementById('adminUser').value;
  const pass = document.getElementById('adminPass').value;
  
  if (user === 'Hm' && pass === 'nm') {
    playSuccess();
    document.getElementById('loginOverlay').classList.add('hidden');
    document.getElementById('mainAdminContent').classList.remove('hidden');
    sessionStorage.setItem('adminLogin', 'true');
    
    loadTotalCount();
    loadNoticeDisplay();
    loadAllOrders();
    
    if(currentEmail) {
        const info = document.getElementById('adminProfileInfo');
        if(info) {
            info.style.display = "block";
            info.innerHTML = "Verified Admin: <b>" + currentEmail + "</b>";
        }
    }
    showToast("লগইন সফল হয়েছে! 🔓");
  } else {
    showToast("ভুল ইউজারনেম বা পাসওয়ার্ড! ❌");
  }
}

window.onload = function() {
  if (sessionStorage.getItem('adminLogin') === 'true') {
    document.getElementById('loginOverlay').classList.add('hidden');
    document.getElementById('mainAdminContent').classList.remove('hidden');
    loadTotalCount();
    loadNoticeDisplay();
    loadAllOrders();
    if(currentEmail) {
        const info = document.getElementById('adminProfileInfo');
        if(info) {
            info.style.display = "block";
            info.innerHTML = "Verified Admin: <b>" + currentEmail + "</b>";
        }
    }
  }
};

// ৪. মডাল ও সাউন্ড কন্ট্রোল
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
    playClick();
    if(id === 'userListModal') loadAllUsers(); // ইউজার লিস্ট খুললে লোড হবে
}
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function playClick() { document.getElementById('sndClick').play(); }
function playDel() { document.getElementById('sndDelete').play(); }
function playSuccess() { document.getElementById('sndSuccess').play(); }

// ৫. অফার ম্যানেজমেন্ট
function loadAdminOffers(sim) {
    const list = document.getElementById('admin-offer-list-modal');
    document.getElementById('viewSimTitle').innerText = sim + " কন্ট্রোল";
    openModal('viewOffersModal');
    list.innerHTML = '<p style="text-align:center; color:#00ffff;">লোড হচ্ছে...</p>';

    db.ref('offers/' + sim).on('value', snap => {
        list.innerHTML = "";
        if (!snap.exists()) {
            list.innerHTML = `<p style="text-align:center; color:#ff4b2b; padding:20px;">কোনো অফার নেই।</p>`;
            return;
        }
        snap.forEach(daySnap => {
            daySnap.forEach(offSnap => {
                const off = offSnap.val();
                list.innerHTML += `
                <div style="background:#161b22; padding:12px; border-radius:10px; margin-bottom:10px; border:1px solid #333; display:flex; align-items:center;">
                    <div style="flex:1;">
                        <h4 style="margin:0; color:#fff; font-size:14px;">${off.title}</h4>
                        <p style="margin:4px 0; font-size:12px; color:#00ffff;">${off.days} দিন | ৳${off.price}</p>
                    </div>
                    <button onclick="deleteOffer('${off.operator}','${off.days}','${off.id}')" style="background:none; border:none; color:red; font-size:18px; cursor:pointer;">🗑️</button>
                </div>`;
            });
        });
    });
}

function addOffer() {
  if (!checkPermission()) return;
  const title = document.getElementById('offTitle').value;
  const price = document.getElementById('offPrice').value;
  const operator = document.getElementById('offOperator').value;
  const days = document.getElementById('offDays').value;

  if (!title || !price) { showToast("তথ্য পূরণ করুন! ⚠️"); return; }

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
    showToast("অফার যোগ হয়েছে! ✅");
    closeModal('addOfferModal');
  });
}

function deleteOffer(op, d, id) {
  if (!checkPermission()) return;
  if (confirm("অফারটি ডিলিট করতে চান?")) {
    db.ref('offers/' + op + '/' + d + '/' + id).remove().then(() => {
        playDel();
        showToast("ডিলিট হয়েছে! 🗑️");
    });
  }
}

// ৬. ধামাকা অফার (Notice)
function updateNotice() {
    if (!checkPermission()) return;
    const text = document.getElementById('noticeText').value;
    const price = document.getElementById('noticePrice').value;
    const days = document.getElementById('noticeDays').value;

    if (text && price) {
        db.ref('dhakaOffer').set({ text: text, price: price, days: days }).then(() => {
            playSuccess();
            showToast("ধামাকা অফার আপডেট হয়েছে! 🚀");
            closeModal('noticeModal');
        });
    } else { showToast("তথ্য দিন! ⚠️"); }
}

function deleteNotice() {
    if (!checkPermission()) return;
    db.ref('dhakaOffer').remove().then(() => {
        playDel();
        showToast("মুছে ফেলা হয়েছে! 🗑️");
        closeModal('noticeModal');
    });
}

// ৭. অর্ডার ম্যানেজমেন্ট (Trx ID ও কপি সিস্টেম সহ)
function copyNum(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast("কপি হয়েছে! 📋");
        playClick();
    });
}

function loadAllOrders() {
    db.ref('allOrders').on('value', snap => {
        const list = document.getElementById('adminOrderList');
        const badge = document.getElementById('order-pending-badge');
        if (!list) return;
        list.innerHTML = "";
        
        if (!snap.exists()) {
            list.innerHTML = '<p style="text-align:center; color:#888; padding: 20px;">কোনো অর্ডার নেই 😴</p>';
            if(badge) badge.style.display = "none";
            return;
        }

        let pending = 0;
        snap.forEach(child => {
            let o = child.val();
            let key = child.key;
            if(o.status === "Pending") pending++;

            list.innerHTML += `
                <div class="order-card-item" style="background:#161b22; border-left: 4px solid ${o.status === 'Success' ? '#28a745' : '#ffcc00'}; border-radius:10px; padding:12px; margin-bottom:12px; border:1px solid #333;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; border-bottom: 1px solid #222; padding-bottom: 5px;">
                        <img src="${o.userPhoto || 'https://ui-avatars.com/api/?name=U'}" style="width: 35px; height: 35px; border-radius: 50%;">
                        <div style="flex: 1;">
                            <div style="color: #00ffff; font-size: 11px;">ID: ${o.userId}</div>
                            <div style="color: #666; font-size: 9px;">🕒 ${o.time || ''}</div>
                        </div>
                        <div style="font-size: 10px; color: ${o.status === 'Success' ? '#28a745' : '#ffcc00'}; font-weight:bold;">${o.status}</div>
                    </div>

                    <div style="color: #fff; font-weight: bold; margin-bottom: 5px;">${o.title || o.offerName}</div>
                    
                    <div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <span style="color: #eee; font-size: 13px;">📱 নাম্বারঃ <b>${o.customerNumber}</b></span>
                            <button onclick="copyNum('${o.customerNumber}')" style="background: #333; color: #00ffff; border: none; padding: 2px 8px; border-radius: 4px; font-size: 10px; cursor:pointer;">কপি</button>
                        </div>
                        <div style="color: #ffcc00; font-size: 13px; margin-top: 5px;">
                            💳 Trx ID: <b style="color: #fff;">${o.trxId || 'নেই'}</b> 
                            <span onclick="copyNum('${o.trxId}')" style="cursor:pointer; font-size: 10px; color: #00ffff;"> (কপি)</span>
                        </div>
                        <div style="font-size: 11px; color: #aaa; margin-top: 3px;">💰 দামঃ ৳${o.price} | 🏦 ${o.method || 'Bkash'}</div>
                    </div>

                    <div style="display: flex; gap: 8px; margin-top: 10px;">
                        <button onclick="updateOrderStatus('${key}', 'Pending')" style="flex: 1; background: #333; color: #fff; border: 1px solid #444; padding: 6px; border-radius: 5px; cursor:pointer;">পেন্ডিং</button>
                        <button onclick="completeOrderAction('${key}')" style="flex: 1; background: #28a745; color: #fff; border: none; padding: 6px; border-radius: 5px; font-weight: bold; cursor:pointer;">সাকসেস</button>
                    </div>
                </div>`;
        });
        if(badge) { badge.innerText = pending; badge.style.display = pending > 0 ? "block" : "none"; }
    });
}

function updateOrderStatus(key, status) {
    if (!checkPermission()) return;
    db.ref('allOrders/' + key).update({ status: status }).then(() => { showToast("আপডেট হয়েছে! 🔄"); });
}

function completeOrderAction(key) {
    if (!checkPermission()) return;
    if(confirm("অর্ডারটি সাকসেস করবেন?")) {
        db.ref('allOrders/' + key).update({ status: "Success" }).then(() => {
            playSuccess();
            showToast("অর্ডার সফল হয়েছে! ✅");
        });
    }
}

// ৮. ইউজার লিস্ট ম্যানেজমেন্ট
function loadAllUsers() {
    const userList = document.getElementById('adminUserList');
    userList.innerHTML = '<p style="text-align:center; color:#00ffff;">লোড হচ্ছে...</p>';
    
    db.ref('users').on('value', snap => {
        userList.innerHTML = "";
        if (!snap.exists()) {
            userList.innerHTML = '<p style="text-align:center; color:#888;">কোনো ইউজার নেই!</p>';
            return;
        }
        snap.forEach(child => {
            let u = child.val();
            userList.innerHTML += `
                <div style="background:#161b22; padding:10px; border-radius:8px; margin-bottom:8px; display:flex; align-items:center; border:1px solid #333;">
                    <img src="${u.photo || 'https://ui-avatars.com/api/?name=U'}" style="width:35px; height:35px; border-radius:50%; margin-right:10px;">
                    <div style="flex:1;">
                        <div style="color:#fff; font-size:13px; font-weight:bold;">${u.name || 'User'}</div>
                        <div style="color:#666; font-size:11px;">ID: ${u.customerId || u.uid}</div>
                    </div>
                </div>`;
        });
    });
}

// ৯. কাউন্টার ও ডিসপ্লে
function loadTotalCount() {
    db.ref('offers').on('value', snap => {
        let count = 0;
        snap.forEach(op => { op.forEach(day => { count += day.numChildren(); }); });
        document.getElementById('offer-count').innerText = "মোট অফারঃ " + count;
    });
}

function loadNoticeDisplay() {
    db.ref('dhakaOffer').on('value', snap => {
        const displayDiv = document.getElementById('dhaka-notice-display');
        const textShow = document.getElementById('noticeTextShow');
        if (snap.exists()) {
            let data = snap.val();
            displayDiv.style.display = 'block';
            textShow.innerHTML = `${data.text} <br> <span style="color:#00ffff; font-size:12px;">৳${data.price} (${data.days} দিন)</span>`;
        } else { displayDiv.style.display = 'none'; }
    });
}
