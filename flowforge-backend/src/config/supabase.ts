import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const uploadToSupabase = async (
  file: Express.Multer.File
): Promise<string> => {
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${
    file.originalname.substring(file.originalname.lastIndexOf("."))
  }`;

  const { error } = await supabase.storage
    .from("attachments")
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from("attachments")
    .getPublicUrl(fileName);

  return data.publicUrl;
};