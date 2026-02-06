const API = "https://f84y4ph2q9.execute-api.eu-central-1.amazonaws.com";

let cart = [];
let categoriesMap = {};

document.getElementById("orderBtn").addEventListener("click", submitOrder);

async function loadData() {
  const [menuRes, catRes] = await Promise.all([fetch(`${API}/menu`), fetch(`${API}/categories`)]);

  const menu = await menuRes.json();
  const categories = await catRes.json();

  categories.forEach((c) => {
    categoriesMap[c.categoryID] = c.name;
  });

  renderMenu(menu);
}

function renderMenu(menu) {
  const grouped = {};

  menu
    .filter((i) => i.is_available)
    .forEach((item) => {
      const catName = categoriesMap[item.categoryID] || "Inne";
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push(item);
    });

  const menuDiv = document.getElementById("menu");
  menuDiv.innerHTML = "";

  for (const cat in grouped) {
    const section = document.createElement("div");
    section.className = "category";
    section.innerHTML = `<h2>${cat}</h2>`;

    grouped[cat].forEach((item) => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div>
          <strong>${item.name}</strong>
          <small>${item.description}</small>
          <small>${item.price} zł</small>
        </div>
        <button>Dodaj</button>
      `;

      div.querySelector("button").addEventListener("click", () => {
        addToCart(item.name, item.price);
      });

      section.appendChild(div);
    });

    menuDiv.appendChild(section);
  }
}

function addToCart(name, price) {
  const existing = cart.find((i) => i.name === name);

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ name, price, quantity: 1 });
  }

  renderCart();
}

function removeFromCart(name) {
  const item = cart.find((i) => i.name === name);
  if (!item) return;

  item.quantity--;

  if (item.quantity <= 0) {
    cart = cart.filter((i) => i.name !== name);
  }

  renderCart();
}

function renderCart() {
  const div = document.getElementById("cartItems");
  div.innerHTML = "";

  let total = 0;

  cart.forEach((i) => {
    total += i.price * i.quantity;

    div.innerHTML += `
      <div class="cart-item">
        <span>${i.name} × ${i.quantity}</span>
        <div class="cart-actions">
          <span>${i.price * i.quantity} zł</span>
          <button class="remove-btn" onclick="removeFromCart('${i.name}')">−</button>
        </div>
      </div>
    `;
  });

  document.getElementById("total").innerText = total;
}

function validateOrder() {
  const customerName = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();

  if (customerName.length < 2) {
    showErrorToast("Proszę podać prawidłowe imię (min. 2 znaki).");
    document.getElementById("name").focus();
    return false;
  }

  const nameRegex = /^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+$/;
  if (!nameRegex.test(customerName)) {
    showErrorToast("Imię może zawierać tylko litery (bez cyfr i znaków specjalnych).");
    document.getElementById("name").focus();
    return false;
  }

  const phoneRegex = /^\+[0-9]{9,15}$/;
  if (!phoneRegex.test(phone)) {
    showErrorToast("Proszę podać prawidłowy numer telefonu zaczynający się od numeru kierunkowego (np.+48) (9-15 cyfr).");
    document.getElementById("phone").focus();
    return false;
  }

  if (cart.length === 0) {
    showErrorToast("Koszyk jest pusty. Dodaj coś do zamówienia.");
    return false;
  }

  return true;
}

async function submitOrder() {
  if (!validateOrder()) return;

  const customerName = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();

  const payload = {
    customerName,
    phone,
    items: cart.map((i) => i.name),
    totalPrice: cart.reduce((s, i) => s + i.price * i.quantity, 0),
  };

  const res = await fetch(`${API}/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    showToast();
    cart = [];
    renderCart();
    document.getElementById("name").value = "";
    document.getElementById("phone").value = "";
  } else {
    alert("❌ Błąd zamówienia");
  }
}
function showToast() {
  const toast = document.getElementById("toast");
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}
function showErrorToast(message) {
  const toast = document.getElementById("errorToast");
  toast.textContent = "❌ " + message;
  toast.classList.remove("hidden");
  toast.style.backgroundColor = "#f56565";
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

loadData();
