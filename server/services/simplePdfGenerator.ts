import PDFDocument from 'pdfkit';
import crypto from 'crypto';
import { db } from '../db';
import { systemSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface CompanySettings {
  businessName: string;
  businessLogo?: string;
  contactEmail: string;
  supportEmail: string;
  supportPhone: string;
  supportHours: string;
  supportLocation: string;
  availableLocations: Array<{
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
  }>;
}

export interface ConsentFormData {
  tenantId: string;
  playerId: string;
  playerName: string;
  parentId: string;
  parentName: string;
  templateType: string;
  templateTitle: string;
  templateContent: string;
  signedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  companySettings?: CompanySettings;
}

export interface GeneratedDocument {
  pdfBuffer: Buffer;
  fileName: string;
  digitalSignature: string;
  filePath?: string;
  contentType: 'application/pdf';
  isHtmlFallback: boolean;
}

export class SimplePDFGeneratorService {
  
  private async fetchCompanySettings(tenantId: string): Promise<CompanySettings> {
    // Get system settings from database for this tenant
    const settings = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.tenantId, tenantId));
    
    const settingsMap = settings.reduce((acc, setting) => {
      let value: any = setting.value;
      // Parse boolean values
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      // Parse numeric values
      if (!isNaN(Number(value))) value = Number(value);
      // Parse JSON arrays (for availableLocations)
      if (setting.key === 'availableLocations' && typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // If parsing fails, create simple location objects
          value = value.split(',').map((s: string) => ({
            name: s.trim(),
            addressLine1: s.trim(),
            city: '',
            country: 'US'
          })).filter((s: any) => s.name);
        }
      }
      
      acc[setting.key] = value;
      return acc;
    }, {} as any);

    // Default settings with fallbacks
    return {
      businessName: settingsMap.businessName || "PlayHQ",
      businessLogo: settingsMap.businessLogo || "",
      contactEmail: settingsMap.contactEmail || "admin@playhq.app",
      supportEmail: settingsMap.supportEmail || "support@playhq.app",
      supportPhone: settingsMap.supportPhone || "(555) 123-GOAL",
      supportHours: settingsMap.supportHours || "Monday - Friday",
      supportLocation: settingsMap.supportLocation || "South Florida",
      availableLocations: settingsMap.availableLocations || [
        { name: "Main Location", addressLine1: "123 Sports Avenue", city: "Miami", state: "FL", country: "US" }
      ],
    };
  }

  private stripHtmlTags(html: string): string {
    // Remove HTML tags and convert to plain text
    return html
      .replace(/<h[1-6]>(.*?)<\/h[1-6]>/gi, '\n$1\n\n')
      .replace(/<p>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li>(.*?)<\/li>/gi, '• $1\n')
      .replace(/<ul>/gi, '\n')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '$1')
      .replace(/<em>(.*?)<\/em>/gi, '$1')
      .replace(/<[^>]*>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private replacePlaceholders(content: string, data: ConsentFormData, companySettings: CompanySettings): string {
    const mainLocation = companySettings.availableLocations[0] || {};
    const addressParts = [
      mainLocation.addressLine1,
      mainLocation.addressLine2,
      mainLocation.city && mainLocation.state ? `${mainLocation.city}, ${mainLocation.state}` : mainLocation.city,
      mainLocation.postalCode,
      mainLocation.country
    ].filter(Boolean);
    
    const companyAddress = addressParts.join(', ') || 'Address not specified';
    
    const replacements: Record<string, string> = {
      '{{PLAYER_NAME}}': data.playerName,
      '{{PARENT_NAME}}': data.parentName,
      '{{DATE_SIGNED}}': data.signedAt.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      '{{TIME_SIGNED}}': data.signedAt.toLocaleTimeString('en-US'),
      '{{COMPANY_NAME}}': companySettings.businessName,
      '{{COMPANY_ADDRESS}}': companyAddress,
      '{{CONTACT_EMAIL}}': companySettings.contactEmail,
      '{{SUPPORT_EMAIL}}': companySettings.supportEmail,
      '{{SUPPORT_PHONE}}': companySettings.supportPhone,
      '{{SUPPORT_HOURS}}': companySettings.supportHours,
      '{{SUPPORT_LOCATION}}': companySettings.supportLocation,
    };
    
    let result = content;
    for (const [placeholder, value] of Object.entries(replacements)) {
      result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    }
    
    return result;
  }

  private async generateConsentPDF(data: ConsentFormData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 50,
          size: 'LETTER'
        });
        
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        
        // Fetch company settings
        const companySettings = data.companySettings || await this.fetchCompanySettings(data.tenantId);
        
        // Add header with company name
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text(companySettings.businessName, { align: 'center' })
           .moveDown(0.5);
        
        // Add title
        doc.fontSize(16)
           .text(data.templateTitle, { align: 'center' })
           .moveDown(1);
        
        // Add metadata
        doc.fontSize(11)
           .font('Helvetica')
           .text(`Player: ${data.playerName}`, { continued: false })
           .text(`Parent/Guardian: ${data.parentName}`)
           .text(`Date: ${data.signedAt.toLocaleDateString('en-US', { 
             year: 'numeric', 
             month: 'long', 
             day: 'numeric' 
           })}`)
           .text(`Time: ${data.signedAt.toLocaleTimeString('en-US')}`)
           .moveDown(1);
        
        // Process and add content
        const processedContent = this.replacePlaceholders(data.templateContent, data, companySettings);
        const plainTextContent = this.stripHtmlTags(processedContent);
        
        // Split content into sections for better formatting
        const lines = plainTextContent.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            if (line.startsWith('•')) {
              // Bullet point
              doc.fontSize(10)
                 .font('Helvetica')
                 .text(line, { indent: 20 });
            } else if (line.match(/^[A-Z][^:]+:$/)) {
              // Section header (ends with colon)
              doc.fontSize(12)
                 .font('Helvetica-Bold')
                 .moveDown(0.5)
                 .text(line, { underline: false })
                 .font('Helvetica')
                 .fontSize(10);
            } else {
              // Regular text
              doc.fontSize(10)
                 .font('Helvetica')
                 .text(line, { align: 'left' });
            }
          } else {
            doc.moveDown(0.3);
          }
        }
        
        // Add digital signature section
        doc.moveDown(2)
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('Digital Signature Information:', { underline: true })
           .font('Helvetica')
           .fontSize(9)
           .moveDown(0.5)
           .text(`Signed electronically by: ${data.parentName}`)
           .text(`Date/Time: ${data.signedAt.toLocaleString('en-US')}`)
           .text(`IP Address: ${data.ipAddress || 'Not recorded'}`)
           .text(`Document ID: ${crypto.createHash('sha256').update(
             `${data.tenantId}-${data.playerId}-${data.templateType}-${data.signedAt.toISOString()}`
           ).digest('hex').substring(0, 16).toUpperCase()}`);
        
        // Add footer
        doc.moveDown(2)
           .fontSize(8)
           .fillColor('#666666')
           .text(companySettings.businessName, { align: 'center' })
           .text(`${companySettings.contactEmail} • ${companySettings.supportPhone}`, { align: 'center' })
           .text('This document was electronically signed and is legally binding.', { align: 'center' });
        
        // Finalize the PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private generateDigitalSignature(data: ConsentFormData): string {
    const signatureData = `${data.tenantId}-${data.playerId}-${data.parentId}-${data.templateType}-${data.signedAt.toISOString()}`;
    return crypto.createHash('sha256').update(signatureData).digest('hex');
  }

  public async generateAndStoreConsentDocument(data: ConsentFormData): Promise<GeneratedDocument> {
    try {
      // Generate PDF
      const pdfBuffer = await this.generateConsentPDF(data);
      
      // Generate digital signature
      const digitalSignature = this.generateDigitalSignature(data);
      
      // Create filename
      const dateStr = data.signedAt.toISOString().split('T')[0];
      const fileName = `consent-${data.templateType}-${data.playerName.replace(/\s+/g, '-').toLowerCase()}-${dateStr}.pdf`;
      
      return {
        pdfBuffer,
        fileName,
        digitalSignature,
        contentType: 'application/pdf',
        isHtmlFallback: false
      };
    } catch (error) {
      console.error('Error generating PDF with PDFKit:', error);
      throw error;
    }
  }
}