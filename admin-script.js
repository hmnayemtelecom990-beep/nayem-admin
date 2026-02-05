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

// ২. সিকিউরিটি ভেরিয়েবল
const MASTER_ADMIN_EMAIL = "hmnayemtelecom990@gmail.com"; 
let currentAdminEmail = ""; 

// জিমেইল ভেরিফিকেশন (এটি সরাসরি গুগল থেকে চেক করবে)
function adminGoogleAuth() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then((result) => {
        currentAdminEmail = result.user.email.toLowerCase().trim();
        localStorage.setItem('saved_admin', currentAdminEmail); // মেমোরিতে সেভ
        alert("ভেরিফিকেশন সফল: " + currentAdminEmail);
        document.getElementById('adminProfileInfo').innerHTML = "Verified: " + currentAdminEmail;
    }).catch((e) => alert("Error: " + e.message));
}

// ৩. লগইন ফাংশন (Hm, nm)
function checkLogin() {
  const user = document.getElementById('adminUser').value;
  const pass = document.getElementById('adminPass').value;
  
  if (user === 'Hm' && pass === 'nm') {
    // লগইন সফল
    document.getElementById('loginOverlay').classList.add('hidden');
    document.getElementById('mainAdminContent').classList.remove('hidden');
    
    // আগে যদি জিমেইল সেভ করা থাকে সেটা নিয়ে নেবে
    currentAdminEmail = localStorage.getItem('saved_admin') || "";
    
    loadTotalCount();
    loadNoticeDisplay();
    loadAllOrders(); 
    showToast("স্বাগতম সোনা ভাই! 🔓");
  } else {
    showToast("ভুল ইউজারনেম বা পাসওয়ার্ড! ❌");
  }
}

// পারমিশন চেক
function checkPermission() {
    let emailCheck = currentAdminEmail || localStorage.getItem('saved_admin') || "";
    if (emailCheck.toLowerCase().trim() === MASTER_ADMIN_EMAIL.toLowerCase().trim()) {
        return true;
    } else {
        alert("🚨 আগে গুগল লগইন করুন!\nবর্তমানে লগইন নেই।");
        return false;
    }
}

// ৪. অর্ডার সাকসেস/রিজেক্ট ফাংশন
function updateStatus(key, status) {
    if (!checkPermission()) return; 
    db.ref('orders/' + key).update({ status: status }).then(() => {
        showToast("অর্ডার " + status + " হয়েছে!");
    });
}

// ৫. অফার ডিলিট ফাংশন
function deleteOffer(op, d, id) {
  if (!checkPermission()) return; 
  if (confirm("ডিলিট করবেন?")) {
    db.ref('offers/' + op + '/' + d + '/' + id).remove();
  }
}

// উইন্ডো লোড হলে কি হবে (সবসময় পাসওয়ার্ড চাইবে)
window.onload = function() {
    document.getElementById('loginOverlay').classList.remove('hidden');
    document.getElementById('mainAdminContent').classList.add('hidden');
};

// টোস্ট এবং অন্যান্য ফাংশন আগের মতোই থাকবে...
function showToast(m){ console.log(m); } 
function loadTotalCount(){} function loadNoticeDisplay(){} function loadAllOrders(){}
