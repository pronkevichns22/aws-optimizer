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

// User schema для хранения учетных записей
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    awsAccessKeyId: String,
    awsSecretAccessKey: String,
    awsRegion: { type: String, default: 'us-east-1' },
    isLocalStack: { type: Boolean, default: false },
    localStackEndpoint: { type: String, default: 'http://localhost:4566' },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// Вспомогательная функция для создания EC2 клиента с нужными credentials
const createEC2Client = (credentials: any) => {
    const config: any = {
        region: credentials.region || 'us-east-1',
        credentials: {
            accessKeyId: credentials.accessKeyId || 'test',
            secretAccessKey: credentials.secretAccessKey || 'test',
        },
    };

    // Если это LocalStack, добавляем endpoint
    if (credentials.isLocalStack) {
        config.endpoint = credentials.endpoint || 'http://localhost:4566';
    }

    return new EC2Client(config);
};

// AUTHENTICATION ENDPOINTS

// 1. Регистрация нового пользователя
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, accessKeyId, secretAccessKey, region, isLocalStack, endpoint } = req.body;

        // Проверяем, существует ли пользователь
        const existingUser = await User.findOne({ 
            $or: [{ username }, { email }] 
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь с таким username или email уже существует' });
        }

        // Создаем нового пользователя (в реальном приложении нужна хеширование пароля!)
        const newUser = new User({
            username,
            email,
            password, // TODO: используйте bcrypt для хеширования!
            awsAccessKeyId: accessKeyId,
            awsSecretAccessKey: secretAccessKey,
            awsRegion: region || 'us-east-1',
            isLocalStack: isLocalStack || false,
            localStackEndpoint: endpoint || 'http://localhost:4566'
        });

        await newUser.save();

        res.status(201).json({ 
            message: 'Пользователь успешно создан',
            userId: newUser._id,
            username: newUser.username
        });
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        res.status(500).json({ error: 'Ошибка при регистрации', message: String(error) });
    }
});

// 2. Вход пользователя
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password, accessKeyId, secretAccessKey, region, isLocalStack, endpoint } = req.body;

        // Если передали credentials, используем их напрямую
        if (accessKeyId && secretAccessKey) {
            // Проверяем доступность AWS/LocalStack
            const testClient = createEC2Client({
                accessKeyId,
                secretAccessKey,
                region: region || 'us-east-1',
                isLocalStack,
                endpoint
            });

            try {
                // Пытаемся выполнить простой запрос для проверки credentials
                await testClient.send(new DescribeInstancesCommand({}));
                
                return res.status(200).json({
                    success: true,
                    message: 'Успешное подключение',
                    session: {
                        type: isLocalStack ? 'localstack' : 'aws',
                        accessKeyId: accessKeyId.substring(0, 4) + '****', // скрываем ключ
                        region: region || 'us-east-1'
                    }
                });
            } catch (awsError: any) {
                return res.status(401).json({ 
                    error: 'Неверная учетная запись или недоступна служба',
                    details: awsError.message 
                });
            }
        }

        // Если нет credentials, ищем пользователя по username
        if (username && password) {
            const user = await User.findOne({ username });

            if (!user || user.password !== password) { // TODO: используйте bcrypt.compare()!
                return res.status(401).json({ error: 'Неверный username или пароль' });
            }

            // Проверяем AWS/LocalStack credentials
            const testClient = createEC2Client({
                accessKeyId: user.awsAccessKeyId,
                secretAccessKey: user.awsSecretAccessKey,
                region: user.awsRegion,
                isLocalStack: user.isLocalStack,
                endpoint: user.localStackEndpoint
            });

            try {
                await testClient.send(new DescribeInstancesCommand({}));
                
                return res.status(200).json({
                    success: true,
                    message: 'Вход выполнен успешно',
                    userId: user._id,
                    username: user.username,
                    session: {
                        type: user.isLocalStack ? 'localstack' : 'aws',
                        region: user.awsRegion
                    }
                });
            } catch (awsError: any) {
                return res.status(401).json({ 
                    error: 'Ошибка подключения к AWS/LocalStack',
                    details: awsError.message 
                });
            }
        }

        res.status(400).json({ error: 'Требуются credentials или username/password' });
    } catch (error) {
        console.error('Ошибка при входе:', error);
        res.status(500).json({ error: 'Ошибка при входе', message: String(error) });
    }
});

// 3. Валидация текущей сессии
app.post('/api/auth/validate', async (req, res) => {
    try {
        const { accessKeyId, secretAccessKey, region, isLocalStack, endpoint } = req.body;

        const testClient = createEC2Client({
            accessKeyId,
            secretAccessKey,
            region,
            isLocalStack,
            endpoint
        });

        await testClient.send(new DescribeInstancesCommand({}));
        
        res.status(200).json({ valid: true });
    } catch (error: any) {
        res.status(401).json({ valid: false, error: error.message });
    }
});



// 5. Главный роут (путь) для сканирования AWS
app.post('/api/scan', async (req, res) => {
    try {
        const { accessKeyId, secretAccessKey, region, isLocalStack, endpoint } = req.body;

        if (!accessKeyId || !secretAccessKey) {
            return res.status(400).json({ error: 'Требуются AWS credentials' });
        }

        // Создаем EC2 клиент с переданными credentials
        const ec2 = createEC2Client({
            accessKeyId,
            secretAccessKey,
            region: region || 'us-east-1',
            isLocalStack,
            endpoint
        });

        console.log('🔍 Полный скан инфраструктуры...');
        console.log(`${isLocalStack ? '🐳 LocalStack' : '☁️ AWS'} Регион: ${region || 'us-east-1'}`);

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