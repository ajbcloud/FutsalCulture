
/**
 * TEMPLATE PROCESSING SERVICE
 * Handles template variable replacement, validation, and optimization
 */

export interface TemplateVariables {
  // Player/Parent variables
  customerName?: string;
  firstName?: string;
  lastName?: string;
  playerName?: string;
  parentName?: string;
  
  // Session/Booking variables
  sessionDate?: string;
  sessionTime?: string;
  location?: string;
  sessionName?: string;
  sessionPrice?: string;
  totalAmount?: string;
  confirmationCode?: string;
  
  // Business variables
  tenantName?: string;
  businessName?: string;
  businessPhone?: string;
  businessAddress?: string;
  
  // Special variables
  inviteUrl?: string;
  expiresAt?: string;
  discountCode?: string;
  
  // Custom variables
  [key: string]: string | undefined;
}

export interface ProcessedTemplate {
  subject?: string;
  content: string;
  variables: TemplateVariables;
  missingVariables: string[];
  isValid: boolean;
}

export class TemplateProcessor {
  private static instance: TemplateProcessor;
  
  private constructor() {}

  public static getInstance(): TemplateProcessor {
    if (!TemplateProcessor.instance) {
      TemplateProcessor.instance = new TemplateProcessor();
    }
    return TemplateProcessor.instance;
  }

  /**
   * Process a template with given variables
   */
  public processTemplate(
    template: string,
    subject: string | undefined,
    variables: Partial<TemplateVariables>
  ): ProcessedTemplate {
    const missingVariables: string[] = [];
    const usedVariables: TemplateVariables = {};

    // Process content
    let processedContent = this.replaceVariables(template, variables, missingVariables, usedVariables);
    
    // Process subject if provided
    let processedSubject: string | undefined;
    if (subject) {
      processedSubject = this.replaceVariables(subject, variables, missingVariables, usedVariables);
    }

    return {
      subject: processedSubject,
      content: processedContent,
      variables: usedVariables,
      missingVariables,
      isValid: missingVariables.length === 0
    };
  }

  /**
   * Replace variables in text with actual values
   */
  private replaceVariables(
    text: string,
    variables: Partial<TemplateVariables>,
    missingVariables: string[],
    usedVariables: TemplateVariables
  ): string {
    // Find all variable placeholders in the format {{variableName}}
    const variablePattern = /\{\{([^}]+)\}\}/g;
    
    return text.replace(variablePattern, (match, variableName) => {
      const trimmedName = variableName.trim();
      
      // Check if variable exists
      if (variables[trimmedName] !== undefined) {
        usedVariables[trimmedName] = variables[trimmedName]!;
        return variables[trimmedName]!;
      } else {
        // Track missing variables
        if (!missingVariables.includes(trimmedName)) {
          missingVariables.push(trimmedName);
        }
        return match; // Return original placeholder if variable not found
      }
    });
  }

  /**
   * Validate template syntax
   */
  public validateTemplate(template: string, subject?: string): {
    isValid: boolean;
    errors: string[];
    variables: string[];
  } {
    const errors: string[] = [];
    const variables: string[] = [];
    
    // Check for unclosed braces
    const openBraces = (template.match(/\{\{/g) || []).length;
    const closeBraces = (template.match(/\}\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push('Mismatched template braces - ensure all {{variables}} are properly closed');
    }

    // Extract all variables
    const variablePattern = /\{\{([^}]+)\}\}/g;
    let match;
    
    while ((match = variablePattern.exec(template)) !== null) {
      const variableName = match[1].trim();
      if (!variables.includes(variableName)) {
        variables.push(variableName);
      }
    }

    // Check subject if provided
    if (subject) {
      const subjectOpenBraces = (subject.match(/\{\{/g) || []).length;
      const subjectCloseBraces = (subject.match(/\}\}/g) || []).length;
      
      if (subjectOpenBraces !== subjectCloseBraces) {
        errors.push('Mismatched template braces in subject line');
      }

      // Reset regex for subject
      variablePattern.lastIndex = 0;
      while ((match = variablePattern.exec(subject)) !== null) {
        const variableName = match[1].trim();
        if (!variables.includes(variableName)) {
          variables.push(variableName);
        }
      }
    }

    // Check for empty variable names
    const emptyVariables = variables.filter(v => v === '');
    if (emptyVariables.length > 0) {
      errors.push('Empty variable names found - ensure all {{}} contain variable names');
    }

    return {
      isValid: errors.length === 0,
      errors,
      variables
    };
  }

  /**
   * Get available template variables with descriptions
   */
  public getAvailableVariables(): Array<{
    name: string;
    description: string;
    example: string;
    category: string;
  }> {
    return [
      // Player/Parent variables
      { name: 'customerName', description: 'Full name of the customer', example: 'John Doe', category: 'Personal' },
      { name: 'firstName', description: 'Customer first name', example: 'John', category: 'Personal' },
      { name: 'lastName', description: 'Customer last name', example: 'Doe', category: 'Personal' },
      { name: 'playerName', description: 'Player name', example: 'Alex Smith', category: 'Personal' },
      { name: 'parentName', description: 'Parent name', example: 'Jane Smith', category: 'Personal' },
      
      // Session variables
      { name: 'sessionDate', description: 'Formatted session date', example: 'Monday, January 15, 2024', category: 'Session' },
      { name: 'sessionTime', description: 'Formatted session time', example: '2:00 PM', category: 'Session' },
      { name: 'location', description: 'Session location', example: 'Main Training Center', category: 'Session' },
      { name: 'sessionName', description: 'Name of the session', example: 'Elite Training', category: 'Session' },
      { name: 'sessionPrice', description: 'Session price', example: '$35.00', category: 'Session' },
      { name: 'totalAmount', description: 'Total booking amount', example: '$45.00', category: 'Session' },
      { name: 'confirmationCode', description: 'Booking confirmation code', example: 'ABC123', category: 'Session' },
      
      // Business variables
      { name: 'tenantName', description: 'Organization name', example: 'Elite Sports Academy', category: 'Business' },
      { name: 'businessName', description: 'Business name', example: 'Elite Sports Academy', category: 'Business' },
      { name: 'businessPhone', description: 'Business phone number', example: '(555) 123-4567', category: 'Business' },
      { name: 'businessAddress', description: 'Business address', example: '123 Main Street, Your City', category: 'Business' },
      
      // Special variables
      { name: 'inviteUrl', description: 'Invitation acceptance URL', example: 'https://app.playhq.app/invite/abc123', category: 'Special' },
      { name: 'expiresAt', description: 'Invitation expiration date', example: 'January 20, 2024', category: 'Special' },
      { name: 'discountCode', description: 'Discount code', example: 'SAVE20', category: 'Special' }
    ];
  }

  /**
   * Generate preview data for template testing
   */
  public generatePreviewData(): TemplateVariables {
    return {
      customerName: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      playerName: 'Alex Smith',
      parentName: 'Jane Smith',
      sessionDate: 'Monday, January 15, 2024',
      sessionTime: '2:00 PM',
      location: 'Main Training Center',
      sessionName: 'Elite Training Session',
      sessionPrice: '$35.00',
      totalAmount: '$35.00',
      confirmationCode: 'ABC123',
      tenantName: 'Elite Sports Academy',
      businessName: 'Elite Sports Academy',
      businessPhone: '(555) 123-4567',
      businessAddress: '123 Main Street, Your City, State 12345',
      inviteUrl: 'https://app.playhq.app/invite/abc123',
      expiresAt: 'January 20, 2024',
      discountCode: 'SAVE20'
    };
  }

  /**
   * Optimize template for SMS (shorten content, preserve key info)
   */
  public optimizeForSMS(content: string, maxLength: number = 160): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Common SMS optimizations
    let optimized = content
      // Remove extra whitespace and line breaks
      .replace(/\s+/g, ' ')
      .trim()
      // Common abbreviations for sports/training context
      .replace(/training/gi, 'training')
      .replace(/session/gi, 'session')
      .replace(/confirmation/gi, 'conf')
      .replace(/academy/gi, 'academy')
      .replace(/tomorrow/gi, 'tmrw')
      .replace(/reminder/gi, 'remind')
      .replace(/please/gi, 'pls')
      .replace(/your/gi, 'ur')
      .replace(/thank you/gi, 'thx')
      // Remove common filler words
      .replace(/\b(the|a|an)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // If still too long, truncate with ellipsis
    if (optimized.length > maxLength - 3) {
      optimized = optimized.substring(0, maxLength - 3) + '...';
    }

    return optimized;
  }

  /**
   * Convert plain text to HTML for email templates
   */
  public convertToHTML(plainText: string): string {
    return plainText
      // Convert line breaks to HTML
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      // Wrap in paragraphs
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
      // Clean up empty paragraphs
      .replace(/<p><\/p>/g, '')
      // Convert URLs to links
      .replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" style="color: #1e40af; text-decoration: underline;">$1</a>'
      )
      // Convert email addresses to links
      .replace(
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
        '<a href="mailto:$1" style="color: #1e40af; text-decoration: underline;">$1</a>'
      )
      // Convert phone numbers to links
      .replace(
        /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g,
        '<a href="tel:$1" style="color: #1e40af; text-decoration: underline;">$1</a>'
      );
  }

  /**
   * Sanitize template content for security
   */
  public sanitizeTemplate(content: string): string {
    return content
      // Remove potentially dangerous HTML tags and attributes
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^>]*>/gi, '')
      .replace(/<object\b[^>]*>/gi, '')
      .replace(/<embed\b[^>]*>/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:text\/html/gi, '');
  }
}

export const templateProcessor = TemplateProcessor.getInstance();
