
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as toStream from 'streamifier';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  async uploadImage(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { 
            folder: 'dailymart_products',
            resource_type: 'auto'
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Cloudinary upload failed'));
          resolve(result);
        },
      );

      toStream.createReadStream(file.buffer).pipe(upload);
    });
  }
}
