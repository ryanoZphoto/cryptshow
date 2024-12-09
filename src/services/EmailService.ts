import nodemailer from 'nodemailer';
import { TokenSubmission } from './SubmissionService';

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    async sendEmail(options: EmailOptions): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html
            });
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    async sendSubmissionConfirmation(submission: TokenSubmission): Promise<void> {
        const text = `
            Thank you for submitting your token!
            
            Token Details:
            - Address: ${submission.tokenAddress}
            - Name: ${submission.tokenName}
            - Symbol: ${submission.tokenSymbol}
            - Tier: ${submission.tier}
            
            We will notify you when your token is ready to be showcased.
        `;

        await this.sendEmail({
            to: submission.email,
            subject: 'Token Submission Confirmation',
            text
        });
    }

    async sendShowcaseNotification(submission: TokenSubmission, position: number): Promise<void> {
        const text = `
            Your token is approaching its showcase time!
            
            Token Details:
            - Address: ${submission.tokenAddress}
            - Name: ${submission.tokenName}
            - Current Position: ${position}
            
            Please make sure everything is ready for the showcase.
        `;

        await this.sendEmail({
            to: submission.email,
            subject: 'Token Showcase Approaching',
            text
        });
    }
}