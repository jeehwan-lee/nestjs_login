import { Injectable } from '@nestjs/common';
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

  async delelteRefreshToken(email: string) {
    await this.tokenRepository.softDelete({ email: email });
  }

  signAccessToken(userEmail: string): string {
    return jwt.sign({ id: userEmail }, 'accessToken', { expiresIn: '1h' });
  }

  signRefreshToken(userEmail: string): string {
    return jwt.sign({ id: userEmail }, 'refreshToken', { expiresIn: '24h' });
  }

  verifyAcessToken(token: string) {
    return jwt.verify(token, 'accessToken');
  }

  verifyRefreshToken(token: string) {
    return jwt.verify(token, 'refreshToken');
  }
}
