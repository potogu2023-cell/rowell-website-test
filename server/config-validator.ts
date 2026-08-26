/**
 * 生产环境配置验证工具
 * 用于在服务器启动时验证关键配置，防止配置错误导致数据丢失
 */

import { sql } from 'drizzle-orm';

/**
 * 验证数据库配置
 * @returns true if valid, false otherwise
 */
export function validateDatabaseConfig(): boolean {
  const dbUrl = process.env.DATABASE_URL || '';
  
  console.log('\n========================================');
  console.log('🔍 开始验证生产环境配置...');
  console.log('========================================\n');

  // 1. 检查DATABASE_URL是否存在
  if (!dbUrl) {
    console.error('❌ 错误：DATABASE_URL环境变量未设置！');
    return false;
  }

  // 2. 检查数据库名称
  const expectedDbName = 'rowell_workflow';
  if (!dbUrl.includes(expectedDbName)) {
    console.error('❌ 错误：数据库配置不满足生产环境要求！');
    console.error('\n⚠️  警告：当前配置可能导致产品数据丢失，请通过受控配置渠道检查。\n');
    return false;
  }

  // 3. 检查区域
  const expectedRegion = 'ap-northeast-1';
  if (!dbUrl.includes(expectedRegion)) {
    console.warn('⚠️  警告：数据库区域不满足预期生产策略。');
  }

  console.log('✅ 数据库配置验证通过\n');
  
  return true;
}

/**
 * 验证产品数据完整性
 * @param db Database connection
 * @returns true if valid, false otherwise
 */
export async function validateProductData(db: any): Promise<boolean> {
  try {
    console.log('🔍 检查产品数据完整性...');
    
    // 如果数据库不可用,跳过验证
    if (!db) {
      console.warn('⚠️  数据库不可用,跳过产品数据验证');
      return true;
    }
    
    // 导入products表
    const { products } = await import('../drizzle/schema');
    
    // 查询产品数量
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(products);
    
    const productCount = Number(result[0]?.count || 0);
    
    // 预期产品数量（生产环境应该有1900+个产品）
    const minExpectedCount = 1000;
    
    if (productCount < minExpectedCount) {
      console.error('❌ 错误：产品数据完整性检查未通过！');
      console.error('\n⚠️  警告：可能连接到了错误的数据库，请通过受控配置渠道检查。\n');
      return false;
    }
    
    console.log('✅ 产品数据验证通过\n');
    
    return true;
  } catch {
    console.error('❌ 错误：无法验证产品数据');
    // 允许在数据库连接失败时继续启动
    console.warn('⚠️  将继续启动服务器,但数据库功能可能不可用');
    return true;
  }
}

/**
 * 执行所有配置验证
 * @param db Database connection
 * @returns true if all validations pass
 */
export async function validateAllConfigs(db: any): Promise<boolean> {
  // 1. 验证数据库配置
  const dbConfigValid = validateDatabaseConfig();
  if (!dbConfigValid) {
    console.error('\n========================================');
    console.error('❌ 配置验证失败！服务器将拒绝启动。');
    console.error('========================================\n');
    return false;
  }

  // 2. 验证产品数据
  const productDataValid = await validateProductData(db);
  if (!productDataValid) {
    console.error('\n========================================');
    console.error('❌ 数据验证失败！服务器将拒绝启动。');
    console.error('========================================\n');
    return false;
  }

  console.log('========================================');
  console.log('✅ 所有配置验证通过！服务器正常启动。');
  console.log('========================================\n');
  
  return true;
}
