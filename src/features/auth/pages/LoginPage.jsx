import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services/api';

export default function LoginPage() {
    const [username, setUsername] = useState('Admin');
    const [password, setPassword] = useState('password');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);

        try {
            const data = await authService.login(username, password);

            // Save the token on success
            if (data.token) {
                localStorage.setItem('authToken', data.token);
                navigate('/dashboard');
            } else {
                throw new Error('Token not received from server');
            }

        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#111620] flex items-center justify-center relative overflow-hidden font-sans">
            {/* Background design elements to mimic the network/tech feel */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute inset-0" style={{ backgroundImage: `url('/src/assets/img_background.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />

            </div>

            <div className="max-w-5xl w-full flex flex-col md:flex-row items-center justify-center gap-16 md:gap-32 z-10 px-8">

                {/* Left Side: Logo & Branding */}
                <div className="flex flex-col items-center text-center">
                    <div className="w-[200px] h-[140px] mb-4 relative flex items-center justify-center">
                        {/* Custom Drone SVG Logo mimicking the image */}
                        <img src="/src/assets/icon_app.png" alt="Drone" className="w-full h-full" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-widest text-[#ea580c] uppercase mb-1">
                        UAV Patrol
                    </h1>
                    <h2 className="text-xl text-gray-300 font-medium tracking-wide">
                        Drone Controller
                    </h2>
                </div>

                {/* Right Side: Login Form */}
                <div className="w-full max-w-[400px] bg-[#222934] rounded-lg border border-slate-700/60 p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm bg-opacity-95 text-center">
                    <h2 className="text-xl font-bold text-white mb-1 font-sans tracking-wide">User Login</h2>
                    <p className="text-[#8894a4] text-xs mb-8">Please enter your credential</p>

                    <form onSubmit={handleLogin} className="space-y-5 text-left">
                        {errorMsg && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs px-3 py-2 rounded-sm text-center mb-4">
                                {errorMsg}
                            </div>
                        )}
                        <div>
                            <label className="block text-[#8894a4] text-xs mb-1.5 ml-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-[#1b212b] border border-slate-600/50 rounded-sm px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50 transition-colors shadow-inner"
                                placeholder="Admin"
                            />
                        </div>

                        <div>
                            <label className="block text-[#8894a4] text-xs mb-1.5 ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#1b212b] border border-slate-600/50 rounded-sm px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50 transition-colors shadow-inner tracking-widest"
                                placeholder="•••••"
                            />
                        </div>

                        <div className="">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full hover:from-[#f37b3c] hover:to-[#b35428]  py-2.5 px-4 flex items-center justify-center rounded-[2px] shadow-lg transition-all relative overflow-hidden ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? (
                                    <span className="relative z-10 py-[6px]">Logging in...</span>
                                ) : (
                                    <img src="/src/assets/btn_login.png" alt="Login" className="w-full h-full" />
                                )}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}
