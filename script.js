/* =========================================================
   🚀 দেশি অফার - অ্যাডমিন মাস্টার স্ক্রিপ্ট (ফুল আপডেট ও ফিক্সড)
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
    if(document.getElementById('loginOverlay')) document.getElementById('loginOverlay').classList.add('hidden');
    if(document.getElementById('mainAdminContent')) document.getElementById('mainAdminContent').classList.remove('hidden');
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
    if(id === 'userListModal') loadAllUsers(); 
}
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function playClick() { if(document.getElementById('sndClick')) document.getElementById('sndClick').play(); }
function playDel() { if(document.getElementById('sndDelete')) document.getElementById('sndDelete').play(); }
function playSuccess() { if(document.getElementById('sndSuccess')) document.getElementById('sndSuccess').play(); }
// ৫. অফার ম্যানেজমেন্ট (Updated & Fixed)
function addOffer() {
  if (!checkPermission()) return;
  
  const title = document.getElementById('offTitle').value.trim();
  const price = document.getElementById('offPrice').value.trim();
  const operator = document.getElementById('offOperator').value; // ড্রপডাউন থেকে সিম
  const days = document.getElementById('offDays').value;       // ড্রপডাউন থেকে দিন

  // সবগুলো তথ্য পূরণ করা হয়েছে কি না চেক করা
  if (!title || !price || operator === "" || days === "") { 
    showToast("সিম, দিন, টাইটেল এবং দাম—সবগুলো সঠিকভাবে দিন! ⚠️"); 
    return; 
  }

  const data = {
    id: "ID" + Date.now(),
    title: title, 
    price: price,
    dokanPrice: document.getElementById('offDokanPrice').value || "0",
    condition: document.getElementById('offCondition').value || "N/A",
    operator: operator, 
    days: days
  };

  // ডাটাবেসে পাঠানোর আগে একটি মেসেজ
  showToast("অফার সেভ হচ্ছে... ⏳");

  db.ref('offers/' + operator + '/' + days + '/' + data.id).set(data)
  .then(() => {
    playSuccess();
    showToast("অফার সফলভাবে যোগ হয়েছে! ✅");
    closeModal('addOfferModal');
    
    // ইনপুট বক্স খালি করা
    document.getElementById('offTitle').value = "";
    document.getElementById('offPrice').value = "";
  })
  .catch(e => { 
    console.error("Firebase Error:", e);
    showToast("ডাটাবেস পারমিশন এরর! রুলস চেক করুন। ❌"); 
  });
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
        }).catch(e => { showToast("❌ ডাটাবেস পারমিশন এরর!"); });
    } else { showToast("তথ্য দিন! ⚠️"); }
}

function deleteNotice() {
    if (!checkPermission()) return;
    db.ref('dhakaOffer').remove().then(() => {
        playDel();
        showToast("মুছে ফেলা হয়েছে! 🗑️");
        closeModal('noticeModal');
    }).catch(e => { showToast("❌ ডাটাবেস পারমিশন এরর!"); });
}

// ৭. অর্ডার ম্যানেজমেন্ট (পেন্ডিং উপরে এবং সাকসেস নিচে সাজানো)
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

        let pendingCount = 0;
        let ordersArray = [];

        // ১. সব অর্ডার আগে একটা অ্যারেতে নিচ্ছি
        snap.forEach(child => {
            let o = child.val();
            o.key = child.key; // আইডিটা ভেতরে সেভ করছি
            ordersArray.push(o);
            if(o.status === "Pending") pendingCount++;
        });

        // ২. অর্ডারগুলো সাজাচ্ছি (Sorting): পেন্ডিং অর্ডার উপরে, সাকসেস নিচে
        ordersArray.sort((a, b) => {
            if (a.status === 'Pending' && b.status !== 'Pending') return -1;
            if (a.status !== 'Pending' && b.status === 'Pending') return 1;
            return 0;
        });

        // ৩. সাজানো অর্ডারগুলো লুপ চালিয়ে ডিসপ্লে করছি
        ordersArray.forEach(o => {
            let key = o.key;
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
                        <button onclick="updateOrderStatus('${key}', 'Pending')" style="flex: 1; background: #333; color: #fff; border: 1px solid #444; padding: 6px; border-radius: 5px; cursor:pointer; font-size: 11px;">পেন্ডিং</button>
                        <button onclick="completeOrderAction('${key}')" style="flex: 1; background: #28a745; color: #fff; border: none; padding: 6px; border-radius: 5px; font-weight: bold; cursor:pointer; font-size: 11px;">সাকসেস</button>
                        <button onclick="deleteOrderAction('${key}')" style="width: 40px; background: #ff4b2b; color: #fff; border: none; padding: 6px; border-radius: 5px; cursor:pointer; display: flex; align-items: center; justify-content: center;">🗑️</button>
                    </div>
                </div>`;
        });
        if(badge) { badge.innerText = pendingCount; badge.style.display = pendingCount > 0 ? "block" : "none"; }
    });
}


// ৮. ইউজার লিস্ট ম্যানেজমেন্ট (সিরিয়াল নাম্বার ও কর্নারে ডিসপ্লে সহ)
function loadAllUsers() {
    const userList = document.getElementById('adminUserList');
    if(!userList) return;
    userList.innerHTML = '<p style="text-align:center; color:#00ffff;">লোড হচ্ছে...</p>';
    
    db.ref('users').on('value', snap => {
        userList.innerHTML = "";
        if (!snap.exists()) {
            userList.innerHTML = '<p style="text-align:center; color:#888;">কোনো ইউজার নেই!</p>';
            return;
        }

        let usersArray = [];
        // সব ইউজারকে আগে একটা লিস্টে নিলাম
        snap.forEach(child => {
            usersArray.push({ uid: child.key, data: child.val() });
        });

        let totalUsers = usersArray.length; // মোট কতজন ইউজার আছে

        usersArray.forEach((userObj, index) => {
            let u = userObj.data;
            let uid = userObj.uid; 
            let isBlocked = u.isBlocked === true; 
            
            // সিরিয়াল নাম্বার: মোট সংখ্যা থেকে ইনডেক্স বিয়োগ করলে ওপরেরটা বড় হবে
            let serialNum = totalUsers - index;

            userList.innerHTML += `
                <div style="position:relative; background:#161b22; padding:12px; border-radius:12px; margin-bottom:10px; display:flex; align-items:center; border:1px solid ${isBlocked ? 'red' : '#333'}; overflow:hidden;">
                    
                    <div style="position:absolute; top:0; right:0; background:linear-gradient(135deg, #00f2fe, #4facfe); color:#000; font-size:13px; font-weight:bold; padding:2px 10px; border-radius:0 0 0 10px; box-shadow: -1px 1px 5px rgba(0,0,0,0.3);">
                        🏷️${serialNum}
                    </div>

                    <img src="${u.photo || 'https://ui-avatars.com/api/?name=U'}" style="width:40px; height:40px; border-radius:50%; margin-right:12px; border:1px solid #00ffff;">
                    <div style="flex:1;">
                        <div style="color:#fff; font-size:13px; font-weight:bold;">${u.name || 'User'} ${isBlocked ? '<span style="color:red; font-size:10px;">(Blocked)</span>' : ''}</div>
                        <div style="color:#666; font-size:11px;">ID: ${u.customerId || 'N/A'}</div>
                    </div>
                    <button onclick="toggleUserBlock('${uid}', ${isBlocked})" 
                        style="background:${isBlocked ? '#00ffff' : '#ff000a'}; color:#ffff; border:none; padding:5px 10px; border-radius:6px; font-size:11px; cursor:pointer; font-weight:bold;">
                        ${isBlocked ? '🔓 Unblock' : '🚫 Block'}
                    </button>
                </div>`;
        });
    });
}

function toggleUserBlock(uid, currentStatus) {
    if (!checkPermission()) return;
    let action = currentStatus ? "আনব্লক" : "ব্লক";
    if (confirm(`আপনি কি এই ইউজারকে ${action} করতে চান?`)) {
        db.ref('users/' + uid).update({ isBlocked: !currentStatus }).then(() => {
            playSuccess();
            showToast(`ইউজার ${action} হয়েছে!`);
        }).catch(e => { showToast("❌ ডাটাবেস পারমিশন এরর!"); });
    }
}


// ৯. কাউন্টার ও ডিসপ্লে
function loadTotalCount() {
    db.ref('offers').on('value', snap => {
        let count = 0;
        if(snap.exists()) {
            snap.forEach(op => { op.forEach(day => { count += day.numChildren(); }); });
        }
        const el = document.getElementById('offer-count');
        if(el) el.innerText = "মোট অফারঃ " + count;
    });
}

function loadNoticeDisplay() {
    db.ref('dhakaOffer').on('value', snap => {
        const displayDiv = document.getElementById('dhaka-notice-display');
        const textShow = document.getElementById('noticeTextShow');
        if (snap.exists() && displayDiv) {
            let data = snap.val();
            displayDiv.style.display = 'block';
            textShow.innerHTML = `${data.text} <br> <span style="color:#00ffff; font-size:12px;">৳${data.price} (${data.days} দিন)</span>`;
        } else if(displayDiv) { displayDiv.style.display = 'none'; }
    });
}

function copyNum(text) { navigator.clipboard.writeText(text).then(() => { showToast("কপি হয়েছে! 📋"); playClick(); }); }
// ১০. অর্ডার অ্যাকশন কন্ট্রোল (বাটন ফিক্স)
function updateOrderStatus(key, newStatus) {
    if (!checkPermission()) return;
    db.ref('allOrders/' + key).update({ status: newStatus })
    .then(() => { playSuccess(); showToast("স্ট্যাটাস আপডেট হয়েছে!"); });
}

function completeOrderAction(key) {
    if (!checkPermission()) return;
    if (confirm("অর্ডারটি সাকসেস করতে চান?")) {
        db.ref('allOrders/' + key).update({ status: "Success" })
        .then(() => { playSuccess(); showToast("অর্ডার সাকসেসফুল! ✅"); });
    }
}

function deleteOrderAction(key) {
    if (!checkPermission()) return;
    if (confirm("অর্ডারটি ডিলিট করতে চান? এটি আর ফিরে পাবেন না!")) {
        db.ref('allOrders/' + key).remove()
        .then(() => { playDel(); showToast("অর্ডার ডিলিট হয়েছে! 🗑️"); });
    }
}