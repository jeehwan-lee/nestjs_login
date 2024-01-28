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

  async updateRefreshToken(email: string, refreshToken: string) {
    const existedRefreshToken = await this.tokenRepository.findOne({
      where: { email },
    });

    existedRefreshToken.refreshToken = refreshToken;
    existedRefreshToken.updatedDate = new Date();

    return this.tokenRepository.save(existedRefreshToken);
  }

  async delelteRefreshToken(email: string) {
    await this.tokenRepository.softDelete({ email: email });
  }

  signAccessToken(userEmail: string): string {
    //TODO : secret token 값 env 로 저장
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
    return jwt.verify(token, process.env.ACCESS_TOKEN_SCRET);
  }

  verifyRefreshToken(token: string) {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SCRET);
  }
}
