const BASE_URL = import.meta.env.VITE_ML_ENGINE_URL || 'https://dakshhadvani19-agrishield.hf.space';

export const aiService = {
    checkCropSuitability: async (payload) => {
        try {
            const response = await fetch(`${BASE_URL}/api/v1/check-suitability`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Failed to check suitability: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("[aiService] checkCropSuitability error:", error);
            throw error;
        }
    },

    sendChatMessage: async (messages, context = null, farms = [], weather = null, userName = null) => {
        try {
            const response = await fetch(`${BASE_URL}/api/v1/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages,
                    context,
                    farms,
                    weather,
                    user_name: userName,
                }),
            });

            if (!response.ok) {
                throw new Error(`Chat API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("[aiService] sendChatMessage error:", error);
            throw error;
        }
    },

    registerReportSettings: async (payload) => {
        try {
            const response = await fetch(`${BASE_URL}/api/v1/register-report-settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Settings registration API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("[aiService] registerReportSettings error:", error);
            throw error;
        }
    },

    verifyPhoneNumber: async (phone, twilioSid, twilioToken) => {
        try {
            const response = await fetch(`${BASE_URL}/api/v1/verify-phone`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone, twilio_sid: twilioSid, twilio_token: twilioToken }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return { valid: false, message: errorData.detail || 'Invalid phone number' };
            }

            return await response.json();
        } catch (error) {
            console.error("[aiService] verifyPhoneNumber error:", error);
            throw error;
        }
    },

    sendTestReport: async (payload) => {
        try {
            const response = await fetch(`${BASE_URL}/api/v1/send-test-report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Send test report API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("[aiService] sendTestReport error:", error);
            throw error;
        }
    },

    analyzeNutrition: async (payload) => {
        try {
            const response = await fetch(`${BASE_URL}/api/v1/analyze-nutrition`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Analyze nutrition API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("[aiService] analyzeNutrition error:", error);
            throw error;
        }
    },

    validateImageCrop: async (payload) => {
        // payload: { crop_name: string, image: string (base64 data URI) }
        try {
            const response = await fetch(`${BASE_URL}/api/v1/validate-image-crop`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                // On network error, allow through so we don't block the user
                return { valid: true, detected_as: 'unknown', reason: 'Validation check skipped.' };
            }

            return await response.json();
        } catch (error) {
            console.error("[aiService] validateImageCrop error:", error);
            // On any error, allow through gracefully
            return { valid: true, detected_as: 'unknown', reason: 'Validation check skipped.' };
        }
    }
};
