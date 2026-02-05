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
   🔒 সিকিউরিটি এবং মেমোরি সিস্টেম
============================================================ */
const MASTER_ADMIN_EMAIL = "hmnayemtelecom990@gmail.com"; 

// অ্যাপ চালু হওয়ার সময় মেমোরি থেকে জিমেইল টেনে আনা
let currentAdminEmail = localStorage.getItem('masterAdminEmail') || ""; 

// বাটন কাজ করার পারমিশন চেক
function checkPermission() {
    let savedEmail = localStorage.getItem('masterAdminEmail') || "";
    if (savedEmail.toLowerCase().trim() === MASTER_ADMIN_EMAIL.toLowerCase().trim()) {
        return true;
    } else {
        alert("🚨 অনুমতি নেই! আগে গুগল লগইন করে জিমেইল ভেরিফাই করুন।");
        return false;
    }
}

// ২. গুগল লগইন (একবার করলেই হবে)
function adminGoogleAuth() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then((result) => {
        let user = result.user;
        currentAdminEmail = user.email.toLowerCase().trim();
        
        // মেমোরিতে সেভ
        localStorage.setItem('masterAdminEmail', currentAdminEmail);
        
        playSuccess();
        alert("✅ ভেরিফিকেশন সফল এবং স্থায়ীভাবে সেভ হয়েছে!");
        showProfileDisplay();
    }).catch((error) => {
        alert("❌ গুগল লগইন ব্যর্থ: " + error.message);
    });
}

function showProfileDisplay() {
    const profileInfo = document.getElementById('adminProfileInfo');
    if(profileInfo && currentAdminEmail) {
        profileInfo.style.display = "block";
        profileInfo.innerHTML = `লগইনঃ <b>${currentAdminEmail}</b>`;
    }
}

// ৩. পাসওয়ার্ড লগইন (Hm, nm - প্রতিবার চাইবে)
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
    showProfileDisplay();
    
    showToast("স্বাগতম সোনা ভাই! 🔓");
  } else {
    showToast("ভুল ইউজারনেম বা পাসওয়ার্ড! ❌");
  }
}

// ৪. অর্ডার ম্যানেজমেন্ট (বাটনগুলো এখন কাজ করবে)
function loadAllOrders() {
    db.ref('orders').on('value', snap => {
        const list = document.getElementById('adminOrderList');
        if (!list) return;
        list.innerHTML = "";
        
        if (!snap.exists()) {
            list.innerHTML = '<p style="text-align:center; color:#888;">কোনো অর্ডার নেই!</p>';
            return;
        }

        snap.forEach(child => {
            let o = child.val();
            let key = child.key;
            list.innerHTML += `
                <div class="order-card-item" style="background:#121212; padding:12px; border-radius:10px; margin-bottom:10px; border-left:4px solid ${o.status==='Success'?'#28a745':'#ffcc00'};">
                    <div style="color:#00ffff; font-size:12px;">ID: ${o.customerId} | Status: ${o.status}</div>
                    <div style="color:#fff; margin:5px 0;">${o.offerName}</div>
                    <div style="color:#aaa; font-size:11px;">📱 ${o.targetNumber} | 💰 ৳${o.price}</div>
                    <div style="display:flex; gap:8px; margin-top:10px;">
                        <button onclick="updateStatus('${key}', 'Success')" style="background:#28a745; color:#fff; border:none; padding:6px 12px; border-radius:5px; cursor:pointer;">সাকসেস</button>
                        <button onclick="updateStatus('${key}', 'Rejected')" style="background:#ff4b2b; color:#fff; border:none; padding:6px 12px; border-radius:5px; cursor:pointer;">রিজেক্ট</button>
                    </div>
                </div>`;
        });
    });
}

function updateStatus(key, status) {
    if (!checkPermission()) return; 
    db.ref('orders/' + key).update({ status: status }).then(() => {
        if(status === "Success") playSuccess();
        showToast("অর্ডার " + status + " হয়েছে! ✅");
    });
}

// ৫. অফার ম্যানেজমেন্ট
function deleteOffer(op, d, id) {
  if (!checkPermission()) return; 
  if (confirm("অফারটি ডিলিট করতে চান?")) {
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

  if (!title || !price) { showToast("তথ্য পূরণ করুন! ⚠️"); return; }

  const data = { id: Date.now().toString(), title: title, price: price, operator: operator, days: days };
  db.ref('offers/' + operator + '/' + days + '/' + data.id).set(data).then(() => {
    playSuccess(); showToast("অফার যোগ হয়েছে!"); closeModal('addOfferModal');
  });
}

// ৬. অন্যান্য জরুরি ফাংশন
function showToast(message) {
    const toast = document.getElementById('toast');
    if(toast) {
        toast.innerText = message;
        toast.style.top = "20px";
        setTimeout(() => { toast.style.top = "-100px"; }, 3000);
    }
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); playClick(); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function playClick() { document.getElementById('sndClick').play(); }
function playDel() { document.getElementById('sndDelete').play(); }
function playSuccess() { document.getElementById('sndSuccess').play(); }

window.onload = function() {
    document.getElementById('loginOverlay').classList.remove('hidden');
    document.getElementById('mainAdminContent').classList.add('hidden');
};

// ডাটাবেস কাউন্ট লোড
function loadTotalCount() {
    db.ref('offers').on('value', snap => {
        let count = 0;
        snap.forEach(op => { op.forEach(day => { count += day.numChildren(); }); });
        document.getElementById('offer-count').innerText = "মোট অফারঃ " + count;
    });
}
function loadNoticeDisplay() { /* নোটিশ কোড */ }
