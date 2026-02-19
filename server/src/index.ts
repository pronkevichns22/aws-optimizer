import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { EC2Client, DescribeVolumesCommand, DescribeAddressesCommand, DescribeInstancesCommand } from '@aws-sdk/client-ec2';

// 1. Загружаем настройки из .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 2. Middleware (Прослойки)
app.use(cors()); // Позволяет React-приложению делать запросы к этому серверу
app.use(express.json()); // Позволяет серверу понимать формат JSON

// 3. Настройка схемы MongoDB (как будут выглядеть данные в базе)
const AuditSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    totalWasted: Number,
    resourcesFound: Array
});
const Audit = mongoose.model('Audit', AuditSchema);

// 4. Настройка клиента AWS для связи с LocalStack
const ec2 = new EC2Client({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    },
});

// 5. Главный роут (путь) для сканирования AWS
app.get('/api/scan', async (req, res) => {
    try {
        console.log('🔍 Полный скан инфраструктуры...');

        // 1. ПОЛУЧАЕМ ВСЕ ДИСКИ (EBS)
        const volData = await ec2.send(new DescribeVolumesCommand({}));
        const volumes = volData.Volumes || [];
        console.log(`📦 Найденo дисков: ${volumes.length}`);
        
        // 2. ПОЛУЧАЕМ ВСЕ СЕРВЕРА (EC2)
        const instData = await ec2.send(new DescribeInstancesCommand({}));
        const instances = instData.Reservations?.flatMap(r => r.Instances || []) || [];
        console.log(`🖥️  Найheно серверов: ${instances.length}`);

        // 3. ПОЛУЧАЕМ IP
        const ipData = await ec2.send(new DescribeAddressesCommand({}));
        const ips = ipData.Addresses || [];
        console.log(`🌐 Найдено IP: ${ips.length}`);

        // --- РАСЧЕТЫ (МАТЕМАТИКА) ---

        // Цены (условные)
        const PRICE_PER_GB = 0.08;      // $ за ГБ диска
        const PRICE_PER_SERVER = 15.00; // $ за t2.micro сервер в месяц
        const PRICE_PER_IP = 3.60;      // $ за простой IP

        // А. Считаем ПОЛНУЮ стоимость (Total Spend)
        const totalDisksCost = volumes.reduce((sum, v) => sum + (v.Size || 0) * PRICE_PER_GB, 0);
        const totalServersCost = instances.filter(i => i.State?.Name === 'running').length * PRICE_PER_SERVER;
        const totalSpend = totalDisksCost + totalServersCost;
        console.log(`💰 Total Spend: $${totalSpend.toFixed(2)}`);

        // Б. Считаем МУСОР (Total Waste)
        const wastedVolumes = volumes.filter(v => v.State === 'available');
        const wastedVolCost = wastedVolumes.reduce((sum, v) => sum + (v.Size || 0) * PRICE_PER_GB, 0);

        const wastedIps = ips.filter(ip => !ip.AssociationId);
        const wastedIpCost = wastedIps.length * PRICE_PER_IP;

        const totalWaste = wastedVolCost + wastedIpCost;
        console.log(`❌ Total Waste: $${totalWaste.toFixed(2)}`);

        // 4. Формируем красивый ответ
        const result = {
            summary: {
                totalSpend: parseFloat(totalSpend.toFixed(2)),
                totalWaste: parseFloat(totalWaste.toFixed(2)),
                serverCount: instances.length,
                diskCount: volumes.length,
                wasteCount: wastedVolumes.length + wastedIps.length
            },
            // ВСЕ ресурсы (активные + неиспользуемые)
            allResources: [
                // Все EC2 инстансы
                ...instances.map(inst => ({
                    id: inst.InstanceId,
                    type: 'EC2',
                    size: 0,
                    cost: inst.State?.Name === 'running' ? PRICE_PER_SERVER : 0,
                    region: inst.Placement?.AvailabilityZone || 'unknown',
                    status: inst.State?.Name || 'unknown'
                })),
                // Все EBS диски
                ...volumes.map(vol => ({
                    id: vol.VolumeId,
                    type: 'EBS',
                    size: vol.Size,
                    cost: parseFloat(((vol.Size || 0) * PRICE_PER_GB).toFixed(2)),
                    region: vol.AvailabilityZone || 'unknown',
                    status: vol.State || 'unknown'
                })),
                // Все Elastic IPs
                ...ips.map(ip => ({
                    id: ip.PublicIp,
                    type: 'IP',
                    size: 0,
                    cost: ip.AssociationId ? 0 : PRICE_PER_IP,  // Платим только за неиспользуемые IPs
                    region: ip.Domain || 'vpc',
                    status: ip.AssociationId ? 'attached' : 'unattached'
                }))
            ],
            // ТОЛЬКО неиспользуемые ресурсы
            resources: [
                ...wastedVolumes.map(v => ({ 
                    id: v.VolumeId, 
                    type: 'EBS', 
                    size: v.Size, 
                    cost: parseFloat(((v.Size || 0) * PRICE_PER_GB).toFixed(2)),
                    region: v.AvailabilityZone 
                })),
                ...wastedIps.map(ip => ({ 
                    id: ip.PublicIp, 
                    type: 'IP', 
                    size: 0, 
                    cost: PRICE_PER_IP,
                    region: ip.Domain 
                }))
            ]
        };

        console.log('✅ Результат:', JSON.stringify(result, null, 2));

        // Сохраняем в базу
        await Audit.create({
            totalWasted: totalWaste,
            resourcesFound: result.resources
        });

        // ОТПРАВЛЯЕМ РЕЗУЛЬТАТ
        return res.json(result);

    } catch (error) {
        console.error('❌ Ошибка при сканировании:', error);
        return res.status(500).json({ error: 'Scan failed', message: String(error) });
    }
});

// 6. Подключение к MongoDB и запуск сервера
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aws_optimizer')
    .then(() => {
        console.log('✅ MongoDB подключена');
        app.listen(PORT, () => {
            console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Ошибка подключения к MongoDB:', err);
        process.exit(1);
    });