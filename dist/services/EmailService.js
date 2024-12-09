"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }
    async sendEmail(options) {
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html
            });
        }
        catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }
    async sendSubmissionConfirmation(submission) {
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
    async sendShowcaseNotification(submission, position) {
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
exports.EmailService = EmailService;
