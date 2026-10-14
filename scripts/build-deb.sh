#!/bin/bash

# Este script empaqueta el sistema vCard QR en un archivo .deb
# Requisitos previos en el entorno de compilación: nodejs, npm, dpkg-deb

set -e

# Configuración
VERSION="2.2.1"
PACKAGE_NAME="vcard-system"
BUILD_DIR="build_deb"
APP_DIR="/opt/${PACKAGE_NAME}"
SERVICE_FILE="scripts/vcard-system.service"
ADMIN_SERVICE_FILE="scripts/vcard-admin.service"
MAINTAINER="Ford Yude Ti <it@fordyudecanahuati.com>"
ARCH="amd64" # Cambiar a arm64 si es necesario

echo "=== Iniciando construcción del paquete Debian ==="

# 1. Preparar directorio de compilación
echo "1. Creando estructura de directorios..."
rm -rf ${BUILD_DIR}
mkdir -p ${BUILD_DIR}/DEBIAN
mkdir -p ${BUILD_DIR}${APP_DIR}
mkdir -p ${BUILD_DIR}/etc/systemd/system/

# 2. Compilar la aplicación Next.js
echo "2. Compilando aplicación Next.js..."
npm install --legacy-peer-deps
npx prisma generate
npm run build

# 3. Copiar archivos necesarios al directorio de empaquetado
echo "3. Copiando archivos a ${APP_DIR}..."
cp -R .next ${BUILD_DIR}${APP_DIR}/
cp -R node_modules ${BUILD_DIR}${APP_DIR}/
cp -R public ${BUILD_DIR}${APP_DIR}/
cp package.json ${BUILD_DIR}${APP_DIR}/
cp next.config.js ${BUILD_DIR}${APP_DIR}/
cp -R prisma ${BUILD_DIR}${APP_DIR}/
cp -R scripts ${BUILD_DIR}${APP_DIR}/
cp -R lib ${BUILD_DIR}${APP_DIR}/
cp -R .env ${BUILD_DIR}${APP_DIR}/ || echo "No .env found, skipping"

# 4. Configurar el archivo de control DEBIAN
echo "4. Generando DEBIAN/control..."
cat <<EOF > ${BUILD_DIR}/DEBIAN/control
Package: ${PACKAGE_NAME}
Version: ${VERSION}
Section: web
Priority: optional
Architecture: ${ARCH}
Maintainer: ${MAINTAINER}
Description: Sistema de Gestión de vCards QR
 Portal Cautivo y Generador de vCards para Ford Yude Canahuati.
 Requiere PostgresSQL y Node.js >= 18.
Depends: nodejs (>= 18.0.0)
EOF

# 5. Configurar Scripts de Instalación (postinst)
echo "5. Generando scripts post-instalación..."
cat <<EOF > ${BUILD_DIR}/DEBIAN/postinst
#!/bin/bash
set -e

# Crear usuario de sistema si no existe
if ! id "vcard" &>/dev/null; then
    useradd -r -s /bin/false -d /opt/vcard-system vcard
fi

# Asignar permisos
chown -R vcard:vcard /opt/vcard-system

# Recargar daemon de sistema
systemctl daemon-reload

echo "=========================================================="
echo "Instalación completada."
echo "Por favor edite el archivo /opt/vcard-system/.env con sus"
echo "credenciales de Base de Datos y ejecute:"
echo "  cd /opt/vcard-system && npx prisma db push"
echo "Luego inicie los servicios con:"
echo "  systemctl enable vcard-admin"
echo "  systemctl start vcard-admin"
echo "  systemctl enable vcard-system"
echo "  systemctl start vcard-system"
echo "=========================================================="
EOF
chmod 755 ${BUILD_DIR}/DEBIAN/postinst

# 6. Copiar el archivo de servicio de systemd
echo "6. Configurando servicios systemd..."
cp ${SERVICE_FILE} ${BUILD_DIR}/etc/systemd/system/
cp ${ADMIN_SERVICE_FILE} ${BUILD_DIR}/etc/systemd/system/

# 7. Construir el archivo .deb
echo "7. Construyendo archivo .deb..."
dpkg-deb --build ${BUILD_DIR}

# 8. Mover al root folder y limpiar
mv ${BUILD_DIR}.deb ${PACKAGE_NAME}_${VERSION}_${ARCH}.deb
rm -rf ${BUILD_DIR}

echo "=== Éxito! Paquete generado: ${PACKAGE_NAME}_${VERSION}_${ARCH}.deb ==="
