import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Protección temporal para edición local. En producción debe reemplazarse por Firebase Authentication.
const ADMIN_ACCESS_KEY = "Afayo0710";
const PRODUCTS_COLLECTION = "productos";
const PLACEHOLDER_IMAGE = "assets/hero-productos-ecof.png";
const FAMILY_OPTIONS = [
  { id: "fundas", label: "Fundas shopping / fundas kraft", category: "Fundas" },
  { id: "panaderia", label: "Fundas delivery / panadería / despacho", category: "Fundas" },
  { id: "cajas-blancas", label: "Cajas blancas / cartulina", category: "Cajas" },
  { id: "tortas-postres", label: "Cajas tortas y postres", category: "Cajas" },
  { id: "comida", label: "Cajas comida / loncheras / bandejas", category: "Cajas" },
  { id: "pizza", label: "Cajas pizza", category: "Cajas" },
  { id: "papeles", label: "Envoltura / papel antigrasa / etiquetas / servilletas", category: "Envoltura" },
  { id: "servilletas", label: "Servilletas", category: "Envoltura" }
];

let firestoreProducts = [];
let selectedDocId = "";

const adminLogin = document.getElementById("adminLogin");
const adminWorkspace = document.getElementById("adminWorkspace");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminStatus = document.getElementById("adminStatus");
const productList = document.getElementById("firestoreProductList");
const productForm = document.getElementById("firestoreProductForm");

function setStatus(message, type = "") {
  adminStatus.textContent = message;
  adminStatus.dataset.type = type;
}

function splitList(value = "") {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function splitLines(value = "") {
  return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean).slice(0, 3);
}

function pricesFromEditor(value = "") {
  return value.split(/\n|,/).map((line) => line.trim()).filter(Boolean).reduce((prices, line) => {
    const [qty, price] = line.split("=").map((item) => item?.trim());
    if (qty && price) prices[qty] = Number(price.replace(",", ".")) || price;
    return prices;
  }, {});
}

function pricesToText(value) {
  if (!value || typeof value !== "object") return "";
  return Object.entries(value).map(([qty, price]) => `${qty}=${price}`).join("\n");
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return splitList(value);
  return [];
}

function normalizeProduct(docId, data = {}) {
  const image = data.imagen || data.imagenPrincipal || data.imagenMiniatura || PLACEHOLDER_IMAGE;
  return {
    id: docId,
    nombre: data.nombre || "Producto ECOF",
    descripcion: data.descripcion || "",
    precio: Number(data.precio ?? 0) || 0,
    categoria: data.categoria || "",
    familia: data.familia || "fundas",
    subcategoria: data.subcategoria || "",
    imagen: image,
    imagenMiniatura: data.imagenMiniatura || image,
    imagenPrincipal: data.imagenPrincipal || image,
    medidas: data.medidas || "Medidas por definir",
    material: data.material || "Material por definir",
    paquete: data.paquete || "A cotizar",
    precioPaquete: data.precioPaquete || "A cotizar",
    precioUnidad: data.precioUnidad || (Number(data.precio) ? `$${Number(data.precio).toFixed(2).replace(".", ",")}` : "A cotizar"),
    codigo: data.codigo || "",
    activo: data.activo !== false,
    personalizable: data.personalizable !== false,
    destacado: Boolean(data.destacado),
    orden: Number(data.orden ?? 0) || 0,
    etiquetas: asArray(data.etiquetas),
    uso: asArray(data.uso),
    galeria: Array.isArray(data.galeria) ? data.galeria.filter(Boolean).slice(0, 3) : [],
    videoYoutube: data.videoYoutube || "",
    preciosCantidad: data.preciosCantidad && typeof data.preciosCantidad === "object" ? data.preciosCantidad : null
  };
}

async function loadProducts() {
  setStatus("Cargando productos desde Firestore...");
  try {
    let snapshot;
    try {
      snapshot = await getDocs(query(collection(db, PRODUCTS_COLLECTION), orderBy("orden")));
      if (snapshot.empty) snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    } catch {
      snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    }
    firestoreProducts = snapshot.docs
      .map((item) => normalizeProduct(item.id, item.data()))
      .sort((a, b) => a.orden - b.orden);
    renderProductList();
    setStatus(`${firestoreProducts.length} producto(s) cargados desde Firebase.`, "success");
    if (firestoreProducts[0] && !selectedDocId) fillForm(firestoreProducts[0]);
  } catch (error) {
    console.error(error);
    setStatus("No se pudo cargar Firestore. Revisa conexión, reglas o configuración de Firebase.", "error");
  }
}

function renderProductList() {
  productList.innerHTML = firestoreProducts.length ? firestoreProducts.map((product) => `
    <button type="button" class="${product.id === selectedDocId ? "is-active" : ""}" data-select-product="${product.id}">
      <strong>${escapeHtml(product.nombre)}</strong>
      <span>${product.activo ? "Activo" : "Inactivo"} · ${product.destacado ? "Destacado" : "Normal"} · orden ${product.orden}</span>
    </button>
  `).join("") : `<p class="empty-request">Todavía no hay productos en Firestore.</p>`;
}

function emptyProduct() {
  return {
    id: "",
    nombre: "",
    descripcion: "",
    precio: 0,
    categoria: "Fundas",
    familia: "fundas",
    subcategoria: "",
    imagen: "",
    imagenMiniatura: "",
    imagenPrincipal: "",
    medidas: "",
    material: "",
    paquete: "",
    precioPaquete: "",
    precioUnidad: "",
    codigo: "",
    galeria: [],
    videoYoutube: "",
    preciosCantidad: null,
    personalizable: true,
    activo: true,
    destacado: false,
    orden: firestoreProducts.length + 1,
    etiquetas: [],
    uso: []
  };
}

function fillForm(product = emptyProduct()) {
  populateFamilyOptions();
  selectedDocId = product.id || "";
  document.getElementById("firestoreDocId").value = product.id || "";
  document.getElementById("fsNombre").value = product.nombre || "";
  document.getElementById("fsCodigo").value = product.codigo || "";
  document.getElementById("fsPrecio").value = product.precio || "";
  document.getElementById("fsOrden").value = product.orden || 0;
  document.getElementById("fsCategoria").value = product.categoria || "";
  document.getElementById("fsFamilia").value = product.familia || "fundas";
  document.getElementById("fsSubcategoria").value = product.subcategoria || "";
  document.getElementById("fsImagen").value = product.imagen || "";
  document.getElementById("fsImagenMiniatura").value = product.imagenMiniatura || "";
  document.getElementById("fsImagenPrincipal").value = product.imagenPrincipal || "";
  document.getElementById("fsGaleria").value = (product.galeria || []).join("\n");
  document.getElementById("fsVideoYoutube").value = product.videoYoutube || "";
  document.getElementById("fsMedidas").value = product.medidas || "";
  document.getElementById("fsMaterial").value = product.material || "";
  document.getElementById("fsPaquete").value = product.paquete || "";
  document.getElementById("fsPrecioPaquete").value = product.precioPaquete || "";
  document.getElementById("fsPrecioUnidad").value = product.precioUnidad || "";
  document.getElementById("fsPreciosCantidad").value = pricesToText(product.preciosCantidad);
  document.getElementById("fsDescripcion").value = product.descripcion || "";
  document.getElementById("fsEtiquetas").value = (product.etiquetas || []).join(", ");
  document.getElementById("fsUso").value = (product.uso || []).join(", ");
  document.getElementById("fsPersonalizable").checked = product.personalizable !== false;
  document.getElementById("fsActivo").checked = product.activo !== false;
  document.getElementById("fsDestacado").checked = Boolean(product.destacado);
  document.getElementById("fsImageFileName").textContent = "Ningún archivo cargado.";
  renderGalleryManager();
  renderProductList();
}

function formToProduct() {
  const nombre = document.getElementById("fsNombre").value.trim();
  if (!nombre) throw new Error("El nombre del producto es obligatorio.");
  const image = document.getElementById("fsImagen").value.trim();
  const quantityPrices = pricesFromEditor(document.getElementById("fsPreciosCantidad").value);
  return {
    nombre,
    descripcion: document.getElementById("fsDescripcion").value.trim(),
    precio: Number(document.getElementById("fsPrecio").value || 0),
    categoria: document.getElementById("fsCategoria").value.trim(),
    familia: document.getElementById("fsFamilia").value,
    subcategoria: document.getElementById("fsSubcategoria").value.trim(),
    imagen: image,
    imagenMiniatura: document.getElementById("fsImagenMiniatura").value.trim() || image,
    imagenPrincipal: document.getElementById("fsImagenPrincipal").value.trim() || image,
    galeria: splitLines(document.getElementById("fsGaleria").value),
    videoYoutube: document.getElementById("fsVideoYoutube").value.trim(),
    medidas: document.getElementById("fsMedidas").value.trim(),
    material: document.getElementById("fsMaterial").value.trim(),
    paquete: document.getElementById("fsPaquete").value.trim(),
    precioPaquete: document.getElementById("fsPrecioPaquete").value.trim(),
    precioUnidad: document.getElementById("fsPrecioUnidad").value.trim(),
    preciosCantidad: Object.keys(quantityPrices).length ? quantityPrices : null,
    codigo: document.getElementById("fsCodigo").value.trim(),
    personalizable: document.getElementById("fsPersonalizable").checked,
    activo: document.getElementById("fsActivo").checked,
    destacado: document.getElementById("fsDestacado").checked,
    orden: Number(document.getElementById("fsOrden").value || 0),
    etiquetas: splitList(document.getElementById("fsEtiquetas").value),
    uso: splitList(document.getElementById("fsUso").value)
  };
}

async function saveProduct(event) {
  event.preventDefault();
  try {
    const payload = formToProduct();
    const docId = document.getElementById("firestoreDocId").value;
    if (docId) {
      await updateDoc(doc(db, PRODUCTS_COLLECTION, docId), {
        ...payload,
        actualizado: serverTimestamp()
      });
      setStatus("Producto actualizado en Firebase.", "success");
    } else {
      const created = await addDoc(collection(db, PRODUCTS_COLLECTION), {
        ...payload,
        creado: serverTimestamp(),
        actualizado: serverTimestamp()
      });
      selectedDocId = created.id;
      setStatus("Producto creado en Firebase.", "success");
    }
    await loadProducts();
    if (selectedDocId) fillForm(firestoreProducts.find((product) => product.id === selectedDocId) || firestoreProducts[0]);
  } catch (error) {
    console.error(error);
    setStatus(error.message || "No se pudo guardar el producto.", "error");
  }
}

async function deleteProduct() {
  const docId = document.getElementById("firestoreDocId").value;
  if (!docId) return setStatus("Selecciona un producto antes de borrar.", "error");
  const product = firestoreProducts.find((item) => item.id === docId);
  if (!confirm(`¿Borrar "${product?.nombre || "este producto"}" de Firebase?`)) return;
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, docId));
    selectedDocId = "";
    fillForm(emptyProduct());
    await loadProducts();
    setStatus("Producto borrado de Firebase.", "success");
  } catch (error) {
    console.error(error);
    setStatus("No se pudo borrar el producto.", "error");
  }
}

async function toggleActiveProduct() {
  const docId = document.getElementById("firestoreDocId").value;
  if (!docId) return setStatus("Selecciona un producto antes de activar o desactivar.", "error");
  const current = firestoreProducts.find((item) => item.id === docId);
  if (!current) return;
  await updateDoc(doc(db, PRODUCTS_COLLECTION, docId), {
    activo: !current.activo,
    actualizado: serverTimestamp()
  });
  await loadProducts();
  fillForm(firestoreProducts.find((product) => product.id === docId) || emptyProduct());
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function populateFamilyOptions() {
  const select = document.getElementById("fsFamilia");
  if (!select || select.options.length) return;
  select.innerHTML = FAMILY_OPTIONS.map((family) => `<option value="${family.id}">${escapeHtml(family.label)}</option>`).join("");
}

function syncCategoryFromFamily() {
  const family = FAMILY_OPTIONS.find((item) => item.id === document.getElementById("fsFamilia")?.value);
  const category = document.getElementById("fsCategoria");
  if (family && category && !category.value.trim()) category.value = family.category;
}

function renderGalleryManager() {
  const manager = document.getElementById("fsGalleryManager");
  const gallery = document.getElementById("fsGaleria");
  if (!manager || !gallery) return;
  const items = splitLines(gallery.value);
  manager.innerHTML = items.length
    ? items.map((item, index) => `
      <div class="editor-gallery-item">
        <img src="${escapeHtml(item)}" alt="${escapeHtml(mediaFileName(item, index))}" onerror="this.src='assets/ecof-logo.png'">
        <strong title="${escapeHtml(mediaFileName(item, index))}">${escapeHtml(mediaFileName(item, index))}</strong>
        <button type="button" data-remove-fs-gallery-image="${index}">Eliminar imagen</button>
      </div>
    `).join("")
    : `<span class="editor-file-status">Sin fotos extra en galería.</span>`;
}

function mediaFileName(src = "", index = 0) {
  const value = String(src);
  if (value.startsWith("data:image")) return `Imagen subida ${index + 1}`;
  try {
    const url = new URL(value, window.location.href);
    const driveId = url.searchParams.get("id");
    if (driveId) return `Drive ${driveId.slice(0, 10)}...`;
    return decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "") || `Imagen ${index + 1}`;
  } catch {
    return value.split(/[\\/]/).pop() || `Imagen ${index + 1}`;
  }
}

adminLoginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (document.getElementById("adminAccessKey").value !== ADMIN_ACCESS_KEY) {
    alert("Clave temporal incorrecta.");
    return;
  }
  sessionStorage.setItem("ecofAdminUnlocked", "true");
  adminLogin.hidden = true;
  adminWorkspace.hidden = false;
  await loadProducts();
});

productList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-select-product]");
  if (!button) return;
  const product = firestoreProducts.find((item) => item.id === button.dataset.selectProduct);
  if (product) fillForm(product);
});

productForm?.addEventListener("submit", saveProduct);
document.getElementById("newFirestoreProduct")?.addEventListener("click", () => fillForm(emptyProduct()));
document.getElementById("refreshFirestoreProducts")?.addEventListener("click", loadProducts);
document.getElementById("deleteFirestoreProduct")?.addEventListener("click", deleteProduct);
document.getElementById("toggleActiveProduct")?.addEventListener("click", toggleActiveProduct);
document.getElementById("fsFamilia")?.addEventListener("change", syncCategoryFromFamily);
document.getElementById("fsGaleria")?.addEventListener("input", renderGalleryManager);
document.getElementById("fsGalleryManager")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-fs-gallery-image]");
  if (!button) return;
  const gallery = document.getElementById("fsGaleria");
  const items = splitLines(gallery.value);
  items.splice(Number(button.dataset.removeFsGalleryImage), 1);
  gallery.value = items.join("\n");
  renderGalleryManager();
});
document.getElementById("fsImageFile")?.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const dataUrl = reader.result;
    document.getElementById("fsImagen").value = dataUrl;
    document.getElementById("fsImagenMiniatura").value = dataUrl;
    document.getElementById("fsImagenPrincipal").value = dataUrl;
    const gallery = document.getElementById("fsGaleria");
    const items = splitLines(gallery.value);
    if (!items.includes(dataUrl)) gallery.value = [dataUrl, ...items].slice(0, 3).join("\n");
    document.getElementById("fsImageFileName").textContent = `Archivo cargado: ${file.name}`;
    renderGalleryManager();
  });
  reader.readAsDataURL(file);
});

if (sessionStorage.getItem("ecofAdminUnlocked") === "true") {
  adminLogin.hidden = true;
  adminWorkspace.hidden = false;
  loadProducts();
}

populateFamilyOptions();
renderGalleryManager();
