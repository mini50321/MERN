import { OTP } from '../models/index.js';

export interface OTPResponse {
  success: boolean;
  message: string;
  otp?: string;
}

export async function generateOTP(): Promise<string> {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTP(
  phoneNumber: string,
  otp: string,
  apiKey: string
): Promise<OTPResponse> {
  try {
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=dlt&sender_id=MAVY&message=206273&variables_values=${otp}&flash=0&numbers=${phoneNumber}`;
    
    const response = await fetch(url, {
      method: "GET",
    });

    const data = await response.json() as { return: boolean; message: string[]; request_id?: string };
    
    if (data.return) {
      return {
        success: true,
        message: "OTP sent successfully",
        otp,
      };
    } else {
      const errorMsg = Array.isArray(data.message) ? data.message[0] : data.message || "Failed to send OTP";
      return {
        success: false,
        message: errorMsg,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "Failed to send OTP. Please try again.",
    };
  }
}

export async function storeOTP(
  phoneNumber: string,
  otp: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await OTP.deleteMany({ phone_number: phoneNumber });

  await OTP.create({
    phone_number: phoneNumber,
    otp,
    expires_at: expiresAt,
    verified: false
  });
}

export async function verifyOTP(
  phoneNumber: string,
  otp: string
): Promise<{ valid: boolean; message: string }> {
  const otpRecord = await OTP.findOne({
    phone_number: phoneNumber,
    otp,
    verified: false
  }).sort({ created_at: -1 });

  if (!otpRecord) {
    return {
      valid: false,
      message: "Invalid OTP code",
    };
  }

  if (otpRecord.expires_at < new Date()) {
    return {
      valid: false,
      message: "OTP has expired",
    };
  }

  otpRecord.verified = true;
  await otpRecord.save();

  return {
    valid: true,
    message: "OTP verified successfully",
  };
}

export async function cleanupExpiredOTPs(): Promise<void> {
  await OTP.deleteMany({ expires_at: { $lt: new Date() } });
}
