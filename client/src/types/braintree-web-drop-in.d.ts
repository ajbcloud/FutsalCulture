declare module 'braintree-web-drop-in' {
  interface DropinInstance {
    requestPaymentMethod(): Promise<{ nonce: string; type: string }>;
    teardown(): Promise<void>;
    on(event: string, callback: (data: any) => void): void;
  }

  interface DropinOptions {
    authorization: string;
    container: HTMLElement | string;
    card?: {
      cardholderName?: {
        required?: boolean;
      };
    };
    venmo?: {
      allowDesktop?: boolean;
      allowDesktopWebLogin?: boolean;
      allowNewBrowserTab?: boolean;
      mobileWebFallBack?: boolean;
      paymentMethodUsage?: 'single_use' | 'multi_use';
    };
    googlePay?: {
      merchantId: string;
      transactionInfo: {
        totalPriceStatus: 'FINAL' | 'ESTIMATED';
        totalPrice: string;
        currencyCode: string;
      };
    };
    paypal?: {
      flow: string;
      amount: number;
      currency: string;
    };
  }

  interface DropinModule {
    create(options: DropinOptions): Promise<DropinInstance>;
  }

  const dropin: DropinModule;
  export = dropin;
}