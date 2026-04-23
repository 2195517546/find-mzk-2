import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join, extname, basename } from 'path';

const imagesDir = './public/assets/images';

async function convertToWebP() {
  try {
    const files = await readdir(imagesDir);
    const imageFiles = files.filter(file =>
      ['.png', '.jpg', '.jpeg'].includes(extname(file).toLowerCase())
    );

    console.log(`找到 ${imageFiles.length} 个图片文件`);

    for (const file of imageFiles) {
      const inputPath = join(imagesDir, file);
      const outputPath = join(imagesDir, basename(file, extname(file)) + '.webp');

      try {
        await sharp(inputPath)
          .webp({ quality: 80 })
          .toFile(outputPath);

        console.log(`✓ 已转换: ${file} -> ${basename(outputPath)}`);
      } catch (err) {
        console.error(`✗ 转换失败: ${file}`, err.message);
      }
    }

    console.log('\n转换完成！');
  } catch (err) {
    console.error('错误:', err);
  }
}

convertToWebP();
