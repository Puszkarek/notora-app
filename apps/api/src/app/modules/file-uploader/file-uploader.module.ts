import { Module } from '@nestjs/common';
import { NestjsFormDataModule } from 'nestjs-form-data';

import { FileUploaderService } from './file-uploader.service';

@Module({
  imports: [NestjsFormDataModule],
  providers: [FileUploaderService],
  exports: [FileUploaderService],
})
export class FileUploaderModule {}
