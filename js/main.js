function addProduct(name, quantity, price) {
  getNextAvailableId((nextId) => {
    const transaction = db.transaction(["products"], "readwrite");
    const store = transaction.objectStore("products");
    const product = { id: nextId, name, quantity, price };
    store.add(product);
    transaction.oncomplete = () => {
      console.log("Product added");
      window.location.href = "products.html";
    };
  });
}

function getNextAvailableId(callback) {
  const transaction = db.transaction(["products"], "readonly");
  const store = transaction.objectStore("products");
  const request = store.getAll();

  request.onsuccess = function (event) {
    const products = event.target.result;
    const usedIds = products.map(p => p.id).sort((a, b) => a - b);
    let id = 1;
    for (let usedId of usedIds) {
      if (usedId === id) id++;
      else break;
    }
    callback(id);
  };
}

function loadProducts() {
  const transaction = db.transaction(["products"], "readonly");
  const store = transaction.objectStore("products");
  const request = store.getAll();
  request.onsuccess = function (event) {
    const products = event.target.result;
    const list = document.getElementById("product-list");
    list.innerHTML = "";
    products.forEach(product => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${product.id}</td>
        <td><input type="text" value="${product.name}" id="name-${product.id}" disabled /></td>
        <td><input type="number" value="${product.quantity}" id="quantity-${product.id}" disabled /></td>
        <td><input type="number" step="0.01" value="${product.price}" id="price-${product.id}" disabled /></td>
        <td>
          <button onclick="deleteProduct(${product.id})">Delete</button>
          <button onclick="enableEdit(${product.id}, this)">Edit</button>
        </td>
      `;
      list.appendChild(row);
    });
  };
}


function loadLowProducts() {
  const transaction = db.transaction(["products"], "readonly");
  const store = transaction.objectStore("products");
  const request = store.getAll();
  request.onsuccess = function (event) {
    const products = event.target.result;
    const list = document.getElementById("low-product-list");
    list.innerHTML = "";
      const lowStockProducts = products.filter(product => product.quantity < 5);
    lowStockProducts.forEach(product => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${product.id}</td>
        <td><input type="text" value="${product.name}" id="name-${product.id}" disabled /></td>
        <td><input type="number" value="${product.quantity}" id="quantity-${product.id}" disabled /></td>
        <td><input type="number" step="0.01" value="${product.price}" id="price-${product.id}" disabled /></td>
      
      `;
      list.appendChild(row);
    });
  };
}
 


function enableEdit(id, button) {
  const nameInput = document.getElementById(`name-${id}`);
  const quantityInput = document.getElementById(`quantity-${id}`);
  const priceInput = document.getElementById(`price-${id}`);

  if (button.textContent === "Edit") {
    nameInput.disabled = false;
    quantityInput.disabled = false;
    priceInput.disabled = false;
    button.textContent = "Save";
  } else {
    const updatedData = {
      name: nameInput.value,
      quantity: parseInt(quantityInput.value),
      price: parseFloat(priceInput.value)
    };
    updateProduct(id, updatedData);
    button.textContent = "Edit";
    nameInput.disabled = true;
    quantityInput.disabled = true;
    priceInput.disabled = true;
  }
}

function deleteProduct(id) {
  const transaction = db.transaction(["products"], "readwrite");
  const store = transaction.objectStore("products");
  store.delete(id);
  transaction.oncomplete = () => {
    console.log("Product deleted");
    loadProducts();
  };
}

function updateProduct(id, updatedData) {
  const transaction = db.transaction(["products"], "readwrite");
  const store = transaction.objectStore("products");
  const request = store.get(id);

  request.onsuccess = function () {
    const product = request.result;
    if (!product) return;

    product.name = updatedData.name;
    product.quantity = updatedData.quantity;
    product.price = updatedData.price;

    store.put(product);
    transaction.oncomplete = () => {
      console.log("Product updated");
      loadProducts();
    };
  };
}

function updateDashboard() {
  const transaction = db.transaction(["products"], "readonly");
  const store = transaction.objectStore("products");
  const countRequest = store.count();
  countRequest.onsuccess = function () {
    const countElement = document.getElementById("total-products");
    if (countElement) {
      countElement.textContent = countRequest.result;
    }
  };
}

function generateReports() {
  const txn = db.transaction(["products"], "readonly");
  const store = txn.objectStore("products");
  const request = store.getAll();

  request.onsuccess = function (e) {
    const products = e.target.result;

    const totalProducts = products.length;
    const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const totalValue = products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
    const avgPrice = totalProducts > 0 ? (totalValue / totalQuantity).toFixed(2) : 0;
    const highPrice = products.length ? Math.max(...products.map(p => p.price)) : 0;
    const lowPrice = products.length ? Math.min(...products.map(p => p.price)) : 0;

    document.getElementById("report-total-products").textContent = totalProducts;
    document.getElementById("report-total-quantity").textContent = totalQuantity;
    document.getElementById("report-total-value").textContent = "Rs " + totalValue.toFixed(2);
    document.getElementById("report-avg-price").textContent = "Rs " + avgPrice;
    document.getElementById("report-high-price").textContent = "Rs " + highPrice;
    document.getElementById("report-low-price").textContent = "Rs " + lowPrice;

    const tbody = document.getElementById("report-table-body");
    tbody.innerHTML = "";
    products.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>${p.quantity}</td>
        <td>Rs ${p.price}</td>
        <td>Rs ${(p.quantity * p.price).toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });
  };
}

function generateLowStockReport() {
  const txn = db.transaction(["products"], "readonly");
  const store = txn.objectStore("products");
  const request = store.getAll();

  request.onsuccess = function (e) {
    const products = e.target.result;
    const lowStockBody = document.getElementById("low-stock-body");

    if (!lowStockBody) return;

    const lowStock = products.filter(p => Number(p.quantity) < 5);
    lowStockBody.innerHTML = "";

    if (lowStock.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="4">✅ All products sufficiently stocked.</td>`;
      lowStockBody.appendChild(row);
    } else {
      lowStock.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${p.id}</td>
          <td>${p.name}</td>
          <td>${p.quantity}</td>
          <td>Rs ${p.price}</td>
        `;
        lowStockBody.appendChild(tr);
      });
    }
  };
}


