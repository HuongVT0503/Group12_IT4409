import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import driver from '../config/neo4j.js';

dotenv.config();

// ===== ĐĂNG KÝ NGƯỜI DÙNG MỚI =====
export async function registerUser({ username, email, phone, password }) {
    const session = driver.session();
    try {
        // Kiểm tra trùng email hoặc số điện thoại
        const checkQuery = `
      MATCH (u:User)
      WHERE u.email = $email OR u.phone = $phone
      RETURN u
    `;
        const checkResult = await session.run(checkQuery, { email, phone });

        if (checkResult.records.length > 0) {
            throw new Error('Email hoặc số điện thoại đã tồn tại!');
        }

        // Mã hóa mật khẩu
        const hashed = await bcrypt.hash(password, 10);

        // Tạo node User mới
        const createQuery = `
      CREATE (u:User {
        id: randomUUID(),
        username: $username,
        email: $email,
        phone: $phone,
        password: $hashed,
        provider: "local",
        createdAt: datetime()
      })
      RETURN u
    `;
        await session.run(createQuery, { username, email, phone, hashed });

        return { message: 'Đăng ký thành công!' };
    } finally {
        await session.close();
    }
}

// ===== ĐĂNG NHẬP BẰNG EMAIL / SĐT =====
export async function loginUser({ identifier, password }) {
    const session = driver.session();
    try {
        const query = `
      MATCH (u:User)
      WHERE u.email = $identifier OR u.phone = $identifier
      RETURN u
    `;
        const result = await session.run(query, { identifier });

        if (result.records.length === 0) {
            throw new Error('Không tìm thấy tài khoản!');
        }

        const user = result.records[0].get('u').properties;

        // So khớp mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Sai mật khẩu!');
        }

        // Sinh JWT
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.SECRET_KEY,
            { expiresIn: '3d' }
        );

        return { token, user };
    } finally {
        await session.close();
    }
}

// ===== ĐĂNG NHẬP QUA MẠNG XÃ HỘI =====
export async function socialLogin({ provider, socialId, username, email }) {
    const session = driver.session();
    try {
        // Kiểm tra user đã tồn tại chưa
        const query = `
      MATCH (u:User)
      WHERE u.socialId = $socialId AND u.provider = $provider
      RETURN u
    `;
        const result = await session.run(query, { socialId, provider });

        let user;
        if (result.records.length === 0) {
            // Tạo mới nếu chưa có
            const createQuery = `
        CREATE (u:User {
          id: randomUUID(),
          username: $username,
          email: $email,
          provider: $provider,
          socialId: $socialId,
          createdAt: datetime()
        })
        RETURN u
      `;
            const createRes = await session.run(createQuery, {
                username,
                email,
                provider,
                socialId,
            });
            user = createRes.records[0].get('u').properties;
        } else {
            user = result.records[0].get('u').properties;
        }

        // Sinh JWT
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.SECRET_KEY,
            { expiresIn: '3d' }
        );

        return { message: `Đăng nhập ${provider} thành công!`, token, user };
    } finally {
        await session.close();
    }
}
