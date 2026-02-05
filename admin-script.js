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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* =========================================================
   🔒 মাস্টার সিকিউরিটি ভেরিয়েবল
============================================================ */
const MASTER_ADMIN_EMAIL = "your-email@gmail.com"; // 👈 এখানে আপনার নিজের জিমেইলটি দিন
let currentAdminEmail = ""; // বর্তমানে লগইন করা ইমেইল এখানে জমা থাকবে

// পারমিশন চেক ফাংশন
function checkPermission() {
    if (currentAdminEmail === MASTER_ADMIN_EMAIL) {
        return true;
    } else {
        showToast("আপনার এই কাজ করার অনুমতি নেই! 🚫");
        playDel(); // ওয়ার্নিং সাউন্ডের জন্য
        return false;
    }
}

// নতুন টোস্ট ফাংশন
function showToast(message) {
    const toast = document.getElementById('toast');
    if(toast) {
        toast.innerText = message;
        toast.style.top = "20px";
        setTimeout(() => { toast.style.top = "-100px"; }, 3000);
    }
}

// ২. লগইন ফাংশন (ইউজারনেম ও পাসওয়ার্ড)
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
  }
};

// ৩. মডাল ও সাউন্ড কন্ট্রোল
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
    playClick();
    if(id === 'userListModal') { loadUserList(); }
}
function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}
function playClick() { document.getElementById('sndClick').play(); }
function playDel() { document.getElementById('sndDelete').play(); }
function playSuccess() { document.getElementById('sndSuccess').play(); }

// ৪. অফার লোড করা
function loadAdminOffers(sim) {
    const list = document.getElementById('admin-offer-list-modal');
    document.getElementById('viewSimTitle').innerText = sim + " অফার কন্ট্রোল";
    openModal('viewOffersModal');
    
    list.innerHTML = '<p style="text-align:center; color:#00ffff;">লোড হচ্ছে...</p>';

    db.ref('offers/' + sim).on('value', snap => {
        list.innerHTML = "";
        if (!snap.exists()) {
            list.innerHTML = `<p style="text-align:center; color:#ff4b2b; padding:20px;">কোনো অফার পাওয়া যায়নি।</p>`;
            return;
        }
        
        snap.forEach(daySnap => {
            daySnap.forEach(offSnap => {
                const off = offSnap.val();
                list.innerHTML += `
                <div class="offer-item" style="background:#121212; padding:10px; border-radius:8px; margin-bottom:8px; display:flex; align-items:center; border:1px solid #333;">
                    <div style="flex:1;">
                        <h4 style="margin:0; color:#fff;">${off.title}</h4>
                        <p style="margin:4px 0; font-size:12px; color:#00ffff;">${off.days} দিন | ৳${off.price}</p>
                    </div>
                    <button class="del-btn" onclick="deleteOffer('${off.operator}','${off.days}','${off.id}')" style="background:none; border:none; color:red; cursor:pointer; font-size:18px;">🗑️</button>
                </div>`;
            });
        });
    });
}

// ৫. অফার যোগ করা (সিকিউরিটি চেক যুক্ত)
function addOffer() {
  if (!checkPermission()) return; // মাস্টার জিমেইল চেক

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

// ৬. ধামাকা অফার আপডেট (সিকিউরিটি চেক যুক্ত)
function updateNotice() {
    if (!checkPermission()) return; // মাস্টার জিমেইল চেক

    const text = document.getElementById('noticeText').value;
    const price = document.getElementById('noticePrice').value;
    const days = document.getElementById('noticeDays').value;

    if (text && price && days) {
        db.ref('dhakaOffer').set({ text: text, price: price, days: days }).then(() => {
            playSuccess();
            showToast("ধামাকা অফার আপডেট হয়েছে! 🚀");
            closeModal('noticeModal');
        });
    } else { showToast("সব তথ্য পূরণ করুন! ⚠️"); }
}

function deleteNotice() {
    if (!checkPermission()) return; // মাস্টার জিমেইল চেক
    db.ref('dhakaOffer').remove().then(() => {
        playDel();
        showToast("নোটিশ মুছে ফেলা হয়েছে! 🗑️");
        closeModal('noticeModal');
    });
}

/* =========================================================
   👥 ইউজার লিস্ট ও ব্লক সিস্টেম (সিকিউরিটি চেক যুক্ত)
============================================================ */
function loadUserList() {
    const userListDiv = document.getElementById('adminUserList');
    userListDiv.innerHTML = '<p style="text-align:center; color:#00ffff; padding:20px;">ইউজার লোড হচ্ছে...</p>';

    db.ref('users').on('value', snap => {
        userListDiv.innerHTML = "";
        if (!snap.exists()) {
            userListDiv.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">কোনো ইউজার পাওয়া যায়নি!</p>';
            return;
        }

        snap.forEach(child => {
            let u = child.val();
            let isBlocked = u.isBlocked === true;
            let btnText = isBlocked ? "🔓 আনব্লক" : "🚫 ব্লক";
            let btnColor = isBlocked ? "#28a745" : "#ff4b2b";
            let statusBadge = isBlocked ? "<span style='color:red; font-size:10px;'>[ব্লকড]</span>" : "<span style='color:#28a745; font-size:10px;'>[সচল]</span>";

            userListDiv.innerHTML += `
                <div class="user-card" style="background:#121212; padding:12px; border-radius:10px; margin-bottom:10px; display:flex; align-items:center; border:1px solid #222;">
                    <img src="${u.photo || 'https://ui-avatars.com/api/?name=U'}" style="width:40px; height:40px; border-radius:50%; margin-right:12px; border:1.5px solid #00f2fe;">
                    <div style="flex:1;">
                        <h4 style="margin:0; color:#fff; font-size:14px;">${u.name} ${statusBadge}</h4>
                        <p style="margin:2px 0; color:#aaa; font-size:11px;">ইমেইল: ${u.email}</p>
                        <p style="margin:0; color:#00f2fe; font-size:11px; font-weight:bold;">কাস্টমার আইডি: ${u.customerId}</p>
                    </div>
                    <button onclick="toggleUserBlock('${u.uid}', ${isBlocked})" style="background:${btnColor}; color:#fff; border:none; padding:6px 10px; border-radius:6px; font-size:11px; cursor:pointer; font-weight:bold;">
                        ${btnText}
                    </button>
                </div>`;
        });
    });
}

function toggleUserBlock(uid, currentStatus) {
    if (!checkPermission()) return; // মাস্টার জিমেইল চেক
    let confirmMsg = currentStatus ? "আনব্লক করতে চান?" : "ব্লক করতে চান?";
    if (confirm(confirmMsg)) {
        db.ref('users/' + uid).update({ isBlocked: !currentStatus }).then(() => {
            showToast(currentStatus ? "আনব্লক করা হয়েছে! ✅" : "ব্লক করা হয়েছে! 🚫");
        });
    }
}

/* =========================================================
   📩 অর্ডার ম্যানেজমেন্ট (সিকিউরিটি চেক যুক্ত)
============================================================ */
function copyNum(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast("কপি হয়েছে! 📋");
        playClick();
    });
}

function loadAllOrders() {
    db.ref('orders').on('value', snap => {
        const list = document.getElementById('adminOrderList');
        const badge = document.getElementById('order-pending-badge');
        if (!list) return;
        
        list.innerHTML = "";
        if (!snap.exists()) {
            list.innerHTML = '<p style="text-align:center; color:#888; padding: 20px;">কোনো নতুন অর্ডার নেই 😴</p>';
            if(badge) badge.style.display = "none";
            return;
        }

        let pendingCount = 0;
        snap.forEach(child => {
            let o = child.val();
            let key = child.key;
            if(o.status === "Pending") pendingCount++;

            list.innerHTML += `
                <div class="order-card-item" style="background: #121212; border-left: 4px solid ${o.status === 'Success' ? '#28a745' : '#ffcc00'}; border-radius: 10px; padding: 12px; margin-bottom: 12px; border-bottom: 1px solid #333;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <div style="flex: 1;">
                            <div style="color: #00ffff; font-size: 13px; font-weight: bold;">ID: ${o.customerId}</div>
                            <div style="color: #666; font-size: 10px;">🕒 ${o.orderTime}</div>
                        </div>
                        <div style="font-size: 10px; font-weight: bold; color: ${o.status === 'Success' ? '#28a745' : '#ffcc00'};">${o.status}</div>
                    </div>

                    <div style="font-size: 13px; color: #eee;">
                        <div style="color: #ffcc00; font-weight: bold; margin-bottom: 5px;">${o.offerName}</div>
                        <div>📱 নাম্বারঃ <b>${o.targetNumber}</b> <span onclick="copyNum('${o.targetNumber}')" style="cursor:pointer; color:#00ffff; font-size:10px; margin-left:5px;">(কপি)</span></div>
                        <div style="font-size: 12px;">💰 দামঃ ৳${o.price} | 💳 ${o.paymentMethod}</div>
                        <div style="font-size: 11px; color: #aaa;">TrxID: ${o.transactionId} <span onclick="copyNum('${o.transactionId}')" style="cursor:pointer; color:#00ffff;">(কপি)</span></div>
                    </div>

                    <div style="display: flex; gap: 8px; margin-top: 10px;">
                        <button onclick="updateStatus('${key}', 'Pending')" style="flex: 1; background: #333; color: #fff; border: 1px solid #444; padding: 5px; border-radius: 5px; font-size: 11px; cursor: pointer;">পেন্ডিং</button>
                        <button onclick="updateStatus('${key}', 'Success')" style="flex: 1; background: #28a745; color: #fff; border: none; padding: 5px; border-radius: 5px; font-size: 11px; font-weight: bold; cursor: pointer;">সাকসেস</button>
                        <button onclick="updateStatus('${key}', 'Rejected')" style="flex: 1; background: #ff4b2b; color: #fff; border: none; padding: 5px; border-radius: 5px; font-size: 11px; font-weight: bold; cursor: pointer;">রিজেক্ট</button>
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
    if (!checkPermission()) return; // মাস্টার জিমেইল চেক
    db.ref('orders/' + key).update({ status: status }).then(() => {
        if(status === "Success") playSuccess();
        showToast("অর্ডার " + status + " হয়েছে! ✅");
    });
}

// ৭. ডিলিট ও কাউন্ট
function deleteOffer(op, d, id) {
  if (!checkPermission()) return; // মাস্টার জিমেইল চেক
  if (confirm("অফারটি ডিলিট করতে চান?")) {
    playDel();
    db.ref('offers/' + op + '/' + d + '/' + id).remove().then(() => {
        showToast("অফারটি ডিলিট হয়েছে! 🗑️");
    });
  }
}

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
        if (snap.exists() && snap.val().text) {
            let data = snap.val();
            displayDiv.style.display = 'block';
            textShow.innerHTML = `${data.text}<br><small>দাম: ৳${data.price} | মেয়াদ: ${data.days} দিন</small>`;
        } else {
            displayDiv.style.display = 'none';
        }
    });
}

/* =========================================================
   🔐 অ্যাডমিন গুগল অথেন্টিকেশন লজিক
============================================================ */
function adminGoogleAuth() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then((result) => {
        let user = result.user;
        currentAdminEmail = user.email; // বর্তমান ইমেইল সেভ করা হলো
        
        playSuccess();
        showToast("গুগল ভেরিফিকেশন সফল! ✅");
        
        const profileInfo = document.getElementById('adminProfileInfo');
        profileInfo.style.display = "block";
        profileInfo.innerHTML = `
            <img src="${user.photoURL}" style="width:30px; border-radius:50%; vertical-align:middle; margin-right:5px;">
            লগইন আছেন: <b>${user.email}</b>
        `;
    }).catch((error) => {
        showToast("গুগল লগইন ব্যর্থ! ❌");
    });
}
