import { IsNotEmpty, IsString , IsOptional, IsEmail} from "class-validator";

export class sendEmailDto {
    
    @IsNotEmpty()
    @IsEmail({}, {each: true}) // validate each element in the array as an email
    recipients: string[] = [];

    @IsString()
    subject!: string;

    @IsString()
    html!: string;

    @IsOptional()
    @IsString()
    text?: string;


}