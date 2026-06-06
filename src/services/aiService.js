const BASE_URL = import.meta.env.DEV ? 'http://127.0.0.1:8000' : '';

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
    }
};
