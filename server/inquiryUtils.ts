/**
 * Utility functions for inquiry management
 */

/**
 * Generate unique inquiry number in format: INQ-YYYYMMDD-XXX
 * @returns Inquiry number string
 */
export function generateInquiryNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // Generate a random 3-digit number
  const random = Math.floor(Math.random() * 900) + 100; // 100-999
  
  return `INQ-${year}${month}${day}-${random}`;
}

/**
 * Validate inquiry number format
 * @param inquiryNumber - Inquiry number to validate
 * @returns True if valid, false otherwise
 */
export function validateInquiryNumber(inquiryNumber: string): boolean {
  const pattern = /^INQ-\d{8}-\d{3}$/;
  return pattern.test(inquiryNumber);
}
