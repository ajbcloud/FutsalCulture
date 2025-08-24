import puppeteer from 'puppeteer';
import crypto from 'crypto';
import { ObjectStorageService } from '../objectStorage';
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
  contentType: 'application/pdf' | 'text/html';
  isHtmlFallback: boolean;
}

export class PDFGeneratorService {
  
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
      businessName: settingsMap.businessName || "Futsal Culture",
      businessLogo: settingsMap.businessLogo || "",
      contactEmail: settingsMap.contactEmail || "admin@futsalculture.com",
      supportEmail: settingsMap.supportEmail || "support@futsalculture.com",
      supportPhone: settingsMap.supportPhone || "(555) 123-GOAL",
      supportHours: settingsMap.supportHours || "Monday - Friday",
      supportLocation: settingsMap.supportLocation || "South Florida",
      availableLocations: settingsMap.availableLocations || [
        { name: "Main Location", addressLine1: "123 Sports Avenue", city: "Miami", state: "FL", country: "US" }
      ],
    };
  }

  private async generateConsentPDF(data: ConsentFormData): Promise<{ buffer: Buffer; isHtmlFallback: boolean }> {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-software-rasterizer',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
      });

      try {
        const page = await browser.newPage();
        
        const htmlContent = this.generateConsentHTML(data);
        
        await page.setContent(htmlContent, { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        });

        const pdfUint8Array = await page.pdf({
          format: 'A4',
          margin: {
            top: '1in',
            right: '1in',
            bottom: '1in',
            left: '1in'
          },
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: `
            <div style="font-size: 10px; color: #666; text-align: center; width: 100%;">
              <span>Consent Document - ${data.templateTitle}</span>
            </div>
          `,
          footerTemplate: `
            <div style="font-size: 10px; color: #666; text-align: center; width: 100%;">
              <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Document ID: ${data.playerId}-${data.templateType} | Generated: ${new Date().toISOString()}</span>
            </div>
          `
        });
        
        const pdfBuffer = Buffer.from(pdfUint8Array);

        return { buffer: pdfBuffer, isHtmlFallback: false };
      } finally {
        await browser.close();
      }
    } catch (error) {
      console.error('Puppeteer failed to generate PDF:', error);
      // Fallback: Return a simple HTML representation as a fallback
      // This will create a basic PDF-like document that can be viewed
      return { buffer: this.generateFallbackPDF(data), isHtmlFallback: true };
    }
  }

  private generateFallbackPDF(data: ConsentFormData): Buffer {
    // Create a simple HTML document that can be saved and viewed
    const htmlContent = this.generateConsentHTML(data);
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${data.templateTitle}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #ffeb3b; padding: 10px; text-align: center; font-weight: bold;">
          Please use Print to PDF (Ctrl+P) to save this document as a PDF file.
        </div>
        ${htmlContent}
      </body>
      </html>
    `;
    
    // Return HTML as a buffer that can be downloaded
    return Buffer.from(fullHtml, 'utf-8');
  }

  private generateConsentHTML(data: ConsentFormData): string {
    const signatureHash = this.generateDigitalSignature(data);
    const company = data.companySettings;
    
    // Process template content with merge fields
    let processedContent = data.templateContent;
    if (company) {
      // Replace merge fields in template content
      processedContent = processedContent
        .replace(/\{\{COMPANY_NAME\}\}/g, company.businessName)
        .replace(/\{\{CONTACT_EMAIL\}\}/g, company.contactEmail)
        .replace(/\{\{SUPPORT_EMAIL\}\}/g, company.supportEmail)
        .replace(/\{\{SUPPORT_PHONE\}\}/g, company.supportPhone)
        .replace(/\{\{SUPPORT_HOURS\}\}/g, company.supportHours)
        .replace(/\{\{SUPPORT_LOCATION\}\}/g, company.supportLocation)
        .replace(/\{\{PLAYER_NAME\}\}/g, data.playerName)
        .replace(/\{\{PARENT_NAME\}\}/g, data.parentName)
        .replace(/\{\{DATE_SIGNED\}\}/g, data.signedAt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        }));

      // Add primary business address if available
      if (company.availableLocations && company.availableLocations.length > 0) {
        const primaryLocation = company.availableLocations[0];
        const fullAddress = [
          primaryLocation.addressLine1,
          primaryLocation.addressLine2,
          `${primaryLocation.city}${primaryLocation.state ? ', ' + primaryLocation.state : ''}${primaryLocation.postalCode ? ' ' + primaryLocation.postalCode : ''}`,
          primaryLocation.country
        ].filter(Boolean).join(', ');
        
        processedContent = processedContent
          .replace(/\{\{COMPANY_ADDRESS\}\}/g, fullAddress)
          .replace(/\{\{COMPANY_CITY\}\}/g, primaryLocation.city)
          .replace(/\{\{COMPANY_STATE\}\}/g, primaryLocation.state || '')
          .replace(/\{\{COMPANY_POSTAL_CODE\}\}/g, primaryLocation.postalCode || '');
      }
    }
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.templateTitle}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .letterhead {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
          }
          .letterhead-logo {
            max-height: 80px;
            max-width: 300px;
            object-fit: contain;
            margin-bottom: 10px;
          }
          .letterhead-company-name {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
          }
          .letterhead-contact {
            font-size: 12px;
            color: #666;
            margin-top: 10px;
          }
          .header {
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2563eb;
          }
          .document-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .signature-section {
            border-top: 2px solid #333;
            padding-top: 20px;
            margin-top: 30px;
          }
          .signature-box {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 15px;
          }
          .verification {
            background: #f0fdf4;
            border: 1px solid #22c55e;
            padding: 15px;
            border-radius: 5px;
            font-size: 12px;
            color: #166534;
          }
          .metadata {
            font-size: 11px;
            color: #666;
            margin-top: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          .consent-content h1, .consent-content h2, .consent-content h3 {
            color: #1f2937;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          .consent-content ul, .consent-content ol {
            margin: 10px 0;
            padding-left: 20px;
          }
          .consent-content li {
            margin-bottom: 5px;
          }
          
          /* Print-specific styles */
          @media print {
            body {
              margin: 0;
              padding: 20px;
            }
            .header div[style*="background"] {
              display: none; /* Hide the notice when printing */
            }
            .letterhead, .header, .document-info, .content, .signature-section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <!-- Company Letterhead -->
        <div class="letterhead">
          ${company?.businessLogo ? 
            `<img src="${company.businessLogo}" alt="${company.businessName}" class="letterhead-logo" />` : 
            `<div class="letterhead-company-name">${company?.businessName || 'Futsal Culture'}</div>`
          }
          <div class="letterhead-contact">
            ${company?.contactEmail || ''} ${company?.supportPhone ? '• ' + company.supportPhone : ''}<br>
            ${company?.supportLocation || ''}
          </div>
        </div>

        <div class="header">
          <div class="title">${data.templateTitle}</div>
          <div>Official Consent Document (HTML Format)</div>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 10px 0; border-radius: 5px; font-size: 14px;">
            <strong>📄 Document Notice:</strong> This document is in HTML format as a fallback option. 
            To save as PDF: Use your browser's Print function and select "Save as PDF" as the destination.
          </div>
        </div>

        <div class="document-info">
          <table>
            <tr>
              <th>Player Name:</th>
              <td>${data.playerName}</td>
              <th>Parent/Guardian:</th>
              <td>${data.parentName}</td>
            </tr>
            <tr>
              <th>Document Type:</th>
              <td>${data.templateType.charAt(0).toUpperCase() + data.templateType.slice(1)}</td>
              <th>Date Signed:</th>
              <td>${data.signedAt.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })}</td>
            </tr>
          </table>
        </div>

        <div class="content">
          <div class="consent-content">
            ${processedContent}
          </div>
        </div>

        <div class="signature-section">
          <h3>Electronic Signature and Consent</h3>
          
          <div class="signature-box">
            <p><strong>Digital Signature:</strong> ${data.parentName}</p>
            <p><strong>Signature Date:</strong> ${data.signedAt.toISOString()}</p>
            <p><strong>IP Address:</strong> ${data.ipAddress || 'Not recorded'}</p>
            <p><strong>User Agent:</strong> ${data.userAgent ? data.userAgent.substring(0, 100) + '...' : 'Not recorded'}</p>
          </div>

          <div class="verification">
            <p><strong>Document Verification</strong></p>
            <p>This document has been electronically signed and is legally binding. The digital signature below verifies the authenticity and integrity of this document.</p>
            <p><strong>Digital Signature Hash:</strong> <code>${signatureHash}</code></p>
            <p><strong>Player ID:</strong> ${data.playerId}</p>
            <p><strong>Tenant ID:</strong> ${data.tenantId}</p>
          </div>

          <div class="metadata">
            <p><em>This document was generated electronically and constitutes a legally binding agreement. Any modifications to this document after signing will invalidate the digital signature.</em></p>
            <p><em>Generated on: ${new Date().toISOString()}</em></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateDigitalSignature(data: ConsentFormData): string {
    const signatureData = {
      tenantId: data.tenantId,
      playerId: data.playerId,
      parentId: data.parentId,
      templateType: data.templateType,
      signedAt: data.signedAt.toISOString(),
      ipAddress: data.ipAddress,
      contentHash: crypto.createHash('sha256').update(data.templateContent).digest('hex')
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(signatureData))
      .digest('hex');
  }

  public async generateAndStoreConsentDocument(data: ConsentFormData): Promise<GeneratedDocument> {
    // Fetch company settings if not provided
    if (!data.companySettings) {
      data.companySettings = await this.fetchCompanySettings(data.tenantId);
    }
    
    // Generate PDF
    const { buffer: pdfBuffer, isHtmlFallback } = await this.generateConsentPDF(data);
    
    // Generate file name
    const timestamp = data.signedAt.toISOString().replace(/[:.]/g, '-');
    const extension = isHtmlFallback ? 'html' : 'pdf';
    const fileName = `consent-${data.templateType}-${data.playerId}-${timestamp}.${extension}`;
    
    // Generate digital signature
    const digitalSignature = this.generateDigitalSignature(data);
    
    // Store in object storage
    const objectStorageService = new ObjectStorageService();
    
    // Upload PDF to object storage
    const uploadUrl = await objectStorageService.getObjectEntityUploadURL();
    
    // Upload the PDF buffer to the presigned URL
    const contentType = isHtmlFallback ? 'text/html' : 'application/pdf';
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: pdfBuffer,
      headers: {
        'Content-Type': contentType,
        'Content-Length': pdfBuffer.length.toString(),
      }
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload document: ${uploadResponse.statusText}`);
    }

    // Get the file path from the upload URL
    const filePath = objectStorageService.normalizeObjectEntityPath(uploadUrl);

    return {
      pdfBuffer,
      fileName,
      digitalSignature,
      filePath,
      contentType,
      isHtmlFallback
    };
  }

  public verifyDocumentSignature(document: any, originalData: ConsentFormData): boolean {
    const expectedSignature = this.generateDigitalSignature(originalData);
    return document.digitalSignature === expectedSignature;
  }
}