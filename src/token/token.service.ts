import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Token } from './token.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Token) private tokenRepository: Repository<Token>,
    private readonly jwtService: JwtService,
  ) {}

  async getRefreshTokenByEmail(email: string) {
    const result = await this.tokenRepository.findOne({
      where: { email },
    });

    return result;
  }

  async getRefreshTokenByToken(refreshToken: string) {
    const result = await this.tokenRepository.findOne({
      where: { refreshToken },
    });

    return result;
  }

  createRefreshToken(token: Token): Promise<Token> {
    return this.tokenRepository.save(token);
  }

  async updateRefreshToken(email: string, refreshToken: string) {
    const existedRefreshToken = await this.tokenRepository.findOne({
      where: { email },
    });

    existedRefreshToken.refreshToken = refreshToken;
    existedRefreshToken.updatedDate = new Date();

    return this.tokenRepository.save(existedRefreshToken);
  }

  async delelteRefreshToken(refreshToken: string) {
    await this.tokenRepository.softDelete({ refreshToken: refreshToken });
  }

  signAccessToken(userEmail: string): string {
    return jwt.sign({ id: userEmail }, process.env.ACCESS_TOKEN_SCRET, {
      expiresIn: '1h',
    });
  }

  signRefreshToken(userEmail: string): string {
    return jwt.sign({ id: userEmail }, process.env.REFRESH_TOKEN_SCRET, {
      expiresIn: '24h',
    });
  }

  verifyAcessToken(token: string) {
    try {
      return jwt.verify(token, process.env.ACCESS_TOKEN_SCRET);
    } catch {
      throw new HttpException(
        '유효한 토큰이 아닙니다.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async verifyRefreshToken(token: string) {
    try {
      return jwt.verify(token, process.env.REFRESH_TOKEN_SCRET);
    } catch {
      // 유효하지 않거나 혹은 유효기간이 지난 refreshToken일 경우
      // DB에서 삭제
      await this.delelteRefreshToken(token);

      throw new HttpException(
        '유효한 토큰이 아닙니다.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
