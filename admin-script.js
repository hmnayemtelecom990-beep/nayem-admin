// ১. ফায়ারবেস কনফিগারেশন (আপনার দেওয়া তথ্য অনুযায়ী)
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
   🔒 মাস্টার সিকিউরিটি ও জিমেইল সেভ সিস্টেম
============================================================ */
// আপনার অরিজিনাল অ্যাডমিন ইমেইল
const MASTER_ADMIN_EMAIL = "hmnayemtelecom990@gmail.com"; 

// অ্যাপ চালু হওয়ার সময় মেমোরি থেকে জিমেইল টেনে আনা
let currentAdminEmail = localStorage.getItem('masterAdminEmail') || ""; 

// অনুমতি চেক ফাংশন (যাতে কাজ করার সময় বাধা না দেয়)
function checkPermission() {
    let savedEmail = localStorage.getItem('masterAdminEmail') || "";
    
    // যদি মেমোরিতে জিমেইল থাকে এবং সেটি আপনার জিমেইল এর সাথে মিলে যায়
    if (savedEmail.toLowerCase().trim() === MASTER_ADMIN_EMAIL.toLowerCase().trim()) {
        return true;
    } else {
        alert("🚨 অনুমতি নেই!\nআপনার জিমেইলটি ভেরিফাই করা নেই। নিচের 'Google দিয়ে লগইন' বাটনে ক্লিক করে " + MASTER_ADMIN_EMAIL + " দিয়ে লগইন করুন।");
        return false;
    }
}

// গুগল লগইন (এটি একবার করলেই মেমোরিতে সেভ হবে)
function adminGoogleAuth() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then((result) => {
        let user = result.user;
        let loggedEmail = user.email.toLowerCase().trim();
        
        // জিমেইলটি চিরস্থায়ীভাবে মেমোরিতে সেভ করা হচ্ছে
        localStorage.setItem('masterAdminEmail', loggedEmail);
        currentAdminEmail = loggedEmail;
        
        playSuccess();
        alert("✅ অভিনন্দন! জিমেইল ভেরিফিকেশন সফল এবং সেভ হয়েছে। এখন আপনি সব কাজ করতে পারবেন।");
        
        const profileInfo = document.getElementById('adminProfileInfo');
        if(profileInfo) {
            profileInfo.style.display = "block";
            profileInfo.innerHTML = `ভেরিফাইড অ্যাডমিনঃ <b>${user.email}</b>`;
        }
    }).catch((error) => {
        alert("❌ গুগল লগইন ব্যর্থ: " + error.message);
    });
}

// ২. পাসওয়ার্ড লগইন (Hm, nm - প্রতিবার চাইবে)
function checkLogin() {
  const user = document.getElementById('adminUser').value;
  const pass = document.getElementById('adminPass').value;
  
  if (user === 'Hm' && pass === 'nm') {
    playSuccess();
    document.getElementById('loginOverlay').classList.add('hidden');
    document.getElementById('mainAdminContent').classList.remove('hidden');
    
    // ডাটা লোড করা শুরু
    loadTotalCount();
    loadNoticeDisplay();
    loadAllOrders(); 
    
    // যদি আগে জিমেইল সেভ করা থাকে তবে সেটি প্রোফাইলে দেখাবে
    let saved = localStorage.getItem('masterAdminEmail');
    if(saved) {
        const profileInfo = document.getElementById('adminProfileInfo');
        if(profileInfo) {
            profileInfo.style.display = "block";
            profileInfo.innerHTML = `ভেরিফাইড অ্যাডমিনঃ <b>${saved}</b>`;
        }
    }
    
    showToast("স্বাগতম সোনা ভাই! 🔓");
  } else {
    document.getElementById('loginError').style.display = "block";
    setTimeout(() => { document.getElementById('loginError').style.display = "none"; }, 3000);
  }
}

// ৩. অর্ডার লিস্ট কন্ট্রোল (HTML এর adminOrderList আইডির সাথে মিল রাখা হয়েছে)
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
                <div class="order-card-item" style="background:#161b22; padding:12px; border-radius:10px; margin-bottom:10px; border:1px solid #333; border-left:4px solid ${o.status==='Success'?'#28a745':'#ffcc00'};">
                    <div style="color:#00ffff; font-size:12px; margin-bottom:5px;">ID: ${o.customerId} | Status: ${o.status}</div>
                    <div style="color:#fff; font-weight:bold;">${o.offerName}</div>
                    <div style="color:#eee; font-size:13px; margin:5px 0;">নাম্বারঃ ${o.targetNumber}</div>
                    <div style="color:#aaa; font-size:12px;">টাকাঃ ৳${o.price} | Trx: ${o.transactionId}</div>
                    <div style="display:flex; gap:10px; margin-top:10px;">
                        <button onclick="updateStatus('${key}', 'Success')" style="flex:1; background:#28a745; color:#fff; border:none; padding:8px; border-radius:5px; cursor:pointer; font-weight:bold;">সাকসেস</button>
                        <button onclick="updateStatus('${key}', 'Rejected')" style="flex:1; background:#ff4b2b; color:#fff; border:none; padding:8px; border-radius:5px; cursor:pointer; font-weight:bold;">রিজেক্ট</button>
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
        showToast("অর্ডার " + status + " হয়েছে!");
    });
}

// ৪. অফার যোগ ও ডিলিট
function addOffer() {
  if (!checkPermission()) return; 
  const title = document.getElementById('offTitle').value;
  const price = document.getElementById('offPrice').value;
  const operator = document.getElementById('offOperator').value;
  const days = document.getElementById('offDays').value;

  if (!title || !price) { showToast("সব তথ্য দিন! ⚠️"); return; }

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

function loadAdminOffers(sim) {
    const list = document.getElementById('admin-offer-list-modal');
    document.getElementById('viewSimTitle').innerText = sim + " অফার কন্ট্রোল";
    openModal('viewOffersModal');
    list.innerHTML = '<p style="text-align:center; color:#00ffff; padding:20px;">লোড হচ্ছে...</p>';

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
                <div class="offer-item" style="background:#161b22; padding:10px; border-radius:10px; margin-bottom:8px; display:flex; align-items:center; border:1px solid #333;">
                    <div style="flex:1;">
                        <h4 style="margin:0; color:#fff; font-size:14px;">${off.title}</h4>
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
        showToast("ডিলিট হয়েছে! 🗑️");
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
            showToast("ধামাকা অফার পাবলিশ হয়েছে! 🚀");
            closeModal('noticeModal');
        });
    } else { showToast("তথ্য পূরণ করুন! ⚠️"); }
}

function deleteNotice() {
    if (!checkPermission()) return; 
    db.ref('dhakaOffer').remove().then(() => {
        playDel();
        showToast("মুছে ফেলা হয়েছে! 🗑️");
        closeModal('noticeModal');
    });
}

// ৬. ইউজার লিস্ট কন্ট্রোল
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
                <div class="user-card" style="background:#161b22; padding:10px; margin-bottom:8px; border-radius:10px; border:1px solid #333; display:flex; align-items:center;">
                    <img src="${u.photo || 'https://ui-avatars.com/api/?name=U'}" style="width:40px; height:40px; border-radius:50%; margin-right:10px;">
                    <div style="flex:1;">
                        <h4 style="margin:0; color:#fff; font-size:13px;">${u.name}</h4>
                        <p style="margin:2px 0; color:#aaa; font-size:11px;">ID: ${u.customerId}</p>
                    </div>
                    <button onclick="toggleUserBlock('${u.uid}', ${isBlocked})" style="background:${isBlocked?'#28a745':'#ff4b2b'}; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; font-size:11px;">
                        ${isBlocked ? "আনব্লক" : "ব্লক"}
                    </button>
                </div>`;
        });
    });
}

function toggleUserBlock(uid, currentStatus) {
    if (!checkPermission()) return; 
    db.ref('users/' + uid).update({ isBlocked: !currentStatus }).then(() => {
        showToast("ইউজার আপডেট হয়েছে!");
    });
}

// ৭. UI ও সাউন্ড কন্ট্রোল
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

// প্রতিবার অ্যাপ খুললে পাসওয়ার্ড স্ক্রিন দেখাবে
window.onload = function() {
    document.getElementById('loginOverlay').classList.remove('hidden');
    document.getElementById('mainAdminContent').classList.add('hidden');
};
