
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(file: File): Promise<{ secure_url: string, public_id: string }> {
    const fileBuffer = await file.arrayBuffer();
    const mime = file.type;
    const encoding = 'base64';
    const base64Data = Buffer.from(fileBuffer).toString('base64');
    const fileUri = 'data:' + mime + ';' + encoding + ',' + base64Data;
    
    const result = await cloudinary.uploader.upload(fileUri, {
      folder: 'bondhon17',
      invalidate: true,
    });
    
    return { secure_url: result.secure_url, public_id: result.public_id };
}

export async function deleteFromCloudinary(publicId: string | null | undefined) {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error(`Failed to delete ${publicId} from Cloudinary:`, error);
    }
}
