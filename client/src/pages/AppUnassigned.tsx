import { useTheme } from "@/contexts/ThemeContext";
import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Users, ArrowRight, LogOut, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppUnassigned() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, navigate] = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0f1629]' : 'bg-gray-50'}`}>
      <header className={`border-b ${isDarkMode ? 'border-slate-800 bg-[#1e293b]' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-blue-600' : 'bg-blue-600'}`}>
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              PlayHQ
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                <User className={`w-4 h-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`} />
              </div>
              <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                {user?.firstName || user?.primaryEmailAddress?.emailAddress || 'User'}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className={isDarkMode ? 'text-slate-400 hover:text-white' : ''}
              data-testid="button-sign-out"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
            isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'
          }`}>
            <Users className={`w-10 h-10 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <h1 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Welcome to PlayHQ, {user?.firstName || 'there'}!
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            You're signed in but not part of a club yet. Join a club to book sessions and manage your account.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <Card className={isDarkMode ? 'bg-[#1e293b] border-slate-700' : ''}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : ''}`}>
                <Users className="w-5 h-5 text-blue-500" />
                Join a Club
              </CardTitle>
              <CardDescription className={isDarkMode ? 'text-slate-400' : ''}>
                Have an access code from your club? Enter it to join and start booking sessions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/join">
                <Button className="w-full" data-testid="button-join-club">
                  Enter Club Code
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className={isDarkMode ? 'bg-[#1e293b] border-slate-700' : ''}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : ''}`}>
                <Calendar className="w-5 h-5 text-green-500" />
                Browse Sessions
              </CardTitle>
              <CardDescription className={isDarkMode ? 'text-slate-400' : ''}>
                Explore available training sessions near you. You can join a club when you're ready to book.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/sessions">
                <Button variant="outline" className="w-full" data-testid="button-browse-sessions">
                  Browse Sessions
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className={`text-center p-6 rounded-lg ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-100'}`}>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Don't have a code yet? Ask your coach or club administrator for your club's access code.
            <br />
            You can also{' '}
            <Link href="/get-started" className="text-blue-500 hover:underline">
              create your own club
            </Link>
            {' '}if you're a coach or administrator.
          </p>
        </div>
      </main>
    </div>
  );
}
