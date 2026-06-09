import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Express } from 'express';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
    uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result.secure_url); 
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async deleteFile(publicId: string) {
    return cloudinary.uploader.destroy(publicId);
  }

  extractPublicId(url: string): string {
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        const pathParts = parts.slice(uploadIndex + 2); 
        const filename = pathParts[pathParts.length - 1].split('.')[0]; 
        pathParts[pathParts.length - 1] = filename;
        return pathParts.join('/'); // restaurant-images/abc
    }
}
