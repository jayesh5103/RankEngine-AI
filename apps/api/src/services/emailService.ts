export interface IEmailService {
  sendEmail(to: string, subject: string, textBody: string): Promise<boolean>;
}

export class ConsoleEmailService implements IEmailService {
  async sendEmail(to: string, subject: string, textBody: string): Promise<boolean> {
    console.log('============================= EMAIL SENT =============================');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${textBody}`);
    console.log('======================================================================');
    return true;
  }
}

let activeEmailService: IEmailService = new ConsoleEmailService();

export const getEmailService = (): IEmailService => {
  return activeEmailService;
};

// Test helper to override email service implementation
export const _setEmailService = (service: IEmailService) => {
  activeEmailService = service;
};
