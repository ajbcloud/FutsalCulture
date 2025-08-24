import puppeteer from 'puppeteer';
import crypto from 'crypto';
import { ObjectStorageService } from '../objectStorage';

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
}

export interface GeneratedDocument {
  pdfBuffer: Buffer;
  fileName: string;
  digitalSignature: string;
  filePath?: string;
}

export class PDFGeneratorService {
  private async generateConsentPDF(data: ConsentFormData): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      const htmlContent = this.generateConsentHTML(data);
      
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      const pdfBuffer = await page.pdf({
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

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  private generateConsentHTML(data: ConsentFormData): string {
    const signatureHash = this.generateDigitalSignature(data);
    
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
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${data.templateTitle}</div>
          <div>Official Consent Document</div>
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
            ${data.templateContent}
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
    // Generate PDF
    const pdfBuffer = await this.generateConsentPDF(data);
    
    // Generate file name
    const timestamp = data.signedAt.toISOString().replace(/[:.]/g, '-');
    const fileName = `consent-${data.templateType}-${data.playerId}-${timestamp}.pdf`;
    
    // Generate digital signature
    const digitalSignature = this.generateDigitalSignature(data);
    
    // Store in object storage
    const objectStorageService = new ObjectStorageService();
    
    // Upload PDF to object storage
    const uploadUrl = await objectStorageService.getObjectEntityUploadURL();
    
    // Upload the PDF buffer to the presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: pdfBuffer,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length.toString(),
      }
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload PDF: ${uploadResponse.statusText}`);
    }

    // Get the file path from the upload URL
    const filePath = objectStorageService.normalizeObjectEntityPath(uploadUrl);

    return {
      pdfBuffer,
      fileName,
      digitalSignature,
      filePath
    };
  }

  public verifyDocumentSignature(document: any, originalData: ConsentFormData): boolean {
    const expectedSignature = this.generateDigitalSignature(originalData);
    return document.digitalSignature === expectedSignature;
  }
}