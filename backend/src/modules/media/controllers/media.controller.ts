import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiProduces,
} from '@nestjs/swagger';
import { MediaService } from '../services/media.service';
import { MediaType, UploadMediaDto, MediaResponseDto, UploadResultDto } from '../dto/media.dto';
import { Permissions } from '@/modules/permissions/decorators/permissions.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/permissions/guards/permission.guard';

@ApiTags('media')
@Controller('media')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @Permissions('media.upload')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        type: {
          type: 'string',
          enum: Object.values(MediaType),
        },
        folder: {
          type: 'string',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload a file' })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: UploadResultDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const result = await this.mediaService.uploadFile(file, dto.folder);

    return {
      media: result,
      url: result.fileUrl,
    };
  }

  @Post('upload/audio')
  @Permissions('media.upload')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an audio file' })
  @ApiResponse({
    status: 201,
    description: 'Audio file uploaded successfully',
    type: UploadResultDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAudio(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Audio file is required');
    }

    const result = await this.mediaService.uploadAudio(file, folder || 'audio');

    return {
      media: result,
      url: result.fileUrl,
    };
  }

  @Post('upload/image')
  @Permissions('media.upload')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an image file' })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: UploadResultDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const result = await this.mediaService.uploadImage(file, folder || 'images');

    return {
      media: result,
      url: result.fileUrl,
    };
  }

  @Get(':id/url')
  @ApiOperation({ summary: 'Get signed URL for a file' })
  @ApiResponse({
    status: 200,
    description: 'Signed URL generated',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
      },
    },
  })
  async getSignedUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('expiresIn') expiresIn?: number,
  ) {
    const media = await this.mediaService.getSignedUrl(id);
    return { url: media };
  }

  @Delete('*')
  @Permissions('media.delete')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 204, description: 'File deleted successfully' })
  async deleteFile(@Param() params: Record<string, string>) {
    const fileKey = params[0];
    await this.mediaService.deleteFile(fileKey);
  }
}
