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
  try {
    console.log(`[OTP Verify] Attempting to verify OTP for ${phoneNumber}`);
    
    
    const otpRecord = await OTP.findOne({
      phone_number: phoneNumber,
      verified: false
    }).sort({ created_at: -1 });

    if (!otpRecord) {
      console.log(`[OTP Verify] No unverified OTP found for ${phoneNumber}`);
      return {
        valid: false,
        message: "Invalid OTP code. Please request a new OTP.",
      };
    }

    console.log(`[OTP Verify] Found OTP record. Expected: ${otpRecord.otp}, Received: ${otp}`);

    
    if (otpRecord.otp !== otp) {
      console.log(`[OTP Verify] OTP mismatch for ${phoneNumber}`);
      return {
        valid: false,
        message: "Invalid OTP code",
      };
    }

   
    if (otpRecord.expires_at < new Date()) {
      console.log(`[OTP Verify] OTP expired for ${phoneNumber}. Expires: ${otpRecord.expires_at}, Now: ${new Date()}`);
      return {
        valid: false,
        message: "OTP has expired. Please request a new OTP.",
      };
    }

    
    otpRecord.verified = true;
    await otpRecord.save();

    console.log(`[OTP Verify] Successfully verified OTP for ${phoneNumber}`);
    return {
      valid: true,
      message: "OTP verified successfully",
    };
  } catch (error) {
    console.error("[OTP Verify] Error during verification:", error);
    return {
      valid: false,
      message: "Failed to verify OTP. Please try again.",
    };
  }
}

export async function cleanupExpiredOTPs(): Promise<void> {
  await OTP.deleteMany({ expires_at: { $lt: new Date() } });
}
