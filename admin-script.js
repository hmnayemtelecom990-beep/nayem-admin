/* =========================================================
   👑 Double Secured Admin Panel JS (Password + Google)
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

// ফায়ারবেস ইনিশিয়ালাইজ
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const provider = new firebase.auth.GoogleAuthProvider();

// ২. অ্যাডমিন লগইন সিস্টেম (ডাবল সিকিউরিটি)
function adminLogin() {
    const userField = document.getElementById('adminUser').value;
    const passField = document.getElementById('adminPass').value;

    // ১ম স্তর: পাসওয়ার্ড চেক
    if (userField === 'Hm' && passField === 'nm') {
        
        // ২য় স্তর: গুগল লগইন পপআপ
        firebase.auth().signInWithPopup(provider).then((result) => {
            const user = result.user;
            
            // ৩য় স্তর: জিমেইল আইডি ভেরিফিকেশন
            if (user.email === "your-admin-email@gmail.com") { // এখানে আপনার জিমেইল দিন
                playSuccess();
                showToast("স্বাগতম অ্যাডমিন! 👑");
                document.getElementById('loginOverlay').classList.add('hidden');
                document.getElementById('mainAdminContent').classList.remove('hidden');
                
                // সেশন সেভ করা (ব্রাউজার ট্যাব বন্ধ করলে লগআউট হয়ে যাবে - নিরাপত্তার জন্য)
                sessionStorage.setItem('adminLogin', 'true');
                initDashboard();
            } else {
                showToast("অননুমোদিত জিমেইল! 🚫");
                firebase.auth().signOut();
            }
        }).catch((error) => {
            console.error(error);
            showToast("গুগল লগইন ব্যর্থ! ❌");
        });

    } else {
        showToast("ভুল ইউজারনেম বা পাসওয়ার্ড! ❌");
    }
}

// নিরাপত্তার জন্য অটো-লগইন বন্ধ রাখা হয়েছে (প্রতিবার পাসওয়ার্ড চাইবে)
window.onload = function() {
    if (sessionStorage.getItem('adminLogin') === 'true') {
        // যদি একই ট্যাবে রিফ্রেশ হয় তবেই থাকবে
        firebase.auth().onAuthStateChanged((user) => {
            if (user && user.email === "your-admin-email@gmail.com") {
                document.getElementById('loginOverlay').classList.add('hidden');
                document.getElementById('mainAdminContent').classList.remove('hidden');
                initDashboard();
            }
        });
    }
};

function initDashboard() {
    loadTotalCount();
    loadNoticeDisplay();
    loadAllOrders();
}

// ৩. টোস্ট ও সাউন্ড কন্ট্রোল
function showToast(message) {
    const toast = document.getElementById('toast');
    if(toast) {
        toast.innerText = message;
        toast.classList.add('show');
        setTimeout(() => { toast.classList.remove('show'); }, 3000);
    }
}

function playClick() { document.getElementById('sndClick').play(); }
function playDel() { document.getElementById('sndDelete').play(); }
function playSuccess() { document.getElementById('sndSuccess').play(); }

// ৪. মডাল কন্ট্রোল
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
    playClick();
}
function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

// ৫. অফার লোড করা (লিস্ট ভিউ)
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
                <div class="offer-item" style="display:flex; justify-content:space-between; align-items:center; background:#222; margin-bottom:8px; padding:10px; border-radius:8px;">
                    <div style="flex:1;">
                        <h4 style="margin:0; color:#fff;">${off.title}</h4>
                        <p style="margin:4px 0; font-size:12px; color:#00ffff;">${off.days} দিন | ৳${off.price}</p>
                    </div>
                    <button class="del-btn" onclick="deleteOffer('${off.operator}','${off.days}','${off.id}')" style="background:none; border:none; cursor:pointer; font-size:18px;">🗑️</button>
                </div>`;
            });
        });
    });
}

// ৬. অফার যোগ করা
function addOffer() {
  const title = document.getElementById('offTitle').value;
  const price = document.getElementById('offPrice').value;
  const operator = document.getElementById('offOperator').value;
  const days = document.getElementById('offDays').value;

  if (!title || !price) { showToast("সব তথ্য পূরণ করুন! ⚠️"); return; }

  const data = {
    id: Date.now().toString(),
    title: title,
    price: price,
    dokanPrice: document.getElementById('offDokanPrice').value || "0",
    condition: document.getElementById('offCondition').value || "প্রযোজ্য নয়",
    operator: operator,
    days: days
  };

  db.ref('offers/' + operator + '/' + days + '/' + data.id).set(data).then(() => {
    playSuccess();
    showToast("অফার যোগ হয়েছে! ✅");
    closeModal('addOfferModal');
  }).catch(e => showToast("Permission Denied! ❌"));
}

// ৭. ধামাকা অফার (নোটিশ) আপডেট
function updateNotice() {
    const text = document.getElementById('noticeText').value;
    const price = document.getElementById('noticePrice').value;
    const days = document.getElementById('noticeDays').value;

    if (text && price && days) {
        db.ref('dhakaOffer').set({
            text: text,
            price: price,
            days: days
        }).then(() => {
            playSuccess();
            showToast("ধামাকা অফার আপডেট হয়েছে! 🚀");
            closeModal('noticeModal');
        });
    } else {
        showToast("সব তথ্য পূরণ করুন! ⚠️");
    }
}

// ৮. অর্ডার ম্যানেজমেন্ট সিস্টেম
function loadAllOrders() {
    db.ref('allOrders').on('value', snap => {
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
                <div class="order-card-item" style="background: #121212; border-left: 4px solid ${o.status === 'Success' ? '#28a745' : '#ffcc00'}; border-radius: 10px; padding: 12px; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #222; padding-bottom: 8px;">
                        <img src="${o.userPhoto || 'https://ui-avatars.com/api/?name=U'}" style="width: 35px; height: 35px; border-radius: 50%;">
                        <div style="flex: 1;">
                            <div style="color: #00f2fe; font-size: 12px;">${o.userName || 'ইউজার'}</div>
                            <div style="color: #555; font-size: 9px;">${o.time}</div>
                        </div>
                        <div style="font-size: 10px; color: ${o.status === 'Success' ? '#28a745' : '#ffcc00'};">${o.status}</div>
                    </div>
                    <div style="margin-top:10px;">
                        <div style="color: #fff; font-weight: bold;">${o.title}</div>
                        <div style="color: #00ffaa; font-size: 14px; margin: 5px 0;">📱 ${o.customerNumber} <button onclick="copyNum('${o.customerNumber}')" style="font-size: 9px;">Copy</button></div>
                        <div style="color: #aaa; font-size: 11px;">TrxID: ${o.trxId}</div>
                    </div>
                    <div style="display: flex; gap: 5px; margin-top:10px;">
                        <button onclick="updateOrderStatus('${key}', 'Pending')" style="flex:1; padding:5px; font-size:11px;">পেন্ডিং</button>
                        <button onclick="completeOrderAction('${key}')" style="flex:1; padding:5px; font-size:11px; background:#28a745; border:none; color:white;">সাকসেস</button>
                    </div>
                </div>`;
        });
        if(badge) { badge.innerText = pendingCount; badge.style.display = pendingCount > 0 ? "block" : "none"; }
    });
}

function updateOrderStatus(key, status) {
    db.ref('allOrders/' + key).update({ status: status }).then(() => {
        showToast("স্ট্যাটাস আপডেট! 🔄");
    });
}

function completeOrderAction(key) {
    if(confirm("অর্ডারটি সাকসেস করবেন?")) {
        db.ref('allOrders/' + key).update({ status: "Success" }).then(() => {
            playSuccess();
            showToast("অর্ডার সফল! ✅");
            setTimeout(() => { db.ref('allOrders/' + key).remove(); }, 7200000); 
        });
    }
}

// ৯. ডিলিট ও ইউটিলিটি
function deleteOffer(op, d, id) {
  if (confirm("অফারটি ডিলিট করতে চান?")) {
    db.ref('offers/' + op + '/' + d + '/' + id).remove().then(() => {
        playDel();
        showToast("অফারটি ডিলিট হয়েছে!");
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

function copyNum(text) {
    navigator.clipboard.writeText(text).then(() => { showToast("কপি হয়েছে! 📋"); });
}

function loadNoticeDisplay() {
    db.ref('dhakaOffer').on('value', snap => {
        const displayDiv = document.getElementById('dhaka-notice-display');
        const textShow = document.getElementById('noticeTextShow');
        if (snap.exists() && snap.val().text) {
            let data = snap.val();
            displayDiv.style.display = 'block';
            textShow.innerHTML = `<span style="color:#fff;">${data.text}</span><br><span style="color:#00ffff; font-size:11px;">৳${data.price} | ${data.days} দিন</span>`;
        } else {
            displayDiv.style.display = 'none';
        }
    });
}
/* =========================================================
   👥 User Management System
============================================================ */
function loadAllUsers() {
    db.ref('users').on('value', snap => {
        const list = document.getElementById('adminUserList');
        const badge = document.getElementById('user-count-badge');
        if (!list) return;

        list.innerHTML = "";
        if (!snap.exists()) {
            list.innerHTML = '<p style="text-align:center; color:#888;">কোনো ইউজার পাওয়া যায়নি।</p>';
            return;
        }

        let userCount = 0;
        snap.forEach(child => {
            let u = child.val();
            userCount++;

            list.innerHTML += `
                <div style="display: flex; align-items: center; gap: 12px; background: #222; padding: 10px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #333;">
                    <img src="${u.photo || 'https://ui-avatars.com/api/?name=U'}" style="width: 40px; height: 40px; border-radius: 50%; border: 1.5px solid #00f2fe;">
                    <div style="flex: 1;">
                        <div style="color: #fff; font-size: 13px; font-weight: bold;">${u.name}</div>
                        <div style="color: #888; font-size: 11px;">${u.email}</div>
                        <div style="color: #555; font-size: 9px;">UID: ${u.uid}</div>
                    </div>
                    <button onclick="copyNum('${u.uid}')" style="background: #333; color: #00f2fe; border: none; padding: 5px 8px; border-radius: 4px; font-size: 10px; cursor: pointer;">Copy ID</button>
                </div>
            `;
        });
        if(badge) badge.innerText = userCount;
    });
}
