1. api swagger로 하나 만들어두기
   -> 모든 유저 조회는 swagger로 불가
   -> req body 안에 email이 필요
2. admin@admin.com / admin
3. softDelete를 통한 refreshToken 삭제
4. typescript 적용
5. 권한 : MEMBER / ADMIN
6. 잠금해제 API 추가

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

   - 이메일과 비밀번호를 입력받아 회원가입을 합니다.
  
   - 이메일 중복검사를 합니다.
  
   - 비밀번호는 암호화된 방식으로 데이터베이스에 저장됩니다.

2. 로그인 API

   - 이메일과 비밀번호를 입력받아 로그인합니다.
  
   - 로그인 성공 시 JWT 토큰(Access 토큰, Refresh 토큰)을 발급합니다.
  
   - Refresh 토큰은 토큰 검증과 Access 토큰 재발급을 위해 발급과 동시에 DB에 저장합니다.
  
   - 추가적으로 로그아웃 API를 통해 현재 계정을 로그아웃 할 수 있습니다. (DB에 저장된 Refresh 토큰 삭제)
  
3. 비밀번호 변경 API

   - 로그인한 사용자는 이메일과 비밀번호를 입력받아 비밀번호를 변경할 수 있습니다.
  
   - 새로운 비밀번호는 암호화된 방식으로 데이터베이스에 저장됩니다.
  
4. 회원 목록 조회 API

   - 현재 가입된 회원 목록을 조회할 수 있습니다.
  
   - 관리자 권한을 갖는 계정만 회원 목록을 조회할 수 있습니다.
  
5. Refresh 토큰을 사용한 토큰 재발급 기능

   - 토큰 재발급 API를 통해 유효한 Refresh 토큰을 통해 Access 토큰을 재발급 받을 수 있습니다.
  
   - 로그인한 사용자만 토큰 재발급을 받을 수 있습니다.
     
6. 로그인 시도 제한 기능(최대 5회)

   - 로그인을 5번 실패할 경우 해당 계정이 잠기게 됩니다. (계정의 status를 INACTIVE로 변경)
  
   - 추가적으로 잠긴 계정을 해제하는 API를 통해 잠긴 상태의 계정을 풀 수 있습니다. (계정의 status를 ACTIVE로 변경)
     
7. 중복 로그인 방지 기능

   - 현재 접속중인 계정은 중복으로 로그인할 수 없습니다.
  
   - DB에 저장된 Refresh 토큰과 이메일을 통해 중복 로그인 여부를 확인합니다.

     
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

auth.controller.ts 에서 API를 생성하고 auth.guard.ts 를 통해 인증을 확인합니다.


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

   USER 테이블과는 다르기 delatedDate 컬럼을 추가했는데 이는 토큰이 만료되거나 로그아웃한 경우,

   추후 로그인 기록을 확인할때 사용할 수 있도록 데이터를 삭제하지 않고 Typeorm의 Soft Delate를 사용했습니다. 
