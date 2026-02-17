import { IsString, IsNumber, IsDateString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class CreateCouponDto {
    @IsString()
    code: string;

    @IsNumber()
    discount: number;

    @IsString()
    @IsIn(['PERCENTAGE', 'FIXED'])
    type: string;

    @IsDateString()
    expiry: string;

    @IsOptional()
    @IsNumber()
    usageLimit?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
