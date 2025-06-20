let db;
const request = indexedDB.open("InventoryDB", 1);

request.onupgradeneeded = function (event) {
  db = event.target.result;
  const store = db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
  store.createIndex("name", "name");
  store.createIndex("quantity", "quantity");
  store.createIndex("price", "price");
};

// request.onsuccess = function (event) {
//   db = event.target.result;

//   document.addEventListener("DOMContentLoaded", () => {
//     if (document.getElementById("add-product-form")) {
//       document.getElementById("add-product-form").addEventListener("submit", function (e) {
//         e.preventDefault();
//         const name = document.getElementById("product-name").value;
//         const quantity = parseInt(document.getElementById("product-quantity").value);
//         const price = parseFloat(document.getElementById("product-price").value);
//         addProduct(name, quantity, price);
//       });
//     }

//     if (document.getElementById("total-products")) {
//       updateDashboard();
//     }

//     if (document.getElementById("product-list")) {
//       loadProducts();
//     }

//     if (document.getElementById("report-table-body")) {
//       generateReports();
//     }

//     if (document.getElementById("low-stock-body")) {
//       generateLowStockReport();
//     }

//     if (document.getElementById("low-product-list")) {
//       loadLowProducts();
//     }
//   });
// };
request.onsuccess = function (event) {
  db = event.target.result;

  document.dispatchEvent(new Event("db-ready"));
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
};

function initApp() {
  if (document.getElementById("add-product-form")) {
    document.getElementById("add-product-form").addEventListener("submit", function (e) {
      e.preventDefault();
      const name = document.getElementById("product-name").value;
      const quantity = parseInt(document.getElementById("product-quantity").value);
      const price = parseFloat(document.getElementById("product-price").value);
      addProduct(name, quantity, price);
    });
  }

  if (document.getElementById("total-products")) {
    updateDashboard();
  }

  if (document.getElementById("product-list")) {
    loadProducts();
  }

  if (document.getElementById("report-table-body")) {
    generateReports();
  }

  if (document.getElementById("low-stock-body")) {
    generateLowStockReport();
  }

  if (document.getElementById("low-product-list")) {
    loadLowProducts();
  }
}

request.onerror = function (event) {
  console.error("IndexedDB error:", event.target.errorCode);
};

