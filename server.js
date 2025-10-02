const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 数据库连接配置
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // 你的MySQL用户名
    password: 'r07a10n27', // 你的MySQL密码
    database: 'my_database_1'
});

// 连接数据库
db.connect(err => {
    if (err) {
        console.error('数据库连接失败:', err);
        return;
    }
    console.log('数据库连接成功');
});

// 注册接口
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // 检查用户名是否已存在
        const [users] = await db.promise().query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        
        if (users.length > 0) {
            return res.status(400).json({ message: '用户名已存在' });
        }
        
        // 密码加密
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 插入新用户
        await db.promise().query(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );
        
        res.status(201).json({ message: '注册成功' });
    } catch (err) {
        console.error('注册失败:', err);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 登录接口
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // 查询用户
        const [users] = await db.promise().query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }
        
        const user = users[0];
        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }
        
        // 返回用户ID（实际项目中应使用JWT令牌）
        res.json({ 
            message: '登录成功', 
            userId: user.id,
            username: user.username
        });
    } catch (err) {
        console.error('登录失败:', err);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 获取学生信息接口
app.get('/api/student-info/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const [info] = await db.promise().query(
            'SELECT * FROM student_info WHERE user_id = ?',
            [userId]
        );
        
        res.json(info.length > 0 ? info[0] : null);
    } catch (err) {
        console.error('获取学生信息失败:', err);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 保存学生信息接口
app.post('/api/student-info', async (req, res) => {
    const { userId, ...info } = req.body;
    
    try {
        // 检查是否已有信息
        const [existing] = await db.promise().query(
            'SELECT * FROM student_info WHERE user_id = ?',
            [userId]
        );
        
        if (existing.length > 0) {
            // 更新现有信息
            await db.promise().query(
                `UPDATE student_info SET 
                    student_id = ?, name = ?, nationality = ?, political_status = ?,
                    province = ?, city = ?, district = ?, town = ?, village = ?,
                    postal_code = ?, phone = ?, email = ?, household_type = ?,
                    birthdate = ?, birth_province = ?, birth_city = ?, birth_district = ?,
                    father_name = ?, father_phone = ?, father_unit = ?, father_job = ?,
                    mother_name = ?, mother_phone = ?, mother_unit = ?, mother_job = ?,
                    high_school = ?
                 WHERE user_id = ?`,
                [
                    info.studentId, info.name, info.nationality, info.politicalStatus,
                    info.province, info.city, info.district, info.town, info.village,
                    info.postalCode, info.phone, info.email, info.householdType,
                    info.birthdate, info.birthProvince, info.birthCity, info.birthDistrict,
                    info.fatherName, info.fatherPhone, info.fatherUnit, info.fatherJob,
                    info.motherName, info.motherPhone, info.motherUnit, info.motherJob,
                    info.highSchool, userId
                ]
            );
        } else {
            // 插入新信息
            await db.promise().query(
                `INSERT INTO student_info (
                    user_id, student_id, name, nationality, political_status,
                    province, city, district, town, village,
                    postal_code, phone, email, household_type,
                    birthdate, birth_province, birth_city, birth_district,
                    father_name, father_phone, father_unit, father_job,
                    mother_name, mother_phone, mother_unit, mother_job,
                    high_school
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId, info.studentId, info.name, info.nationality, info.politicalStatus,
                    info.province, info.city, info.district, info.town, info.village,
                    info.postalCode, info.phone, info.email, info.householdType,
                    info.birthdate, info.birthProvince, info.birthCity, info.birthDistrict,
                    info.fatherName, info.fatherPhone, info.fatherUnit, info.fatherJob,
                    info.motherName, info.motherPhone, info.motherUnit, info.motherJob,
                    info.highSchool
                ]
            );
        }
        
        res.json({ message: '信息保存成功' });
    } catch (err) {
        console.error('保存学生信息失败:', err);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});