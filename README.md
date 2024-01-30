# NestJS를 활용한 사용자 인증과 권한 관리시스템 구현

이 프로젝트는 NestJS를 활용해 사용자의 회원가입, 로그인, 비밀번호 변경을 처리하는 API를 구현하고 

JWT를 사용한 토큰 기반의 인증 시스템을 구축합니다.


## 목차

- [설치 및 실행방법](#설치-및-실행방법)

- [구현 내용](#구현-내용)

- [구조 및 설계](#구조-및-설계)

   - [프로젝트 구조](#1-프로젝트-구조)
 
   - [DB 설계](#2-DB-설계)

- [코드 설명](#코드-설명)

- [회고](#회고)


## 설치 및 실행방법

1. Install Dependencies

```
npm install
```

2. NestJS 서버 실행

```
npm run start
```

3. 서버 접속 주소
   
```
http://localhost:3000
```

4. Swagger API를 통한 실행
   
   아래 Swagger API URL을 통해 API 예시를 확인하고 실행할 수 있습니다.

   다만, 관리자 권한 인증이 필요한 '회원목록 조회 API'의 경우 별도의 방법(Postman 사용)이 필요합니다.

```
http://localhost:3000/api
```

5. 테스트 계정

   - 관리자 : admin@admin.com / admin

   - 일반 사용자 : jeehwan@naver.com / 123456


## 구현 내용

1. 회원가입 API

2. 로그인 API
  
3. 비밀번호 변경 API
  
4. 회원 목록 조회 API
  
5. Refresh 토큰을 사용한 토큰 재발급 기능
     
6. 로그인 시도 제한 기능(최대 5회)
     
7. 중복 로그인 방지 기능

     
## 구조 및 설계

### 1. 프로젝트 구조

```bash
├── app.controller.spec.ts
├── app.controller.ts
├── app.module.ts
├── app.service.ts
├── main.ts
├── auth
│   ├── auth.controller.ts
│   ├── auth.guard.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── token
│   ├── token.entity.ts
│   ├── token.module.ts
│   └── token.service.ts
├── user
│   ├── user.entity.ts
│   ├── user.module.ts
└── └── user.service.ts
```

프로젝트의 src 파일은 위와 같은 구조로 이루어져있습니다.

auth, token, user 총 3개의 모듈로 이루어져있으며

auth.controller.ts에서 API를 생성하고 auth.guard.ts를 통해 인증을 확인합니다.


### 2. DB 설계

- USER 테이블

|   칼럼명    |    타 입     | Null |     Key     |  Default |  설 명  |
| :---------: | :----------: | :--: | :---------: | :------: | :------: |
|     id      |     int      |  No  | Primary Key |     -    |    id    |
|    email    |    varchar   |  No  |      -      |     -    |  이메일  |
|   password  |    varchar   |  No  |      -      |     -    | 비밀번호 |
|   status    |    varchar   |  No  |      -      |  ACTIVE  | 잠금상태 |
|  failCount  |    varchar   |  No  |      -      |     0    | 실패횟수 |
|    role     |     int      |  No  |      -      |  MEMBER  |   권한   |
| createDate  |   datetime   |  No  |      -      | 현재시간 | 생성일자 |
| updatedDate |   datetime   |  No  |      -      | 현재시간 | 수정일자 |

- TOKEN 테이블

|   칼럼명    |    타 입     | Null |     Key     |  Default |  설 명   |
| :---------: | :----------: | :--: | :---------: | :------: | :------: |
|     id      |     int      |  No  | Primary Key |     -    |    id    |
|    email    |     int      |  No  |      -      |     -    |  이메일  |
| refreshToken|    varchar   |  No  |      -      |     -    |Refrsh토큰|
| createDate  |   datetime   |  No  |      -      | 현재시간 | 생성일자 |
| updatedDate |   datetime   |  No  |      -      | 현재시간 | 수정일자 |
| delatedDate |   datetime   |  No  |      -      | 현재시간 | 삭제일자 |

데이터베이스 구조는 USER와 TOKEN 테이블 두개로 구성되어 있습니다.

1. USER 테이블에는 회원의 기본적인 정보인 email과 password, role이 있으며,

   로그인 실패횟수를 저장하는 failCount와 5회 이상 실패 시 계정을 잠그는 status 컬럼이 있습니다.

2. TOKEN 테이블은 현재 로그인한 사용자의 email과 refresh 토큰을 저장합니다.

   USER 테이블과는 달리 delatedDate 컬럼을 추가했는데 이는 토큰이 만료되거나 사용자가 로그아웃한 경우,

   로그인과 로그아웃 내역을 확인할 수 있도록 데이터를 삭제하지 않고 Typeorm의 Soft Delate를 사용했습니다. 


## 코드 설명

```
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

...

}
```

이 프로젝트의 모든 API는 auth.controller.ts에 구현되어 있으며,

@Controller('auth') 데코레이터를 통해 /auth를 기본 경로로 설정했습니다.

1. 회원가입 API

   ```
   @Post('register')
   async register(@Body() user: User) {
     return await this.authService.register(user);
   }
   ```

   회원가입 API는 /auth/register 이며, User 객체의 email과 password를 입력받습니다.

   ```
   async register(user: User) {
     const existedUser = await this.userService.getUser(user.email);

     if (existedUser) {
       throw new HttpException(
         '이미 존재하는 이메일입니다.',
         HttpStatus.BAD_REQUEST,
       );
     }

     const encryptedPassword = bcrypt.hashSync(user.password, 10);

     try {
       const newUser = await this.userService.createUser({
         ...user,
         password: encryptedPassword,
       });
       newUser.password = undefined;
       return newUser;
     } catch (error) {
       throw new HttpException('Internal Server Error', 500);
     }
   }
   ```
  
   authService.register에서는 userService의 getUser를 통해 email을 입력받아 중복된 이메일이 존재하는지 확인하고

   중복된 이메일이 없을 경우 password를 암호화해서 userService의 createUser를 통해 사용자 정보를 DB에 저장합니다.

2. 로그인 API (로그인 시도제한, 중복로그인 확인 기능 포함)

   ```
   @Post('login')
   async login(@Body() userInfo: UserInfo) {
     return await this.authService.login(userInfo.email, userInfo.password);
   }
   ```

   로그인 API는 /auth/login이며 user의 email과 password를 입력받습니다.

   authService.login에서는 아래와 같은 절차로 로그인을 진행합니다.

   2.1 (비밀번호 검증에 실패한 경우) 계정의 존재여부 확인

   ```
   async login(email: string, password: string) {
    const validatedUser = await this.userService.validateUser(email, password);

    if (!validatedUser) {
      // 비밀번호 검증에 실패했을 경우

      const existedUser = await this.userService.getUser(email);

      // 계정이 존재하지 않을 경우
      if (!existedUser) {
        throw new HttpException(
          '가입되지 않은 이메일입니다.',
          HttpStatus.BAD_REQUEST,
        );
      }
   
   ...
   
   }
   ```

   위와 같이 비밀번호 검증에 실패한 경우 이메일이 존재하는지 먼저 확인합니다.
   
   2.2 (비밀번호 검증에 실패한 경우) failCount 증가

   ```
   async login(email: string, password: string) {
    const validatedUser = await this.userService.validateUser(email, password);

    if (!validatedUser) {
      // 비밀번호 검증에 실패했을 경우

      ...
   
      // User의 fail Count 데이터 증가
      const failCount = await this.userService.increaseUserFailCount(email);

      ...
   }
   ```

   이메일이 존재할 경우 해당 이메일의 failCount를 증가시킵니다.
   
   2.3 로그인 실패를 5번 이상 했을 경우 계정 잠금

   ```
   async login(email: string, password: string) {
    const validatedUser = await this.userService.validateUser(email, password);

    if (!validatedUser) {
      // 비밀번호 검증에 실패했을 경우

      ...

      // fail Count >= 5 이면 계정 잠금
      if (failCount >= 5) {
        await this.userService.inActivateUserAccount(email);

        throw new HttpException(
          '로그인 시도 횟수 5회 초과로 계정이 잠겼습니다.',
          HttpStatus.BAD_REQUEST,
        );
      }
   
      ...
   
   }
   ```

   만약 해당 이메일의 failCount가 5 이상이 경우, 해당 계정의 status 값을 'INACTIVE'로 변경해서 계정을 잠금상태로 변경하게 됩니다.
   
   2.4 (비밀번호 검증 성공 시) 계정이 잠겼는지 확인

   ```
   async login(email: string, password: string) {

   ...

      throw new HttpException(
        `이메일과 비밀번호를 확인하세요. (로그인 실패 횟수 : ${failCount})`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 계정이 잠겼는지 확인
    if (validatedUser.status == 'INACTIVE') {
      throw new HttpException('계정이 잠겨있습니다.', HttpStatus.BAD_REQUEST);
    }

   ...

   }
   ```

   로그인 실패했을 경우 로그인 실패 횟수를 보여주며, 비밀번호 검증을 성공했을 경우 해당 계정이 잠겼는지 확인합니다.
   
   2.5 (비밀번호 검증 성공 시) 중복로그인 확인

   ```
   async login(email: string, password: string) {

   ...

    // 중복로그인 확인
    const userExistedRefreshToken =
      await this.tokenService.getRefreshTokenByEmail(validatedUser.email);

    if (userExistedRefreshToken) {
      throw new HttpException(
        '이미 로그인 되어있는 사용자입니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

   ...

   }
   ```

   다음으로 TOKEN 테이블에 해당 계정의 정보가 존재하는지 tokenService.getRefreshTokenByEmail을 통해 확인하며,

   계정의 정보가 존재할 경우 이미 로그인되어 있는 사용자라고 판단합니다.

   2.6 failCount 0으로 초기화

   ```
   async login(email: string, password: string) {

   ...
    // User의 fail Acount 0으로 초기화
    await this.userService.resetUserFailCount(email);
   
   ...

   }
   ```

   중복로그인 검증까지 마친 후 로그인을 하기 위해 계정의 failCount를 0으로 초기화합니다.
   
   2.7 로그인한 사용자의 refresh 토큰을 DB에 저장 후 토큰 반환

   ```
   async login(email: string, password: string) {

   ...
   
    const accessToken = await this.tokenService.signAccessToken(email);
    const refreshToken = await this.tokenService.signRefreshToken(email);

    // 현재 로그인한 사용자의 refresh Token을 DB에 저장
    await this.tokenService.createRefreshToken({
      email: email,
      refreshToken: refreshToken,
      createDate: undefined,
      updatedDate: undefined,
      deletedDate: undefined,
    });

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
   
   ...

   }
   ```

   마지막으로 로그인한 사용자의 refresh 토큰을 DB에 저장하며, access 토큰과 refresh 토큰을 반환합니다.
  
3. 비밀번호 변경 API

   ```
   @Post('changePw')
   async changePassword(@Body() userInfo: UserInfo) {
     return await this.authService.changePassword(
       userInfo.email,
       userInfo.password,
     );
   }
   ```
   비밀번호 변경 API는 /auth/changePw 이며, email과 password를 입력받습니다.

   비밀번호 변경 로직은 다음과 같은 절차로 진행됩니다.

   3.1 TOKEN 을 통한 현재 로그인한 사용자인지 확인

   ```
   async changePassword(email: string, password: string) {
       // TOKEN 인증을 통해 현재 접속한 사용자인지 검증
       const userExistedRefreshToken =
         await this.tokenService.getRefreshTokenByEmail(email);
   
       if (!userExistedRefreshToken) {
         throw new HttpException('로그인이 필요합니다.', HttpStatus.BAD_REQUEST);
       }
   
       // 유효한 토큰인지 검증
       await this.tokenService.verifyRefreshToken(
         userExistedRefreshToken.refreshToken,
       );
   
       ...
   }
   ```

   tokenService.getRefreshTokenByEmail을 통해 현재 로그인한 사용자인지 확인합니다.

   3.2 이메일이 존재하는지 확인

   ```
   async changePassword(email: string, password: string) {

      ...
   
       const existedUser = await this.userService.getUser(email);
   
       if (!existedUser) {
         throw new HttpException(
           '이메일이 존재하지 않습니다.',
           HttpStatus.BAD_REQUEST,
         );
       }
   
       ...
   }
   ```

   3.3 새로운 비밀번호를 암호화해서 저장

   ```
   async changePassword(email: string, password: string) {

   ...
   
       const encryptedPassword = bcrypt.hashSync(password, 10);
   
       try {
         const newUser = await this.userService.updateUserPassword(
           existedUser,
           encryptedPassword,
         );
         newUser.password = undefined;
         return newUser;
       } catch (error) {
         throw new HttpException('Internal Server Error', 500);
       }
   }
   ```

   새로 입력받은 비밀번호를 암호화해서 userService.updateUserPassword를 통해 DB에 업데이트합니다.

4. 회원 목록 조회 API

   ```
   @UseGuards(adminCheckGuard)
   @Get('user')
   async findAllUser() {
     return await this.authService.findAllUser();
   }
   ```

   회원목록 조회 API는 /auth/user이며, 이는 관리자 권한만 접근할 수 있기 때문에 Guard를 사용해 권한을 먼저 확입합니다.

   adminCheckGuard 는 아래와 같습니다.

   ```
   export class adminCheckGuard implements CanActivate {
      constructor(
        private authService: AuthService,
        private userService: UserService,
      ) {}
   
      async canActivate(context: any): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const existedUser = await this.userService.getUser(request.body.email);
   
        if (!existedUser) {
          throw new HttpException(
            '정상적인 접근이 아닙니다.',
            HttpStatus.BAD_REQUEST,
          );
        }
   
        if (existedUser.role !== 'ADMIN') {
          throw new HttpException(
            '회원목록은 관리자만 조회할 수 있습니다.',
            HttpStatus.BAD_REQUEST,
          );
        } else {
          return true;
        }
      }
   }
   ```

   userSerivce.getUser를 통해 가입된 사용자인지 확인하고, 해당 계정의 role을 확인합니다.

   해당 계정이 ADMIN 권한을 갖고 있다면 authService.findAllUser를 실행합니다.
  
5. Refresh 토큰을 사용한 토큰 재발급 기능

   ```
   @Post('token')
     async createAccessToken(@Body() userEmailAndToken: UserEmailAndToken) {
       return await this.authService.createAccessToken(
         userEmailAndToken.email,
         userEmailAndToken.refreshToken,
       );
   }
   ```

   토큰 재발급 API는 /auth/token이며, email과 로그인한 클라이언트의 refreshToken을 받습니다.

   토큰 재발급 절차는 아래와 같이 진행됩니다.

   5.1 유효한 토큰인지 확인

   ```
   async createAccessToken(email: string, refreshToken: string) {
       const existedToken =
         await this.tokenService.getRefreshTokenByToken(refreshToken);
   
       if (!existedToken) {
         throw new HttpException(
           '유효한 토큰이 아닙니다.',
           HttpStatus.BAD_REQUEST,
         );
       }
   
       // 유효한 토큰인지 검증
       await this.tokenService.verifyRefreshToken(refreshToken);
   
      ...
   
   }
   ```

   먼저 토큰을 재발급받으려는 사용자의 refresh 토큰이 유효한 토큰인지 확인합니다.

   해당 토큰이 TOKEN 테이블에 저장되었는지 tokenService.getRefreshTokenByToken을 통해 확인하며,

   ```
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
   ```

   tokenService.verfiyRefreshToken을 통해 토큰이 정상적인 토큰인지, 그리고 유효기간이 지나지 않은 토큰인지 확인합니다.

   만약, 유효한 토큰이 아닐 경우 TOKEN 테이블에서 삭제하며 해당 계정은 로그아웃처리됩니다.

   5.2 access 토큰 발급 및 refresh 토큰의 유효기간을 갱신

   ```
   async createAccessToken(email: string, refreshToken: string) {

      ...
   
       // refreshToken 유효기간 갱신
       const newAccessToken = this.tokenService.signAccessToken(email);
       const newRefreshToken = this.tokenService.signRefreshToken(email);
   
       ...
   
   }
   ```

   토큰이 검증되었다면 새로운 access 토큰을 발급하며

   기존에 사용하던 refresh 토큰도 유효기간을 연장하기 위해 새로 발급합니다.

   5.3 현재 로그인한 사용자의 새로운 refresh 토큰을 TOKEN 테이블에 업데이트

   ```
   async createAccessToken(email: string, refreshToken: string) {

       ...
   
       // 현재 로그인한 사용자의 refresh Token을 DB에 저장
       await this.tokenService.updateRefreshToken(email, newRefreshToken);
   
       return { accessToken: newAccessToken, refreshToken: refreshToken };
   }
   ```

   유효기간이 연장된 refresh 토큰을 TOKEN 테이블에 저장해서 현재 계정의 로그인상태를 유지합니다.


   ## 회고

   NestJS는 현재 프로젝트를 진행하면서 Typescript를 공부하고 Typescript 기반의 서버를 만들어보기 위해

   공부해본적이 있어 기본적인 API는 어렵지 않게 구현했습니다.

   다만, NestJS의 Guard에 대해 정확히 알지 못해서

   처음에는 모든 사용자 조회 API를 만들때 @Query('email')를 통해 이메일을 받아서 해당 이메일의 권한을 확인하는 방법을 사용했습니다.

   이렇게 될 경우 문제점은 모든 사용자 조회 API는 Get 방식을 사용하기 때문에

   ADMIN 권한을 갖는 계정의 이메일을 알아낼 경우 손쉽게 허가받지 않은 사용자도 해당 API를 사용할 수 있다는 문제가 있었습니다.

   이러한 도용을 막기 위해 Guard에 대해 공부를 했고 권한을 체크하는 Guard를 만들어서

   GET 방식의 요청에서도 허가받지 않은 사용자는 접근할 수 없도록 구현했습니다.

   또한 이 프로젝트에서 구현한 방식은 아니지만, 비밀번호 변경과 토큰 재발급 API에서 TOKEN이 유효한지 확인하는 부분도

   Guard를 사용한다면 서비스에서 TOKEN을 검증하지 않고 GUARD에서 공통으로 검증할 수 있을것이라 생각을 했습니다.

   이번 프로젝트를 통해 NestJS의 Guard를 사용하는 이유를 알게 되었으며,

   추후 비밀번호 변경, 토큰 재발급 API도 Guard를 통한 인증을 구현해보려 합니다.

   감사합니다.
   

   
