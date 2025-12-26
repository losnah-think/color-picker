import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('🔍 데이터베이스 연결 테스트 시작...');
    
    // 환경 변수 확인
    const dbUrl = process.env.DATABASE_URL;
    const directUrl = process.env.DATABASE_DIRECT_URL;
    
    console.log('📊 환경 변수:');
    console.log('  - DATABASE_URL:', dbUrl ? '✅ 설정됨' : '❌ 없음');
    console.log('  - DATABASE_DIRECT_URL:', directUrl ? '✅ 설정됨' : '❌ 없음');
    
    // 1. 기본 연결 테스트
    console.log('⏳ 데이터베이스 연결 시도...');
    const now = await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log('✅ 데이터베이스 연결 성공');
    
    // 2. User 테이블 접근 테스트
    console.log('⏳ User 테이블 접근 테스트...');
    const userCount = await prisma.user.count();
    console.log(`✅ User 테이블 접근 가능 (총 ${userCount}명)`);
    
    // 3. 사용자 목록 조회 (처음 5명)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      take: 5,
    });
    
    return NextResponse.json(
      {
        status: 'success',
        message: '✅ 모든 데이터베이스 테스트 통과!',
        timestamp: now,
        userCount,
        recentUsers: users,
        environment: process.env.NODE_ENV,
        databaseInfo: {
          databaseUrl: dbUrl ? '설정됨' : '없음',
          directUrl: directUrl ? '설정됨' : '없음',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ 데이터베이스 연결 실패:', error.message);
    
    let solution = '';
    
    if (error.message.includes('Tenant or user not found')) {
      solution = 'Username 또는 Password가 틀렸습니다. Supabase 대시보드에서 확인하세요.';
    } else if (error.message.includes('connect ECONNREFUSED')) {
      solution = '데이터베이스 포트에 연결할 수 없습니다. 포트 번호를 확인하세요.';
    } else if (error.message.includes('Name resolution')) {
      solution = 'DNS 이름 해석 실패. 호스트명을 확인하세요.';
    } else if (error.message.includes('FATAL: password authentication failed')) {
      solution = '패스워드 인증 실패. 특수문자 인코딩을 확인하세요.';
    }
    
    return NextResponse.json(
      {
        status: 'error',
        message: '❌ 데이터베이스 연결 실패',
        error: error.message,
        solution,
        environment: process.env.NODE_ENV,
        databaseInfo: {
          databaseUrl: process.env.DATABASE_URL ? '설정됨' : '없음',
          directUrl: process.env.DATABASE_DIRECT_URL ? '설정됨' : '없음',
        },
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
