# ECOF Firebase Firestore

La página pública carga productos desde la colección `productos`.
Si Firestore está vacío o falla, el catálogo usa el respaldo local existente para no romper la página.

## Estructura de documento recomendada

```js
{
  nombre: "Funda shopping mediana",
  descripcion: "Producto ECOF para negocios.",
  precio: 0.35,
  categoria: "Fundas",
  familia: "fundas",
  subcategoria: "Fundas shopping",
  imagen: "https://...",
  imagenMiniatura: "https://...",
  imagenPrincipal: "https://...",
  medidas: "22,5 x 22 x 10 cm",
  material: "Papel kraft",
  paquete: "100 unidades",
  precioPaquete: "$35,00",
  precioUnidad: "$0,35",
  codigo: "001",
  activo: true,
  destacado: false,
  orden: 1,
  etiquetas: ["Personalizable", "Kraft"],
  uso: ["Tiendas", "Boutiques"],
  galeria: ["https://..."],
  videoYoutube: "https://www.youtube.com/watch?v=...",
  preciosCantidad: {
    100: 0.35,
    300: 0.30,
    500: 0.27,
    1000: 0.21
  },
  personalizable: true,
  creado: serverTimestamp(),
  actualizado: serverTimestamp()
}
```

## Reglas temporales para pruebas

Usar solo mientras pruebas el admin. No es seguro para producción.

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /productos/{productoId} {
      allow read, write: if true;
    }
  }
}
```

## Reglas recomendadas para producción

Antes de publicar, configura Firebase Authentication y limita escritura al correo autorizado.

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /productos/{productoId} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.token.email == "aalexanderayo@gmail.com";
    }
  }
}
```

## Archivos nuevos

- `firebase.js`: conexión central a Firebase.
- `admin.html`: panel visual para productos.
- `admin.js`: CRUD de productos en Firestore.
