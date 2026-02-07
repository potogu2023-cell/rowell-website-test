-- Migration: Create USP Standards Table
-- Date: 2026-02-06
-- Purpose: 为USP Standards产品匹配系统创建usp_standards表

-- 创建USP Standards表
CREATE TABLE IF NOT EXISTS usp_standards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE COMMENT 'USP标准代码,如L1, L7, L11',
  name VARCHAR(100) NOT NULL COMMENT '化学名称,如Octadecylsilane (C18)',
  description TEXT COMMENT '简短描述',
  detailedDescription TEXT COMMENT '详细说明',
  chemicalFormula VARCHAR(100) COMMENT '化学式',
  applications TEXT COMMENT '应用场景',
  displayOrder INT DEFAULT 0 COMMENT '显示顺序',
  featured INT DEFAULT 0 COMMENT '是否推荐(0=否,1=是)',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_usp_standards_code (code),
  INDEX idx_usp_standards_displayOrder (displayOrder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='USP标准信息表';

-- 插入初始USP标准数据
INSERT INTO usp_standards (code, name, description, detailedDescription, chemicalFormula, applications, displayOrder, featured) VALUES
('L1', 'Octadecylsilane (C18)', 'Most common reversed-phase material', 
 'Octadecylsilane (C18) is the most widely used HPLC column packing material. It provides excellent retention for a wide range of compounds and is suitable for both isocratic and gradient elution. C18 columns are ideal for separating non-polar to moderately polar compounds.',
 'Si-(CH2)17-CH3', 
 'Pharmaceuticals, environmental analysis, food and beverage testing, general reversed-phase separations',
 1, 1),

('L7', 'Octylsilane (C8)', 'Medium hydrophobicity', 
 'Octylsilane (C8) columns offer medium hydrophobicity, providing faster analysis times compared to C18 while maintaining good selectivity for many compounds. C8 columns are particularly useful for peptides and proteins.',
 'Si-(CH2)7-CH3',
 'Peptide and protein analysis, pharmaceutical analysis, faster separations',
 2, 1),

('L11', 'Phenylsilane', 'Aromatic selectivity', 
 'Phenylsilane columns provide unique selectivity for aromatic compounds through π-π interactions, making them ideal for separating aromatic analytes. They offer complementary selectivity to alkyl-bonded phases.',
 'Si-(CH2)3-C6H5',
 'Aromatic compound separation, pharmaceutical analysis, isomer separation',
 3, 1),

('L60', 'HILIC', 'Polar compound separation', 
 'Hydrophilic Interaction Liquid Chromatography (HILIC) is designed for polar compound separation, complementing reversed-phase chromatography. HILIC uses polar stationary phases and is ideal for highly polar, water-soluble compounds.',
 'Various polar phases',
 'Carbohydrates, amino acids, nucleotides, polar pharmaceuticals',
 4, 1),

('L10', 'Nitrile', 'Polar interactions', 
 'Nitrile (cyano) bonded phases offer unique selectivity through polar interactions, particularly useful for certain pharmaceutical and environmental applications. They provide intermediate polarity between C18 and HILIC.',
 'Si-(CH2)3-CN',
 'Pharmaceutical analysis, environmental testing, polar compound separation',
 5, 0),

('L3', 'Porous silica', 'Normal phase', 
 'Unmodified porous silica is used for normal-phase chromatography, ideal for separating polar compounds. It is the most polar stationary phase and is used with non-polar mobile phases.',
 'SiO2',
 'Lipid analysis, polymer analysis, normal-phase separations',
 6, 0);

-- 为products表的usp字段添加索引(如果不存在)
CREATE INDEX IF NOT EXISTS idx_products_usp ON products(usp);

-- 验证数据
SELECT COUNT(*) as total_standards FROM usp_standards;
SELECT code, name, displayOrder FROM usp_standards ORDER BY displayOrder;
