import {
  fbRegister,
  fbLogin,
  fbGoogleLogin,
  fbSendOtp,
  fbVerifyOtp,
  fbLogout,
  watchLogin
} from "./firebase-ready.js";

const SESSION_KEY = "SKS_ACTIVE_USER_V2";

const businessTypes = [
  "General Store","Grocery / Kirana","Hardware Store","Pipe Store","Electrical Shop",
  "Mobile Shop","Restaurant","Hotel","Medical Store","Garment Shop","Electronics",
  "Auto Parts","Construction Material","Salon","Gym","Bakery","Dairy","Stationery",
  "Jewellery","Agriculture","Computer / Cyber Cafe","Furniture","Footwear","Cosmetics",
  "Gift Shop","Book Store","Other Business"
];

let currentUser = localStorage.getItem(SESSION_KEY) || "";
let data = emptyData();
let cart = [];

function emptyData() {
  return {
    profile: {
      owner: "",
      name: "My Business",
      type: "General Store",
      mobile: "",
      address: "",
      bio: "Billing • Inventory • Marketing • Reports",
      logo: "icon-192.png",
      plan: "free"
    },
    products: [],
    purchases: [],
    sales: []
  };
}

const $ = id => document.getElementById(id);
const rupee = n => "₹" + (Number(n) || 0).toFixed(2);
const today = () => new Date().toISOString().slice(0, 10);
const key = () => `SKS_DATA_${currentUser}`;
const clean = v => String(v || "").trim().toLowerCase();

function fillBusinessSelects() {
  let html = businessTypes.map(x => `<option>${x}</option>`).join("");
  ["regBusiness", "profileType"].forEach(id => {
    if ($(id)) $(id).innerHTML = html;
  });
}

function showAuth(tab) {
  $("loginBox").classList.toggle("active", tab === "login");
  $("registerBox").classList.toggle("active", tab === "register");
  $("loginTab").classList.toggle("active", tab === "login");
  $("registerTab").classList.toggle("active", tab === "register");
  $("authMsg").textContent = "";
}

function msg(t) {
  $("authMsg").textContent = t;
}

async function registerAccount() {
  const email = clean($("regEmail").value);
  const pass = $("regPassword").value.trim();

  if (!email || !pass || !$("regStore").value.trim()) {
    return msg("Email, password, store name zaroori hai");
  }

  try {
    const profile = {
      owner: $("regName").value.trim(),
      storeName: $("regStore").value.trim(),
      businessType: $("regBusiness").value,
      bio: "Billing • Inventory • Marketing • Reports"
    };

    const uid = await fbRegister(email, pass, profile);

    currentUser = uid;
    localStorage.setItem(SESSION_KEY, uid);

    data = emptyData();
    data.profile.owner = profile.owner;
    data.profile.name = profile.storeName;
    data.profile.type = profile.businessType;

    saveRaw();
    startApp();
  } catch (err) {
    msg(err.message);
  }
}

async function emailLogin() {
  const email = clean($("loginEmail").value);
  const pass = $("loginPassword").value.trim();

  if (!email || !pass) return msg("Email aur password डालें");

  try {
    const uid = await fbLogin(email, pass);

    currentUser = uid;
    localStorage.setItem(SESSION_KEY, uid);

    loadData();
    startApp();
  } catch (err) {
    msg(err.message);
  }
}

async function googleLoginUI() {
  try {
    const uid = await fbGoogleLogin();

    currentUser = uid;
    localStorage.setItem(SESSION_KEY, uid);

    loadData();
    startApp();
  } catch (err) {
    msg(err.message);
  }
}

async function sendOtpUI() {
  const phone = $("phoneNumber") ? $("phoneNumber").value.trim() : "";

  if (!phone) return msg("Mobile number डालें, example: +919876543210");

  try {
    await fbSendOtp(phone);
    msg("OTP send ho gaya");
  } catch (err) {
    msg(err.message);
  }
}

async function verifyOtpUI() {
  const otp = $("otpCode") ? $("otpCode").value.trim() : "";

  if (!otp) return msg("OTP डालें");

  try {
    const uid = await fbVerifyOtp(otp);

    currentUser = uid;
    localStorage.setItem(SESSION_KEY, uid);

    loadData();
    startApp();
  } catch (err) {
    msg(err.message);
  }
}

async function logout() {
  try {
    await fbLogout();
  } catch {}

  localStorage.removeItem(SESSION_KEY);
  currentUser = "";
  $("authScreen").style.display = "flex";
  $("appContent").style.display = "none";
}

function loadData() {
  data = JSON.parse(localStorage.getItem(key()) || "null") || emptyData();

  if (!data.profile) data.profile = emptyData().profile;
  if (!data.products) data.products = [];
  if (!data.purchases) data.purchases = [];
  if (!data.sales) data.sales = [];
}

function saveRaw() {
  localStorage.setItem(key(), JSON.stringify(data));
}

function save() {
  saveRaw();
  renderAll();
}

function startApp() {
  $("authScreen").style.display = "none";
  $("appContent").style.display = "block";
  updateProfileUI();
  renderAll();
  generateTemplates();
}

function init() {
  fillBusinessSelects();

  watchLogin(user => {
    if (user && !currentUser) {
      currentUser = user.uid;
      localStorage.setItem(SESSION_KEY, user.uid);
      loadData();
      startApp();
    }
  });

  if (currentUser) {
    loadData();
    startApp();
  } else {
    showAuth("login");
  }
}

function showTab(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav").forEach(n => n.classList.remove("active"));

  $(id).classList.add("active");

  let b = document.querySelector(`[data-tab="${id}"]`);
  if (b) b.classList.add("active");

  $("pageTitle").textContent = b ? b.textContent : id;

  if (id === "reports") renderReport();
  if (id === "customers") renderCustomers();
}

document.addEventListener("click", e => {
  if (e.target.classList.contains("nav") && e.target.dataset.tab) {
    showTab(e.target.dataset.tab);
  }
});

function productById(id) {
  return data.products.find(p => p.id === id);
}

function fillSelects() {
  let opts =
    '<option value="">Select Product</option>' +
    data.products
      .map(p => `<option value="${p.id}">${p.name} (Stock ${p.stock})</option>`)
      .join("");

  if ($("saleProduct")) $("saleProduct").innerHTML = opts;
  if ($("purchaseProduct")) $("purchaseProduct").innerHTML = opts;
}

function clearProductForm() {
  ["productId", "pName", "pCat", "pBuy", "pSell"].forEach(id => {
    if ($(id)) $(id).value = "";
  });

  $("pStock").value = 0;
  $("pLow").value = 5;
}

function saveProduct() {
  let name = $("pName").value.trim();
  if (!name) return alert("Product name डालें");

  let id = $("productId").value || Date.now().toString();

  let p = {
    id,
    name,
    cat: $("pCat").value.trim(),
    buy: +$("pBuy").value || 0,
    sell: +$("pSell").value || 0,
    stock: +$("pStock").value || 0,
    low: +$("pLow").value || 0
  };

  let old = productById(id);
  old ? Object.assign(old, p) : data.products.push(p);

  clearProductForm();
  save();
}

function editProduct(id) {
  let p = productById(id);
  if (!p) return;

  $("productId").value = p.id;
  $("pName").value = p.name;
  $("pCat").value = p.cat;
  $("pBuy").value = p.buy;
  $("pSell").value = p.sell;
  $("pStock").value = p.stock;
  $("pLow").value = p.low;

  showTab("products");
}

function delProduct(id) {
  if (confirm("Delete product?")) {
    data.products = data.products.filter(p => p.id !== id);
    save();
  }
}

function renderProducts() {
  let q = clean($("productSearch")?.value);

  $("productBody").innerHTML =
    data.products
      .filter(p => clean(p.name).includes(q) || clean(p.cat).includes(q))
      .map(
        p => `
      <tr>
        <td>${p.name}</td>
        <td>${p.cat || "-"}</td>
        <td>${rupee(p.buy)}</td>
        <td>${rupee(p.sell)}</td>
        <td><span class="badge ${p.stock <= p.low ? "red" : ""}">${p.stock}</span></td>
        <td>
          <button onclick="editProduct('${p.id}')">Edit</button>
          <button onclick="delProduct('${p.id}')">Delete</button>
        </td>
      </tr>`
      )
      .join("") || '<tr><td colspan="6">No product. Add your real product.</td></tr>';
}

function setupProductEvents() {
  if ($("saleProduct")) {
    $("saleProduct").onchange = () => {
      let p = productById($("saleProduct").value);
      $("saleRate").value = p ? p.sell : "";
    };
  }

  if ($("purchaseProduct")) {
    $("purchaseProduct").onchange = () => {
      let p = productById($("purchaseProduct").value);
      $("purchaseRate").value = p ? p.buy : "";
    };
  }
}

function savePurchase() {
  let p = productById($("purchaseProduct").value);
  let qty = +$("purchaseQty").value || 0;
  let rate = +$("purchaseRate").value || 0;

  if (!p || qty <= 0) return alert("Product aur qty सही डालें");

  p.stock += qty;
  p.buy = rate;

  data.purchases.push({
    id: Date.now().toString(),
    date: today(),
    supplier: $("supplier").value.trim(),
    pid: p.id,
    pname: p.name,
    qty,
    rate,
    total: qty * rate
  });

  $("supplier").value = "";
  $("purchaseQty").value = 1;
  $("purchaseRate").value = "";

  save();
}

function delPurchase(id) {
  let x = data.purchases.find(p => p.id === id);

  if (confirm("Delete purchase?")) {
    let p = productById(x.pid);
    if (p) p.stock -= x.qty;

    data.purchases = data.purchases.filter(p => p.id !== id);
    save();
  }
}

function renderPurchases() {
  $("purchaseBody").innerHTML =
    [...data.purchases]
      .reverse()
      .map(
        x => `
      <tr>
        <td>${x.date}</td>
        <td>${x.supplier || "-"}</td>
        <td>${x.pname}</td>
        <td>${x.qty}</td>
        <td>${rupee(x.total)}</td>
        <td><button onclick="delPurchase('${x.id}')">Delete</button></td>
      </tr>`
      )
      .join("") || '<tr><td colspan="6">No purchase</td></tr>';
}

function addToCart() {
  let p = productById($("saleProduct").value);
  let qty = +$("saleQty").value || 0;
  let rate = +$("saleRate").value || 0;

  if (!p || qty <= 0) return alert("Product aur qty सही डालें");
  if (qty > p.stock) return alert("Stock available nahi hai");

  cart.push({
    pid: p.id,
    name: p.name,
    qty,
    rate,
    buy: p.buy,
    total: qty * rate,
    profit: (rate - p.buy) * qty
  });

  $("saleQty").value = 1;
  $("saleRate").value = "";
  $("saleProduct").value = "";

  renderCart();
}

function renderCart() {
  $("cartBody").innerHTML = cart
    .map(
      (i, n) => `
    <tr>
      <td>${i.name}</td>
      <td>${i.qty}</td>
      <td>${rupee(i.rate)}</td>
      <td>${rupee(i.total)}</td>
      <td><button onclick="removeCartItem(${n})">X</button></td>
    </tr>`
    )
    .join("");

  $("cartTotal").textContent = rupee(cart.reduce((s, i) => s + i.total, 0));
  updateInvoicePreview();
}

function removeCartItem(n) {
  cart.splice(n, 1);
  renderCart();
}

function saveSale() {
  if (!cart.length) return alert("Cart empty hai");

  cart.forEach(i => {
    let p = productById(i.pid);
    if (p) p.stock -= i.qty;
  });

  let sale = {
    id: Date.now().toString(),
    date: today(),
    customer: $("customerName").value.trim(),
    mobile: $("customerMobile").value.trim(),
    items: [...cart],
    total: cart.reduce((s, i) => s + i.total, 0),
    profit: cart.reduce((s, i) => s + i.profit, 0)
  };

  data.sales.push(sale);

  cart = [];
  $("customerName").value = "";
  $("customerMobile").value = "";

  save();
  renderCart();
  makeInvoice(sale);

  setTimeout(() => printInvoice(sale), 300);
}

function invoiceHTML(s) {
  return `
  <div class="bill-print">
    <div class="bill-head">
      <h2>${data.profile.name}</h2>
      <p>${data.profile.address || data.profile.bio || ""} ${data.profile.mobile ? " | " + data.profile.mobile : ""}</p>
    </div>

    <p>
      <b>Invoice:</b> ${s.id}<br>
      <b>Date:</b> ${s.date}<br>
      <b>Customer:</b> ${s.customer || "Cash"} ${s.mobile || ""}
    </p>

    <table>
      <thead>
        <tr><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr>
      </thead>
      <tbody>
        ${s.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${rupee(i.rate)}</td><td>${rupee(i.total)}</td></tr>`).join("")}
      </tbody>
    </table>

    <h2 class="right">Grand Total: ${rupee(s.total)}</h2>
    <p class="thanks">Thank you!</p>
  </div>`;
}

function updateInvoicePreview() {
  if (!cart.length) {
    $("invoiceBox").innerHTML = "<h2>Invoice Preview</h2><p>Cart me item add karte hi bill yahan dikhega.</p>";
    return;
  }

  let s = {
    id: "Preview",
    date: today(),
    customer: $("customerName").value,
    mobile: $("customerMobile").value,
    items: cart,
    total: cart.reduce((a, i) => a + i.total, 0)
  };

  $("invoiceBox").innerHTML = invoiceHTML(s);
}

function makeInvoice(s) {
  $("invoiceBox").innerHTML =
    invoiceHTML(s) +
    `<button class="primary no-print" onclick="printInvoiceById('${s.id}')">Print Invoice</button>`;
}

function printInvoiceById(id) {
  let s = data.sales.find(x => x.id === id);
  if (s) printInvoice(s);
}

function printInvoice(s) {
  printContent(invoiceHTML(s));
}

function printContent(html) {
  $("printArea").innerHTML = html;
  document.body.classList.add("printing");

  setTimeout(() => {
    window.print();
    setTimeout(() => document.body.classList.remove("printing"), 600);
  }, 200);
}

function setupInvoiceEvents() {
  ["customerName", "customerMobile"].forEach(id => {
    if ($(id)) $(id).addEventListener("input", updateInvoicePreview);
  });
}

function renderDashboard() {
  let d = today();
  let sales = data.sales.filter(s => s.date === d);

  $("todaySale").textContent = rupee(sales.reduce((a, s) => a + s.total, 0));
  $("todayProfit").textContent = rupee(sales.reduce((a, s) => a + s.profit, 0));
  $("totalProducts").textContent = data.products.length;
  $("stockValue").textContent = rupee(data.products.reduce((a, p) => a + p.stock * p.buy, 0));

  $("lowStock").innerHTML =
    data.products
      .filter(p => p.stock <= p.low)
      .map(p => `<p class="red"><b>${p.name}</b> stock ${p.stock}</p>`)
      .join("") || '<p class="green">Low stock nahi hai</p>';
}

function renderCustomers() {
  let map = {};

  data.sales.forEach(s => {
    let k = s.mobile || s.customer || "Cash";
    if (!map[k]) map[k] = { name: s.customer || "Cash", mobile: s.mobile || "", count: 0, total: 0 };
    map[k].count++;
    map[k].total += s.total;
  });

  $("customerBody").innerHTML =
    Object.values(map)
      .map(c => `<tr><td>${c.name}</td><td>${c.mobile}</td><td>${c.count}</td><td>${rupee(c.total)}</td></tr>`)
      .join("") || '<tr><td colspan="4">No customers</td></tr>';
}

function renderReport() {
  let d = $("reportDate").value || today();
  $("reportDate").value = d;

  let sales = data.sales.filter(s => s.date === d);
  let pur = data.purchases.filter(p => p.date === d);

  $("reportBox").innerHTML = `
    <h2>Daily Report - ${d}</h2>

    <div class="cards">
      <div class="card"><span>Sales</span><b>${rupee(sales.reduce((a, s) => a + s.total, 0))}</b></div>
      <div class="card"><span>Purchase</span><b>${rupee(pur.reduce((a, p) => a + p.total, 0))}</b></div>
      <div class="card"><span>Profit</span><b>${rupee(sales.reduce((a, s) => a + s.profit, 0))}</b></div>
      <div class="card"><span>Bills</span><b>${sales.length}</b></div>
    </div>

    <table>
      <thead><tr><th>Bill</th><th>Customer</th><th>Total</th></tr></thead>
      <tbody>
        ${sales.map(s => `<tr><td>${s.id}</td><td>${s.customer || "Cash"}</td><td>${rupee(s.total)}</td></tr>`).join("") || '<tr><td colspan="3">No sales</td></tr>'}
      </tbody>
    </table>`;
}

function printReport() {
  renderReport();
  printContent($("reportBox").innerHTML);
}

function exportCSV() {
  let rows = ["Type,Date,Name,Qty,Rate,Total"];

  data.purchases.forEach(p => rows.push(`Purchase,${p.date},${p.pname},${p.qty},${p.rate},${p.total}`));
  data.sales.forEach(s => s.items.forEach(i => rows.push(`Sale,${s.date},${i.name},${i.qty},${i.rate},${i.total}`)));

  download("business-report.csv", rows.join("\n"), "text/csv");
}

function saveProfile() {
  Object.assign(data.profile, {
    name: $("profileName").value,
    owner: $("profileOwner").value,
    type: $("profileType").value,
    mobile: $("profileMobile").value,
    address: $("profileAddress").value,
    bio: $("profileBio").value
  });

  let f = $("profileLogo").files[0];

  if (f) {
    let r = new FileReader();
    r.onload = () => {
      data.profile.logo = r.result;
      save();
      updateProfileUI();
    };
    r.readAsDataURL(f);
  } else {
    save();
    updateProfileUI();
  }
}

function updateProfileUI() {
  $("storeNameSide").textContent = data.profile.name;
  $("storeTypeSide").textContent = data.profile.type;
  $("storeBioTop").textContent = data.profile.bio;
  $("storeLogoSide").src = data.profile.logo || "icon-192.png";

  $("profileName").value = data.profile.name;
  $("profileOwner").value = data.profile.owner || "";
  $("profileType").value = data.profile.type || "General Store";
  $("profileMobile").value = data.profile.mobile || "";
  $("profileAddress").value = data.profile.address || "";
  $("profileBio").value = data.profile.bio || "";
}

const themes = [
  "#1d4ed8,#7c3aed","#dc2626,#f59e0b","#047857,#22c55e","#111827,#64748b",
  "#be123c,#fb7185","#7c2d12,#f97316","#0e7490,#38bdf8","#581c87,#a855f7",
  "#166534,#84cc16","#92400e,#facc15"
];

const titles = [
  "Big Sale","Festival Offer","Grand Opening","New Arrival","Weekend Dhamaka",
  "Best Price","Limited Offer","Customer Special","Mega Discount","Fresh Stock"
];

function generateTemplates() {
  let grid = $("templateGrid");
  if (!grid) return;

  let adTitle = $("adTitle").value || data.profile.name;
  let adText = $("adText").value || `${data.profile.type} ke liye special offer`;

  let html = "";

  for (let i = 0; i < 10; i++) {
    let t = titles[Math.floor(Math.random() * titles.length)];
    let th = themes[Math.floor(Math.random() * themes.length)];

    html += `
    <div class="template-card">
      <div class="ad-preview" id="ad${i}" style="background:linear-gradient(135deg,${th})">
        <div>
          <h3>${t}</h3>
          <p>${adTitle}</p>
        </div>
        <p>${adText}</p>
        <b>${data.profile.mobile || "Contact Us"}</b>
      </div>
      <div class="template-actions">
        <button onclick="editTemplate(${i})">Edit</button>
        <button onclick="downloadTemplate(${i})">Download</button>
        <button onclick="shareTemplate(${i})">Share</button>
      </div>
    </div>`;
  }

  grid.innerHTML = html;
}

function editTemplate(i) {
  let title = prompt("Title", $("adTitle").value || data.profile.name);
  let text = prompt("Text", $("adText").value || "Special Offer");

  if (title !== null) {
    $("adTitle").value = title;
    $("adText").value = text;
    generateTemplates();
  }
}

function downloadTemplate(i) {
  let el = $("ad" + i);
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");

  canvas.width = 1080;
  canvas.height = 1080;

  let grad = ctx.createLinearGradient(0, 0, 1080, 1080);
  grad.addColorStop(0, "#2563eb");
  grad.addColorStop(1, "#7c3aed");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1080);

  ctx.fillStyle = "white";
  ctx.font = "bold 90px Arial";
  ctx.fillText(el.querySelector("h3").textContent, 80, 230);

  ctx.font = "bold 58px Arial";
  ctx.fillText(el.querySelectorAll("p")[0].textContent, 80, 380);

  ctx.font = "44px Arial";
  ctx.fillText(el.querySelectorAll("p")[1].textContent, 80, 520);

  ctx.font = "bold 48px Arial";
  ctx.fillText(el.querySelector("b").textContent, 80, 780);

  canvas.toBlob(b => {
    let a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = "marketing-template.png";
    a.click();
  });
}

async function shareTemplate(i) {
  if (navigator.share) {
    await navigator.share({
      title: "Business Offer",
      text: "Special offer from " + data.profile.name
    });
  } else {
    alert("Share supported nahi hai. Download karke WhatsApp par bhejein.");
  }
}

function downloadBackup() {
  download("business-backup.json", JSON.stringify(data, null, 2), "application/json");
}

function restoreBackup(e) {
  let f = e.target.files[0];
  if (!f) return;

  let r = new FileReader();

  r.onload = () => {
    try {
      data = JSON.parse(r.result);
      save();
      updateProfileUI();
      alert("Restore done");
    } catch {
      alert("Invalid backup");
    }
  };

  r.readAsText(f);
}

function download(name, content, type) {
  let a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
}

function renderAll() {
  fillSelects();
  renderProducts();
  renderPurchases();
  renderDashboard();
  renderCustomers();
}

document.addEventListener("DOMContentLoaded", () => {
  setupProductEvents();
  setupInvoiceEvents();
  init();
});

window.showAuth = showAuth;
window.registerAccount = registerAccount;
window.emailLogin = emailLogin;
window.googleLoginUI = googleLoginUI;
window.sendOtpUI = sendOtpUI;
window.verifyOtpUI = verifyOtpUI;
window.logout = logout;
window.showTab = showTab;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.delProduct = delProduct;
window.savePurchase = savePurchase;
window.delPurchase = delPurchase;
window.addToCart = addToCart;
window.removeCartItem = removeCartItem;
window.saveSale = saveSale;
window.printInvoiceById = printInvoiceById;
window.printReport = printReport;
window.exportCSV = exportCSV;
window.saveProfile = saveProfile;
window.generateTemplates = generateTemplates;
window.editTemplate = editTemplate;
window.downloadTemplate = downloadTemplate;
window.shareTemplate = shareTemplate;
window.downloadBackup = downloadBackup;
window.restoreBackup = restoreBackup;
window.renderReport = renderReport;
