import { supabase } from './supabase';

// ─── Upload a plant scan image and return the public URL ─────────────────────
// The image is stored at: plant-scans/<userId>/<timestamp>.jpg
export async function uploadScanImage(
  userId: string,
  imageBase64: string   // data-URL
): Promise<string> {
  const base64Data = imageBase64.includes(',')
    ? imageBase64.split(',')[1]
    : imageBase64;

  // Decode base64 to binary
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'image/jpeg' });

  const timestamp = Date.now();
  const filePath = `${userId}/${timestamp}.jpg`;

  const { error } = await supabase.storage
    .from('plant-scans')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw new Error(error.message);

  // plant-scans is a private bucket — generate a signed URL valid for 1 hour
  const { data: signedData, error: signedError } = await supabase.storage
    .from('plant-scans')
    .createSignedUrl(filePath, 3600);

  if (signedError) throw new Error(signedError.message);
  return signedData.signedUrl;
}

// ─── Upload user avatar and return the public URL ────────────────────────────
// File is stored at: avatars/<userId>/<fileName>
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const filePath = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true,   // overwrite existing avatar
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  // Bust cache with a timestamp query param
  return `${data.publicUrl}?t=${Date.now()}`;
}

// ─── Delete a plant scan from storage ────────────────────────────────────────
export async function deleteScanImage(userId: string, filePath: string): Promise<void> {
  // filePath should be relative: '<userId>/<timestamp>.jpg'
  const { error } = await supabase.storage
    .from('plant-scans')
    .remove([filePath]);

  if (error) throw new Error(error.message);
}
