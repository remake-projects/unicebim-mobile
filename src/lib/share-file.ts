import { File, Paths } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';

type ShareOptions = { mimeType: string; uti: string; dialogTitle?: string };

/** Writes `content` to a cache file named `fileName` and opens the system share sheet for it. */
export async function shareTextFile(fileName: string, content: string, options: ShareOptions): Promise<void> {
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(content);
  await shareAsync(file.uri, { mimeType: options.mimeType, UTI: options.uti, dialogTitle: options.dialogTitle });
}
