import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
const WHATSAPP_NUMBER = "593990707544";
const PAYPHONE_PAYMENT_LINK = "https://payphone.app/";
// Futuro: para avisos automáticos de pago cancelado/aprobado se debe usar webhook/backend de PayPhone.
// Futuro: para validar transferencias de Banco Pichincha se requiere conciliación bancaria u OCR con revisión segura.
const STORAGE_KEY = "ecofCatalogProductsV6";
const REQUEST_KEY = "ecofQuoteRequestV1";
const PROMO_KEY = "ecofPromosV1";
const FAQ_KEY = "ecofFaqsV1";
const REVIEWS_KEY = "ecofReviewsV1";
const PAGE_CONTENT_KEY = "ecofPageContentV1";
const SOCIAL_LINKS_KEY = "ecofSocialLinksV1";
const PLANS_KEY = "ecofBusinessPlansV1";
// Protección temporal para edición local. En producción debe manejarse con backend o Firebase Auth.
const EDITOR_KEY = "Afayo0710";

const asset = (name) => `assets/catalogo/${name}`;

const families = [
  {
    id: "fundas",
    nav: "Fundas kraft",
    label: "Fundas kraft",
    category: "Fundas",
    description: "Fundas shopping, kraft, blancas y personalizadas para tiendas, regalos, boutiques y empresas.",
    image: asset("catalogo-fundas-shopping-cover.jpg"),
    subcategories: ["Fundas shopping", "Fundas delivery", "Fundas kraft", "Fundas blancas", "Fundas personalizadas con logo", "Fundas para tiendas", "Fundas para regalos", "Fundas para boutique", "Fundas para empresas"],
    color: "#2f7a35"
  },
  {
    id: "panaderia",
    nav: "Fundas delivery",
    label: "Fundas delivery",
    category: "Fundas",
    description: "Empaques para pan, bollería, cafeterías, pastelería y alimentos secos con presentación limpia.",
    image: asset("catalogo-fundas-delivery-cover.jpg"),
    subcategories: ["Fundas para pan", "Fundas para bollería", "Fundas para cafeterías", "Fundas para pastelería", "Fundas para alimentos secos"],
    color: "#b9854d"
  },
  {
    id: "cajas-blancas",
    nav: "Fundas de despacho",
    label: "Fundas de despacho",
    category: "Cajas",
    description: "Cajas blancas autoarmables para productos, comida rápida, delivery y presentaciones comerciales.",
    image: asset("catalogo-cajas-blancas-2.png"),
    subcategories: ["Cajas blancas pequeñas", "Cajas blancas medianas", "Cajas blancas grandes", "Cajas autoarmables", "Cajas para productos", "Cajas para delivery", "Cajas para comida rápida"],
    color: "#6f932f"
  },
  {
    id: "tortas-postres",
    nav: "Cajas",
    label: "Cajas",
    category: "Cajas",
    description: "Cajas resistentes para pastelerías, cafeterías, postres, tortas y repostería.",
    image: asset("catalogo-cajas-tortas.png"),
    subcategories: ["Caja torta pequeño blanco", "Caja torta pequeño plus blanco", "Caja torta mediano blanco", "Caja torta mediano plus blanco", "Caja torta grande blanco", "Cajas para pastelería", "Cajas para postres"],
    color: "#c7663f"
  },
  {
    id: "comida",
    nav: "Cajas comida",
    label: "Cajas comida",
    category: "Cajas",
    description: "Soluciones para hamburguesas, papas, hotdogs, loncheras, snacks, delivery y restaurantes.",
    image: asset("catalogo-loncheras.png"),
    subcategories: ["Caja hamburguesa", "Caja papa box", "Cono papas fritas", "Loncheras", "Lunch box", "Smile box", "Bandejas", "Barquitos", "Hotdogs", "Bandejas snacks"],
    color: "#d8ad54"
  },
  {
    id: "pizza",
    nav: "Cajas pizza",
    label: "Cajas pizza",
    category: "Cajas de pizza",
    description: "Cajas para pizzerías, restaurantes y delivery, listas para cotizar con o sin impresión personalizada.",
    image: "assets/producto-cajas.png",
    subcategories: ["Caja pizza pequeña", "Caja pizza mediana", "Caja pizza familiar", "Caja pizza personalizada", "Caja pizza kraft o blanca"],
    color: "#9c3d2f"
  },
  {
    id: "papeles",
    nav: "Envoltura",
    label: "Envoltura",
    category: "Papeles",
    description: "Papel antigrasa, papel seda y papel para envolver alimentos, regalos, ropa, snacks y postres.",
    image: asset("catalogo-hotdogs-bandejas.png"),
    subcategories: ["Papel antigrasa", "Papel seda", "Papel para envolver", "Papel para alimentos", "Papel para hamburguesas", "Papel para snacks", "Papel para postres"],
    color: "#126bb6"
  },
  {
    id: "servilletas",
    nav: "Servilletas",
    label: "Servilletas",
    category: "Servilletas",
    description: "Servilletas personalizadas para cafeterías, restaurantes, eventos y marcas con atención al detalle.",
    image: "assets/producto-servilletas.png",
    subcategories: ["Servilletas personalizadas", "Servilletas para cafetería", "Servilletas para restaurante", "Servilletas para eventos", "Servilletas con logo"],
    color: "#6f932f"
  }
];

const categories = ["Todos", ...families.map((family) => family.label)];
const defaultFaqs = [
  ["¿Puedo imprimir mi logo?", "Sí. Revisamos tu archivo y recomendamos impresión directa, etiqueta o sello según producto y presupuesto."],
  ["¿Los precios son definitivos?", "Son referenciales. El precio final depende de cantidad, material, medidas, tintas, acabados y urgencia."],
  ["¿Aceptan pedidos para empresas?", "Sí. Tenemos planes para compras frecuentes, producción recurrente y atención prioritaria."],
  ["¿Cómo envío mi diseño?", "Puedes enviarlo por WhatsApp en PNG, JPG, PDF, AI o SVG. Si no lo tienes listo, te asesoramos."],
  ["¿Desde qué cantidad imprimen cajas o envolturas?", "Para productos personalizados que no son fundas de papel, la impresión suele cotizarse desde 1000 unidades."],
  ["¿Puedo pedir entrega fuera de Quito?", "Sí. Coordinamos envíos a todo el país con costo adicional y confirmación previa por WhatsApp."]
].map(([pregunta, respuesta], index) => ({ id: `faq-${index + 1}`, pregunta, respuesta }));
const defaultReviews = [
  { id: "review-1", name: "Panadería local", rating: 5, comment: "Fundas y papeles personalizados con excelente presentación para nuestros productos." },
  { id: "review-2", name: "Cafetería", rating: 5, comment: "Nos ayudaron a elegir medidas, material y cantidad sin complicarnos el pedido." },
  { id: "review-3", name: "Tienda de regalos", rating: 5, comment: "Las fundas kraft hicieron que nuestra marca se vea más profesional desde la entrega." }
];
const defaultPlans = [
  { id: "plan-emprendedor", nombre: "Plan Emprendedor", descripcion: "Ideal para negocios pequeños.", features: ["Asesoría básica", "Cotización rápida", "Pedidos pequeños o medianos"] },
  { id: "plan-negocio", nombre: "Plan Negocio", descripcion: "Para cafeterías, panaderías y restaurantes.", features: ["Beneficios por volumen", "Acceso a promociones", "Atención prioritaria"], destacado: true },
  { id: "plan-empresa", nombre: "Plan Empresa", descripcion: "Para empresas con pedidos frecuentes.", features: ["Precios especiales", "Producción recurrente", "Contrato mensual opcional"] }
];

const catalogFamilies = [
  {
    id: "fundas-shopping",
    nav: "Fundas shopping",
    label: "Fundas shopping",
    description: "Fundas con asa para tiendas, regalos, boutiques, zapaterías y marcas que cuidan su entrega.",
    image: asset("catalogo-fundas-shopping-cover.jpg"),
    color: "#2f7a35",
    defaultFamily: "fundas"
  },
  {
    id: "fundas-delivery",
    nav: "Fundas delivery",
    label: "Fundas delivery",
    description: "Fundas para alimentos, cafeterías, restaurantes y pedidos diarios con buena presencia.",
    image: asset("catalogo-fundas-delivery-cover.jpg"),
    color: "#b9854d",
    defaultFamily: "panaderia"
  },
  {
    id: "fundas-despacho",
    nav: "Fundas despacho",
    label: "Fundas despacho y panadería",
    description: "Opciones de fundas para despacho, panadería, cafetería y entregas rápidas.",
    image: asset("catalogo-fundas-delivery-cover.jpg"),
    color: "#6f932f",
    defaultFamily: "panaderia"
  },
  {
    id: "cajas",
    nav: "Cajas",
    label: "Cajas",
    description: "Cajas blancas, cajas para comida, tortas, postres y pizza. Con precios visibles o cotización por volumen.",
    image: asset("catalogo-cajas-blancas-1.png"),
    color: "#c7663f",
    defaultFamily: "tortas-postres"
  },
  {
    id: "envoltura",
    nav: "Envoltura",
    label: "Envoltura",
    description: "Papel antigrasa, papel seda, etiquetas, servilletas, cubiertos y accesorios personalizados.",
    image: asset("catalogo-portada.jpg"),
    color: "#126bb6",
    defaultFamily: "papeles"
  }
];
const visibleFamilyIds = catalogFamilies.map((family) => family.id);
const familyGroups = {
  fundas: ["fundas"],
  panaderia: ["panaderia"],
  "cajas-blancas": ["cajas-blancas"],
  "tortas-postres": ["tortas-postres", "comida", "pizza"],
  papeles: ["papeles", "servilletas"]
};

function makeProduct(data) {
  const legacyFamily = data.familia || familyFromLegacyCategory(data.category);
  const image = normalizeMediaUrl(data.imagen || data.image || familyById(legacyFamily)?.image || "assets/hero-productos-ecof.png");
  const thumbnail = normalizeMediaUrl(data.imagenMiniatura || data.thumbnail || data.imagen || data.image || familyById(legacyFamily)?.image || "assets/hero-productos-ecof.png");
  const mainImage = normalizeMediaUrl(data.imagenPrincipal || data.mainImage || data.imagen || data.image || familyById(legacyFamily)?.image || "assets/hero-productos-ecof.png");
  return {
    id: data.id,
    codigo: data.codigo || "",
    nombre: data.nombre || data.name || "Producto ECOF",
    familia: legacyFamily,
    categoria: data.categoria || data.category || familyById(legacyFamily)?.category || "",
    subcategoria: data.subcategoria || data.category || "",
    descripcion: data.descripcion || data.description || "Producto ECOF para negocios que buscan mejor presentación y empaque personalizado.",
    material: data.material || "Papel o cartulina personalizable",
    medidas: data.medidas || data.sizes || "Medidas referenciales",
    paquete: data.paquete || "A cotizar",
    precioPaquete: data.precioPaquete || "A cotizar",
    precioUnidad: data.precioUnidad || data.price || (Number(data.precio) ? `$${Number(data.precio).toFixed(2).replace(".", ",")}` : "A cotizar"),
    precio: Number(data.precio ?? 0) || 0,
    activo: data.activo !== false,
    orden: Number(data.orden ?? 0) || 0,
    uso: Array.isArray(data.uso) ? data.uso : (data.use ? [data.use] : ["Negocios", "Empresas"]),
    personalizable: data.personalizable !== false,
    destacado: Boolean(data.destacado || data.featured),
    etiquetas: data.etiquetas || ["Personalizable", "Pedido por volumen"],
    imagen: image,
    imagenMiniatura: thumbnail,
    imagenPrincipal: mainImage,
    galeria: (Array.isArray(data.galeria) ? data.galeria : [data.imagenPrincipal || data.imagen || data.image || familyById(legacyFamily)?.image || "assets/hero-productos-ecof.png"]).filter(Boolean).map(normalizeMediaUrl).slice(0, 3),
    videoYoutube: data.videoYoutube || "",
    preciosCantidad: data.preciosCantidad || null
  };
}

function familyFromLegacyCategory(category = "") {
  const value = String(category).toLowerCase();
  if (value.includes("pan")) return "panaderia";
  if (value.includes("pizza")) return "pizza";
  if (value.includes("servilleta")) return "papeles";
  if (value.includes("seda") || value.includes("antigrasa")) return "papeles";
  if (value.includes("caja")) return "cajas-blancas";
  return "fundas";
}

const shoppingPrices1 = {
  "Joyeria": ["15 x 14 x 8 cm", "desde $0,21 c/u"],
  "Pequeña": ["19 x 14 x 8 cm", "desde $0,23 c/u"],
  "Mediana": ["22,5 x 22 x 10 cm", "desde $0,30 c/u"],
  "Vertical": ["25 x 20 x 10 cm", "desde $0,32 c/u"],
  "Moda": ["25 x 32 x 10 cm", "desde $0,35 c/u"],
  "Grande": ["30 x 32 x 10 cm", "desde $0,41 c/u"]
};

const shoppingPrices2 = {
  "Botella": ["37 x 11 x 10 cm", "desde $0,32 c/u"],
  "Global": ["30 x 24 x 10 cm", "desde $0,41 c/u"],
  "Botella ancha": ["37 x 21,5 x 10 cm", "desde $0,35 c/u"],
  "Gigante": ["30 x 40 x 20 cm", "desde $0,55 c/u"],
  "Zapatera": ["26 x 34 x 14 cm", "desde $0,52 c/u"],
  "Extra grande": ["32 x 29,5 x 14,5 cm", "desde $0,41 c/u"]
};

const defaultProducts = [
  ...Object.entries(shoppingPrices1).map(([name, [size, unit]], index) => makeProduct({
    id: `funda-shopping-${slug(name)}`,
    nombre: `Funda shopping ${name.toLowerCase()}`,
    familia: "fundas",
    subcategoria: "Fundas shopping",
    descripcion: "Funda de papel kraft con asa, ideal para tiendas, regalos, boutiques y marcas que entregan con imagen profesional.",
    material: "Papel kraft con asa de cordón",
    medidas: size,
    paquete: "100, 300, 500 o 1000 unidades",
    precioUnidad: unit,
    uso: ["Tiendas", "Boutiques", "Regalos", "Empresas"],
    destacado: index === 2 || index === 5,
    etiquetas: ["Personalizable", "Kraft", "Pedido por volumen", index === 2 ? "Mas vendido" : "Para tiendas"],
    imagen: asset("catalogo-fundas-shopping-1.jpg")
  })),
  ...Object.entries(shoppingPrices2).map(([name, [size, unit]], index) => makeProduct({
    id: `funda-shopping-${slug(name)}`,
    nombre: `Funda shopping ${name.toLowerCase()}`,
    familia: "fundas",
    subcategoria: name.includes("Botella") ? "Fundas para empresas" : "Fundas shopping",
    descripcion: "Funda kraft de alto impacto visual para productos especiales, boutiques, moda, empresas y entregas premium.",
    material: "Papel kraft con asa de cordón",
    medidas: size,
    paquete: "100, 300, 500 o 1000 unidades",
    precioUnidad: unit,
    uso: ["Tiendas", "Regalos", "Empresas", "Boutiques"],
    destacado: index === 3,
    etiquetas: ["Personalizable", "Kraft", "Para empresas"],
    imagen: asset("catalogo-fundas-shopping-2.jpg")
  })),
  ...[
    ["Delivery canguilera", "21 x 13 x 8,5 cm", "desde $0,16 c/u"],
    ["Delivery estándar", "35 x 20 x 11 cm", "desde $0,21 c/u"],
    ["Delivery chef", "34 x 20 x 15 cm", "desde $0,23 c/u"],
    ["Delivery grande", "36 x 20 x 16 cm", "desde $0,25 c/u"],
    ["Delivery extra grande", "42 x 26 x 22 cm", "desde $0,49 c/u"]
  ].map(([name, size, unit], index) => makeProduct({
    id: `funda-${slug(name)}`,
    nombre: `Funda ${name.toLowerCase()}`,
    familia: "fundas",
    subcategoria: "Fundas delivery",
    descripcion: "Funda delivery resistente para alimentos, pedidos diarios y marcas que necesitan despacho con buena presencia.",
    material: "Papel kraft para alimentos",
    medidas: size,
    paquete: "300, 500 o 1000 unidades",
    precioUnidad: unit,
    uso: ["Delivery", "Restaurantes", "Cafeterías", "Comida preparada"],
    destacado: index === 1,
    etiquetas: ["Para alimentos", "Kraft", "Delivery", "Personalizable"],
    imagen: asset("catalogo-fundas-delivery-precios.jpg")
  })),
  makeProduct({
    id: "fundas-panaderia-pan",
    nombre: "Fundas para pan",
    familia: "panaderia",
    subcategoria: "Fundas para pan",
    descripcion: "Fundas para panaderías y alimentos secos, prácticas para mantener orden, higiene e identidad de marca.",
    material: "Papel kraft o blanco para alimentos",
    medidas: "Formatos para pan y bolleria",
    paquete: "A cotizar",
    uso: ["Panaderías", "Alimentos secos", "Cafeterías"],
    destacado: false,
    etiquetas: ["Para alimentos", "Panadería", "Personalizable"],
    imagen: asset("catalogo-fundas-delivery-cover.jpg")
  }),
  makeProduct({
    id: "fundas-panaderia-bolleria",
    nombre: "Fundas para bollería y cafetería",
    familia: "panaderia",
    subcategoria: "Fundas para cafeterias",
    descripcion: "Empaque para panes dulces, bollería, snacks secos y productos de mostrador.",
    material: "Papel kraft o blanco",
    medidas: "Pequena, mediana y formatos especiales",
    paquete: "A cotizar",
    uso: ["Cafeterías", "Pastelería", "Bollería"],
    destacado: true,
    etiquetas: ["Para alimentos", "Cafetería", "Con logo"],
    imagen: asset("catalogo-fundas-delivery-cover.jpg")
  }),
  ...[
    ["Caja blanco A", "558", "20,5 x 20 x 5,7 cm", "$10,26", "$0,41", "Cajas blancas medianas"],
    ["Caja blanco plus", "506", "22,5 x 22 x 5,7 cm", "$10,32", "$0,41", "Cajas blancas grandes"],
    ["Blanco grande", "413", "15,7 x 14 x 6,7 cm", "$6,76", "$0,27", "Cajas blancas grandes"],
    ["Blanco mediano", "414", "16 x 9 x 6 cm", "$6,23", "$0,25", "Cajas blancas medianas"],
    ["Blanco pequeño", "416", "13,2 x 11,7 x 5,7 cm", "$5,81", "$0,23", "Cajas blancas pequeñas"]
  ].map(([name, code, size, packPrice, unitPrice, sub], index) => makeProduct({
    id: `caja-blanca-${slug(name)}`,
    codigo: code,
    nombre: name,
    familia: "cajas-blancas",
    subcategoria: sub,
    descripcion: "Caja blanca autoarmable para productos, comida, detalles y entregas con presentación limpia.",
    material: "Cartulina blanca alimentaria",
    medidas: size,
    paquete: "25 unidades",
    precioPaquete: packPrice,
    precioUnidad: unitPrice,
    uso: ["Productos", "Delivery", "Comida rápida", "Regalos"],
    destacado: index === 0,
    etiquetas: ["Blanca", "Autoarmable", "Resistente"],
    imagen: asset("catalogo-cajas-blancas-2.png")
  })),
  ...[
    ["Caja torta pequeño blanco", "328", "16,5 x 16,5 x 9 cm", "$7,33", "$0,29", "Caja torta pequeño blanco"],
    ["Caja torta pequeño plus blanco", "657", "16,5 x 16,5 x 12,5 cm", "$7,76", "$0,31", "Caja torta pequeño plus blanco"],
    ["Caja torta mediano blanco", "325", "26 x 26 x 11,7 cm", "$9,92", "$0,40", "Caja torta mediano blanco"],
    ["Caja torta mediano plus blanco", "661", "26 x 26 x 15 cm", "$11,21", "$0,45", "Caja torta mediano plus blanco"],
    ["Caja torta grande blanco", "326", "31 x 31 x 12,5 cm", "$11,21", "$0,45", "Caja torta grande blanco"]
  ].map(([name, code, size, packPrice, unitPrice, sub], index) => makeProduct({
    id: `caja-torta-${slug(name)}`,
    codigo: code,
    nombre: name,
    familia: "tortas-postres",
    subcategoria: sub,
    descripcion: "Caja blanca para tortas y postres, práctica, resistente y pensada para pastelerías.",
    material: "Cartulina blanca alimentaria",
    medidas: size,
    paquete: "25 unidades",
    precioPaquete: packPrice,
    precioUnidad: unitPrice,
    uso: ["Pastelerías", "Cafeterías", "Repostería", "Postres"],
    destacado: index === 2,
    etiquetas: ["Para alimentos", "Blanca", "Resistente"],
    imagen: asset("catalogo-cajas-tortas.png")
  })),
  ...[
    ["Papa box mediano blanco", "46", "9 x 3 x 11 cm", "50 unidades", "$3,36", "$0,07", "Caja papa box"],
    ["Papa box pequeño blanco", "89", "8 x 2,7 x 9,5 cm", "50 unidades", "$3,21", "$0,06", "Caja papa box"],
    ["Hamburguesa jumbo blanca", "388", "13,5 x 13,5 x 9,5 cm", "25 unidades", "$6,26", "$0,25", "Caja hamburguesa"],
    ["Hamburguesa mediana blanca", "387", "11,5 x 11,5 x 6 cm", "25 unidades", "$4,40", "$0,18", "Caja hamburguesa"],
    ["Cono papas fritas grande blanco", "478", "17 x 22 cm", "50 unidades", "$3,90", "$0,08", "Cono papas fritas"],
    ["Cono papas fritas mediano blanco", "350", "13 x 17 cm", "50 unidades", "$3,17", "$0,06", "Cono papas fritas"]
  ].map(([name, code, size, pack, packPrice, unitPrice, sub], index) => makeProduct({
    id: `comida-${slug(name)}`,
    codigo: code,
    nombre: name,
    familia: "comida",
    subcategoria: sub,
    descripcion: "Empaque blanco para comida rápida, resistente, higiénico y fácil de usar.",
    material: "Cartulina blanca alimentaria",
    medidas: size,
    paquete: pack,
    precioPaquete: packPrice,
    precioUnidad: unitPrice,
    uso: ["Restaurantes", "Delivery", "Comida rápida"],
    destacado: index === 2,
    etiquetas: ["Para alimentos", "Blanca", "Resistente"],
    imagen: asset("catalogo-cajas-blancas-1.png")
  })),
  ...[
    ["Hotdog mediano", "300", "18 x 6 x 4,7 cm", "100 unidades", "$5,61", "$0,06", "Hotdogs"],
    ["Hotdog pequeño", "479", "15,5 x 7 x 4,5 cm", "100 unidades", "$5,09", "$0,05", "Hotdogs"],
    ["Hotdog jumbo", "502", "24 x 9,5 x 4,7 cm", "100 unidades", "$10,16", "$0,10", "Hotdogs"],
    ["Barquito pequeño", "597", "8 x 7 x 5 cm", "100 unidades", "$4,83", "$0,05", "Barquitos"],
    ["Barquito mediano", "301", "12 x 7,5 x 5 cm", "100 unidades", "$5,61", "$0,06", "Barquitos"],
    ["Barquito grande", "447", "13 x 13 x 5 cm", "100 unidades", "$10,52", "$0,11", "Barquitos"],
    ["Barquito jumbo", "512", "23,5 x 9,5 x 5,5 cm", "100 unidades", "$13,32", "$0,13", "Barquitos"],
    ["Bandeja snacks blanca", "115", "23,5 x 14 x 4,5 cm", "50 unidades", "$5,95", "$0,12", "Bandejas snacks"]
  ].map(([name, code, size, pack, packPrice, unitPrice, sub], index) => makeProduct({
    id: `comida-${slug(name)}`,
    codigo: code,
    nombre: name,
    familia: "comida",
    subcategoria: sub,
    descripcion: "Empaque para snacks, hotdogs, barquitos y alimentos listos para servir.",
    material: "Cartulina blanca alimentaria",
    medidas: size,
    paquete: pack,
    precioPaquete: packPrice,
    precioUnidad: unitPrice,
    uso: ["Snacks", "Restaurantes", "Eventos", "Delivery"],
    destacado: index === 7,
    etiquetas: ["Para alimentos", "Práctico", "Pedido por volumen"],
    imagen: asset("catalogo-hotdogs-bandejas.png")
  })),
  ...[
    ["Lonchera delivery mediano blanco", "372", "21,4 x 12 x 13 cm", "$10,52", "$0,42", "Loncheras"],
    ["Lunch box blanca", "349", "15,5 x 15,5 x 12 cm", "$10,52", "$0,42", "Lunch box"],
    ["Smile blanco", "319", "11,8 x 11,8 x 12 cm", "$7,68", "$0,31", "Smile box"],
    ["Lonchera box colores mediana", "599", "20,5 x 10 x 9,7 cm", "$6,88", "$0,28", "Loncheras"],
    ["Lonchera box colores pequeña", "534", "11,7 x 9 x 9 cm", "$6,12", "$0,24", "Loncheras"]
  ].map(([name, code, size, packPrice, unitPrice, sub], index) => makeProduct({
    id: `lonchera-${slug(name)}`,
    codigo: code,
    nombre: name,
    familia: "comida",
    subcategoria: sub,
    descripcion: "Lonchera de papel para delivery, eventos y comidas especiales, práctica para transportar.",
    material: index > 2 ? "Cartulina de color" : "Cartulina blanca alimentaria",
    medidas: size,
    paquete: "25 unidades",
    precioPaquete: packPrice,
    precioUnidad: unitPrice,
    uso: ["Delivery", "Eventos", "Restaurantes", "Cafeterías"],
    destacado: index === 0,
    etiquetas: ["Para alimentos", "Lonchera", index > 2 ? "Colores disponibles" : "Blanca"],
    imagen: asset("catalogo-loncheras.png")
  })),
  ...[
    ["Caja pizza pequeña", "Pizza pequeña", "A cotizar", "Caja pizza pequeña"],
    ["Caja pizza mediana", "Pizza mediana", "A cotizar", "Caja pizza mediana"],
    ["Caja pizza familiar", "Pizza familiar", "A cotizar", "Caja pizza familiar"],
    ["Caja pizza personalizada", "Formato personalizado", "A cotizar", "Caja pizza personalizada"]
  ].map(([name, size, unit, sub], index) => makeProduct({
    id: `pizza-${slug(name)}`,
    nombre: name,
    familia: "pizza",
    subcategoria: sub,
    descripcion: "Caja para pizza en formato blanco o kraft, lista para pizzerías y delivery con opción de logo.",
    material: "Carton alimentario blanco o kraft",
    medidas: size,
    paquete: "Por volumen",
    precioUnidad: unit,
    uso: ["Pizzerias", "Restaurantes", "Delivery"],
    destacado: index === 2,
    etiquetas: ["Para alimentos", "Personalizable", "Delivery"],
    imagen: "assets/producto-cajas.png"
  })),
  makeProduct({
    id: "papel-antigrasa-personalizado",
    nombre: "Papel antigrasa personalizado",
    familia: "papeles",
    subcategoria: "Papel antigrasa",
    descripcion: "Papel para hamburguesas, papas, snacks, postres y comida rápida con impresión de marca.",
    material: "Papel antigrasa alimentario",
    medidas: "Formatos para wraps, bandejas y snacks",
    paquete: "A cotizar",
    precioUnidad: "Cotizacion por volumen",
    uso: ["Hamburguesas", "Snacks", "Restaurantes", "Cafeterias"],
    destacado: true,
    etiquetas: ["Para alimentos", "Personalizable", "Antigrasa"],
    imagen: asset("catalogo-hotdogs-bandejas.png")
  }),
  makeProduct({
    id: "papel-seda-personalizado",
    nombre: "Papel seda personalizado",
    familia: "papeles",
    subcategoria: "Papel seda",
    descripcion: "Papel elegante para envolver regalos, ropa, detalles, boutiques y productos premium.",
    material: "Papel seda impreso",
    medidas: "Pliegos personalizados",
    paquete: "A cotizar",
    precioUnidad: "Cotizacion por impresion",
    uso: ["Tiendas", "Regalos", "Boutiques", "Ropa"],
    destacado: false,
    etiquetas: ["Elegante", "Personalizable", "Para regalos"],
    imagen: asset("catalogo-fundas-shopping-cover.jpg")
  }),
  makeProduct({
    id: "servilleta-personalizada",
    nombre: "Servilleta personalizada",
    familia: "papeles",
    categoria: "Envoltura",
    subcategoria: "Servilletas personalizadas",
    descripcion: "Servilletas con logo para cafeterías, restaurantes, eventos y puntos de atención.",
    material: "Papel servilleta blanco o kraft",
    medidas: "Cocktail, estandar y premium",
    paquete: "A cotizar",
    precioUnidad: "Cotizacion por volumen",
    uso: ["Cafeterías", "Restaurantes", "Eventos"],
    destacado: false,
    etiquetas: ["Con logo", "Eventos", "Restaurantes"],
    imagen: "assets/producto-servilletas.png"
  }),
  makeProduct({
    id: "etiquetas-adhesivas-personalizadas",
    nombre: "Etiquetas adhesivas personalizadas",
    familia: "papeles",
    categoria: "Envoltura",
    subcategoria: "Etiquetas adhesivas",
    descripcion: "Etiquetas adhesivas para empaques, cajas, fundas, frascos y productos comerciales.",
    material: "Adhesivo mate o brillante",
    medidas: "Medidas personalizadas",
    paquete: "Desde 1000 unidades",
    precioUnidad: "A cotizar",
    uso: ["Tiendas", "Alimentos", "Regalos", "Marcas"],
    destacado: false,
    etiquetas: ["Adhesiva", "Personalizable", "Marca"],
    imagen: asset("catalogo-portada.jpg")
  }),
  makeProduct({
    id: "etiquetas-ropa-personalizadas",
    nombre: "Etiquetas para ropa",
    familia: "papeles",
    categoria: "Envoltura",
    subcategoria: "Etiquetas para ropa",
    descripcion: "Etiquetas colgantes para ropa, accesorios, boutiques y productos de marca.",
    material: "Cartulina impresa o kraft",
    medidas: "Medidas personalizadas",
    paquete: "Desde 1000 unidades",
    precioUnidad: "A cotizar",
    uso: ["Ropa", "Boutiques", "Accesorios"],
    destacado: false,
    etiquetas: ["Ropa", "Boutique", "Personalizable"],
    imagen: asset("catalogo-fundas-shopping-cover.jpg")
  }),
  makeProduct({
    id: "cubiertos-ecologicos-delivery",
    nombre: "Cubiertos ecológicos para delivery",
    familia: "papeles",
    categoria: "Cubiertos o accesorios",
    subcategoria: "Cubiertos o accesorios",
    descripcion: "Cubiertos y complementos para pedidos de comida, ideales para restaurantes, cafeterías y delivery.",
    material: "Material compostable o madera según disponibilidad",
    medidas: "Formato individual o kit",
    paquete: "Desde 100 unidades",
    precioUnidad: "A cotizar",
    uso: ["Restaurantes", "Delivery", "Cafeterías"],
    destacado: false,
    etiquetas: ["Accesorios", "Delivery", "Ecológico"],
    imagen: asset("catalogo-hotdogs-bandejas.png")
  }),
  makeProduct({
    id: "kit-accesorios-para-alimentos",
    nombre: "Kit de accesorios para alimentos",
    familia: "papeles",
    categoria: "Cubiertos o accesorios",
    subcategoria: "Cubiertos o accesorios",
    descripcion: "Complementos para mejorar la entrega de alimentos: cubiertos, servilletas y accesorios según necesidad del negocio.",
    material: "Material ecológico o papel según producto",
    medidas: "Personalizable por pedido",
    paquete: "A cotizar",
    precioUnidad: "A cotizar",
    uso: ["Comida rápida", "Eventos", "Pedidos por volumen"],
    destacado: false,
    etiquetas: ["Accesorios", "Personalizable", "Volumen"],
    imagen: "assets/producto-servilletas.png"
  })
];

let products = loadProducts();
let activeFamily = "fundas-shopping";
let filters = {
  search: "",
  subcategory: "all",
  material: "all",
  usage: "all",
  package: "all",
  price: "all",
  custom: "all"
};
let featuredIndex = 0;
let compare = [];
let requestItems = loadRequest();
let promos = loadPromos();
let faqs = loadFaqs();
let reviews = loadReviews();
let businessPlans = loadPlans();
let reviewIndex = 0;
let selectedPaymentMethod = "Transferencia";
let editorSelectedId = products[0]?.id || "";
let editorSelectedPromoId = promos[0]?.id || "";
let editorMode = false;
let currentModalProductId = "";
let currentModalImageIndex = 0;
let modalGalleryTimer = null;
let pendingCartProductId = "";
let pendingOrderMessage = "";
let draggedProductId = "";

const familyTabs = document.getElementById("familyTabs");
const catalogSections = document.getElementById("catalogSections");
const featuredCarousel = document.getElementById("featuredCarousel");
const productSearch = document.getElementById("productSearch");
const comparePanel = document.getElementById("comparePanel");
const modal = document.getElementById("productModal");
const modalContent = document.getElementById("modalContent");
const confirmCartModal = document.getElementById("confirmCartModal");
const confirmCartText = document.getElementById("confirmCartText");
const orderConfirmModal = document.getElementById("orderConfirmModal");
const orderConfirmPreview = document.getElementById("orderConfirmPreview");
const quoteDrawer = document.getElementById("quoteDrawer");
const quoteItems = document.getElementById("quoteItems");
const quoteCount = document.getElementById("quoteCount");
const quoteNotes = document.getElementById("quoteNotes");
const requestSummary = document.getElementById("requestSummary");
const chatPanel = document.getElementById("chatPanel");
const chatMessages = document.getElementById("chatMessages");
const chatOptions = document.getElementById("chatOptions");
const editorModal = document.getElementById("editorModal");
const editorForm = document.getElementById("editorForm");
const editorProductList = document.getElementById("editorProductList");
const reviewCarousel = document.getElementById("reviewCarousel");
const plansGrid = document.querySelector(".plans-grid");

function familyById(id) {
  return families.find((family) => family.id === id);
}

function catalogFamilyById(id) {
  return catalogFamilies.find((family) => family.id === id);
}

function defaultProductFamilyForCatalog(id) {
  return catalogFamilyById(id)?.defaultFamily || id;
}

function defaultSubcategoryForCatalog(id, familyId = "") {
  const catalog = catalogFamilyById(id);
  if (id === "fundas-delivery") return "Fundas delivery";
  if (id === "fundas-despacho") return "Fundas para pan";
  if (id === "fundas-shopping") return "Fundas shopping";
  if (id === "cajas") return "Cajas para productos";
  if (id === "envoltura") return "Papel antigrasa";
  return catalog?.label || familyById(familyId)?.subcategories?.[0] || "";
}

function inferCatalogFamilyFromBase(familyId = "", subcategory = "", name = "") {
  const text = normalizeSearch(`${subcategory} ${name}`);
  if (familyId === "fundas") return "fundas-shopping";
  if (familyId === "panaderia") return text.includes("delivery") || text.includes("canguilera") || text.includes("chef") || text.includes("estandar") ? "fundas-delivery" : "fundas-despacho";
  if (["cajas-blancas", "tortas-postres", "comida", "pizza"].includes(familyId)) return "cajas";
  if (["papeles", "servilletas"].includes(familyId)) return "envoltura";
  return "fundas-shopping";
}

function normalizeMediaUrl(url = "") {
  const value = String(url || "").trim();
  if (!value) return "";
  const driveMatch = value.match(/drive\.google\.com\/file\/d\/([^/]+)/) || value.match(/[?&]id=([^&]+)/);
  if (driveMatch) return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1200`;
  return value;
}

function slug(value) {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function whatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function productMessage(product) {
  return [
    `Hola ECOF, quiero cotizar el producto: ${product.nombre}.`,
    product.codigo ? `Código: ${product.codigo}` : "",
    `Medidas: ${product.medidas}`,
    "Deseo mas informacion para personalizarlo con mi logo."
  ].filter(Boolean).join("\n");
}

function loadProducts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultProducts;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? ensureStarterProducts(parsed.map((product) => makeProduct(product))) : defaultProducts;
  } catch {
    return defaultProducts;
  }
}

function ensureStarterProducts(list) {
  const currentIds = new Set(list.map((product) => product.id));
  const missing = defaultProducts.filter((product) => !currentIds.has(product.id));
  return missing.length ? [...list, ...missing] : list;
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function productFirestorePayload(product) {
  return {
    nombre: product.nombre || "Producto ECOF",
    descripcion: product.descripcion || "",
    precio: Number(product.precio ?? 0) || 0,
    categoria: product.categoria || "",
    familia: product.familia || "fundas",
    subcategoria: product.subcategoria || "",
    imagen: product.imagen || "",
    imagenMiniatura: product.imagenMiniatura || product.imagen || "",
    imagenPrincipal: product.imagenPrincipal || product.imagen || "",
    medidas: product.medidas || "",
    material: product.material || "",
    paquete: product.paquete || "",
    precioPaquete: product.precioPaquete || "",
    precioUnidad: product.precioUnidad || "",
    codigo: product.codigo || "",
    activo: product.activo !== false,
    destacado: Boolean(product.destacado),
    orden: Number(product.orden ?? products.findIndex((item) => item.id === product.id) + 1) || 0,
    etiquetas: Array.isArray(product.etiquetas) ? product.etiquetas : [],
    uso: Array.isArray(product.uso) ? product.uso : [],
    galeria: Array.isArray(product.galeria) ? product.galeria.slice(0, 3) : [],
    videoYoutube: product.videoYoutube || "",
    preciosCantidad: product.preciosCantidad || null,
    personalizable: product.personalizable !== false,
    actualizado: serverTimestamp()
  };
}

async function saveProductToFirestore(product) {
  if (!product?.id) throw new Error("El producto no tiene ID.");
  await setDoc(doc(db, "productos", product.id), productFirestorePayload(product), { merge: true });
}

async function syncProductsToFirestore() {
  await Promise.all(products.map((product, index) => {
    product.orden = Number(product.orden ?? index + 1) || index + 1;
    return setDoc(doc(db, "productos", product.id), {
      ...productFirestorePayload(product),
      creado: serverTimestamp()
    }, { merge: true });
  }));
}

async function deleteProductFromFirestore(id) {
  if (!id) return;
  await deleteDoc(doc(db, "productos", id));
}

function mapFirestoreProduct(snapshot) {
  return makeProduct({
    id: snapshot.id,
    firestoreId: snapshot.id,
    ...snapshot.data()
  });
}

async function loadProductsFromFirestore() {
  try {
    let snapshots;
    try {
      snapshots = await getDocs(query(collection(db, "productos"), orderBy("orden")));
      if (snapshots.empty) snapshots = await getDocs(collection(db, "productos"));
    } catch {
      snapshots = await getDocs(collection(db, "productos"));
    }
    const firestoreProducts = snapshots.docs
      .map(mapFirestoreProduct)
      .filter((product) => product.activo !== false)
      .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));
    if (!firestoreProducts.length) return false;
    products = firestoreProducts;
    editorSelectedId = products[0]?.id || "";
    saveProducts();
    renderAll();
    return true;
  } catch (error) {
    console.warn("No se pudo cargar Firestore. Se usa catálogo local temporal.", error);
    return false;
  }
}

function loadRequest() {
  try {
    return JSON.parse(localStorage.getItem(REQUEST_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRequest() {
  localStorage.setItem(REQUEST_KEY, JSON.stringify(requestItems));
}

function loadPromos() {
  try {
    return JSON.parse(localStorage.getItem(PROMO_KEY)) || [];
  } catch {
    return [];
  }
}

function savePromos() {
  localStorage.setItem(PROMO_KEY, JSON.stringify(promos));
}

function loadFaqs() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAQ_KEY));
    return Array.isArray(saved) && saved.length ? saved : defaultFaqs;
  } catch {
    return defaultFaqs;
  }
}

function saveFaqs() {
  localStorage.setItem(FAQ_KEY, JSON.stringify(faqs));
}

function loadReviews() {
  try {
    const saved = JSON.parse(localStorage.getItem(REVIEWS_KEY));
    return Array.isArray(saved) && saved.length ? saved : defaultReviews;
  } catch {
    return defaultReviews;
  }
}

function saveReviews() {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
}

function loadPlans() {
  try {
    const saved = JSON.parse(localStorage.getItem(PLANS_KEY));
    return Array.isArray(saved) && saved.length ? saved : defaultPlans;
  } catch {
    return defaultPlans;
  }
}

function savePlans() {
  localStorage.setItem(PLANS_KEY, JSON.stringify(businessPlans));
}

function loadPageContent() {
  try {
    return JSON.parse(localStorage.getItem(PAGE_CONTENT_KEY)) || {};
  } catch {
    return {};
  }
}

function savePageContent(content) {
  localStorage.setItem(PAGE_CONTENT_KEY, JSON.stringify(content));
}

function loadSocialLinks() {
  try {
    return JSON.parse(localStorage.getItem(SOCIAL_LINKS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSocialLinks() {
  const links = {
    instagram: document.getElementById("adminInstagram")?.value.trim() || "",
    tiktok: document.getElementById("adminTiktok")?.value.trim() || "",
    facebook: document.getElementById("adminFacebook")?.value.trim() || ""
  };
  localStorage.setItem(SOCIAL_LINKS_KEY, JSON.stringify(links));
  applySocialLinks();
}

function applySocialLinks() {
  const links = loadSocialLinks();
  const map = { instagramLink: links.instagram, tiktokLink: links.tiktok, facebookLink: links.facebook, locationInstagramLink: links.instagram, locationTiktokLink: links.tiktok, locationFacebookLink: links.facebook };
  Object.entries(map).forEach(([id, href]) => {
    const link = document.getElementById(id);
    if (link && href) link.href = href;
  });
}

function productText(product) {
  return [
    product.nombre,
    product.codigo,
    product.categoria,
    product.subcategoria,
    product.descripcion,
    product.material,
    product.medidas,
    product.paquete,
    product.precioPaquete,
    product.precioUnidad,
    ...(product.uso || []),
    ...(product.etiquetas || [])
  ].join(" ").toLowerCase();
}

function normalizeSearch(value = "") {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function productInCatalogFamily(product, familyId) {
  const text = normalizeSearch(productText(product));
  const family = product.familia;
  if (familyId === "fundas-shopping") return family === "fundas" || text.includes("shopping") || text.includes("zapatera") || text.includes("botella") || text.includes("joyeria");
  if (familyId === "fundas-delivery") return family === "panaderia" && (text.includes("delivery") || text.includes("canguilera") || text.includes("chef") || text.includes("estandar") || text.includes("grande"));
  if (familyId === "fundas-despacho") return family === "panaderia" && !productInCatalogFamily(product, "fundas-delivery");
  if (familyId === "cajas") return ["cajas-blancas", "tortas-postres", "comida", "pizza"].includes(family) || text.includes("caja") || text.includes("box");
  if (familyId === "envoltura") return ["papeles", "servilletas"].includes(family) || text.includes("antigrasa") || text.includes("seda") || text.includes("servilleta") || text.includes("cubierto") || text.includes("etiqueta") || text.includes("envoltura");
  return family === familyId;
}

function catalogColorForProduct(product) {
  return catalogFamilies.find((family) => productInCatalogFamily(product, family.id))?.color || familyById(product.familia)?.color || "#2f7a35";
}

function primaryCatalogFamilyId(product) {
  return catalogFamilies.find((family) => productInCatalogFamily(product, family.id))?.id || activeFamily;
}

function productCatalogFamilyIndex(product) {
  const index = catalogFamilies.findIndex((family) => family.id === primaryCatalogFamilyId(product));
  return index < 0 ? 999 : index;
}

function orderedProductsForModal() {
  return [...products].sort((a, b) => {
    const fa = productCatalogFamilyIndex(a);
    const fb = productCatalogFamilyIndex(b);
    if (fa !== fb) return fa - fb;
    return products.findIndex((product) => product.id === a.id) - products.findIndex((product) => product.id === b.id);
  });
}

function editDistance(a, b) {
  if (!a || !b) return Math.max(a.length, b.length);
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

function smartSearchMatch(product, query) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return true;
  const synonyms = {
    cajs: "cajas",
    cajsas: "cajas",
    caja: "cajas",
    dundsa: "fundas",
    dundas: "fundas",
    funda: "fundas",
    antigrasa: "antigrasa",
    papel: "papel",
    cubiertos: "cubierto",
    accesorio: "accesorio",
    servileltas: "servilletas",
    servilleta: "servilletas",
    envolturas: "envoltura",
    envoltura: "envolturas",
    pizza: "pizza",
    zapatos: "zapatera",
    zapato: "zapatera",
    boutique: "shopping",
    tienda: "shopping",
    tiendas: "shopping"
  };
  const text = normalizeSearch(productText(product));
  const expanded = synonyms[normalizedQuery] || normalizedQuery;
  if (text.includes(expanded)) return true;
  const stopWords = new Set(["quiero", "una", "uno", "para", "por", "con", "sin", "que", "de", "del", "la", "el", "los", "las", "un", "en", "mi", "mis"]);
  const queryTokens = normalizedQuery.split(/[^a-z0-9]+/).map((token) => synonyms[token] || token).filter((token) => token.length > 2 && !stopWords.has(token));
  if (queryTokens.length) {
    const matches = queryTokens.filter((token) => text.includes(token) || text.split(/[^a-z0-9]+/).some((word) => word.length > 2 && (word.includes(token) || editDistance(word.slice(0, token.length), token) <= 1 || editDistance(word, token) <= 2)));
    if (matches.length >= Math.min(2, queryTokens.length)) return true;
  }
  const words = text.split(/[^a-z0-9]+/).filter((word) => word.length > 2);
  return words.some((word) => editDistance(word.slice(0, expanded.length), expanded) <= 1 || editDistance(word, expanded) <= 2);
}

function groupForFamily(familyId) {
  return familyGroups[familyId] || [familyId];
}

function productMatchesActiveFamily(product) {
  if (filters.search.trim()) return true;
  return productInCatalogFamily(product, activeFamily);
}

function applyFilters(list = products) {
    const search = filters.search.trim();
  return list.filter((product) => {
    const familyMatch = activeFamily === "all" || productMatchesActiveFamily(product);
    const searchMatch = smartSearchMatch(product, search);
    const subMatch = filters.subcategory === "all" || product.subcategoria === filters.subcategory;
    const materialMatch = filters.material === "all" || product.material.toLowerCase().includes(filters.material.toLowerCase());
    const usageMatch = true;
    const packageMatch = true;
    const hasPrice = `${product.precioPaquete} ${product.precioUnidad}`.toLowerCase().includes("$");
    const priceMatch = filters.price === "all" || (filters.price === "priced" ? hasPrice : !hasPrice);
    const customMatch = true;
    return familyMatch && searchMatch && subMatch && materialMatch && usageMatch && packageMatch && priceMatch && customMatch;
  });
}

function familyPageUrl(familyId) {
  const url = new URL("catalogo.html", window.location.href);
  url.hash = "catalogo";
  url.searchParams.set("familia", familyId);
  return url.toString();
}

function renderFamilyTabs() {
  if (!familyTabs) return;
  const visibleFamilies = catalogFamilies;
  const counts = visibleFamilies.reduce((acc, family) => {
    acc[family.id] = products.filter((product) => productInCatalogFamily(product, family.id)).length;
    return acc;
  }, {});
  if (activeFamily === "all" || !visibleFamilyIds.includes(activeFamily)) activeFamily = visibleFamilies[0].id;
  familyTabs.innerHTML = visibleFamilies.map((family) => `
      <button class="family-tab ${activeFamily === family.id ? "is-active" : ""}" type="button" data-family="${family.id}" data-family-url="${familyPageUrl(family.id)}" style="--family-color:${family.color}">
        <img src="${family.image}" alt="${escapeHtml(family.label)}">
        <strong>${family.nav}</strong>
        <span>${counts[family.id] || 0} productos</span>
      </button>
    `).join("");
}

function uniqueValues(getter) {
  return [...new Set(products.flatMap((product) => getter(product)).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "es"));
}

function renderFilterOptions() {
  fillSelect("subcategoryFilter", "Todas", uniqueValues((product) => product.subcategoria));
  fillSelect("materialFilter", "Todos", ["kraft", "blanco", "cartulina", "papel seda", "antigrasa"]);
}

function fillSelect(id, firstLabel, values) {
  const select = document.getElementById(id);
  if (!select) return;
  const current = select.value || "all";
  select.innerHTML = `<option value="all">${firstLabel}</option>` + values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
  select.value = [...select.options].some((option) => option.value === current) ? current : "all";
}

function renderCatalog() {
  if (!catalogSections) {
    renderFamilyTabs();
    return;
  }
  const filtered = applyFilters();
  const activeFamilies = catalogFamilies.filter((family) => filters.search.trim() ? true : family.id === activeFamily);
  const html = activeFamilies.map((family) => {
    const items = filtered.filter((product) => product.activo !== false && productInCatalogFamily(product, family.id));
    if (!items.length) return "";
    const groupedItems = family.id === "cajas"
      ? [
          ["Cajas de comida", items.filter((product) => product.familia === "comida")],
          ["Cajas pizza", items.filter((product) => product.familia === "pizza")],
          ["Cajas tortas", items.filter((product) => product.familia === "tortas-postres")],
          ["Cajas blancas sin impresión", items.filter((product) => product.familia === "cajas-blancas")]
        ].filter(([, productsInGroup]) => productsInGroup.length)
      : [["", items]];
    const subcategories = [...new Set(items.map((product) => product.subcategoria).filter(Boolean))];
    return `
      <section class="catalog-family-section" id="familia-${family.id}">
        <div class="catalog-family-header">
          <div>
            <p class="eyebrow">${family.nav}</p>
            <h3>${family.label}</h3>
            <p>${family.description}</p>
          </div>
        </div>
        ${groupedItems.map(([title, productsInGroup]) => `
          ${title ? `<h4 class="catalog-subgroup-title">${title}</h4>` : ""}
          <div class="catalog-accordion">
            ${productsInGroup.map(productCard).join("")}
            ${editorMode ? `<button class="add-product-card" type="button" data-add-product="${family.id}"><strong>+</strong><span>Añadir producto</span></button>` : ""}
          </div>
        `).join("")}
      </section>
    `;
  }).join("");
  catalogSections.innerHTML = html || `<div class="empty-state"><strong>No encontramos productos.</strong><p>Prueba limpiar filtros o busca por otro nombre, código, medida, uso o material.</p></div>`;
  renderFamilyTabs();
}

function productCard(product) {
  const family = familyById(product.familia);
  const cardColor = catalogColorForProduct(product);
  const quoteOnly = product.precioUnidad.toLowerCase().includes("cotizar") || product.precioUnidad.toLowerCase().includes("cotizacion") || product.precioUnidad.toLowerCase().includes("a cotizar");
  const displayPrice = quoteOnly ? "A cotizar" : `${escapeHtml(getQuantityOptions(product)[0]?.unitLabel || product.precioUnidad)}`;
  return `
    <article class="product-accordion-item" data-product-id="${product.id}" ${editorMode ? 'draggable="true"' : ""} style="--family-color:${cardColor || family?.color || "#2f7a35"}">
      ${editorMode ? `<button class="delete-product-x" type="button" data-delete-inline="${product.id}" aria-label="Eliminar producto">×</button>` : ""}
      ${editorMode ? `<button class="editor-card-button" type="button" data-edit-inline="${product.id}">Editar</button>` : ""}
      <div class="product-card-summary">
        <img src="${product.imagenMiniatura}" alt="${escapeHtml(product.nombre)}" loading="lazy" data-image-preview="${product.id}" onerror="this.src='assets/ecof-logo.png'">
        <span>
          <strong>${escapeHtml(product.nombre)}</strong>
          <small>${escapeHtml(product.medidas || "Medidas por definir")}</small>
        </span>
        <b>${displayPrice}</b>
        <button class="see-more-button" type="button" data-image-preview="${product.id}">Ver más</button>
      </div>
    </article>
  `;
}

function renderFeatured() {
  if (!featuredCarousel) return;
  const featured = products.filter((product) => product.destacado);
  const pool = featured.length ? featured : products.slice(0, 6);
  const visible = Array.from({ length: Math.min(3, pool.length) }, (_, offset) => pool[(featuredIndex + offset) % pool.length]);
  featuredCarousel.innerHTML = visible.map(productCard).join("");
}

function getQuantityOptions(product) {
  if (product.preciosCantidad && typeof product.preciosCantidad === "object") {
    return Object.entries(product.preciosCantidad).map(([qty, value]) => ({
      qty,
      unit: Number(value),
      unitLabel: `$${Number(value).toFixed(2).replace(".", ",")} c/u`
    }));
  }
  if (product.familia === "fundas" || product.familia === "panaderia" || product.familia === "cajas-blancas") {
    const base = parseFloat(String(product.precioUnidad).replace(",", ".").match(/\d+(\.\d+)?/)?.[0] || "0.35");
    const byQty = {
      100: base || 0.35,
      300: Math.max((base || 0.35) - 0.05, 0.05),
      500: Math.max((base || 0.35) - 0.08, 0.05),
      1000: Math.max((base || 0.35) - 0.14, 0.05)
    };
    return Object.entries(byQty).map(([qty, price]) => ({ qty, unit: price, unitLabel: `$${price.toFixed(2).replace(".", ",")} c/u` }));
  }
  const packQty = product.paquete.match(/\d+/)?.[0] || "100";
  return [
    { qty: packQty, unit: parseMoney(product.precioUnidad), unitLabel: product.precioUnidad },
    { qty: String(Number(packQty) * 2 || 200), unit: null, unitLabel: "Cotizar volumen" },
    { qty: String(Number(packQty) * 4 || 500), unit: null, unitLabel: "Cotizar volumen" }
  ];
}

function parseMoney(value = "") {
  const match = String(value).replace(",", ".").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function printExtra(product, printValue) {
  if (printValue === "Sin impresión") return 0;
  if (printValue === "Full color") return null;
  if (product.familia === "fundas" || product.familia === "panaderia" || product.familia === "cajas-blancas") return 0;
  return null;
}

function calculateSelection(product, quantity, printValue) {
  const option = getQuantityOptions(product).find((item) => String(item.qty) === String(quantity)) || getQuantityOptions(product)[0];
  if (!option || option.unit === null || printExtra(product, printValue) === null) {
    return { unitLabel: "A cotizar", totalLabel: "A cotizar", total: null };
  }
  const unit = option.unit + printExtra(product, printValue);
  const total = unit * Number(option.qty || 0);
  return {
    unit,
    total,
    unitLabel: `$${unit.toFixed(2).replace(".", ",")} c/u`,
    totalLabel: `$${total.toFixed(2).replace(".", ",")}`
  };
}

function quantityLabel(product, option, printValue) {
  if (printValue === "Full color") return `${option.qty} unidades - A cotizar`;
  const selection = calculateSelection(product, option.qty, printValue);
  return `${option.qty} unidades - ${selection.unitLabel}`;
}

function isBagProduct(product) {
  return product.familia === "fundas";
}

function handleColorOptions(handleValue) {
  if (handleValue === "Asa de cartón") return ["Blanco", "Café"];
  if (handleValue === "Sin asa") return ["Sin color"];
  return ["Negro", "Blanco", "Kraft", "Beige", "Azul marino"];
}

function buyProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  const qtySelect = document.querySelector(`[data-option-qty="${CSS.escape(id)}"]`);
  const print = document.querySelector(`[data-option-print="${CSS.escape(id)}"]`)?.value || "Por definir";
  const handle = document.querySelector(`[data-option-handle="${CSS.escape(id)}"]`)?.value || "Por definir";
  const handleColor = document.querySelector(`[data-option-handle-color="${CSS.escape(id)}"]`)?.value || "Por definir";
  const quantity = qtySelect?.value || "Por definir";
  const selection = calculateSelection(product, quantity, print);
  const message = [
    "Para continuar con la producción, te comparto el detalle de mi pedido para que por favor lo revise y me confirme si todo está correcto:",
    "",
    "DETALLE DEL PEDIDO",
    `Material: ${product.material}`,
    `Nombre/Tamaño: ${product.nombre} - ${product.medidas || "Medida por confirmar"}`,
    `Cantidad: ${quantity}`,
    isBagProduct(product) ? `Tipo de asa: ${handle}` : "",
    isBagProduct(product) ? `Color del cordón/asa: ${handleColor}` : "",
    `Impresión: ${print}`,
    "*Fecha de entrega:* Por confirmar",
    `Valor total: ${selection.totalLabel}`,
    `Valor abono: ${selection.total ? `$${(selection.total * 0.5).toFixed(2).replace(".", ",")}` : "Por confirmar"}`,
    "",
    "Una vez confirmada esta información, procederemos con la producción según lo acordado.",
    "Quedo atento a tu confirmación o a cualquier ajuste que necesite realizar.",
    "Gracias por confiar en nosotros.",
    "Saludos, ECOF Bolsas de Papel."
  ].filter(Boolean).join("\n");
  window.open(whatsappUrl(message), "_blank", "noopener");
}

function openProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  const modalFamilyId = productInCatalogFamily(product, activeFamily) ? activeFamily : primaryCatalogFamilyId(product);
  activeFamily = modalFamilyId;
  const familyColor = catalogFamilyById(modalFamilyId)?.color || catalogColorForProduct(product);
  modal.style.setProperty("--family-color", familyColor);
  currentModalProductId = id;
  currentModalImageIndex = 0;
  const mediaItems = modalMediaItems(product);
  const options = getQuantityOptions(product);
  const isBag = isBagProduct(product);
  modalContent.innerHTML = `
    <div class="modal-layout">
      <aside class="modal-family-nav">
        ${catalogFamilies.map((family) => `<button type="button" data-modal-family="${family.id}" class="${modalFamilyId === family.id ? "is-active" : ""}" style="--family-color:${family.color}">${escapeHtml(family.nav)}</button>`).join("")}
      </aside>
      <div class="modal-gallery">
        ${editorMode ? `<button class="editor-card-button modal-edit-product" type="button" data-edit-inline="${product.id}">Editar producto</button>` : ""}
        <div class="modal-media-stage" id="modalMediaStage">${renderModalMedia(mediaItems[0], product)}</div>
        <button class="gallery-arrow gallery-prev" type="button" data-gallery-step="-1" aria-label="Imagen anterior">‹</button><button class="gallery-arrow gallery-next" type="button" data-gallery-step="1" aria-label="Imagen siguiente">›</button>
        <div class="modal-thumbs">
          ${mediaItems.map((item, index) => `<button type="button" class="${index === 0 ? "is-active" : ""}" data-modal-thumb="${index}">${item.type === "video" ? "<span>Video</span>" : `<img src="${item.src}" alt="${escapeHtml(product.nombre)} ${index + 1}" onerror="this.src='assets/ecof-logo.png'">`}</button>`).join("")}
        </div>
      </div>
      <div class="modal-copy">
        <h2>${escapeHtml(product.nombre)}</h2>
        <p>${escapeHtml(product.descripcion)}</p>
        <div class="modal-specs">
          <span><strong>Medidas:</strong> ${escapeHtml(product.medidas)}</span>
          <span><strong>Material:</strong> ${escapeHtml(product.material)}</span>
          <span><strong>Precio:</strong> <output data-total-price="${product.id}">${escapeHtml(calculateSelection(product, options[0]?.qty, "Con impresión de logo").totalLabel)}</output></span>
        </div>
        <div class="customizer modal-customizer">
          <label>Impresión<select data-option-print="${product.id}"><option value="Con impresión de logo">Con impresión de logo a un color</option><option value="Sin impresión">Sin impresión</option><option value="Full color">Full color: cotizar según logo</option></select></label>
          ${isBag ? `<label>Asa o agarradera<select data-option-handle="${product.id}"><option value="Cordón de algodón">Cordón de algodón</option><option value="Asa de cartón">Asa de cartón</option><option value="Sin asa">Sin asa</option></select></label>
          <label>Color del asa<select data-option-handle-color="${product.id}">${handleColorOptions("Cordón de algodón").map((color) => `<option value="${color}">${color}</option>`).join("")}</select></label>` : `<input type="hidden" data-option-handle="${product.id}" value="Producto base"><input type="hidden" data-option-handle-color="${product.id}" value="No aplica">`}
          <label>Cantidad<select data-option-qty="${product.id}">${options.map((option) => `<option value="${option.qty}" data-unit="${escapeHtml(option.unit ?? "")}">${escapeHtml(quantityLabel(product, option, "Con impresión de logo"))}</option>`).join("")}</select></label>
        </div>
        <div class="form-actions">
          <button class="primary-button" type="button" data-cart="${product.id}">Agregar al carrito</button>
          <button class="secondary-button dark" type="button" data-buy="${product.id}">Comprar por WhatsApp</button>
          <button class="secondary-button dark" type="button" data-how-buy>¿Cómo se hace la compra?</button>
        </div>
      </div>
    </div>
  `;
  modal.showModal();
  updateProductTotal(product.id);
  if (modalGalleryTimer) clearInterval(modalGalleryTimer);
  if (mediaItems.length > 1) {
    modalGalleryTimer = setInterval(() => {
      if (!modal.open || currentModalProductId !== id) return;
      if (modalMediaItems(product)[currentModalImageIndex]?.type === "video") return;
      currentModalImageIndex = (currentModalImageIndex + 1) % mediaItems.length;
      renderModalMediaAt(currentModalImageIndex);
      document.querySelectorAll("[data-modal-thumb]").forEach((button) => button.classList.toggle("is-active", Number(button.dataset.modalThumb) === currentModalImageIndex));
    }, 3600);
  }
}

function modalMediaItems(product) {
  const images = [...new Set([product.imagenPrincipal, ...(product.galeria || [])].filter(Boolean))].map((src, index) => ({ type: "image", src, label: index === 0 ? "Foto principal" : `Foto ${index + 1}` }));
  const video = youtubeEmbed(product.videoYoutube);
  return video ? [...images, { type: "video", src: video, label: "Video" }] : images;
}

function renderModalMedia(item, product) {
  if (!item) return "";
  if (item.type === "video") return `<iframe class="modal-main-image product-video" src="${item.src}?rel=0&modestbranding=1" title="Video ${escapeHtml(product.nombre)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  return `<img class="modal-main-image" id="modalMainImage" src="${item.src}" alt="${escapeHtml(product.nombre)}" onerror="this.src='assets/ecof-logo.png'">`;
}

function renderModalMediaAt(index) {
  const product = products.find((item) => item.id === currentModalProductId);
  if (!product) return;
  const stage = document.getElementById("modalMediaStage");
  const mediaItems = modalMediaItems(product);
  if (stage) stage.innerHTML = renderModalMedia(mediaItems[index], product);
}

function youtubeEmbed(url = "") {
  const value = String(url).trim();
  if (!value) return "";
  const match = value.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([a-zA-Z0-9_-]{8,})/);
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : "";
}

function updateProductTotal(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  const quantity = document.querySelector(`[data-option-qty="${CSS.escape(id)}"]`)?.value || defaultQuantity(product);
  const print = document.querySelector(`[data-option-print="${CSS.escape(id)}"]`)?.value || "Con impresión de logo";
  const selection = calculateSelection(product, quantity, print);
  const output = document.querySelector(`[data-total-price="${CSS.escape(id)}"]`);
  if (output) output.textContent = selection.totalLabel;
  updateQuantityLabels(id);
}

function updateHandleColors(id) {
  const handle = document.querySelector(`[data-option-handle="${CSS.escape(id)}"]`)?.value;
  const colorSelect = document.querySelector(`[data-option-handle-color="${CSS.escape(id)}"]`);
  if (!colorSelect) return;
  colorSelect.innerHTML = handleColorOptions(handle).map((color) => `<option value="${color}">${color}</option>`).join("");
}

function updateQuantityLabels(id) {
  const product = products.find((item) => item.id === id);
  const select = document.querySelector(`[data-option-qty="${CSS.escape(id)}"]`);
  if (!product || !select) return;
  const print = document.querySelector(`[data-option-print="${CSS.escape(id)}"]`)?.value || "Con impresión de logo";
  [...select.options].forEach((option) => {
    const qtyOption = getQuantityOptions(product).find((item) => String(item.qty) === String(option.value));
    if (qtyOption) option.textContent = quantityLabel(product, qtyOption, print);
  });
}

function stepModalGallery(step) {
  const product = products.find((item) => item.id === currentModalProductId);
  if (!product) return;
  const gallery = modalMediaItems(product);
  if (!gallery.length) return;
  currentModalImageIndex = (currentModalImageIndex + step + gallery.length) % gallery.length;
  renderModalMediaAt(currentModalImageIndex);
  document.querySelectorAll("[data-modal-thumb]").forEach((button) => button.classList.toggle("is-active", Number(button.dataset.modalThumb) === currentModalImageIndex));
}

function confirmAddToCart(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  pendingCartProductId = id;
  if (confirmCartText) confirmCartText.textContent = `¿Seguro quieres agregar "${product.nombre}" al carrito?`;
  confirmCartModal?.showModal();
}

function switchModalProduct(direction) {
  if (!currentModalProductId) return;
  const visible = orderedProductsForModal();
  const index = visible.findIndex((product) => product.id === currentModalProductId);
  if (index < 0) return;
  const next = visible[(index + direction + visible.length) % visible.length];
  openProduct(next.id);
}

function showHowToBuy() {
  modalContent.innerHTML = `
    <div class="how-buy-panel">
      <img src="assets/catalogo/catalogo-proceso-compra.jpg" alt="Proceso de compra ECOF">
      <div>
        <h2>¿Cómo se hace la compra?</h2>
        <ol>
          <li>Elige producto, cantidad y personalización.</li>
          <li>Agrega al carrito y completa tus datos.</li>
          <li>Envía el pedido por WhatsApp.</li>
          <li>ECOF confirma diseño, tiempo de producción y pago.</li>
        </ol>
        <button class="primary-button" type="button" data-return-cart>Entendido</button>
      </div>
    </div>
  `;
  modal.showModal();
}

function toggleCompare(id) {
  if (compare.includes(id)) compare = compare.filter((item) => item !== id);
  else if (compare.length < 3) compare.push(id);
  renderAll();
}

function renderCompare() {
  if (!comparePanel) return;
  if (!compare.length) {
    comparePanel.innerHTML = `<p>Marca productos en el catálogo para compararlos aquí.</p>`;
    return;
  }
  comparePanel.innerHTML = compare.map((id) => {
    const product = products.find((item) => item.id === id);
    if (!product) return "";
    return `
      <article class="compare-card">
        <strong>${escapeHtml(product.nombre)}</strong>
        <span>${escapeHtml(product.subcategoria)}</span>
        <span>${escapeHtml(product.medidas)}</span>
        <span>${escapeHtml(product.material)}</span>
        <span>${escapeHtml(product.precioUnidad)}</span>
        <button class="compare-remove" type="button" data-remove="${product.id}">Quitar</button>
      </article>
    `;
  }).join("");
}

function addToRequest(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  const qtySelect = document.querySelector(`[data-option-qty="${CSS.escape(id)}"]`);
  const print = document.querySelector(`[data-option-print="${CSS.escape(id)}"]`)?.value || "Por definir";
  const handle = document.querySelector(`[data-option-handle="${CSS.escape(id)}"]`)?.value || "Por definir";
  const handleColor = document.querySelector(`[data-option-handle-color="${CSS.escape(id)}"]`)?.value || "Por definir";
  const quantity = qtySelect?.value || defaultQuantity(product);
  const selection = calculateSelection(product, quantity, print);
  const existing = requestItems.find((item) => item.id === id);
  const payload = {
    id,
    quantity,
    print,
    handle,
    handleColor,
    unitPrice: selection.unitLabel,
    total: selection.total,
    totalLabel: selection.totalLabel
  };
  if (existing) Object.assign(existing, payload);
  else requestItems.push(payload);
  saveRequest();
  renderRequest();
  renderAll();
  quoteDrawer.classList.add("is-open");
  quoteDrawer.setAttribute("aria-hidden", "false");
}

function defaultQuantity(product) {
  const match = product.paquete.match(/\d+/);
  return match ? match[0] : "100";
}

function removeFromRequest(id) {
  requestItems = requestItems.filter((item) => item.id !== id);
  saveRequest();
  renderRequest();
  renderAll();
}

function renderRequest() {
  if (!quoteCount || !quoteItems) {
    renderRequestSummary();
    return;
  }
  quoteCount.textContent = requestItems.length;
  if (!requestItems.length) {
    quoteItems.innerHTML = `<p class="empty-request">Agrega productos del catálogo para armar tu solicitud.</p>`;
    renderRequestSummary();
    return;
  }
  quoteItems.innerHTML = requestItems.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    if (!product) return "";
    const options = getQuantityOptions(product);
    return `
      <article class="quote-item">
        <img src="${escapeHtml(product.imagenMiniatura)}" alt="${escapeHtml(product.nombre)}">
        <strong>${escapeHtml(product.nombre)}</strong>
        <span>${escapeHtml(product.medidas || "Medidas por confirmar")}</span>
        <span>${escapeHtml(item.print || "")} · ${escapeHtml(item.handle || "")} · ${escapeHtml(item.handleColor || "")}</span>
        <strong>${escapeHtml(item.totalLabel || "A cotizar")}</strong>
        <select data-request-qty="${product.id}" aria-label="Cantidad deseada">
          ${options.map((option) => `<option value="${option.qty}" ${String(option.qty) === String(item.quantity) ? "selected" : ""}>${option.qty} unidades</option>`).join("")}
        </select>
        <button type="button" data-edit-cart-product="${product.id}">Editar producto</button>
        <button type="button" data-remove-request="${product.id}">Quitar</button>
      </article>
    `;
  }).join("");
  renderRequestSummary();
}

function renderRequestSummary() {
  if (!requestSummary) return;
  requestSummary.innerHTML = `
    <strong>Solicitud actual</strong>
    <p>${requestItems.length ? `${requestItems.length} producto(s) listos para enviar por WhatsApp.` : "Todavía no agregas productos. Usa el botón Agregar al carrito en cada producto."}</p>
    <button class="ghost-button dark" type="button" id="openRequestFromSummary">Ver solicitud</button>
  `;
}

async function sendRequest() {
  if (!requestItems.length) return alert("Agrega al menos un producto a la solicitud.");
  const invoice = getInvoiceData();
  const skipInvoice = document.getElementById("skipInvoiceData")?.checked;
  if (!skipInvoice && (!invoice.name || !invoice.id || !invoice.phone || !invoice.email || !invoice.address)) {
    quoteDrawer.classList.add("is-open");
    quoteDrawer.setAttribute("aria-hidden", "false");
    showCustomNotice("Faltan datos de factura", "Completa los datos para factura o marca la opción de agendar esos datos en otro momento.", "danger");
    return;
  }
  const total = requestItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const lines = requestItems.map((item, index) => {
    const product = products.find((entry) => entry.id === item.id);
    return [
      `${index + 1}. ${product.nombre}`,
      `Material: ${product.material}`,
      `Nombre/Tamaño: ${product.nombre} - ${product.medidas || "Medida por confirmar"}`,
      `Cantidad: ${item.quantity}`,
      isBagProduct(product) ? `Color del cordón/asa: ${item.handleColor || "Por definir"}` : "",
      `Impresión: ${item.print || "Por definir"}`,
      `Valor total: ${item.totalLabel || "A cotizar"}`
    ].filter(Boolean).join("\n");
  });
  const messageLines = [
    "Hola ECOF.",
    "Quiero confirmar este pedido desde el catálogo web. Por favor revísenlo y me indican si todo está correcto:",
    "",
    "DETALLE DEL PEDIDO",
    ...lines,
    "",
    "Fecha de entrega: Por confirmar",
    `Valor total: ${total ? `$${total.toFixed(2).replace(".", ",")}` : "Por confirmar"}`,
    `Valor abono sugerido: ${total ? `$${(total * 0.5).toFixed(2).replace(".", ",")}` : "Por confirmar"}`,
    "",
    skipInvoice ? "Datos para factura: deseo agendarlos en otro momento." : "Datos para factura:",
    skipInvoice ? "" : `Nombre/Razón social: ${invoice.name || "No indicado"}`,
    skipInvoice ? "" : `Cédula/RUC: ${invoice.id || "No indicado"}`,
    skipInvoice ? "" : `Teléfono: ${invoice.phone || "No indicado"}`,
    skipInvoice ? "" : `Correo: ${invoice.email || "No indicado"}`,
    skipInvoice ? "" : `Dirección: ${invoice.address || "No indicada"}`,
    `Observaciones: ${quoteNotes.value.trim() || "Deseo más información y asesoría."}`,
    "",
    "Una vez confirmada esta información, pueden continuar con la revisión del diseño, tiempos de producción y forma de pago.",
    "Quedo atento a su confirmación o a cualquier ajuste que necesite realizar.",
    "Gracias por confiar en nosotros.",
    "Saludos, ECOF Bolsas de Papel."
  ];
  showOrderConfirmation(messageLines.filter(Boolean).join("\n"));
}

function showOrderConfirmation(message) {
  pendingOrderMessage = message;
  if (!orderConfirmModal || !orderConfirmPreview) {
    if (confirm("¿Deseas enviar este pedido por WhatsApp?")) window.open(whatsappUrl(message), "_blank", "noopener");
    return;
  }
  orderConfirmPreview.textContent = message;
  orderConfirmModal.showModal();
}

function getInvoiceData() {
  return {
    name: document.getElementById("invoiceName")?.value.trim(),
    id: document.getElementById("invoiceId")?.value.trim(),
    phone: document.getElementById("invoicePhone")?.value.trim(),
    email: document.getElementById("invoiceEmail")?.value.trim(),
    address: document.getElementById("invoiceAddress")?.value.trim()
  };
}

async function createOrderImageFile(lines) {
  const canvas = document.createElement("canvas");
  const width = 1200;
  const lineHeight = 34;
  const padding = 70;
  canvas.width = width;
  canvas.height = Math.max(900, padding * 2 + lines.length * lineHeight + 150);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fbfcf5";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#2f7a35";
  ctx.fillRect(0, 0, canvas.width, 18);
  ctx.fillStyle = "#f6d34b";
  ctx.fillRect(0, 18, canvas.width * 0.5, 10);
  ctx.fillStyle = "#1d5fbf";
  ctx.fillRect(canvas.width * 0.5, 18, canvas.width * 0.25, 10);
  ctx.fillStyle = "#d74235";
  ctx.fillRect(canvas.width * 0.75, 18, canvas.width * 0.25, 10);
  ctx.fillStyle = "#123f1f";
  ctx.font = "900 54px Arial";
  ctx.fillText("ECOF", padding, 95);
  ctx.font = "700 24px Arial";
  ctx.fillStyle = "#51604b";
  ctx.fillText("Detalle de pedido generado desde el catálogo web", padding, 132);
  ctx.font = "22px Arial";
  ctx.fillStyle = "#172016";
  let y = 190;
  lines.forEach((line) => {
    const cleanLine = String(line).replace(/[📦🌱♻️]/g, "").trim();
    wrapCanvasText(ctx, cleanLine, width - padding * 2).forEach((part) => {
      ctx.fillText(part, padding, y);
      y += lineHeight;
    });
    if (!cleanLine) y += 8;
  });
  ctx.fillStyle = "#2f7a35";
  ctx.font = "800 22px Arial";
  ctx.fillText("ECOF Bolsas de Papel - 0990707544 - ecof0117@gmail.com", padding, canvas.height - 55);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  return new File([blob], `pedido-ecof-${Date.now()}.png`, { type: "image/png" });
}

function downloadFile(file) {
  const link = document.createElement("a");
  link.download = file.name;
  link.href = URL.createObjectURL(file);
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function wrapCanvasText(ctx, text, maxWidth) {
  if (!text) return [""];
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function populateQuoteProducts() {
  const select = document.querySelector("[name='product']");
  if (!select) return;
  select.innerHTML = products.map((product) => `<option value="${escapeHtml(product.nombre)}">${escapeHtml(product.nombre)}</option>`).join("");
}

function renderPromos() {
  const grid = document.getElementById("promoGrid");
  if (!grid) return;
  const activePromos = promos.filter((promo) => promo.activa !== false);
  const ticker = document.getElementById("heroPromoTicker");
  if (ticker) {
    ticker.textContent = activePromos[0]
      ? `Promoción vigente: ${activePromos[0].nombre} · ${activePromos[0].beneficio || "consulta por WhatsApp"}`
      : "Promociones vigentes, catálogo ECOF y empaques hechos en Ecuador";
  }
  if (!activePromos.length) {
    grid.innerHTML = `<div class="empty-state"><strong>No hay promociones activas.</strong><p>Cuando actives una promoción desde el editor aparecerá aquí con su temporizador.</p>${editorMode ? `<button class="editor-inline-button" type="button" data-add-promo="true">Agregar promoción</button>` : ""}</div>`;
    return;
  }
  grid.innerHTML = `${editorMode ? `<button class="editor-inline-button promo-add-main" type="button" data-add-promo="true">Agregar promoción</button>` : ""}` + activePromos.map((promo) => {
    const remaining = promo.fin ? timeRemaining(promo.fin) : "Sin fecha límite";
    const p1 = products.find((product) => product.id === promo.producto1);
    const p2 = products.find((product) => product.id === promo.producto2);
    const imageBlock = promo.imagen
      ? `<img src="${promo.imagen}" alt="${escapeHtml(promo.nombre)}">`
      : `<div class="promo-combo-images">${[p1, p2].filter(Boolean).map((product) => `<img src="${escapeHtml(product.imagenMiniatura)}" alt="${escapeHtml(product.nombre)}">`).join("") || `<img src="assets/ecof-logo.png" alt="ECOF">`}</div>`;
    return `
      <article class="promo-card">
        ${editorMode ? `<button class="delete-product-x" type="button" data-delete-promo-inline="${promo.id}" aria-label="Eliminar promoción">×</button>` : ""}
        ${editorMode ? `<button class="editor-card-button promo-edit-button" type="button" data-edit-promo="${promo.id}">Editar promoción</button>` : ""}
        <b class="promo-corner">Promoción</b>
        ${imageBlock}
        <span>Promoción ECOF</span>
        <h3>${escapeHtml(promo.nombre)}</h3>
        <p>${escapeHtml(promo.descripcion || "")}</p>
        ${(promo.precioAntes || promo.precioDespues) ? `<div class="promo-prices"><span>Antes <del>${formatPromoPrice(promo.precioAntes)}</del></span><strong>Ahora ${formatPromoPrice(promo.precioDespues)}</strong>${promoSavings(promo) ? `<small>Ahorro ${promoSavings(promo)}</small>` : ""}</div>` : ""}
        <strong>${escapeHtml(promo.beneficio || "")}</strong>
        <em>${escapeHtml(remaining)}</em>
        <button class="primary-button" type="button" data-promo-cart="${promo.id}">Comprar promoción</button>
      </article>
    `;
  }).join("");
}

function formatPromoPrice(value = "") {
  if (value === "") return "";
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? `$${number.toFixed(2).replace(".", ",")}` : escapeHtml(value);
}

function promoSavings(promo) {
  const before = Number(String(promo.precioAntes || "").replace(",", "."));
  const after = Number(String(promo.precioDespues || "").replace(",", "."));
  if (!Number.isFinite(before) || !Number.isFinite(after) || before <= after) return "";
  return formatPromoPrice(before - after);
}

function renderFaqs() {
  const grid = document.getElementById("faqGrid");
  if (!grid) return;
  grid.innerHTML = `${editorMode ? `<button class="add-product-card faq-add-card" type="button" data-add-faq="true"><strong>+</strong><span>Añadir pregunta</span></button>` : ""}` + faqs.map((faq, index) => `
    <details ${index === 0 ? "open" : ""}>
      ${editorMode ? `<button class="delete-product-x faq-delete" type="button" data-delete-faq="${faq.id}" aria-label="Eliminar pregunta">×</button>` : ""}
      <summary>${escapeHtml(faq.pregunta)}</summary>
      <p>${escapeHtml(faq.respuesta)}</p>
    </details>
  `).join("");
}

function renderReviews() {
  if (!reviewCarousel) return;
  const reviewPool = editorMode ? reviews : reviews.filter((review) => review.approved !== false);
  const approvedCount = reviews.filter((review) => review.approved !== false).length;
  const counter = document.getElementById("reviewCounter");
  if (counter) counter.textContent = `${approvedCount} comentario${approvedCount === 1 ? "" : "s"} aprobado${approvedCount === 1 ? "" : "s"}`;
  const visible = Array.from({ length: Math.min(3, reviewPool.length) }, (_, offset) => reviewPool[(reviewIndex + offset) % reviewPool.length]).filter(Boolean);
  reviewCarousel.innerHTML = visible.map((review) => `
    <article>
      ${review.image ? `<img class="review-image" src="${escapeHtml(review.image)}" alt="Imagen de comentario ECOF" loading="lazy">` : ""}
      <strong>${escapeHtml(review.name)}</strong>
      <span>${"★".repeat(Number(review.rating) || 5)}${"☆".repeat(5 - (Number(review.rating) || 5))}</span>
      <p>${escapeHtml(review.comment)}</p>
      ${editorMode && review.approved === false ? `<button class="mini-admin-button" type="button" data-approve-review="${review.id}">Aprobar</button>` : ""}
      ${editorMode ? `<button class="mini-admin-button" type="button" data-review-image="${review.id}">Agregar imagen</button>` : ""}
      ${editorMode ? `<button class="delete-review-button" type="button" data-delete-review="${review.id}">Eliminar</button>` : ""}
    </article>
  `).join("");
}

function renderPlans() {
  if (!plansGrid) return;
  plansGrid.innerHTML = businessPlans.map((plan) => `
    <article class="${plan.destacado ? "featured-plan" : ""}">
      <h3>${escapeHtml(plan.nombre)}</h3>
      <p>${escapeHtml(plan.descripcion)}</p>
      <ul>
        ${(plan.features || []).map((feature, index) => `<li>${escapeHtml(feature)}${editorMode ? ` <button class="mini-admin-button" type="button" data-delete-plan-feature="${plan.id}:${index}">×</button>` : ""}</li>`).join("")}
      </ul>
      ${editorMode ? `<button class="mini-admin-button" type="button" data-add-plan-feature="${plan.id}">+ Característica</button>` : ""}
      <a class="primary-button js-plan" href="#" data-plan="${escapeHtml(plan.nombre)}">Hablar con asesor</a>
    </article>
  `).join("");
}

function timeRemaining(dateValue) {
  const end = new Date(dateValue).getTime();
  if (!end) return "Sin fecha límite";
  const diff = end - Date.now();
  if (diff <= 0) return "Finaliza hoy";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${days} días ${hours} h ${minutes} min ${seconds} s restantes`;
}

function setupWhatsAppLinks() {
  document.querySelectorAll(".js-whatsapp").forEach((link) => {
    const message = "Hola ECOF, quiero cotizar empaques personalizados para mi negocio.";
    if (link.tagName === "BUTTON") {
      link.onclick = () => window.open(whatsappUrl(message), "_blank", "noopener");
    } else {
      link.href = whatsappUrl(message);
    }
  });
  document.querySelectorAll(".js-promo").forEach((link) => {
    link.href = whatsappUrl(`Hola ECOF, quiero solicitar la promocion: ${link.dataset.promo}.`);
  });
  document.querySelectorAll(".js-plan").forEach((link) => {
    link.href = whatsappUrl(`Hola ECOF, quiero más información sobre ${link.dataset.plan}. Me interesa conocer cantidades recomendadas, precios por volumen, tiempos de producción, beneficios para empresas y cómo funciona la reposición mensual.`);
  });
  const payphoneButton = document.getElementById("payphoneButton");
  if (payphoneButton) payphoneButton.href = whatsappUrl("Hola ECOF, quiero pagar con tarjeta por PayPhone. Por favor envíenme el link de pago seguro para mi pedido.");
  const pichinchaButton = document.getElementById("pichinchaButton");
  if (pichinchaButton) pichinchaButton.href = whatsappUrl("Hola ECOF, quiero pagar por transferencia en Banco Pichincha. Por favor envíenme los datos de la cuenta para mi pedido.");
  const guayaquilButton = document.getElementById("guayaquilButton");
  if (guayaquilButton) guayaquilButton.href = whatsappUrl("Hola ECOF, quiero pagar por transferencia en Banco Guayaquil. Por favor envíenme los datos de la cuenta para mi pedido.");
}

function renderEditorList() {
  editorProductList.innerHTML = products.map((product) => `
    <button type="button" class="${product.id === editorSelectedId ? "is-active" : ""}" data-edit-product="${product.id}">
      <strong>${escapeHtml(product.nombre)}</strong>
      <span>${escapeHtml(familyById(product.familia)?.nav || product.familia)}${product.codigo ? ` - COD ${escapeHtml(product.codigo)}` : ""}</span>
    </button>
  `).join("");
}

function renderPromoEditorList() {
  const list = document.getElementById("editorPromoList");
  if (!list) return;
  list.innerHTML = promos.length ? promos.map((promo) => `
    <button type="button" class="${promo.id === editorSelectedPromoId ? "is-active" : ""}" data-edit-promo="${promo.id}">
      <strong>${escapeHtml(promo.nombre)}</strong>
      <span>${promo.activa === false ? "Pausada" : "Activa"} · ${promo.fin ? timeRemaining(promo.fin) : "Sin temporizador"}</span>
    </button>
  `).join("") : `<p class="empty-request">No hay promociones. Crea la primera desde este formulario.</p>`;
}

function fillPromoForm(promo = null) {
  populatePromoProductOptions();
  const item = promo || { id: `promo-${Date.now()}`, nombre: "Nueva promoción", descripcion: "", beneficio: "", imagen: "", fin: "", activa: true, producto1: "", producto2: "", precioAntes: "", precioDespues: "" };
  editorSelectedPromoId = item.id;
  document.getElementById("promoId").value = item.id;
  document.getElementById("promoNombre").value = item.nombre || "";
  document.getElementById("promoDescripcion").value = item.descripcion || "";
  document.getElementById("promoBeneficio").value = item.beneficio || "";
  document.getElementById("promoImagen").value = item.imagen || "";
  document.getElementById("promoFin").value = item.fin || "";
  document.getElementById("promoActiva").value = String(item.activa !== false);
  document.getElementById("promoProducto1").value = item.producto1 || "";
  document.getElementById("promoProducto2").value = item.producto2 || "";
  document.getElementById("promoPrecioAntes").value = item.precioAntes || "";
  document.getElementById("promoPrecioDespues").value = item.precioDespues || "";
  renderPromoEditorList();
}

function promoFromEditor() {
  return {
    id: document.getElementById("promoId").value || `promo-${Date.now()}`,
    nombre: document.getElementById("promoNombre").value.trim(),
    descripcion: document.getElementById("promoDescripcion").value.trim(),
    beneficio: document.getElementById("promoBeneficio").value.trim(),
    imagen: document.getElementById("promoImagen").value.trim(),
    fin: document.getElementById("promoFin").value,
    activa: document.getElementById("promoActiva").value === "true",
    producto1: document.getElementById("promoProducto1").value,
    producto2: document.getElementById("promoProducto2").value,
    precioAntes: document.getElementById("promoPrecioAntes").value.trim(),
    precioDespues: document.getElementById("promoPrecioDespues").value.trim()
  };
}

function populatePromoProductOptions() {
  ["promoProducto1", "promoProducto2"].forEach((id) => {
    const select = document.getElementById(id);
    if (!select) return;
    const current = select.value;
    select.innerHTML = `<option value="">Sin producto</option>` + products.map((product) => `<option value="${product.id}">${escapeHtml(product.nombre)}</option>`).join("");
    select.value = [...select.options].some((option) => option.value === current) ? current : "";
  });
}

function populateEditorFamilyOptions() {
  const select = document.getElementById("editorFamilia");
  select.innerHTML = [
    `<option value="fundas">Fundas shopping / kraft</option>`,
    `<option value="panaderia">Fundas delivery / despacho / panadería</option>`,
    `<option value="cajas-blancas">Cajas blancas / cartulina</option>`,
    `<option value="tortas-postres">Cajas tortas y postres</option>`,
    `<option value="comida">Cajas comida</option>`,
    `<option value="pizza">Cajas pizza</option>`,
    `<option value="papeles">Envoltura / papel antigrasa / etiquetas</option>`,
    `<option value="servilletas">Servilletas</option>`
  ].join("");
}

function fillEditorForm(product = null) {
  populateEditorFamilyOptions();
  const item = product || makeProduct({
    id: `producto-${Date.now()}`,
    nombre: "Nuevo producto ECOF",
    familia: "fundas",
    subcategoria: "Fundas personalizadas con logo",
    categoria: "Fundas"
  });
  editorSelectedId = item.id;
  document.getElementById("editorId").value = item.id;
  document.getElementById("editorNombre").value = item.nombre;
  document.getElementById("editorCodigo").value = item.codigo;
  document.getElementById("editorFamilia").value = item.familia;
  document.getElementById("editorCategoria").value = item.categoria;
  document.getElementById("editorSubcategoria").value = item.subcategoria;
  document.getElementById("editorMedidas").value = item.medidas;
  document.getElementById("editorMaterial").value = item.material;
  document.getElementById("editorPaquete").value = item.paquete;
  document.getElementById("editorPrecioPaquete").value = item.precioPaquete;
  document.getElementById("editorPrecioUnidad").value = item.precioUnidad;
  document.getElementById("editorPreciosCantidad").value = item.preciosCantidad ? Object.entries(item.preciosCantidad).map(([qty, price]) => `${qty}=${price}`).join("\n") : "";
  document.getElementById("editorImagen").value = item.imagen;
  document.getElementById("editorImagenMiniatura").value = item.imagenMiniatura;
  document.getElementById("editorImagenPrincipal").value = item.imagenPrincipal;
  document.getElementById("editorGaleria").value = (item.galeria || []).join("\n");
  renderEditorGalleryManager();
  document.getElementById("editorVideoYoutube").value = item.videoYoutube || "";
  document.getElementById("editorDescripcion").value = item.descripcion;
  document.getElementById("editorUso").value = item.uso.join(", ");
  document.getElementById("editorEtiquetas").value = item.etiquetas.join(", ");
  document.getElementById("editorPersonalizable").checked = item.personalizable;
  document.getElementById("editorDestacado").checked = item.destacado;
  renderEditorList();
}

function productFromEditor() {
  const familia = document.getElementById("editorFamilia").value;
  const galeria = document.getElementById("editorGaleria").value.split(/\n|,/).map((item) => item.trim()).filter(Boolean).slice(0, 3);
  return makeProduct({
    id: document.getElementById("editorId").value || `producto-${Date.now()}`,
    codigo: document.getElementById("editorCodigo").value.trim(),
    nombre: document.getElementById("editorNombre").value.trim(),
    familia,
    categoria: document.getElementById("editorCategoria").value.trim() || familyById(familia)?.category,
    subcategoria: document.getElementById("editorSubcategoria").value.trim(),
    descripcion: document.getElementById("editorDescripcion").value.trim(),
    material: document.getElementById("editorMaterial").value.trim(),
    medidas: document.getElementById("editorMedidas").value.trim(),
    paquete: document.getElementById("editorPaquete").value.trim(),
    precioPaquete: document.getElementById("editorPrecioPaquete").value.trim(),
    precioUnidad: document.getElementById("editorPrecioUnidad").value.trim(),
    preciosCantidad: pricesFromEditor(document.getElementById("editorPreciosCantidad").value),
    imagen: document.getElementById("editorImagen").value.trim(),
    imagenMiniatura: document.getElementById("editorImagenMiniatura").value.trim(),
    imagenPrincipal: document.getElementById("editorImagenPrincipal").value.trim(),
    galeria,
    videoYoutube: document.getElementById("editorVideoYoutube").value.trim(),
    uso: splitList(document.getElementById("editorUso").value),
    etiquetas: splitList(document.getElementById("editorEtiquetas").value),
    personalizable: document.getElementById("editorPersonalizable").checked,
    destacado: document.getElementById("editorDestacado").checked
  });
}

async function saveEditorProductToState({ syncFirebase = false } = {}) {
  const product = productFromEditor();
  if (!product.nombre.trim()) {
    showCustomNotice("Falta el nombre", "Escribe el nombre del producto antes de guardarlo.", "danger");
    return null;
  }
  const index = products.findIndex((item) => item.id === product.id);
  if (index >= 0) products[index] = product;
  else products.unshift(product);
  editorSelectedId = product.id;
  saveProducts();
  renderAll();
  fillEditorForm(product);
  if (syncFirebase) {
    await saveProductToFirestore(product);
  }
  return product;
}

function renderEditorGalleryManager() {
  const manager = document.getElementById("editorGalleryManager");
  const gallery = document.getElementById("editorGaleria");
  if (!manager || !gallery) return;
  const items = gallery.value.split(/\n|,/).map((item) => item.trim()).filter(Boolean).slice(0, 3);
  manager.innerHTML = items.length
    ? items.map((item, index) => `
      <div class="editor-gallery-item">
        <img src="${escapeHtml(item)}" alt="${escapeHtml(mediaFileName(item, index))}" onerror="this.src='assets/ecof-logo.png'">
        <strong title="${escapeHtml(mediaFileName(item, index))}">${escapeHtml(mediaFileName(item, index))}</strong>
        <button type="button" data-remove-gallery-image="${index}">Eliminar imagen</button>
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
    const last = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "");
    return last || `Imagen ${index + 1}`;
  } catch {
    return value.split(/[\\/]/).pop() || `Imagen ${index + 1}`;
  }
}

function splitList(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function blockedWordIn(value = "") {
  const blocked = [
    "verga", "vrga", "v3rga", "verg", "chucha", "chch", "puta", "puto", "putita", "putazo",
    "hijueputa", "hijo de puta", "hp", "careverga", "care vrga", "picha", "carepicha",
    "mierda", "mrd", "m13rda", "cojudo", "cojuda", "huevon", "huevón", "webon", "guevon",
    "maricon", "maricón", "marica", "cabron", "cabrón", "malparido", "malparida",
    "imbecil", "imbécil", "idiota", "pendejo", "pendeja", "zorra", "perra", "estupido", "estúpido",
    "chucha tu madre", "ctm", "mama verga", "mamaverga", "mmv", "rata", "ladron", "ladrón",
    "estafador", "estafadora", "longo de mierda"
  ];
  const normalized = normalizeSearch(value);
  return blocked.find((word) => normalized.includes(normalizeSearch(word))) || "";
}

function hasBlockedLanguage(value = "") {
  return Boolean(blockedWordIn(value));
}

function showPolicyAlert(word) {
  const existing = document.querySelector(".policy-alert");
  if (existing) existing.remove();
  const alertBox = document.createElement("div");
  alertBox.className = "policy-alert";
  alertBox.innerHTML = `<strong>Comentario no permitido</strong><p>La palabra "${escapeHtml(word)}" infringe nuestra política de respeto. Escribe tu comentario sin insultos u ofensas.</p><button type="button">Entendido</button>`;
  document.body.appendChild(alertBox);
  alertBox.querySelector("button").addEventListener("click", () => alertBox.remove());
  setTimeout(() => alertBox.remove(), 7000);
}

function showCustomNotice(title, message, tone = "") {
  const existing = document.querySelector(".policy-alert");
  if (existing) existing.remove();
  const alertBox = document.createElement("div");
  alertBox.className = `policy-alert ${tone}`;
  alertBox.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p><button type="button">Entendido</button>`;
  document.body.appendChild(alertBox);
  alertBox.querySelector("button").addEventListener("click", () => {
    alertBox.remove();
    if (title.toLowerCase().includes("factura")) {
      quoteDrawer.classList.add("is-open");
      quoteDrawer.setAttribute("aria-hidden", "false");
    }
  });
  setTimeout(() => alertBox.remove(), 7000);
}

function pricesFromEditor(value = "") {
  const entries = String(value).split(/\n|,/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const [qty, price] = line.split("=").map((part) => part.trim());
    return [qty, Number(String(price).replace(",", "."))];
  }).filter(([qty, price]) => qty && Number.isFinite(price));
  return entries.length ? Object.fromEntries(entries) : null;
}

function openEditorWithPrompt() {
  const key = prompt("Clave de editor ECOF");
  if (key === EDITOR_KEY) openEditor();
  else if (key !== null) alert("Clave incorrecta.");
}

function openEditor() {
  const socials = loadSocialLinks();
  populateEditorFamilyOptions();
  renderEditorList();
  renderPromoEditorList();
  fillEditorForm(products.find((product) => product.id === editorSelectedId) || products[0]);
  fillPromoForm(promos.find((promo) => promo.id === editorSelectedPromoId) || null);
  if (document.getElementById("adminInstagram")) document.getElementById("adminInstagram").value = socials.instagram || "";
  if (document.getElementById("adminTiktok")) document.getElementById("adminTiktok").value = socials.tiktok || "";
  if (document.getElementById("adminFacebook")) document.getElementById("adminFacebook").value = socials.facebook || "";
  editorModal.showModal();
}

function exportProducts(downloadName = `ecof-catalogo-${new Date().toISOString().slice(0, 10)}.json`) {
  const blob = new Blob([JSON.stringify(products, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = downloadName;
  link.click();
  URL.revokeObjectURL(url);
}

function importProducts(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error("El archivo no contiene un array.");
      products = imported.map((product) => makeProduct(product));
      saveProducts();
      editorSelectedId = products[0]?.id || "";
      renderAll();
      fillEditorForm(products[0]);
      alert("Catálogo importado correctamente.");
    } catch (error) {
      alert(`No se pudo importar el JSON: ${error.message}`);
    }
  };
  reader.readAsText(file);
}

function renderChat() {
  if (!chatMessages.children.length) {
    addBotMessage("Hola, soy el asistente ECOF. Elige una opcion y te guio rapido.");
  }
  const options = [
    ["cotizar", "Quiero cotizar un producto"],
    ["elegir", "No sé qué empaque elegir"],
    ["whatsapp", "Quiero hablar por WhatsApp"],
    ["empresa", "Soy empresa y compro por volumen"],
    ["medidas", "Necesito ayuda con medidas"],
    ["logo", "Quiero personalizar con mi logo"],
    ["cart", "Abrir carrito"]
  ];
  chatOptions.innerHTML = options.map(([key, label]) => `<button type="button" data-chat-option="${key}">${label}</button>`).join("");
}

function addBotMessage(message, action = "") {
  const node = document.createElement("div");
  node.className = "message";
  node.innerHTML = `${escapeHtml(message)}${action}`;
  chatMessages.appendChild(node);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addUserMessage(message) {
  const node = document.createElement("div");
  node.className = "message user";
  node.textContent = message;
  chatMessages.appendChild(node);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleChatOption(key, label) {
  addUserMessage(label);
  const wa = (message, text = "Abrir WhatsApp") => `<a class="chat-wa" href="${whatsappUrl(message)}" target="_blank" rel="noopener">${text}</a>`;
  const responses = {
    cotizar: ["Puedes agregar productos a la solicitud o enviarnos el producto exacto por WhatsApp.", wa("Hola ECOF, quiero cotizar un producto del catálogo.")],
    elegir: ["Cuéntanos que vendes, cantidad aproximada y si llevara logo. Te recomendamos medida, material y empaque.", wa("Hola ECOF, necesito ayuda para elegir el empaque correcto.")],
    whatsapp: ["Claro, abre WhatsApp y un asesor puede ayudarte con catálogo, precios, medidas y personalización.", wa("Hola ECOF, quiero hablar con un asesor.")],
    empresa: ["Para compras por volumen podemos revisar precios preferenciales, producción recurrente y atención prioritaria.", wa("Hola ECOF, soy empresa y compro por volumen.")],
    medidas: ["Para fundas mide alto, ancho y fuelle. Para cajas mide largo, ancho y alto. Tambien puedes enviar una foto del producto.", wa("Hola ECOF, necesito ayuda con medidas de empaque.")],
    logo: ["Puedes enviar tu logo en PNG, JPG, PDF, SVG o AI. Revisamos contraste, ubicación y método de impresión.", wa("Hola ECOF, quiero personalizar empaques con mi logo.")],
    cart: ["Abrí el carrito. En observaciones puedes escribir modo admin si eres administrador.", ""]
  };
  if (key === "cart") {
    quoteDrawer.classList.add("is-open");
    quoteDrawer.setAttribute("aria-hidden", "false");
  }
  const [message, action] = responses[key] || responses.cotizar;
  addBotMessage(message, action);
}

function handleChatText(text) {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return;
  addUserMessage(text);
  if (normalized === "activar modo admin") {
    const password = prompt("Clave de admin ECOF");
    if (password === EDITOR_KEY) {
      addBotMessage("Acceso correcto. Abriendo editor de catálogo.");
      openEditor();
    } else if (password !== null) {
      addBotMessage("Clave incorrecta.");
    }
    return;
  }
  addBotMessage("Puedo ayudarte a elegir empaque, revisar medidas, personalizar con logo o enviarte a WhatsApp para cerrar tu pedido.");
}

function activateEditorMode() {
  editorMode = true;
  document.body.classList.add("admin-mode");
  document.getElementById("adminExitButton").hidden = false;
  document.getElementById("adminSaveButton").hidden = false;
  renderAll();
  enableInlineTextEditing();
}

function requestEditorFromCart() {
  activateEditorMode();
  alert("Modo admin activado para pruebas. Cuando me indiques, vuelvo a poner la clave.");
}

function enableInlineTextEditing() {
  const saved = loadPageContent();
  const nodes = [...document.querySelectorAll("main h1, main h2, main h3, main p, main li, main .plans-grid a, footer p, footer strong, footer a, footer span, .hero-badges strong, .hero-badges span, .quick-benefits strong, .quick-benefits span")];
  nodes.forEach((node, index) => {
    const key = node.dataset.editKey || `editable-${index}`;
    node.dataset.editKey = key;
    if (saved[key]) {
      const text = String(saved[key]).trim().toLowerCase();
      if (!(node.matches("h1,h2,h3") && ["instagram", "tiktok", "facebook"].includes(text))) node.textContent = saved[key];
    }
    node.contentEditable = "true";
    node.classList.add("inline-editable");
    node.addEventListener("blur", () => {
      const next = loadPageContent();
      next[key] = node.textContent.trim();
      savePageContent(next);
    });
  });
}

function applySavedPageContent() {
  const saved = loadPageContent();
  Object.entries(saved).forEach(([selector, value]) => {
    const node = document.querySelector(`[data-edit-key="${selector}"]`) || document.querySelector(selector);
    if (node) {
      const text = String(value || "").trim().toLowerCase();
      if (node.matches("h1,h2,h3") && ["instagram", "tiktok", "facebook"].includes(text)) return;
      node.textContent = value;
    }
  });
  if (saved.heroImage) {
    const heroImage = document.querySelector("#heroCarousel img.is-active") || document.querySelector("#heroCarousel img");
    if (heroImage) heroImage.src = saved.heroImage;
  }
}

function renderAll() {
  renderFilterOptions();
  syncFilterControls();
  renderCatalog();
  renderFeatured();
  renderCompare();
  renderRequest();
  renderPromos();
  renderFaqs();
  renderReviews();
  renderPlans();
  populateQuoteProducts();
  setupWhatsAppLinks();
  applySavedPageContent();
}

function setupHeroCarousel() {
  const slides = [...document.querySelectorAll("#heroCarousel img")];
  if (slides.length < 2) return;
  const dots = document.getElementById("heroDots");
  let index = 0;
  const paint = () => {
    slides.forEach((slide, slideIndex) => slide.classList.toggle("is-active", slideIndex === index));
    if (dots) dots.querySelectorAll("button").forEach((button, dotIndex) => button.classList.toggle("is-active", dotIndex === index));
  };
  if (dots) {
    dots.innerHTML = slides.map((_, slideIndex) => `<button type="button" aria-label="Ver portada ${slideIndex + 1}" data-hero-dot="${slideIndex}" class="${slideIndex === 0 ? "is-active" : ""}"></button>`).join("");
    dots.addEventListener("click", (event) => {
      const button = event.target.closest("[data-hero-dot]");
      if (!button) return;
      index = Number(button.dataset.heroDot);
      paint();
    });
  }
  setInterval(() => {
    slides[index].classList.remove("is-active");
    index = (index + 1) % slides.length;
    paint();
  }, 4200);
}

function syncFilterControls() {
  const pairs = {
    subcategoryFilter: filters.subcategory,
    materialFilter: filters.material,
    usageFilter: filters.usage,
    packageFilter: filters.package,
    priceFilter: filters.price,
    customFilter: filters.custom
  };
  Object.entries(pairs).forEach(([id, value]) => {
    const select = document.getElementById(id);
    if (select && [...select.options].some((option) => option.value === value)) select.value = value;
  });
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button, a");
  document.querySelectorAll(".nav-dropdown[open]").forEach((dropdown) => {
    if (!dropdown.contains(event.target)) dropdown.removeAttribute("open");
  });
  if (editorMode && event.target.closest("#heroCarousel")) {
    const url = prompt("Pega el link de la nueva imagen principal de portada");
    if (url) {
      const next = loadPageContent();
      next.heroImage = normalizeMediaUrl(url);
      savePageContent(next);
      applySavedPageContent();
    }
    return;
  }
  if (!target) return;

  if (target.dataset.family) {
    activeFamily = target.dataset.family;
    filters.subcategory = "all";
    if (!document.body.classList.contains("catalog-page")) {
      window.location.href = target.dataset.familyUrl || familyPageUrl(activeFamily);
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("familia", activeFamily);
    url.hash = "catalogo";
    window.history.replaceState({}, "", url);
    renderAll();
  }
  if (target.dataset.jumpFamily) {
    activeFamily = target.dataset.jumpFamily;
    filters.search = "";
    if (productSearch) productSearch.value = "";
    if (!document.body.classList.contains("catalog-page")) {
      window.location.href = familyPageUrl(activeFamily);
      return;
    }
    renderAll();
  }
  if (target.dataset.subChip) {
    filters.subcategory = target.dataset.subChip;
    document.getElementById("subcategoryFilter").value = filters.subcategory;
    renderAll();
  }
  if (target.dataset.open) openProduct(target.dataset.open);
  if (target.dataset.related) openProduct(target.dataset.related);
  if (target.dataset.modalFamily) {
    activeFamily = target.dataset.modalFamily;
    renderAll();
    const nextProduct = products.find((product) => productInCatalogFamily(product, activeFamily));
    if (nextProduct) openProduct(nextProduct.id);
  }
  if (target.dataset.compare) toggleCompare(target.dataset.compare);
  if (target.dataset.remove) toggleCompare(target.dataset.remove);
  if (target.dataset.request) addToRequest(target.dataset.request);
  if (target.dataset.cart) confirmAddToCart(target.dataset.cart);
  if (target.dataset.buy) buyProduct(target.dataset.buy);
  if (target.dataset.removeRequest) removeFromRequest(target.dataset.removeRequest);
  if (target.dataset.editCartProduct) openProduct(target.dataset.editCartProduct);
  if (target.id === "openRequestFromSummary") {
    quoteDrawer.classList.add("is-open");
    quoteDrawer.setAttribute("aria-hidden", "false");
  }
  if (target.dataset.editProduct) {
    fillEditorForm(products.find((product) => product.id === target.dataset.editProduct));
  }
  if (target.dataset.editPromo) {
    fillPromoForm(promos.find((promo) => promo.id === target.dataset.editPromo));
    editorModal.showModal();
  }
  if (target.dataset.chatOption) handleChatOption(target.dataset.chatOption, target.textContent.trim());
  if (target.dataset.addProduct) {
    const catalogFamily = target.dataset.addProduct;
    const family = defaultProductFamilyForCatalog(catalogFamily);
    const familyMeta = familyById(family);
    fillEditorForm(makeProduct({
      id: `producto-${Date.now()}`,
      nombre: "Nuevo producto ECOF",
      familia: family,
      categoria: familyMeta?.category || catalogFamilyById(catalogFamily)?.label || "",
      subcategoria: defaultSubcategoryForCatalog(catalogFamily, family)
    }));
    editorModal.showModal();
  }
  if (target.dataset.howBuy !== undefined) showHowToBuy();
  if (target.dataset.editInline) {
    fillEditorForm(products.find((product) => product.id === target.dataset.editInline));
    editorModal.showModal();
  }
  if (target.dataset.deleteInline) {
    const product = products.find((item) => item.id === target.dataset.deleteInline);
    if (product && confirm(`¿Seguro quieres borrar el producto "${product.nombre}"?`)) {
      products = products.filter((item) => item.id !== product.id);
      saveProducts();
      renderAll();
    }
  }
  if (target.dataset.addPromo) {
    fillPromoForm(null);
    editorModal.showModal();
  }
  if (target.dataset.deletePromoInline) {
    const promo = promos.find((item) => item.id === target.dataset.deletePromoInline);
    if (promo && confirm(`¿Seguro quieres borrar la promoción "${promo.nombre}"?`)) {
      promos = promos.filter((item) => item.id !== promo.id);
      savePromos();
      renderAll();
    }
  }
  if (target.dataset.promoCart) {
    const promo = promos.find((item) => item.id === target.dataset.promoCart);
    if (promo) {
      [promo.producto1, promo.producto2].filter(Boolean).forEach((id) => {
        if (!requestItems.some((item) => item.id === id)) {
          const product = products.find((entry) => entry.id === id);
          if (product) {
            const option = getQuantityOptions(product)[0];
            requestItems.push({ id, quantity: option?.qty || defaultQuantity(product), print: "Promoción", handle: "", handleColor: "", unitPrice: promo.precioDespues ? formatPromoPrice(promo.precioDespues) : "Promoción", total: null, totalLabel: promo.precioDespues ? formatPromoPrice(promo.precioDespues) : "Promoción" });
          }
        }
      });
      saveRequest();
      renderRequest();
      if (quoteDrawer) {
        quoteDrawer.classList.add("is-open");
        quoteDrawer.setAttribute("aria-hidden", "false");
      } else {
        showCustomNotice("Promoción agregada", "Abriremos el catálogo para revisar tu carrito.", "success");
        window.setTimeout(() => { window.location.href = "catalogo.html#catalogo"; }, 900);
      }
    }
  }
  if (target.dataset.addFaq) {
    const pregunta = prompt("Pregunta frecuente");
    if (!pregunta) return;
    const respuesta = prompt("Respuesta");
    if (!respuesta) return;
    faqs.unshift({ id: `faq-${Date.now()}`, pregunta, respuesta });
    saveFaqs();
    renderAll();
  }
  if (target.dataset.deleteFaq) {
    const faq = faqs.find((item) => item.id === target.dataset.deleteFaq);
    if (faq && confirm(`¿Eliminar la pregunta "${faq.pregunta}"?`)) {
      faqs = faqs.filter((item) => item.id !== faq.id);
      saveFaqs();
      renderAll();
    }
  }
  if (target.dataset.deleteReview) {
    reviews = reviews.filter((review) => review.id !== target.dataset.deleteReview);
    saveReviews();
    renderReviews();
  }
  if (target.dataset.approveReview) {
    const review = reviews.find((item) => item.id === target.dataset.approveReview);
    if (review) {
      review.approved = true;
      saveReviews();
      renderReviews();
    }
  }
  if (target.dataset.reviewImage) {
    const review = reviews.find((item) => item.id === target.dataset.reviewImage);
    if (review) {
      const imageUrl = prompt("Pega el link de la imagen del cliente o referencia visual");
      if (imageUrl) {
        review.image = normalizeMediaUrl(imageUrl);
        saveReviews();
        renderReviews();
      }
    }
  }
  if (target.dataset.removeGalleryImage) {
    const gallery = document.getElementById("editorGaleria");
    if (gallery) {
      const items = gallery.value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
      items.splice(Number(target.dataset.removeGalleryImage), 1);
      gallery.value = items.join("\n");
      renderEditorGalleryManager();
    }
  }
  if (target.dataset.addPlanFeature) {
    const plan = businessPlans.find((item) => item.id === target.dataset.addPlanFeature);
    const feature = prompt("Nueva característica del plan");
    if (plan && feature) {
      plan.features = [...(plan.features || []), feature.trim()];
      savePlans();
      renderAll();
    }
  }
  if (target.dataset.deletePlanFeature) {
    const [planId, index] = target.dataset.deletePlanFeature.split(":");
    const plan = businessPlans.find((item) => item.id === planId);
    if (plan) {
      plan.features.splice(Number(index), 1);
      savePlans();
      renderAll();
    }
  }
  if (target.dataset.modalThumb) {
    const product = products.find((item) => item.id === currentModalProductId);
    if (!product) return;
    currentModalImageIndex = Number(target.dataset.modalThumb);
    renderModalMediaAt(currentModalImageIndex);
    document.querySelectorAll("[data-modal-thumb]").forEach((button) => button.classList.toggle("is-active", Number(button.dataset.modalThumb) === currentModalImageIndex));
  }
  if (target.dataset.galleryStep) stepModalGallery(Number(target.dataset.galleryStep));
  if (target.dataset.modalStep) switchModalProduct(Number(target.dataset.modalStep));
  if (target.dataset.returnCart !== undefined) {
    modal.close();
    quoteDrawer.classList.add("is-open");
    quoteDrawer.setAttribute("aria-hidden", "false");
  }
  const faq = event.target.closest(".faq-grid details");
  if (faq && !event.target.closest("summary, button")) {
    faq.open = !faq.open;
  }
});

document.addEventListener("toggle", (event) => {
  if (!event.target.matches(".product-accordion-item") || !event.target.open) return;
  document.querySelectorAll(".product-accordion-item[open]").forEach((item) => {
    if (item !== event.target) item.open = false;
  });
}, true);

document.addEventListener("change", (event) => {
  const qtyId = event.target?.dataset?.optionQty;
  const printId = event.target?.dataset?.optionPrint;
  const handleId = event.target?.dataset?.optionHandle;
  if (qtyId) updateProductTotal(qtyId);
  if (printId) updateProductTotal(printId);
  if (handleId) updateHandleColors(handleId);
});

document.addEventListener("dragstart", (event) => {
  const card = event.target.closest?.(".product-accordion-item[draggable='true']");
  if (!card || !editorMode) return;
  draggedProductId = card.dataset.productId;
  event.dataTransfer.effectAllowed = "move";
  card.classList.add("is-dragging");
});

document.addEventListener("dragover", (event) => {
  if (!draggedProductId || !editorMode) return;
  const card = event.target.closest?.(".product-accordion-item");
  if (card) {
    event.preventDefault();
    card.classList.add("is-drop-target");
  }
});

document.addEventListener("dragleave", (event) => {
  event.target.closest?.(".product-accordion-item")?.classList.remove("is-drop-target");
});

document.addEventListener("drop", async (event) => {
  if (!draggedProductId || !editorMode) return;
  const targetCard = event.target.closest?.(".product-accordion-item");
  if (!targetCard || targetCard.dataset.productId === draggedProductId) return;
  event.preventDefault();
  const fromIndex = products.findIndex((product) => product.id === draggedProductId);
  const toIndex = products.findIndex((product) => product.id === targetCard.dataset.productId);
  if (fromIndex < 0 || toIndex < 0) return;
  const [moved] = products.splice(fromIndex, 1);
  products.splice(toIndex, 0, moved);
  products.forEach((product, index) => {
    product.orden = index + 1;
  });
  saveProducts();
  renderAll();
  try {
    await syncProductsToFirestore();
    showCustomNotice("Orden guardado", "El nuevo orden de productos se sincronizó con Firebase.", "success");
  } catch (error) {
    console.error(error);
    showCustomNotice("Orden guardado localmente", "El orden cambió en este navegador, pero Firebase no respondió.", "danger");
  }
});

document.addEventListener("dragend", () => {
  draggedProductId = "";
  document.querySelectorAll(".is-dragging, .is-drop-target").forEach((node) => node.classList.remove("is-dragging", "is-drop-target"));
});

document.addEventListener("click", (event) => {
  const image = event.target.closest("[data-image-preview]");
  if (!image) return;
  event.preventDefault();
  event.stopPropagation();
  openProduct(image.dataset.imagePreview);
}, true);

productSearch?.addEventListener("input", (event) => {
  filters.search = event.target.value;
  renderAll();
});

["subcategoryFilter", "materialFilter", "usageFilter", "packageFilter", "priceFilter", "customFilter"].forEach((id) => {
  document.getElementById(id)?.addEventListener("change", (event) => {
    const key = id.replace("Filter", "");
    filters[key] = event.target.value;
    renderAll();
  });
});

document.getElementById("clearFilters")?.addEventListener("click", () => {
  filters = { search: "", subcategory: "all", material: "all", usage: "all", package: "all", price: "all", custom: "all" };
  activeFamily = "all";
  productSearch.value = "";
  renderAll();
});

document.getElementById("prevFeatured")?.addEventListener("click", () => {
  const total = Math.max(1, products.filter((product) => product.destacado).length || products.length);
  featuredIndex = (featuredIndex - 1 + total) % total;
  renderFeatured();
});

document.getElementById("nextFeatured")?.addEventListener("click", () => {
  const total = Math.max(1, products.filter((product) => product.destacado).length || products.length);
  featuredIndex = (featuredIndex + 1) % total;
  renderFeatured();
});

function stepReviews(direction) {
  const reviewPool = editorMode ? reviews : reviews.filter((review) => review.approved !== false);
  if (!reviewPool.length) return;
  reviewIndex = (reviewIndex + direction + reviewPool.length) % reviewPool.length;
  renderReviews();
}

document.getElementById("prevReview")?.addEventListener("click", () => stepReviews(-1));
document.getElementById("nextReview")?.addEventListener("click", () => stepReviews(1));

document.getElementById("modalClose")?.addEventListener("click", () => modal.close());
modal?.addEventListener("click", (event) => {
  if (event.target === modal) modal.close();
});
modal?.addEventListener("close", () => {
  if (modalGalleryTimer) clearInterval(modalGalleryTimer);
  modalGalleryTimer = null;
  currentModalProductId = "";
  currentModalImageIndex = 0;
  modalContent.innerHTML = "";
});
document.getElementById("confirmCartClose")?.addEventListener("click", () => confirmCartModal?.close());
document.getElementById("confirmCartCancel")?.addEventListener("click", () => confirmCartModal?.close());
document.getElementById("confirmCartAccept")?.addEventListener("click", () => {
  if (pendingCartProductId) addToRequest(pendingCartProductId);
  pendingCartProductId = "";
  confirmCartModal?.close();
  if (!quoteDrawer) return;
  quoteDrawer.classList.add("is-open");
  quoteDrawer.setAttribute("aria-hidden", "false");
});
document.getElementById("confirmCartContinue")?.addEventListener("click", () => {
  if (pendingCartProductId) {
    const productId = pendingCartProductId;
    pendingCartProductId = "";
    addToRequest(productId);
    quoteDrawer?.classList.remove("is-open");
    quoteDrawer?.setAttribute("aria-hidden", "true");
  }
  confirmCartModal?.close();
});
confirmCartModal?.addEventListener("click", (event) => {
  if (event.target === confirmCartModal) confirmCartModal.close();
});
document.getElementById("orderConfirmClose")?.addEventListener("click", () => orderConfirmModal?.close());
document.getElementById("orderConfirmCancel")?.addEventListener("click", () => {
  orderConfirmModal?.close();
  if (!quoteDrawer) return;
  quoteDrawer.classList.add("is-open");
  quoteDrawer.setAttribute("aria-hidden", "false");
});
document.getElementById("orderConfirmSend")?.addEventListener("click", () => {
  if (!pendingOrderMessage) return;
  window.open(whatsappUrl(pendingOrderMessage), "_blank", "noopener");
  orderConfirmModal?.close();
});
orderConfirmModal?.addEventListener("click", (event) => {
  if (event.target === orderConfirmModal) orderConfirmModal.close();
});
document.getElementById("modalPrev")?.addEventListener("click", () => switchModalProduct(-1));
document.getElementById("modalNext")?.addEventListener("click", () => switchModalProduct(1));
document.getElementById("quoteDrawerToggle")?.addEventListener("click", () => {
  if (!quoteDrawer) return;
  quoteDrawer.classList.toggle("is-open");
  quoteDrawer.setAttribute("aria-hidden", String(!quoteDrawer.classList.contains("is-open")));
});
document.addEventListener("pointerdown", (event) => {
  if (!quoteDrawer) return;
  if (!quoteDrawer.classList.contains("is-open")) return;
  if (quoteDrawer.contains(event.target) || event.target.closest("#quoteDrawerToggle")) return;
  quoteDrawer.classList.remove("is-open");
  quoteDrawer.setAttribute("aria-hidden", "true");
});
document.getElementById("closeQuoteDrawer")?.addEventListener("click", () => {
  quoteDrawer?.classList.remove("is-open");
  quoteDrawer?.setAttribute("aria-hidden", "true");
});
quoteNotes?.addEventListener("input", () => {
  if (quoteNotes.value.trim().toLowerCase() !== "modo admin") return;
  quoteNotes.value = "";
  requestEditorFromCart();
});
document.getElementById("adminExitButton")?.addEventListener("click", () => {
  editorMode = false;
  document.body.classList.remove("admin-mode");
  document.getElementById("adminExitButton").hidden = true;
  document.getElementById("adminSaveButton").hidden = true;
  document.querySelectorAll(".inline-editable").forEach((node) => {
    node.contentEditable = "false";
    node.classList.remove("inline-editable");
  });
  renderAll();
});
async function saveAdminProgress() {
  saveProducts();
  savePromos();
  saveSocialLinks();
  try {
    await syncProductsToFirestore();
    showCustomNotice("Guardado completo", "El catálogo se guardó en este navegador y se sincronizó con Firebase.", "success");
  } catch (error) {
    console.error(error);
    showCustomNotice("Guardado local realizado", "Se guardó en este navegador, pero Firebase no respondió. Revisa reglas/conexión e intenta nuevamente.", "danger");
  }
}
document.getElementById("sendQuoteRequest")?.addEventListener("click", sendRequest);
quoteItems?.addEventListener("input", (event) => {
  if (!event.target.dataset.requestQty) return;
  const item = requestItems.find((entry) => entry.id === event.target.dataset.requestQty);
  const product = products.find((entry) => entry.id === event.target.dataset.requestQty);
  if (item && product) {
    item.quantity = event.target.value;
    const selection = calculateSelection(product, item.quantity, item.print);
    item.unitPrice = selection.unitLabel;
    item.total = selection.total;
    item.totalLabel = selection.totalLabel;
    saveRequest();
    renderRequest();
  }
});
quoteItems?.addEventListener("change", (event) => {
  if (!event.target.dataset.requestQty) return;
  const item = requestItems.find((entry) => entry.id === event.target.dataset.requestQty);
  const product = products.find((entry) => entry.id === event.target.dataset.requestQty);
  if (item && product) {
    item.quantity = event.target.value;
    const selection = calculateSelection(product, item.quantity, item.print);
    item.unitPrice = selection.unitLabel;
    item.total = selection.total;
    item.totalLabel = selection.totalLabel;
    saveRequest();
    renderRequest();
  }
});

document.getElementById("chatToggle")?.addEventListener("click", () => {
  chatPanel.classList.toggle("is-open");
  chatPanel.setAttribute("aria-hidden", String(!chatPanel.classList.contains("is-open")));
  renderChat();
});
document.getElementById("chatClose")?.addEventListener("click", () => {
  chatPanel.classList.remove("is-open");
  chatPanel.setAttribute("aria-hidden", "true");
});
document.getElementById("chatInputForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("chatTextInput");
  handleChatText(input.value);
  input.value = "";
});
document.getElementById("headerEditorButton")?.addEventListener("click", requestEditorFromCart);
document.getElementById("editorClose")?.addEventListener("click", () => editorModal.close());
document.getElementById("newProductButton")?.addEventListener("click", () => fillEditorForm(null));
document.getElementById("adminSaveButton")?.addEventListener("click", saveAdminProgress);
document.getElementById("saveAdminProgressButton")?.addEventListener("click", saveAdminProgress);
document.getElementById("syncFirebaseButton")?.addEventListener("click", async () => {
  if (!confirm(`¿Subir ${products.length} productos actuales a Firebase? Esto actualizará documentos con el mismo ID.`)) return;
  await saveAdminProgress();
});
document.getElementById("saveSocialLinksButton")?.addEventListener("click", () => {
  saveSocialLinks();
  alert("Redes sociales guardadas.");
});
document.getElementById("exportJsonButton")?.addEventListener("click", () => exportProducts());
document.getElementById("backupJsonButton")?.addEventListener("click", () => exportProducts(`respaldo-catalogo-ecof-${new Date().toISOString().replace(/[:.]/g, "-")}.json`));
document.getElementById("restoreCatalogButton")?.addEventListener("click", () => {
  if (!confirm("Esto reemplazará el catálogo guardado por el catálogo de ejemplo. ¿Deseas continuar?")) return;
  products = defaultProducts;
  saveProducts();
  editorSelectedId = products[0]?.id || "";
  renderAll();
  fillEditorForm(products[0]);
});
document.getElementById("importJsonInput")?.addEventListener("change", (event) => importProducts(event.target.files[0]));
document.getElementById("editorImageFile")?.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById("editorImagen").value = reader.result;
    document.getElementById("editorImagenMiniatura").value = reader.result;
    document.getElementById("editorImagenPrincipal").value = reader.result;
    const gallery = document.getElementById("editorGaleria");
    const current = gallery.value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
    if (current.length < 3) gallery.value = [...current, reader.result].slice(0, 3).join("\n");
    const status = document.getElementById("editorImageFileName");
    if (status) status.textContent = `Archivo cargado: ${file.name}`;
    renderEditorGalleryManager();
  };
  reader.readAsDataURL(file);
});
document.getElementById("editorGaleria")?.addEventListener("input", renderEditorGalleryManager);
document.getElementById("promoImageFile")?.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById("promoImagen").value = reader.result;
  };
  reader.readAsDataURL(file);
});

editorForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const product = await saveEditorProductToState({ syncFirebase: true });
    if (!product) return;
    showCustomNotice("Producto guardado", `"${product.nombre}" se guardó en Firebase.`, "success");
  } catch (error) {
    console.error(error);
    showCustomNotice("Guardado local", "El producto quedó guardado en este navegador, pero no se pudo subir a Firebase.", "danger");
  }
});

document.getElementById("saveProductFirebaseButton")?.addEventListener("click", async () => {
  try {
    const product = await saveEditorProductToState({ syncFirebase: true });
    if (!product) return;
    showCustomNotice("Guardado en Firebase", `"${product.nombre}" quedó sincronizado. Puedes recargar y seguirá apareciendo.`, "success");
  } catch (error) {
    console.error(error);
    showCustomNotice("No se pudo guardar en Firebase", "Revisa la conexión o las reglas de Firestore. El producto quedó guardado localmente.", "danger");
  }
});

document.getElementById("deleteProductButton")?.addEventListener("click", async () => {
  const id = document.getElementById("editorId").value;
  if (!id || !confirm("¿Eliminar este producto del catálogo?")) return;
  products = products.filter((product) => product.id !== id);
  requestItems = requestItems.filter((item) => item.id !== id);
  editorSelectedId = products[0]?.id || "";
  saveProducts();
  saveRequest();
  renderAll();
  fillEditorForm(products[0] || null);
  try {
    await deleteProductFromFirestore(id);
    showCustomNotice("Producto eliminado", "También se eliminó de Firebase.", "success");
  } catch (error) {
    console.error(error);
    showCustomNotice("Eliminado local", "Se eliminó de la página local, pero Firebase no respondió.", "danger");
  }
});

document.getElementById("promoForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const promo = promoFromEditor();
  const index = promos.findIndex((item) => item.id === promo.id);
  if (index >= 0) promos[index] = promo;
  else promos.unshift(promo);
  editorSelectedPromoId = promo.id;
  savePromos();
  saveSocialLinks();
  renderAll();
  fillPromoForm(promo);
});

document.getElementById("deletePromoButton")?.addEventListener("click", () => {
  const id = document.getElementById("promoId").value;
  if (!id || !confirm("¿Eliminar esta promoción?")) return;
  promos = promos.filter((promo) => promo.id !== id);
  editorSelectedPromoId = promos[0]?.id || "";
  savePromos();
  renderAll();
  fillPromoForm(promos[0] || null);
});

document.getElementById("editorFamilia")?.addEventListener("change", (event) => {
  const family = familyById(event.target.value);
  document.getElementById("editorCategoria").value = family?.category || "";
  const subcategory = document.getElementById("editorSubcategoria");
  if (!subcategory.value.trim() || subcategory.value === "Fundas personalizadas con logo") {
    subcategory.value = defaultSubcategoryForCatalog(inferCatalogFamilyFromBase(event.target.value), event.target.value);
  }
});

document.querySelectorAll(".payment-option").forEach((button) => {
  button.addEventListener("click", () => {
    selectedPaymentMethod = button.dataset.method;
    document.querySelectorAll(".payment-option").forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
  });
});

document.getElementById("paymentForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.getElementById("payName").value.trim();
  const email = document.getElementById("payEmail").value.trim();
  const amount = document.getElementById("payAmount").value;
  const concept = document.getElementById("payConcept").value.trim();
  if (!name || !email || !amount || !concept) return;
  // Integración futura: conectar aquí PayPhone, Datafast, Kushki, Stripe,
  // Mercado Pago o PayPal mediante backend seguro y credenciales reales.
  window.open(whatsappUrl(`Hola ECOF, quiero solicitar un link de pago. Nombre: ${name}. Correo: ${email}. Monto: $${amount}. Concepto: ${concept}. Método preferido: ${selectedPaymentMethod}.`), "_blank", "noopener");
});

document.getElementById("quoteForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const wantsLogo = data.get("logo") ? "si" : "no";
  const message = [
    "Hola ECOF, quiero enviar una solicitud de cotización.",
    `Nombre: ${data.get("name")}`,
    `Empresa: ${data.get("company") || "No indicada"}`,
    `WhatsApp: ${data.get("phone")}`,
    `Correo: ${data.get("email") || "No indicado"}`,
    `Producto: ${data.get("product")}`,
    `Cantidad: ${data.get("quantity") || "Por definir"}`,
    `Medidas: ${data.get("size") || "Por definir"}`,
    `Material: ${data.get("material")}`,
    `Impresión con logo: ${wantsLogo}`,
    `Comentarios: ${data.get("comments") || "Sin comentarios"}`
  ].join("\n");
  window.open(whatsappUrl(message), "_blank", "noopener");
});

document.getElementById("reviewForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.getElementById("reviewName").value.trim();
  const rating = Number(document.getElementById("reviewRating").value);
  const comment = document.getElementById("reviewComment").value.trim();
  if (!name || !comment) return;
  const blockedWord = blockedWordIn(name) || blockedWordIn(comment);
  if (blockedWord) {
    showPolicyAlert(blockedWord);
    return;
  }
  reviews.unshift({ id: `review-${Date.now()}`, name, rating, comment, approved: false });
  saveReviews();
  event.currentTarget.reset();
  renderReviews();
  showCustomNotice("Comentario recibido", "Tu comentario quedará visible cuando ECOF lo apruebe.", "success");
});

setInterval(() => {
  const reviewPool = editorMode ? reviews : reviews.filter((review) => review.approved !== false);
  if (!reviewPool.length) return;
  reviewIndex = (reviewIndex + 1) % reviewPool.length;
  renderReviews();
}, 5200);

setInterval(() => {
  if (document.getElementById("promoGrid")) renderPromos();
}, 1000);

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("is-visible");
  });
}, { threshold: 0.12 });

document.querySelectorAll(".section, .quick-benefits article").forEach((section) => {
  section.classList.add("reveal");
  observer.observe(section);
});

document.addEventListener("toggle", (event) => {
  const detail = event.target;
  if (!detail.matches?.(".faq-grid details") || !detail.open) return;
  document.querySelectorAll(".faq-grid details[open]").forEach((item) => {
    if (item !== detail) item.open = false;
  });
}, true);

async function startPublicCatalog() {
  const requestedFamily = new URLSearchParams(window.location.search).get("familia");
  if (requestedFamily && visibleFamilyIds.includes(requestedFamily)) activeFamily = requestedFamily;
  applySavedPageContent();
  applySocialLinks();
  renderAll();
  setupHeroCarousel();
  await loadProductsFromFirestore();
}

startPublicCatalog();


