import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "wouter";
import { Building2, Users } from "lucide-react";

export default function Login() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Welcome Back
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
            How would you like to sign in?
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/login-business" data-testid="link-login-business">
            <div className={`p-8 rounded-xl cursor-pointer transition-all duration-200 border-2 hover:border-blue-500 hover:shadow-lg ${
              isDarkMode 
                ? 'bg-[#1e293b] border-slate-700 hover:bg-[#263449]' 
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}>
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'
                }`}>
                  <Building2 className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  I'm a Club Owner or Coach
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Manage your club, sessions, and players
                </p>
              </div>
            </div>
          </Link>
          
          <Link href="/login-consumer" data-testid="link-login-consumer">
            <div className={`p-8 rounded-xl cursor-pointer transition-all duration-200 border-2 hover:border-blue-500 hover:shadow-lg ${
              isDarkMode 
                ? 'bg-[#1e293b] border-slate-700 hover:bg-[#263449]' 
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}>
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  isDarkMode ? 'bg-green-600/20' : 'bg-green-100'
                }`}>
                  <Users className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  I'm a Parent or Player
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Book sessions and manage your account
                </p>
              </div>
            </div>
          </Link>
        </div>
        
        <div className={`text-center mt-8 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          New here?{' '}
          <Link href="/get-started" className="underline text-blue-600 dark:text-blue-400" data-testid="link-get-started">
            Create your club
          </Link>
          {' '}or{' '}
          <Link href="/join" className="underline text-blue-600 dark:text-blue-400" data-testid="link-join">
            Join an existing club
          </Link>
        </div>
      </div>
    </div>
  );
}
