import z from 'zod';
import { createZodDto } from 'nestjs-zod/dto';

export const RegisterSchema = z.object({
    email: z.string().email().optional(),
    password: z.string()
              .min(6, "password should more than six")
              .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)
              .optional(),
    confirmPassword: z.string()
              .min(6, "password should more than six")
              .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)
              .optional(),
    fullname: z.string().min(5),
    phone: z.number().min(8).optional(),
    profileImageUrl: z.string().optional()
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
