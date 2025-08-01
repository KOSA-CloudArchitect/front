const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || 'user';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.refreshTokens = data.refreshTokens || [];
  }

  // 비밀번호 해싱
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // 비밀번호 검증
  async validatePassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Access Token 생성
  generateAccessToken() {
    const payload = {
      id: this.id,
      email: this.email,
      role: this.role
    };

    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'default-secret-key',
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        issuer: 'kosa-backend',
        audience: 'kosa-client'
      }
    );
  }

  // Refresh Token 생성
  generateRefreshToken() {
    const refreshToken = jwt.sign(
      { 
        id: this.id,
        tokenId: uuidv4(),
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
      { 
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: 'kosa-backend',
        audience: 'kosa-client'
      }
    );

    return refreshToken;
  }

  // 토큰 쌍 생성
  generateTokens() {
    const accessToken = this.generateAccessToken();
    const refreshToken = this.generateRefreshToken();

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900 // 15분 (초 단위)
    };
  }

  // 사용자 정보를 안전하게 반환 (비밀번호 제외)
  toSafeObject() {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive
    };
  }

  // 이메일 형식 검증
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 비밀번호 강도 검증
  static validatePassword(password) {
    // 최소 8자, 대문자, 소문자, 숫자, 특수문자 포함
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return {
      isValid: passwordRegex.test(password),
      requirements: {
        minLength: password.length >= 8,
        hasLowercase: /[a-z]/.test(password),
        hasUppercase: /[A-Z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecialChar: /[@$!%*?&]/.test(password)
      }
    };
  }

  // JWT 토큰 검증
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  // Refresh Token 검증
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'default-refresh-secret');
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }
}

module.exports = User;