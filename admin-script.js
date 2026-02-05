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
   🔒 মাস্টার সিকিউরিটি (স্থায়ী জিমেইল লগইন সিস্টেম)
============================================================ */
const MASTER_ADMIN_EMAIL = "hmnayemtelecom990@gmail.com"; 

// localStorage থেকে আগের সেভ করা ইমেইল খুঁজে নিচ্ছে
let currentAdminEmail = localStorage.getItem('masterAdminEmail') || ""; 

// পারমিশন চেক ফাংশন
function checkPermission() {
    if (currentAdminEmail.toLowerCase().trim() === MASTER_ADMIN_EMAIL.toLowerCase().trim()) {
        return true;
    } else {
        alert("🚨 ভেরিফিকেশন প্রয়োজন!\nবর্তমানে কোনো জিমেইল ভেরিফাই করা নেই। দয়া করে গুগল লগইন করুন।");
        return false;
    }
}

// গুগল অথেন্টিকেশন লজিক (একবার করলেই localStorage-এ সেভ হবে)
function adminGoogleAuth() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then((result) => {
        let user = result.user;
        
        // ইমেইলটি স্থায়ীভাবে localStorage-এ সেভ করা হচ্ছে
        currentAdminEmail = user.email.toLowerCase().trim();
        localStorage.setItem('masterAdminEmail', currentAdminEmail);
        
        playSuccess();
        alert("✅ গুগল ভেরিফিকেশন সফল এবং সেভ হয়েছে!\nইমেইল: " + currentAdminEmail);
        updateProfileDisplay(user.email);
    }).catch((error) => {
        alert("❌ গুগল লগইন ব্যর্থ! " + error.message);
    });
}

// প্রোফাইল ডিসপ্লে আপডেট ফাংশন
function updateProfileDisplay(email) {
    const profileInfo = document.getElementById('adminProfileInfo');
    if(profileInfo && email) {
        profileInfo.style.display = "block";
        profileInfo.innerHTML = `ভেরিফাইড জিমেইল: <b>${email}</b>`;
    }
}

// ২. অ্যাডমিন লগইন (ইউজারনেম ও পাসওয়ার্ড - এটি প্রতিবার চাইবে)
function checkLogin() {
  const user = document.getElementById('adminUser').value;
  const pass = document.getElementById('adminPass').value;
  
  if (user === 'Hm' && pass === 'nm') {
    playSuccess();
    // লগইন সফল হলে মেইন কন্টেন্ট দেখাবে কিন্তু সেশনে সেভ করবে না (যাতে পরে আবার পাসওয়ার্ড চায়)
    document.getElementById('loginOverlay').classList.add('hidden');
    document.getElementById('mainAdminContent').classList.remove('hidden');
    
    // ডাটা লোড করা
    loadTotalCount();
    loadNoticeDisplay();
    loadAllOrders(); 
    
    // যদি আগে থেকেই জিমেইল সেভ থাকে তবে সেটা দেখাবে
    if(currentAdminEmail) {
        updateProfileDisplay(currentAdminEmail);
    }
    
    showToast("লগইন সফল! 🔓");
  } else {
    showToast("ভুল ইউজারনেম বা পাসওয়ার্ড! ❌");
  }
}

// পেজ লোড হলে সবসময় লগইন স্ক্রিন দেখাবে
window.onload = function() {
    // পাসওয়ার্ড সেভ না থাকায় এটি সবসময় লগইন পেজেই রাখবে
    document.getElementById('loginOverlay').classList.remove('hidden');
    document.getElementById('mainAdminContent').classList.add('hidden');
};

// ৩. টোস্ট ও সাউন্ড ফাংশন
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

// ৪. অফার ও কন্টেন্ট ম্যানেজমেন্ট
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
    playClick();
    if(id === 'userListModal') { loadUserList(); }
}
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// অর্ডার স্ট্যাটাস আপডেট
function updateStatus(key, status) {
    if (!checkPermission()) return; 
    db.ref('orders/' + key).update({ status: status }).then(() => {
        if(status === "Success") playSuccess();
        showToast("অর্ডার " + status + " হয়েছে! ✅");
    });
}

// অফার ডিলিট
function deleteOffer(op, d, id) {
  if (!checkPermission()) return; 
  if (confirm("অফারটি ডিলিট করতে চান?")) {
    playDel();
    db.ref('offers/' + op + '/' + d + '/' + id).remove().then(() => {
        showToast("অফারটি ডিলিট হয়েছে! 🗑️");
    });
  }
}

// অফার যোগ করা
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

// ৫. ডাটা লোডিং ফাংশন (আগের মতোই থাকবে)
function loadTotalCount() {
    db.ref('offers').on('value', snap => {
        let count = 0;
        snap.forEach(op => { op.forEach(day => { count += day.numChildren(); }); });
        document.getElementById('offer-count').innerText = "মোট অফারঃ " + count;
    });
}

function loadAllOrders() {
    db.ref('orders').on('value', snap => {
        const list = document.getElementById('adminOrderList');
        if (!list) return;
        list.innerHTML = "";
        snap.forEach(child => {
            let o = child.val();
            let key = child.key;
            list.innerHTML += `
                <div class="order-card-item" style="background:#121212; padding:12px; border-radius:10px; margin-bottom:10px; border-left:4px solid ${o.status==='Success'?'#28a745':'#ffcc00'};">
                    <div style="color:#00ffff; font-size:12px;">ID: ${o.customerId} | Status: ${o.status}</div>
                    <div style="color:#fff; margin:5px 0;">${o.offerName}</div>
                    <div style="color:#aaa; font-size:11px;">📱 ${o.targetNumber} | 💰 ৳${o.price}</div>
                    <div style="display:flex; gap:5px; margin-top:8px;">
                        <button onclick="updateStatus('${key}', 'Success')" style="background:#28a745; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:10px; cursor:pointer;">সাকসেস</button>
                        <button onclick="updateStatus('${key}', 'Rejected')" style="background:#ff4b2b; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:10px; cursor:pointer;">রিজেক্ট</button>
                    </div>
                </div>`;
        });
    });
}

// বাকি ফাংশনগুলো (loadUserList, loadNoticeDisplay, etc.) আগের মতোই কাজ করবে।
