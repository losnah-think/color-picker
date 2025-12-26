const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 환경 변수 테스트\n');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ 설정됨' : '❌ 없음');
console.log('DATABASE_DIRECT_URL:', process.env.DATABASE_DIRECT_URL ? '✅ 설정됨' : '❌ 없음');

if (process.env.DATABASE_URL) {
  const urlObj = new URL(process.env.DATABASE_URL);
  console.log('\n📊 DATABASE_URL 분석:');
  console.log(`  - Username: ${urlObj.username}`);
  console.log(`  - Host: ${urlObj.hostname}`);
  console.log(`  - Port: ${urlObj.port}`);
  console.log(`  - Database: ${urlObj.pathname.slice(1)}`);
}

if (process.env.DATABASE_DIRECT_URL) {
  const urlObj = new URL(process.env.DATABASE_DIRECT_URL);
  console.log('\n📊 DATABASE_DIRECT_URL 분석:');
  console.log(`  - Username: ${urlObj.username}`);
  console.log(`  - Host: ${urlObj.hostname}`);
  console.log(`  - Port: ${urlObj.port}`);
  console.log(`  - Database: ${urlObj.pathname.slice(1)}`);
}

console.log('\n🔗 데이터베이스 연결 테스트 시작...\n');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  try {
    console.log('⏳ Prisma에 연결 중...');
    
    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT NOW()`;
    
    console.log('✅ 데이터베이스 연결 성공!');
    console.log(`   현재 서버 시간: ${result[0].now}`);
    
    // Test if users table exists
    try {
      const users = await prisma.user.findMany({ take: 1 });
      console.log('✅ User 테이블 접근 가능');
    } catch (e) {
      console.log('⚠️  User 테이블에 접근할 수 없음:', e.message.split('\n')[0]);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패!');
    console.error('\n에러 메시지:');
    console.error(error.message);
    
    if (error.message.includes('Name resolution')) {
      console.error('\n💡 해결방법: DNS 이름 해석 실패');
      console.error('   - Supabase 대시보드에서 정확한 Host를 확인하세요');
      console.error('   - .env.local의 DATABASE_DIRECT_URL을 확인하세요');
    } else if (error.message.includes('connect ECONNREFUSED')) {
      console.error('\n💡 해결방법: 연결 거부됨');
      console.error('   - 포트 번호가 올바른지 확인하세요');
      console.error('   - 방화벽 설정을 확인하세요');
    } else if (error.message.includes('password authentication failed')) {
      console.error('\n💡 해결방법: 인증 실패');
      console.error('   - Username과 Password가 올바른지 확인하세요');
      console.error('   - 현재 설정: postgres:3P3#3phqgksthf15');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
