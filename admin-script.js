// ১. ফায়ারবেস কনফিগারেশন (আপনার দেওয়া কনফিগারেশন)
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
   🔒 মাস্টার সিকিউরিটি (স্থায়ী জিমেইল সিস্টেম)
============================================================ */
const MASTER_ADMIN_EMAIL = "hmnayemtelecom990@gmail.com"; 
let currentAdminEmail = localStorage.getItem('masterAdminEmail') || ""; 

// পারমিশন চেক ফাংশন
function checkPermission() {
    // মেমোরি থেকে জিমেইল চেক করছে
    let savedEmail = localStorage.getItem('masterAdminEmail') || "";
    if (savedEmail.toLowerCase().trim() === MASTER_ADMIN_EMAIL.toLowerCase().trim()) {
        return true;
    } else {
        alert("🚨 আগে গুগল লগইন করুন!\nবর্তমানে ভেরিফাইড জিমেইল নেই।");
        return false;
    }
}

// ২. অ্যাডমিন লগইন (ইউজারনেম ও পাসওয়ার্ড - এটি প্রতিবার চাইবে)
function checkLogin() {
  const user = document.getElementById('adminUser').value;
  const pass = document.getElementById('adminPass').value;
  
  if (user === 'Hm' && pass === 'nm') {
    playSuccess();
    document.getElementById('loginOverlay').classList.add('hidden');
    document.getElementById('mainAdminContent').classList.remove('hidden');
    
    // সেশনে সেভ করছি না, যাতে বের হয়ে গেলে আবার পাসওয়ার্ড চায়
    loadTotalCount();
    loadNoticeDisplay();
    loadAllOrders(); 
    
    // আগে জিমেইল সেভ করা থাকলে প্রোফাইলে দেখাবে
    if(currentAdminEmail) {
        const profileInfo = document.getElementById('adminProfileInfo');
        if(profileInfo) {
            profileInfo.style.display = "block";
            profileInfo.innerHTML = `ভেরিফাইড: <b>${currentAdminEmail}</b>`;
        }
    }
    showToast("লগইন সফল! 🔓");
  } else {
    showToast("ভুল ইউজারনেম বা পাসওয়ার্ড! ❌");
  }
}

// অ্যাপ খুললে সবসময় লগইন পেজ দেখাবে
window.onload = function() {
    document.getElementById('loginOverlay').classList.remove('hidden');
    document.getElementById('mainAdminContent').classList.add('hidden');
};

// ৩. গুগল লগইন (একবার করলেই মেমোরিতে সেভ হয়ে থাকবে)
function adminGoogleAuth() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then((result) => {
        let user = result.user;
        currentAdminEmail = user.email.toLowerCase().trim();
        
        // মেমোরিতে সেভ করে রাখছি
        localStorage.setItem('masterAdminEmail', currentAdminEmail);
        
        playSuccess();
        alert("✅ জিমেইল ভেরিফিকেশন সফল এবং সেভ হয়েছে!");
        
        const profileInfo = document.getElementById('adminProfileInfo');
        if(profileInfo) {
            profileInfo.style.display = "block";
            profileInfo.innerHTML = `ভেরিফাইড: <b>${user.email}</b>`;
        }
    }).catch((error) => {
        alert("❌ লগইন ব্যর্থ: " + error.message);
    });
}

// ৪. মডাল ও অন্যান্য ফাংশন (সব আগের মতো রাখা হয়েছে)
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
    playClick();
    if(id === 'userListModal') { loadUserList(); }
}
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function showToast(message) {
    const toast = document.getElementById('toast');
    if(toast) {
        toast.innerText = message;
        toast.style.top = "20px";
        setTimeout(() => { toast.style.top = "-100px"; }, 3000);
    }
}

// পারমিশন চেক দিয়ে ডাটা আপডেট
function updateStatus(key, status) {
    if (!checkPermission()) return; 
    db.ref('orders/' + key).update({ status: status }).then(() => {
        if(status === "Success") playSuccess();
        showToast("অর্ডার " + status + " হয়েছে!");
    });
}

function deleteOffer(op, d, id) {
  if (!checkPermission()) return; 
  if (confirm("ডিলিট করতে চান?")) {
    db.ref('offers/' + op + '/' + d + '/' + id).remove().then(() => {
        showToast("ডিলিট হয়েছে!");
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
    playSuccess(); showToast("অফার যোগ হয়েছে!"); closeModal('addOfferModal');
  });
}

// সাউন্ড ফাংশন
function playClick() { document.getElementById('sndClick').play(); }
function playDel() { document.getElementById('sndDelete').play(); }
function playSuccess() { document.getElementById('sndSuccess').play(); }

// বাকি লোডিং ফাংশনগুলো আগের কোড থেকে নিয়ে নিন...
function loadTotalCount() { 
    db.ref('offers').on('value', snap => { 
        let count = 0; 
        snap.forEach(op => { op.forEach(day => { count += day.numChildren(); }); }); 
        document.getElementById('offer-count').innerText = "মোট অফারঃ " + count; 
    }); 
}
function loadNoticeDisplay() { /* আপনার নোটিশ লোড কোড */ }
function loadUserList() { /* আপনার ইউজার লিস্ট কোড */ }
function loadAllOrders() { /* আপনার অর্ডার লিস্ট কোড */ }
