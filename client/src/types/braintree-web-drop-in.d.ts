declare module 'braintree-web-drop-in' {
  interface DropinInstance {
    requestPaymentMethod(): Promise<{ nonce: string; type: string }>;
    teardown(): Promise<void>;
  }

  interface DropinOptions {
    authorization: string;
    container: HTMLElement | string;
    card?: {
      cardholderName?: {
        required?: boolean;
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