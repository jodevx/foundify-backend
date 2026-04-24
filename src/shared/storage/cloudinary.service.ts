import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { UploadedFile } from './uploaded-file.interface';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadProfilePhoto(file: UploadedFile): Promise<string> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: 'foundify/profile-photos',
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            reject(
              new InternalServerErrorException(
                'Could not upload profile photo',
              ),
            );
            return;
          }
          resolve(result.secure_url);
        },
      );

      upload.end(file.buffer);
    });
  }

  async uploadItemPhoto(file: UploadedFile): Promise<string> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: 'foundify/items',
          resource_type: 'image',
          max_file_size: 5242880, // 5MB
        },
        (error, result) => {
          if (error || !result) {
            reject(
              new InternalServerErrorException(
                'Could not upload item photo',
              ),
            );
            return;
          }
          resolve(result.secure_url);
        },
      );

      upload.end(file.buffer);
    });
  }
}
