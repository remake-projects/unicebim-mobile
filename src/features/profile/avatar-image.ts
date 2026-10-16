import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { launchImageLibraryAsync } from 'expo-image-picker';

/** Uploaded avatars are square JPEGs this wide; plenty for a profile picture, small to upload. */
const AVATAR_SIZE = 512;

/**
 * Lets the user pick and crop a photo, then downsizes it. Returns a local JPEG file URI,
 * or null when the picker was cancelled.
 */
export async function pickAvatarImage(): Promise<string | null> {
  const result = await launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;
  const image = await ImageManipulator.manipulate(asset.uri).resize({ width: AVATAR_SIZE, height: null }).renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  return saved.uri;
}
