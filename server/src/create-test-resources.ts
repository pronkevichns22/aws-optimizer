import dotenv from 'dotenv';
import {
  EC2Client,
  CreateVolumeCommand,
  RunInstancesCommand,
  AllocateAddressCommand,
  DescribeVolumesCommand,
} from '@aws-sdk/client-ec2';

dotenv.config();

const ec2 = new EC2Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT || 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
});

async function createTestResources() {
  try {
    console.log('🚀 Создаём тестовые ресурсы в LocalStack...\n');

    // 1️⃣ Создаём несколько EBS дисков
    console.log('📦 Создаём EBS диски...');
    for (let i = 1; i <= 3; i++) {
      const volumeResult = await ec2.send(
        new CreateVolumeCommand({
          AvailabilityZone: 'us-east-1a',
          Size: 10 + i * 5, // 15GB, 20GB, 25GB
          VolumeType: 'gp2',
          TagSpecifications: [
            {
              ResourceType: 'volume',
              Tags: [
                { Key: 'Name', Value: `test-volume-${i}` },
                { Key: 'Environment', Value: 'test' },
              ],
            },
          ],
        })
      );
      console.log(`   ✅ Создан EBS том: ${volumeResult.VolumeId} (${10 + i * 5}GB)`);
    }

    // 2️⃣ Создаём EC2 инстанс
    console.log('\n🖥️  Создаём EC2 инстанс...');
    const instanceResult = await ec2.send(
      new RunInstancesCommand({
        ImageId: 'ami-12345678', // LocalStack не проверяет реальный ID
        MinCount: 1,
        MaxCount: 1,
        InstanceType: 't2.micro',
        TagSpecifications: [
          {
            ResourceType: 'instance',
            Tags: [
              { Key: 'Name', Value: 'test-instance' },
              { Key: 'Environment', Value: 'test' },
            ],
          },
        ],
      })
    );
    const instanceId = instanceResult.Instances?.[0]?.InstanceId;
    console.log(`   ✅ Создан EC2 инстанс: ${instanceId}`);

    // 3️⃣ Создаём Elastic IP
    console.log('\n🌐 Создаём Elastic IP...');
    const ipResult = await ec2.send(
      new AllocateAddressCommand({
        Domain: 'vpc',
      })
    );
    console.log(
      `   ✅ Создан Elastic IP: ${ipResult.PublicIp} (AllocationId: ${ipResult.AllocationId})`
    );

    // 4️⃣ Создаём ещё несколько "мусорных" EBS дисков
    console.log('\n📦 Создаём дополнительные "мусорные" диски...');
    for (let i = 4; i <= 5; i++) {
      const volumeResult = await ec2.send(
        new CreateVolumeCommand({
          AvailabilityZone: 'us-east-1b',
          Size: 5,
          VolumeType: 'gp2',
          TagSpecifications: [
            {
              ResourceType: 'volume',
              Tags: [
                { Key: 'Name', Value: `unused-volume-${i}` },
                { Key: 'Status', Value: 'unused' },
              ],
            },
          ],
        })
      );
      console.log(`   ✅ Создан неиспользуемый диск: ${volumeResult.VolumeId} (5GB)`);
    }

    console.log('\n✨ Тестовые ресурсы созданы! Теперь можете их удалять через приложение.\n');

    // Показываем все диски для проверки
    const volumesResult = await ec2.send(new DescribeVolumesCommand({}));
    console.log(`📊 Всего создано дисков: ${volumesResult.Volumes?.length || 0}`);
    console.log(`   Перейдите на страницу в приложении и нажимайте Delete!\n`);
  } catch (error) {
    console.error('❌ Ошибка при создании ресурсов:', error);
    process.exit(1);
  }
}

createTestResources();
