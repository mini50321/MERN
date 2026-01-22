// Fast2SMS OTP utility functions

export interface OTPResponse {
  success: boolean;
  message: string;
  otp?: string;
}

export async function generateOTP(): Promise<string> {
  // Generate 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTP(
  phoneNumber: string,
  otp: string,
  apiKey: string
): Promise<OTPResponse> {
  try {
    console.log(`[OTP] Attempting to send OTP ${otp} to ${phoneNumber} using DLT route`);
    
    // Use GET request with query parameters as per Fast2SMS DLT API
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=dlt&sender_id=MAVY&message=206273&variables_values=${otp}&flash=0&numbers=${phoneNumber}`;
    
    console.log(`[OTP] Request URL: ${url.replace(apiKey, 'HIDDEN')}`);
    
    const response = await fetch(url, {
      method: "GET",
    });

    const data = await response.json() as { return: boolean; message: string[]; request_id?: string };
    
    console.log(`[OTP] Fast2SMS Response:`, JSON.stringify(data));

    if (data.return) {
      console.log(`[OTP] Successfully sent OTP to ${phoneNumber}, Request ID: ${data.request_id}`);
      return {
        success: true,
        message: "OTP sent successfully",
        otp,
      };
    } else {
      const errorMsg = Array.isArray(data.message) ? data.message[0] : data.message || "Failed to send OTP";
      console.error(`[OTP] Fast2SMS Error:`, errorMsg);
      return {
        success: false,
        message: errorMsg,
      };
    }
  } catch (error) {
    console.error("[OTP] Fast2SMS Exception:", error);
    return {
      success: false,
      message: "Failed to send OTP. Please try again.",
    };
  }
}

export async function storeOTP(
  db: any,
  phoneNumber: string,
  otp: string
): Promise<void> {
  // OTP expires in 5 minutes
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  // Delete any existing OTPs for this phone number
  await db
    .prepare("DELETE FROM otp_verifications WHERE phone_number = ?")
    .bind(phoneNumber)
    .run();

  // Store new OTP
  await db
    .prepare(
      "INSERT INTO otp_verifications (phone_number, otp_code, expires_at) VALUES (?, ?, ?)"
    )
    .bind(phoneNumber, otp, expiresAt)
    .run();
}

export async function verifyOTP(
  db: any,
  phoneNumber: string,
  otp: string
): Promise<{ valid: boolean; message: string }> {
  const result = await db
    .prepare(
      "SELECT * FROM otp_verifications WHERE phone_number = ? AND otp_code = ? AND is_verified = 0 ORDER BY created_at DESC LIMIT 1"
    )
    .bind(phoneNumber, otp)
    .first();

  if (!result) {
    return {
      valid: false,
      message: "Invalid OTP code",
    };
  }

  const expiresAt = new Date(result.expires_at as string);
  if (expiresAt < new Date()) {
    return {
      valid: false,
      message: "OTP has expired",
    };
  }

  // Mark OTP as verified
  await db
    .prepare(
      "UPDATE otp_verifications SET is_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .bind(result.id)
    .run();

  return {
    valid: true,
    message: "OTP verified successfully",
  };
}

export async function cleanupExpiredOTPs(db: any): Promise<void> {
  await db
    .prepare("DELETE FROM otp_verifications WHERE expires_at < DATETIME('now')")
    .run();
}
