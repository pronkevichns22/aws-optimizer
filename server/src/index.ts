import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { EC2Client, DescribeVolumesCommand, DescribeAddressesCommand } from '@aws-sdk/client-ec2';

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
        console.log('🔍 Запуск сканирования AWS ресурсов...');

        // А) Получаем неиспользуемые диски (EBS)
        const volCommand = new DescribeVolumesCommand({
            Filters: [{ Name: 'status', Values: ['available'] }]
        });
        const { Volumes } = await ec2.send(volCommand);

        // Б) Получаем неиспользуемые IP (Elastic IP)
        const ipCommand = new DescribeAddressesCommand({});
        const { Addresses } = await ec2.send(ipCommand);
        const unusedIps = (Addresses || []).filter(ip => !ip.AssociationId);

        // В) Превращаем "сырые" данные в понятные нам объекты
        const resources = [
            ...(Volumes || []).map(v => ({
                id: v.VolumeId,
                type: 'EBS Volume',
                size: `${v.Size} GB`,
                cost: (v.Size || 0) * 0.1 // Пример: $0.10 за ГБ
            })),
            ...unusedIps.map(ip => ({
                id: ip.PublicIp,
                type: 'Elastic IP',
                size: 'N/A',
                cost: 3.60 // Фиксированная цена за простой IP
            }))
        ];

        // Г) Считаем общую сумму потерь
        const total = resources.reduce((sum, res) => sum + res.cost, 0);

        // Д) Сохраняем результат в базу данных MongoDB
        const newAudit = await Audit.create({
            totalWasted: total,
            resourcesFound: resources
        });

        console.log('✅ Результаты сохранены в базу!');
        
        // Отправляем данные фронтенду
        res.json(newAudit);

    } catch (error) {
        console.error('❌ Ошибка сервера:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 6. Роут для получения истории (последние 5 сканирований)
app.get('/api/history', async (req, res) => {
    const history = await Audit.find().sort({ date: -1 }).limit(5);
    res.json(history);
});

// 7. Запуск сервера и подключение к базе
const start = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI!);
        console.log('🍃 MongoDB Connected');
        app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
    }
};

start();