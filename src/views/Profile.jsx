import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { farmService } from '../services/farmService';
import { Sprout, Mountain, Trash2, Plus, LogOut, User, Smartphone, ArrowRight } from 'lucide-react';
import { getFarmerCoordinates } from '../services/weatherService';
import { aiService } from '../services/aiService';

const COUNTRIES = [
    { name: 'India', code: '+91', flag: '🇮🇳' },
    { name: 'United States', code: '+1', flag: '🇺🇸' },
    { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
    { name: 'Canada', code: '+1', flag: '🇨🇦' },
    { name: 'Australia', code: '+61', flag: '🇦🇺' },
    { name: 'Pakistan', code: '+92', flag: '🇵🇰' },
    { name: 'Bangladesh', code: '+880', flag: '🇧🇩' },
    { name: 'Sri Lanka', code: '+94', flag: '🇱🇰' },
    { name: 'Nepal', code: '+977', flag: '🇳🇵' },
    { name: 'Singapore', code: '+65', flag: '🇸🇬' },
    { name: 'Malaysia', code: '+60', flag: '🇲🇾' },
    { name: 'Indonesia', code: '+62', flag: '🇮🇩' },
    { name: 'South Africa', code: '+27', flag: '🇿🇦' },
    { name: 'Kenya', code: '+254', flag: '🇰🇪' },
    { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
    { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
    { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
    { name: 'Germany', code: '+49', flag: '🇩🇪' },
    { name: 'France', code: '+33', flag: '🇫🇷' },
    { name: 'Brazil', code: '+55', flag: '🇧🇷' }
];

const detectCountryCode = () => {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (!tz) return '+91'; // Default to India as primary demographic
        
        const tzMap = {
            'Asia/Kolkata': '+91',
            'Asia/Calcutta': '+91',
            'Asia/Karachi': '+92',
            'Asia/Dhaka': '+880',
            'Asia/Colombo': '+94',
            'Asia/Kathmandu': '+977',
            'Asia/Kabul': '+93',
            'Asia/Tehran': '+98',
            'Asia/Dubai': '+971',
            'Asia/Riyadh': '+966',
            'Asia/Baghdad': '+964',
            'Asia/Singapore': '+65',
            'Asia/Jakarta': '+62',
            'Asia/Bangkok': '+66',
            'Asia/Manila': '+63',
            'Asia/Kuala_Lumpur': '+60',
            'Asia/Seoul': '+82',
            'Asia/Tokyo': '+81',
            'Asia/Shanghai': '+86',
            'Asia/Taipei': '+886',
            'Asia/Hong_Kong': '+852',
            'Australia/Sydney': '+61',
            'Australia/Melbourne': '+61',
            'Europe/London': '+44',
            'Europe/Paris': '+33',
            'Europe/Berlin': '+49',
            'Europe/Rome': '+39',
            'Europe/Madrid': '+34',
            'Europe/Amsterdam': '+31',
            'Europe/Brussels': '+32',
            'Europe/Zurich': '+41',
            'Europe/Vienna': '+43',
            'Europe/Stockholm': '+46',
            'Europe/Oslo': '+47',
            'Europe/Copenhagen': '+45',
            'Europe/Helsinki': '+358',
            'Europe/Moscow': '+7',
            'Europe/Kiev': '+380',
            'Africa/Cairo': '+20',
            'Africa/Johannesburg': '+27',
            'Africa/Lagos': '+234',
            'Africa/Nairobi': '+254',
            'America/New_York': '+1',
            'America/Chicago': '+1',
            'America/Denver': '+1',
            'America/Los_Angeles': '+1',
            'America/Toronto': '+1',
            'America/Mexico_City': '+52',
            'America/Sao_Paulo': '+55',
            'America/Argentina/Buenos_Aires': '+54',
            'America/Bogota': '+57',
            'America/Lima': '+51',
            'America/Santiago': '+56',
            'America/Caracas': '+58'
        };
        
        if (tzMap[tz]) return tzMap[tz];
        
        if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('India')) return '+91';
        if (tz.includes('London') || tz.includes('Belfast') || tz.includes('Dublin')) return '+44';
        if (tz.includes('Europe')) {
            if (tz.includes('Paris')) return '+33';
            if (tz.includes('Berlin')) return '+49';
            if (tz.includes('Rome')) return '+39';
            if (tz.includes('Madrid')) return '+34';
            return '+44';
        }
        if (tz.includes('America')) return '+1';
        if (tz.includes('Australia')) return '+61';
        if (tz.includes('Africa')) {
            if (tz.includes('Cairo')) return '+20';
            if (tz.includes('Johannesburg')) return '+27';
            return '+27';
        }
        if (tz.includes('Asia')) {
            if (tz.includes('Tokyo')) return '+81';
            if (tz.includes('Seoul')) return '+82';
            if (tz.includes('Singapore')) return '+65';
            return '+91';
        }
        return '+91';
    } catch (e) {
        return '+91';
    }
};

export default function Profile() {
    const { user, isLoading, loginWithGoogle, logout } = useAuth();
    const [farms, setFarms] = useState([]);
    const [newCrop, setNewCrop] = useState('');
    const [newSoil, setNewSoil] = useState('');
    const [isFetchingFarms, setIsFetchingFarms] = useState(false);

    const [countryCode, setCountryCode] = useState(() => {
        const savedPhone = localStorage.getItem('agrishield_report_phone') || '';
        if (savedPhone.startsWith('+')) {
            const sortedCountries = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
            const matched = sortedCountries.find(c => savedPhone.startsWith(c.code));
            if (matched) return matched.code;
        }
        return detectCountryCode();
    });

    const [phoneBody, setPhoneBody] = useState(() => {
        const savedPhone = localStorage.getItem('agrishield_report_phone') || '';
        if (savedPhone.startsWith('+')) {
            const sortedCountries = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
            const matched = sortedCountries.find(c => savedPhone.startsWith(c.code));
            if (matched) return savedPhone.slice(matched.code.length);
        }
        return savedPhone;
    });

    const phone = countryCode + phoneBody;

    const [deliveryMode, setDeliveryMode] = useState(localStorage.getItem('agrishield_report_mode') || 'SMS');
    const [reportsEnabled, setReportsEnabled] = useState(localStorage.getItem('agrishield_report_enabled') === 'true');
    const [twilioSid, setTwilioSid] = useState(localStorage.getItem('agrishield_twilio_sid') || '');
    const [twilioToken, setTwilioToken] = useState(localStorage.getItem('agrishield_twilio_token') || '');
    const [twilioFrom, setTwilioFrom] = useState(localStorage.getItem('agrishield_twilio_from') || '');
    const [smtpHost, setSmtpHost] = useState(localStorage.getItem('agrishield_smtp_host') || '');
    const [smtpPort, setSmtpPort] = useState(localStorage.getItem('agrishield_smtp_port') || '587');
    const [smtpUser, setSmtpUser] = useState(localStorage.getItem('agrishield_smtp_user') || '');
    const [smtpPass, setSmtpPass] = useState(localStorage.getItem('agrishield_smtp_pass') || '');
    const [smtpFrom, setSmtpFrom] = useState(localStorage.getItem('agrishield_smtp_from') || '');
    const [telegramBotToken, setTelegramBotToken] = useState(
        import.meta.env.VITE_TELEGRAM_BOT_TOKEN || localStorage.getItem('agrishield_telegram_bot_token') || '123456789:dummy_bot_token_alternative'
    );
    const [telegramChatId, setTelegramChatId] = useState(
        import.meta.env.VITE_TELEGRAM_CHAT_ID || localStorage.getItem('agrishield_telegram_chat_id') || 'dummy_chat_id_alternative'
    );
    const [showTwilioConfig, setShowTwilioConfig] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [testResponse, setTestResponse] = useState(null);

    const handleSaveSettings = async () => {
        if (!phoneBody.trim() || phoneBody.trim().length !== 10) {
            alert("Please enter a valid 10-digit mobile phone number.");
            return;
        }
        setIsSavingSettings(true);
        try {
            if (twilioSid && twilioToken) {
                try {
                    const verification = await aiService.verifyPhoneNumber(phone, twilioSid, twilioToken);
                    if (!verification.valid) {
                        alert(`Phone Verification Failed: ${verification.message}`);
                        setIsSavingSettings(false);
                        return;
                    }
                } catch (verifyErr) {
                    console.error("Verification error:", verifyErr);
                    alert("Failed to verify phone number with the backend.");
                    setIsSavingSettings(false);
                    return;
                }
            }

            const coords = await getFarmerCoordinates();
            const payload = {
                email: user.email,
                phone: phone,
                delivery_mode: deliveryMode,
                enabled: reportsEnabled,
                lat: coords.lat,
                lon: coords.lon,
                crops: farms.map(f => ({ crop: f.crop, soil: f.soil })),
                twilio_sid: twilioSid,
                twilio_token: twilioToken,
                twilio_from: twilioFrom,
                custom_smtp_host: smtpHost,
                custom_smtp_port: smtpPort ? parseInt(smtpPort, 10) : null,
                custom_smtp_user: smtpUser,
                custom_smtp_pass: smtpPass,
                custom_smtp_from: smtpFrom,
                custom_telegram_bot_token: telegramBotToken,
                custom_telegram_chat_id: telegramChatId
            };
            
            await aiService.registerReportSettings(payload);
            
            localStorage.setItem('agrishield_report_phone', phone);
            localStorage.setItem('agrishield_report_mode', deliveryMode);
            localStorage.setItem('agrishield_report_enabled', reportsEnabled.toString());
            localStorage.setItem('agrishield_twilio_sid', twilioSid);
            localStorage.setItem('agrishield_twilio_token', twilioToken);
            localStorage.setItem('agrishield_twilio_from', twilioFrom);
            localStorage.setItem('agrishield_smtp_host', smtpHost);
            localStorage.setItem('agrishield_smtp_port', smtpPort);
            localStorage.setItem('agrishield_smtp_user', smtpUser);
            localStorage.setItem('agrishield_smtp_pass', smtpPass);
            localStorage.setItem('agrishield_smtp_from', smtpFrom);
            localStorage.setItem('agrishield_telegram_bot_token', telegramBotToken);
            localStorage.setItem('agrishield_telegram_chat_id', telegramChatId);
            
            alert("Daily report preferences updated successfully!");
        } catch (error) {
            console.error("Failed to save report settings:", error);
            alert("Failed to sync settings with the backend. Settings saved locally.");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleSendTestReport = async () => {
        if (!phoneBody.trim() || phoneBody.trim().length !== 10) {
            alert("Please enter a valid 10-digit phone number first.");
            return;
        }
        setIsSendingTest(true);
        setTestResponse(null);
        try {
            if (twilioSid && twilioToken) {
                try {
                    const verification = await aiService.verifyPhoneNumber(phone, twilioSid, twilioToken);
                    if (!verification.valid) {
                        alert(`Phone Verification Failed: ${verification.message}`);
                        setIsSendingTest(false);
                        return;
                    }
                } catch (verifyErr) {
                    console.error("Verification error:", verifyErr);
                    alert("Failed to verify phone number with the backend.");
                    setIsSendingTest(false);
                    return;
                }
            }

            const coords = await getFarmerCoordinates();
            const payload = {
                email: user.email,
                phone: phone,
                delivery_mode: deliveryMode,
                enabled: reportsEnabled,
                lat: coords.lat,
                lon: coords.lon,
                crops: farms.map(f => ({ crop: f.crop, soil: f.soil })),
                twilio_sid: twilioSid,
                twilio_token: twilioToken,
                twilio_from: twilioFrom,
                custom_smtp_host: smtpHost,
                custom_smtp_port: smtpPort ? parseInt(smtpPort, 10) : null,
                custom_smtp_user: smtpUser,
                custom_smtp_pass: smtpPass,
                custom_smtp_from: smtpFrom,
                custom_telegram_bot_token: telegramBotToken,
                custom_telegram_chat_id: telegramChatId
            };
            
            const result = await aiService.sendTestReport(payload);
            setTestResponse(result);
        } catch (error) {
            console.error("Failed to trigger test report:", error);
            alert("Failed to request report from the server. Check if backend is active.");
        } finally {
            setIsSendingTest(false);
        }
    };

    useEffect(() => {
        if (user) {
            setIsFetchingFarms(true);
            farmService.getUserFarms(user.$id)
                .then(setFarms)
                .finally(() => setIsFetchingFarms(false));
        }
    }, [user]);

    const handleAddFarm = async () => {
        if (!newCrop || !newSoil || !user) return;
        try {
            const doc = await farmService.addFarmToDB(user.$id, newCrop, newSoil);
            setFarms([...farms, doc]);
            setNewCrop('');
            setNewSoil('');
        } catch (error) {
            alert("Failed to add farm.");
        }
    };

    const handleDelete = async (farmId) => {
        try {
            await farmService.deleteFarmFromDB(farmId);
            setFarms(farms.filter(f => f.$id !== farmId));
        } catch (error) {
            alert("Failed to delete farm.");
        }
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center animate-pulse text-gray-500">Loading Secure Profile...</div>;
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
                    <User className="mx-auto h-16 w-16 text-green-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Agronomic Profile</h2>
                    <button onClick={loginWithGoogle} className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold text-lg py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md google-border-hover">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span>Sign in with Google</span>
                    </button>
                    
                    <div className="relative my-4 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                        <span className="relative bg-white dark:bg-gray-800 px-3 text-xs text-gray-400 font-bold uppercase tracking-wider">or</span>
                    </div>

                    <button 
                        onClick={() => authService.loginMock()}
                        className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg px-4 py-3 hover:from-green-600 hover:to-green-700 transition-all font-semibold shadow-sm"
                    >
                        <span>Developer / Demo Bypass Login</span>
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-3xl mx-auto space-y-6">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                        <p className="text-gray-500">{user.email}</p>
                    </div>
                    <button onClick={logout} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                        <LogOut size={20} />
                    </button>
                </motion.div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4 dark:text-white">Your Registered Farms</h2>
                    
                    {isFetchingFarms ? <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div> : null}

                    <div className="space-y-3 mb-6">
                        <AnimatePresence>
                            {farms.map((farm) => (
                                <motion.div key={farm.$id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                    <div className="flex space-x-6">
                                        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                                            <Sprout size={18} className="text-emerald-500"/> <span>{farm.crop}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                                            <Mountain size={18} className="text-amber-500"/> <span>{farm.soil}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(farm.$id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {farms.length === 0 && !isFetchingFarms && <p className="text-gray-500 text-center py-4">No farms registered yet.</p>}
                    </div>

                    <div className="flex space-x-3">
                        <input value={newCrop} onChange={(e) => setNewCrop(e.target.value)} placeholder="Crop (e.g. Cotton)" className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 dark:text-white outline-none" />
                        <input value={newSoil} onChange={(e) => setNewSoil(e.target.value)} placeholder="Soil (e.g. Black)" className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 dark:text-white outline-none" />
                        <button onClick={handleAddFarm} className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-1 transition-all"><Plus size={18} /><span>Add</span></button>
                    </div>
                </div>

                {/* Daily PDF Health Reports Settings Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
                    <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-green-500" />
                        Daily PDF Health Reports
                    </h2>
                    
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Configure automated PDF diagnostics delivered to your phone twice a day (Morning at 8:00 AM & Evening at 8:00 PM) summarizing soil state, atmospheric threats, and crop management suggestions.
                    </p>

                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mobile Phone Number</label>
                                <div className="flex gap-2">
                                    <select
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 dark:text-white outline-none font-semibold text-sm cursor-pointer"
                                    >
                                        {COUNTRIES.map(c => (
                                            <option key={`${c.code}-${c.name}`} value={c.code}>
                                                {c.flag} {c.code} ({c.name})
                                            </option>
                                        ))}
                                    </select>
                                    <input 
                                        type="text" 
                                        value={phoneBody} 
                                        onChange={(e) => setPhoneBody(e.target.value.replace(/\D/g, ''))} 
                                        placeholder="e.g. 9876543210" 
                                        maxLength="10"
                                        className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 dark:text-white outline-none font-medium text-sm" 
                                    />
                                </div>
                            </div>
                            
                            <div className="w-full sm:w-64">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Mode</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['SMS', 'WhatsApp', 'Email', 'Telegram'].map(mode => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setDeliveryMode(mode)}
                                            className={`py-2 px-3 rounded-lg border text-sm font-bold transition-all ${
                                                deliveryMode === mode
                                                    ? 'border-green-500 bg-green-50/50 text-green-700'
                                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-600'
                                            }`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600">
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Enable Automated Dispatch</h4>
                                <p className="text-xs text-gray-400 mt-0.5">Toggle automated 8:00 AM and 8:00 PM alerts</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReportsEnabled(!reportsEnabled)}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${reportsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${reportsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Custom configurations based on deliveryMode */}
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowTwilioConfig(!showTwilioConfig)}
                                className="text-xs font-bold text-green-600 dark:text-green-400 hover:underline flex items-center gap-1.5 focus:outline-none"
                            >
                                🔧 {showTwilioConfig ? `Hide Custom ${deliveryMode} Settings (Optional)` : `Configure Custom ${deliveryMode} Settings (Optional)`}
                            </button>

                            {showTwilioConfig && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-4 space-y-4"
                                >
                                    {(deliveryMode === 'SMS' || deliveryMode === 'WhatsApp') && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Twilio Account SID</label>
                                                    <input 
                                                        type="text" 
                                                        value={twilioSid} 
                                                        onChange={(e) => setTwilioSid(e.target.value)} 
                                                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                                                        className="w-full bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 dark:text-white outline-none font-medium text-xs" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Twilio Auth Token</label>
                                                    <input 
                                                        type="password" 
                                                        value={twilioToken} 
                                                        onChange={(e) => setTwilioToken(e.target.value)} 
                                                        placeholder="32-character authentication token" 
                                                        className="w-full bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 dark:text-white outline-none font-medium text-xs" 
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Twilio From Number / WhatsApp Sender</label>
                                                <input 
                                                    type="text" 
                                                    value={twilioFrom} 
                                                    onChange={(e) => setTwilioFrom(e.target.value)} 
                                                    placeholder="e.g. +14155238886 (SMS) or whatsapp:+14155238886 (WhatsApp)" 
                                                    className="w-full bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 dark:text-white outline-none font-medium text-xs" 
                                                />
                                                <span className="text-[10px] text-gray-400 mt-1 block">Specify your registered Twilio sender number. Prepend `whatsapp:` if using WhatsApp mode.</span>
                                            </div>
                                        </div>
                                    )}

                                    {deliveryMode === 'Email' && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="sm:col-span-2">
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">SMTP Server Host</label>
                                                    <input 
                                                        type="text" 
                                                        value={smtpHost} 
                                                        onChange={(e) => setSmtpHost(e.target.value)} 
                                                        placeholder="e.g. smtp.gmail.com" 
                                                        className="w-full bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 dark:text-white outline-none font-medium text-xs" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Port</label>
                                                    <input 
                                                        type="number" 
                                                        value={smtpPort} 
                                                        onChange={(e) => setSmtpPort(e.target.value)} 
                                                        placeholder="e.g. 587" 
                                                        className="w-full bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 dark:text-white outline-none font-medium text-xs" 
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">SMTP User / Username</label>
                                                    <input 
                                                        type="text" 
                                                        value={smtpUser} 
                                                        onChange={(e) => setSmtpUser(e.target.value)} 
                                                        placeholder="e.g. sender@gmail.com" 
                                                        className="w-full bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 dark:text-white outline-none font-medium text-xs" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">SMTP Password / App Password</label>
                                                    <input 
                                                        type="password" 
                                                        value={smtpPass} 
                                                        onChange={(e) => setSmtpPass(e.target.value)} 
                                                        placeholder="SMTP Mail Password" 
                                                        className="w-full bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 dark:text-white outline-none font-medium text-xs" 
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">From Email Address</label>
                                                <input 
                                                    type="email" 
                                                    value={smtpFrom} 
                                                    onChange={(e) => setSmtpFrom(e.target.value)} 
                                                    placeholder="e.g. reports@agrishield.com" 
                                                    className="w-full bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 dark:text-white outline-none font-medium text-xs" 
                                                />
                                            </div>
                                        </div>
                                    )}

    {deliveryMode === 'Telegram' && (
                                        <div className="p-4 bg-green-50/60 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl text-xs text-green-800 dark:text-green-300 font-semibold flex items-center gap-2">
                                            <span>🤖</span>
                                            <span>Telegram dispatch configuration is active and automatically managed under the hood. No manual setup required.</span>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                            onClick={handleSaveSettings}
                            disabled={isSavingSettings}
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                        >
                            Save Notification Preferences
                        </button>
                        
                        <button
                            onClick={handleSendTestReport}
                            disabled={isSendingTest || !phoneBody}
                            className="bg-white hover:bg-gray-50 text-gray-750 border border-gray-200 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSendingTest ? 'Generating...' : 'Send Test Report Now'}
                        </button>
                    </div>

                    {testResponse && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl border ${
                                testResponse.status === 'success' 
                                    ? 'bg-green-50 border-green-200 text-green-800' 
                                    : 'bg-amber-50 border-amber-200 text-amber-800'
                            } text-sm space-y-2`}
                        >
                            <div className="font-bold flex items-center gap-1.5">
                                {testResponse.status === 'success' ? '✓ Daily Report Dispatched' : '⚠️ Warning / Mock Mode'}
                            </div>
                            <p>{testResponse.message}</p>
                            
                            {testResponse.pdf_url && (
                                <a 
                                    href={import.meta.env.DEV ? `http://127.0.0.1:8000${testResponse.pdf_url}` : testResponse.pdf_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-bold text-green-700 hover:underline mt-1"
                                >
                                    Download PDF Report
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </a>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
