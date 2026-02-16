/**
 * 导入200篇文献数据到数据库
 * 从Markdown文件解析并导入到literature表
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema';
import * as fs from 'fs';
import * as path from 'path';
import slugify from 'slugify';

const LITERATURE_DIR = '/home/ubuntu/literature_final';

interface LiteratureMetadata {
  title: string;
  slug: string;
  authors: string;
  journal: string;
  year: number;
  doi: string;
  url: string;
  application_area: string;
  added_date: string;
  keywords: string[];
  summary: string;
  key_findings: string;
  relevance: string;
}

function parseMarkdownFile(filePath: string): LiteratureMetadata | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      console.log(`⚠️  No frontmatter found in ${path.basename(filePath)}`);
      return null;
    }
    
    const frontmatter = frontmatterMatch[1];
    const bodyContent = content.substring(frontmatterMatch[0].length).trim();
    
    // Parse frontmatter fields
    const metadata: any = {};
    const lines = frontmatter.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const key = match[1];
        let value = match[2].trim();
        
        // Remove quotes
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        
        // Parse keywords array
        if (key === 'keywords') {
          value = value.replace(/[\[\]]/g, '').split(',').map((k: string) => k.trim().replace(/"/g, ''));
        }
        
        metadata[key] = value;
      }
    }
    
    // Extract sections from body
    const summaryMatch = bodyContent.match(/### Summary\n([\s\S]*?)(?=###|$)/);
    const keyFindingsMatch = bodyContent.match(/### Key Findings\n([\s\S]*?)(?=###|$)/);
    const relevanceMatch = bodyContent.match(/### Relevance to ROWELL\n([\s\S]*?)(?=###|$)/);
    
    return {
      title: metadata.title || '',
      slug: metadata.slug || '',
      authors: metadata.authors || '',
      journal: metadata.journal || '',
      year: parseInt(metadata.year) || 2020,
      doi: metadata.doi || '',
      url: metadata.url || '',
      application_area: metadata.application_area || 'pharmaceutical',
      added_date: metadata.added_date || '2026-02-14',
      keywords: metadata.keywords || [],
      summary: summaryMatch ? summaryMatch[1].trim() : '',
      key_findings: keyFindingsMatch ? keyFindingsMatch[1].trim() : '',
      relevance: relevanceMatch ? relevanceMatch[1].trim() : '',
    };
  } catch (error) {
    console.error(`❌ Error parsing ${path.basename(filePath)}:`, error);
    return null;
  }
}

function mapApplicationArea(area: string): string {
  const areaMap: { [key: string]: string } = {
    'Pharmaceutical': 'pharmaceutical',
    'Environmental': 'environmental',
    'Food Safety': 'food-safety',
    'Biopharmaceutical': 'biopharmaceutical',
    'Clinical': 'clinical',
    'Chemical': 'chemical',
  };
  return areaMap[area] || 'pharmaceutical';
}

async function main() {
  console.log('📊 开始导入文献数据...');
  console.log(`📁 文献目录：${LITERATURE_DIR}`);
  console.log();
  
  // 读取所有文献文件
  console.log('📖 读取文献文件...');
  const files = fs.readdirSync(LITERATURE_DIR)
    .filter(f => f.startsWith('LITERATURE_') && f.endsWith('.md'));
  
  console.log(`✅ 找到 ${files.length} 个文献文件`);
  console.log();
  
  // 连接数据库
  console.log('🔌 连接数据库...');
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }
  
  // Parse connection string and handle SSL properly
  const connection = await mysql.createConnection({
    uri: connectionString.replace('?ssl=true', ''),
    ssl: { rejectUnauthorized: true }
  });
  const db = drizzle(connection, { schema, mode: 'default' });
  console.log('✅ 数据库连接成功');
  console.log();
  
  // 统计变量
  let successCount = 0;
  let skipCount = 0;
  let failedCount = 0;
  
  // 逐个导入
  console.log('🔄 开始导入数据...');
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(LITERATURE_DIR, file);
    
    // 解析文件
    const metadata = parseMarkdownFile(filePath);
    if (!metadata) {
      console.log(`⏭️  [${i + 1}/${files.length}] 跳过无效文件：${file}`);
      skipCount++;
      continue;
    }
    
    try {
      // 插入数据库
      await connection.query(
        `INSERT INTO literature (
          slug, title, authors, journal, year, doi, url,
          application_area, summary, key_findings, relevance, keywords,
          added_date, view_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
        [
          metadata.slug,
          metadata.title,
          metadata.authors,
          metadata.journal,
          metadata.year,
          metadata.doi,
          metadata.url,
          mapApplicationArea(metadata.application_area),
          metadata.summary,
          metadata.key_findings,
          metadata.relevance,
          JSON.stringify(metadata.keywords),
          metadata.added_date,
        ]
      );
      
      console.log(`✅ [${i + 1}/${files.length}] 导入成功：${metadata.slug.substring(0, 60)}...`);
      successCount++;
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`⏭️  [${i + 1}/${files.length}] 已存在，跳过：${metadata.slug.substring(0, 60)}...`);
        skipCount++;
      } else {
        console.log(`❌ [${i + 1}/${files.length}] 导入失败：${metadata.slug} - ${error.message}`);
        failedCount++;
      }
    }
  }
  
  // 打印统计结果
  console.log();
  console.log('='.repeat(60));
  console.log('📊 导入完成统计');
  console.log('='.repeat(60));
  console.log(`✅ 导入成功：${successCount} 条`);
  console.log(`⏭️  跳过记录：${skipCount} 条`);
  console.log(`❌ 导入失败：${failedCount} 条`);
  console.log(`📝 总计处理：${files.length} 个文件`);
  console.log('='.repeat(60));
  
  // 验证结果
  console.log();
  console.log('🔍 验证导入结果...');
  const [result] = await connection.query(
    'SELECT COUNT(*) as count FROM literature'
  );
  // @ts-ignore
  const count = result[0]?.count || 0;
  console.log(`✅ 数据库中的文献总数：${count}`);
  console.log();
  
  if (successCount > 0) {
    console.log('🎉 导入成功！');
  } else {
    console.log('⚠️  没有新记录被导入');
  }
  
  await connection.end();
}

main().catch((error) => {
  console.error('❌ 导入失败：', error);
  process.exit(1);
});
