// ১. ফায়ারবেস কনফিগারেশন (আপনার দেওয়া কনফিগারেশন অনুযায়ী)
var firebaseConfig = {
  apiKey: "AIzaSyAHO3ZPYWzTyEcPPNXv4rlxq4ut9fqfeJg",
  authDomain: "hmnayem-b9e55.firebaseapp.com",
  databaseURL: "https://hmnayem-b9e55-default-rtdb.firebaseio.com",
  projectId: "hmnayem-b9e55",
  storageBucket: "hmnayem-b9e55.firebasestorage.app",
  messagingSenderId: "287770671177",
  appId: "1:287770671177:web:7db5b8737e943bb07e2798"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* =========================================================
   🔒 সিকিউরিটি সিস্টেম (নিখুঁত পারমিশন ফিক্স)
============================================================ */
// এখানে ইমেইলটি একদম ছোট হাতের অক্ষরে লিখে রাখা হলো
const MASTER_ADMIN_EMAIL = "hmnayemtelecom990@gmail.com"; 

// অ্যাপ চালু হওয়ার সময় মেমোরি থেকে জিমেইল টেনে আনা
let currentAdminEmail = localStorage.getItem('masterAdminEmail') || ""; 

// পারমিশন চেক ফাংশন
function checkPermission() {
    // মেমোরিতে যা সেভ আছে তা ছোট হাতের করে চেক করছে
    let savedEmail = localStorage.getItem('masterAdminEmail') || "";
    
    if (savedEmail.toLowerCase().trim() === MASTER_ADMIN_EMAIL.toLowerCase().trim()) {
        return true;
    } else {
        // যদি না মিলে তবে এই মেসেজটি দেখাবে
        alert("🚨 অনুমতি নেই!\nবর্তমানে লগইন করা ইমেইল: " + (savedEmail || "কিছুই নেই") + "\n\nসঠিক জিমেইল দিয়ে লগইন করুন।");
        return false;
    }
}


// গুগল অথেন্টিকেশন (একবার করলেই মেমোরিতে সেভ হবে)
function adminGoogleAuth() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then((result) => {
        let user = result.user;
        currentAdminEmail = user.email.toLowerCase().trim();
        
        // মেমোরিতে সেভ
        localStorage.setItem('masterAdminEmail', currentAdminEmail);
        
        playSuccess();
        alert("✅ ভেরিফিকেশন সফল! এখন থেকে আপনি কাজ করতে পারবেন।");
        updateProfileUI(user.email);
    }).catch((error) => {
        alert("❌ গুগল লগইন ব্যর্থ: " + error.message);
    });
}

function updateProfileUI(email) {
    const profileInfo = document.getElementById('adminProfileInfo');
    if(profileInfo && email) {
        profileInfo.style.display = "block";
        profileInfo.innerHTML = `ভেরিফাইড জিমেইলঃ <b>${email}</b>`;
    }
}

// ২. পাসওয়ার্ড লগইন (এটি প্রতিবার চাইবে)
function checkLogin() {
  const user = document.getElementById('adminUser').value;
  const pass = document.getElementById('adminPass').value;
  
  if (user === 'Hm' && pass === 'nm') {
    playSuccess();
    document.getElementById('loginOverlay').classList.add('hidden');
    document.getElementById('mainAdminContent').classList.remove('hidden');
    
    // ডাটা লোড করা
    loadTotalCount();
    loadNoticeDisplay();
    loadAllOrders(); 
    
    // আগে জিমেইল সেভ করা থাকলে সেটা দেখানো
    if(currentAdminEmail) updateProfileUI(currentAdminEmail);
    
    showToast("লগইন সফল! 🔓");
  } else {
    document.getElementById('loginError').style.display = "block";
    setTimeout(() => { document.getElementById('loginError').style.display = "none"; }, 3000);
  }
}

// ৩. অর্ডার কন্ট্রোল
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
            let key = child.key;
            if(o.status === "Pending") pendingCount++;

            list.innerHTML += `
                <div class="order-card-item" style="background:#161b22; padding:15px; border-radius:12px; margin-bottom:10px; border-left:4px solid ${o.status==='Success'?'#28a745':'#ffcc00'}; border:1px solid #333;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span style="color:#00ffff; font-size:12px;">ID: ${o.customerId}</span>
                        <span style="color:${o.status==='Success'?'#28a745':'#ffcc00'}; font-size:12px; font-weight:bold;">${o.status}</span>
                    </div>
                    <div style="color:#fff; font-weight:600; margin-bottom:5px;">${o.offerName}</div>
                    <div style="color:#eee; font-size:13px;">📱 নাম্বারঃ <b>${o.targetNumber}</b></div>
                    <div style="color:#aaa; font-size:12px;">💰 দামঃ ৳${o.price} | Trx: ${o.transactionId}</div>
                    
                    <div style="display:flex; gap:10px; margin-top:12px;">
                        <button onclick="updateStatus('${key}', 'Success')" style="flex:1; background:#28a745; color:#fff; border:none; padding:8px; border-radius:6px; cursor:pointer; font-weight:bold;">সাকসেস</button>
                        <button onclick="updateStatus('${key}', 'Rejected')" style="flex:1; background:#ff4b2b; color:#fff; border:none; padding:8px; border-radius:6px; cursor:pointer; font-weight:bold;">রিজেক্ট</button>
                    </div>
                </div>`;
        });

        if(badge) {
            badge.innerText = pendingCount;
            badge.style.display = pendingCount > 0 ? "block" : "none";
        }
    });
}

function updateStatus(key, status) {
    if (!checkPermission()) return; 
    db.ref('orders/' + key).update({ status: status }).then(() => {
        if(status === "Success") playSuccess();
        showToast("অর্ডার " + status + " হয়েছে! ✅");
    });
}

// ৪. অফার কন্ট্রোল (অ্যাড ও ডিলিট)
function addOffer() {
  if (!checkPermission()) return; 
  const title = document.getElementById('offTitle').value;
  const price = document.getElementById('offPrice').value;
  const operator = document.getElementById('offOperator').value;
  const days = document.getElementById('offDays').value;

  if (!title || !price) { showToast("সব তথ্য পূরণ করুন! ⚠️"); return; }

  const data = {
    id: Date.now().toString(),
    title: title,
    price: price,
    dokanPrice: document.getElementById('offDokanPrice').value,
    condition: document.getElementById('offCondition').value,
    operator: operator,
    days: days
  };

  db.ref('offers/' + operator + '/' + days + '/' + data.id).set(data).then(() => {
    playSuccess();
    showToast("অফার যোগ হয়েছে! ✅");
    closeModal('addOfferModal');
  });
}

function loadAdminOffers(sim) {
    const list = document.getElementById('admin-offer-list-modal');
    document.getElementById('viewSimTitle').innerText = sim + " অফার কন্ট্রোল";
    openModal('viewOffersModal');
    list.innerHTML = '<p style="text-align:center; color:#00ffff;">লোড হচ্ছে...</p>';

    db.ref('offers/' + sim).on('value', snap => {
        list.innerHTML = "";
        if (!snap.exists()) {
            list.innerHTML = '<p style="text-align:center; color:#ff4b2b; padding:20px;">কোনো অফার নেই।</p>';
            return;
        }
        snap.forEach(daySnap => {
            daySnap.forEach(offSnap => {
                const off = offSnap.val();
                list.innerHTML += `
                <div class="offer-item" style="background:#161b22; padding:12px; border-radius:10px; margin-bottom:8px; display:flex; align-items:center; border:1px solid #333;">
                    <div style="flex:1;">
                        <h4 style="margin:0; color:#fff;">${off.title}</h4>
                        <p style="margin:4px 0; font-size:12px; color:#00ffff;">${off.days} দিন | ৳${off.price}</p>
                    </div>
                    <button onclick="deleteOffer('${off.operator}','${off.days}','${off.id}')" style="background:none; border:none; color:#ff4b2b; cursor:pointer; font-size:18px;">🗑️</button>
                </div>`;
            });
        });
    });
}

function deleteOffer(op, d, id) {
  if (!checkPermission()) return; 
  if (confirm("অফারটি ডিলিট করতে চান?")) {
    db.ref('offers/' + op + '/' + d + '/' + id).remove().then(() => {
        playDel();
        showToast("অফারটি ডিলিট হয়েছে! 🗑️");
    });
  }
}

// ৫. ধামাকা অফার (নোটিশ) কন্ট্রোল
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
    } else { showToast("সব তথ্য দিন! ⚠️"); }
}

function deleteNotice() {
    if (!checkPermission()) return; 
    db.ref('dhakaOffer').remove().then(() => {
        playDel();
        showToast("নোটিশ মুছে ফেলা হয়েছে! 🗑️");
        closeModal('noticeModal');
    });
}

// ৬. ইউজার ম্যানেজমেন্ট
function loadUserList() {
    const userListDiv = document.getElementById('adminUserList');
    userListDiv.innerHTML = '<p style="text-align:center; color:#00ffff; padding:20px;">ইউজার লোড হচ্ছে...</p>';

    db.ref('users').on('value', snap => {
        userListDiv.innerHTML = "";
        if (!snap.exists()) {
            userListDiv.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">কোনো ইউজার নেই!</p>';
            return;
        }
        snap.forEach(child => {
            let u = child.val();
            let isBlocked = u.isBlocked === true;
            userListDiv.innerHTML += `
                <div class="user-card">
                    <img src="${u.photo || 'https://ui-avatars.com/api/?name=U'}" class="user-img">
                    <div style="flex:1;">
                        <h4 style="margin:0; color:#fff; font-size:14px;">${u.name}</h4>
                        <p style="margin:2px 0; color:#aaa; font-size:11px;">ID: ${u.customerId}</p>
                    </div>
                    <button onclick="toggleUserBlock('${u.uid}', ${isBlocked})" class="block-btn" style="background:${isBlocked?'#28a745':'#ff4b2b'}; color:#fff;">
                        ${isBlocked ? "আনব্লক" : "ব্লক"}
                    </button>
                </div>`;
        });
    });
}

function toggleUserBlock(uid, currentStatus) {
    if (!checkPermission()) return; 
    db.ref('users/' + uid).update({ isBlocked: !currentStatus }).then(() => {
        showToast("ইউজার স্ট্যাটাস আপডেট হয়েছে!");
    });
}

// ৭. অন্যান্য ফাংশন (UI কন্ট্রোল)
function openModal(id) { document.getElementById(id).classList.remove('hidden'); playClick(); if(id === 'userListModal') loadUserList(); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function showToast(message) {
    const toast = document.getElementById('toast');
    if(toast) { toast.innerText = message; toast.style.top = "20px"; setTimeout(() => { toast.style.top = "-100px"; }, 3000); }
}

function playClick() { document.getElementById('sndClick').play(); }
function playDel() { document.getElementById('sndDelete').play(); }
function playSuccess() { document.getElementById('sndSuccess').play(); }

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
            let d = snap.val();
            displayDiv.style.display = 'block';
            textShow.innerHTML = `${d.text} - ৳${d.price} (${d.days} দিন)`;
        } else { displayDiv.style.display = 'none'; }
    });
}

window.onload = function() {
    document.getElementById('loginOverlay').classList.remove('hidden');
    document.getElementById('mainAdminContent').classList.add('hidden');
};
