import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 1. File Size Validation (Max 2MB)
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 2MB limit' }, { status: 400 });
    }

    // 2. MIME Type Validation
    const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, and WEBP images are allowed.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Magic Bytes / Header Validation (Double check file content)
    // JPEG starts with [0xFF, 0xD8, 0xFF]
    // PNG starts with [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
    // WEBP starts with [0x52, 0x49, 0x46, 0x46] at byte 0 and [0x57, 0x45, 0x42, 0x50] at byte 8 (RIFF...WEBP)
    let isValidHeader = false;
    const header = buffer.subarray(0, 12);
    if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
      isValidHeader = true; // JPEG
    } else if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
      isValidHeader = true; // PNG
    } else if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
               header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50) {
      isValidHeader = true; // WEBP
    }

    if (!isValidHeader) {
      return NextResponse.json({ error: 'Invalid image content. File headers mismatch.' }, { status: 400 });
    }


    // Upload to Cloudinary using a Promise
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'leetcode-clone' }, // Optional: specify a folder
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
