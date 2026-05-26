import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sendEmailDto } from './dto/sendmail.dto';
import * as nodemailer from 'nodemailer'

@Injectable()
export class MaillerService {
    constructor(
        private readonly configService : ConfigService
    ) {}
    emailTransport(){
        const transporter = nodemailer.createTransport({
            host: this.configService.get<string>('EMAIL_HOST'),
            port: this.configService.get<number>('EMAIL_PORT'),
            secure: false,
            auth: {
                user: this.configService.get<string>('EMAIL_USER'),
                pass: this.configService.get<string>('EMAIL_PASS'),
            },
        });
        return transporter;
    }

    async sendEmail(EmailDto: sendEmailDto) {
        const { recipients, subject, html} = EmailDto;

        const transport = this.emailTransport();

        const options: nodemailer.SendMailOptions = {
            from: this.configService.get<string>('EMAIL_USER'),
            to: recipients,
            subject: subject,
            html : html,
        };
        try{    
            await transport.sendMail(options);
            console.log("Email sent successfully to ", recipients);

        }catch(err){
            console.log("Error Sending mail ", err);
        }

    }

    // For now it is still can't not work because you have to update prisma database
    async sendPasswordResetEmail(email: string, token: string) {
        const resetLink = `http://localhost:3000/api/auth/reset-password?token=${token}`;
        await this.sendEmail({
            recipients: [email],
            subject: 'Reset Your Password',
            html: `
            <h3>Reset Password</h3>
            <p>Click the link below to reset your password:</p>
            <a href="${resetLink}">${resetLink}</a>
            <p>This link will expire soon.</p>
        `,
        })
    }

}
