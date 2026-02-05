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
   🔒 মাস্টার সিকিউরিটি (স্থায়ী ও নির্ভুল ভার্সন)
============================================================ */
const MASTER_ADMIN_EMAIL = "hmnayemtelecom990@gmail.com"; 

// অ্যাপ চালু হওয়ার সাথে সাথে মেমোরি থেকে জিমেইল খুঁজে বের করা
let currentAdminEmail = localStorage.getItem('masterAdminEmail') || ""; 

// পারমিশন চেক ফাংশন
function checkPermission() {
    // মেমোরিতে থাকা ইমেইল চেক করছে
    let savedEmail = localStorage.getItem('masterAdminEmail') || "";
    
    if (savedEmail.toLowerCase().trim() === MASTER_ADMIN_EMAIL.toLowerCase().trim()) {
        return true;
    } else {
        alert("🚨 ভেরিফিকেশন প্রয়োজন!\nআপনার ফোনে কোনো জিমেইল সেভ নেই। 'গুগল লগইন' বাটনে চাপ দিয়ে " + MASTER_ADMIN_EMAIL + " দিয়ে লগইন করুন।");
        return false;
    }
}

// গুগল অথেন্টিকেশন (এটি একবার করলেই মেমোরিতে সেভ হবে)
function adminGoogleAuth() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then((result) => {
        let user = result.user;
        let loggedEmail = user.email.toLowerCase().trim();
        
        // মেমোরিতে চিরস্থায়ীভাবে সেভ করা হচ্ছে
        localStorage.setItem('masterAdminEmail', loggedEmail);
        currentAdminEmail = loggedEmail;
        
        playSuccess();
        alert("✅ ভেরিফিকেশন সফল!\nএখন থেকে বাটনগুলো কাজ করবে। ইমেইল: " + loggedEmail);
        
        const profileInfo = document.getElementById('adminProfileInfo');
        if(profileInfo) {
            profileInfo.style.display = "block";
            profileInfo.innerHTML = `ভেরিফাইড: <b>${user.email}</b>`;
        }
    }).catch((error) => {
        alert("❌ গুগল লগইন ব্যর্থ! " + error.message);
    });
}

// ২. ইউজারনেম ও পাসওয়ার্ড (এটি প্রতিবার চাইবে)
function checkLogin() {
  const user = document.getElementById('adminUser').value;
  const pass = document.getElementById('adminPass').value;
  
  if (user === 'Hm' && pass === 'nm') {
    playSuccess();
    document.getElementById('loginOverlay').classList.add('hidden');
    document.getElementById('mainAdminContent').classList.remove('hidden');
    
    // ডাটা লোড
    loadTotalCount();
    loadNoticeDisplay();
    loadAllOrders(); 
    
    // যদি আগে জিমেইল সেভ করা থাকে তবে তা দেখাবে
    let saved = localStorage.getItem('masterAdminEmail');
    const profileInfo = document.getElementById('adminProfileInfo');
    if(saved && profileInfo) {
        profileInfo.style.display = "block";
        profileInfo.innerHTML = `ভেরিফাইড: <b>${saved}</b>`;
    }
    
    showToast("লগইন সফল! 🔓");
  } else {
    showToast("ভুল ইউজারনেম বা পাসওয়ার্ড! ❌");
  }
}

// প্রতিবার অ্যাপ খুললে লগইন স্ক্রিন আসবে
window.onload = function() {
    document.getElementById('loginOverlay').classList.remove('hidden');
    document.getElementById('mainAdminContent').classList.add('hidden');
};

// ৩. টোস্ট ও সাউন্ড
function showToast(message) {
    const toast = document.getElementById('toast');
    if(toast) {
        toast.innerText = message;
        toast.style.top = "20px";
        setTimeout(() => { toast.style.top = "-100px"; }, 3000);
    }
}
function playClick() { document.getElementById('sndClick').play(); }
function playDel() { document.getElementById('sndDelete').play(); }
function playSuccess() { document.getElementById('sndSuccess').play(); }

// ৪. মডাল ও ডাটা কন্ট্রোল (পারমিশন চেক যুক্ত)
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
    playClick();
    if(id === 'userListModal') { loadUserList(); }
}
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function updateStatus(key, status) {
    if (!checkPermission()) return; 
    db.ref('orders/' + key).update({ status: status }).then(() => {
        if(status === "Success") playSuccess();
        showToast("অর্ডার " + status + " হয়েছে! ✅");
    });
}

function deleteOffer(op, d, id) {
  if (!checkPermission()) return; 
  if (confirm("ডিলিট করতে চান?")) {
    db.ref('offers/' + op + '/' + d + '/' + id).remove().then(() => {
        showToast("ডিলিট হয়েছে! 🗑️");
    });
  }
}

function addOffer() {
  if (!checkPermission()) return; 
  const title = document.getElementById('offTitle').value;
  const price = document.getElementById('offPrice').value;
  const operator = document.getElementById('offOperator').value;
  const days = document.getElementById('offDays').value;

  if (!title || !price) { showToast("তথ্য দিন! ⚠️"); return; }

  const data = { id: Date.now().toString(), title: title, price: price, operator: operator, days: days };
  db.ref('offers/' + operator + '/' + days + '/' + data.id).set(data).then(() => {
    playSuccess(); showToast("অফার যোগ হয়েছে! ✅"); closeModal('addOfferModal');
  });
}

// ৫. বাকি ফাংশনগুলো আগের মতোই কাজ করবে
function loadTotalCount() { db.ref('offers').on('value', snap => { let count = 0; snap.forEach(op => { op.forEach(day => { count += day.numChildren(); }); }); document.getElementById('offer-count').innerText = "মোট অফারঃ " + count; }); }
function loadAllOrders() { 
    db.ref('orders').on('value', snap => {
        const list = document.getElementById('adminOrderList');
        if(!list) return; list.innerHTML = "";
        snap.forEach(child => {
            let o = child.val(); let key = child.key;
            list.innerHTML += `<div style="background:#121212; padding:10px; margin-bottom:5px; border-radius:8px;">
                <p style="color:#00ffff; font-size:12px;">${o.offerName} (${o.status})</p>
                <button onclick="updateStatus('${key}', 'Success')" style="color:green;">সাকসেস</button>
                <button onclick="updateStatus('${key}', 'Rejected')" style="color:red;">রিজেক্ট</button>
            </div>`;
        });
    });
}
