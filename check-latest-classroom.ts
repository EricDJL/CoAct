
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const latestStage = await prisma.stage.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      scenes: true,
      imageFiles: true,
      audioFiles: true
    }
  });
  console.log('最新Stage:');
  console.log('ID:', latestStage?.id);
  console.log('名称:', latestStage?.name);
  console.log('图片数量:', latestStage?.imageFiles.length);
  console.log('音频数量:', latestStage?.audioFiles.length);
  console.log('--- 音频文件 ---');
  if (latestStage?.audioFiles) {
    latestStage.audioFiles.forEach((af, i) => {
      console.log(`${i + 1}. ${af.filename} - ${af.url}`);
    });
  }
  await prisma.$disconnect();
}
main();
