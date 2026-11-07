const MAX_SIDE = 1024;

/**
 * Achica la foto en el navegador antes de subirla (las del celular pesan varios MB).
 * El recorte final, el formato y el borrado de metadatos los hace el servidor.
 * Devuelve la imagen en base64 (JPEG), sin el prefijo `data:`.
 */
export async function shrinkForUpload(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}
