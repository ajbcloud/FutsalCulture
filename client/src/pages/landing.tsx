import { Link } from "wouter";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Users, CreditCard } from "lucide-react";
import { BusinessBranding } from "@/components/business-branding";
import { useUserTerminology } from "@/hooks/use-user-terminology";

export default function Landing() {
  const { term } = useUserTerminology();
  
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Elite Futsal Training</h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100">
              Professional coaching for young athletes. Limited spots available daily.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                <a href="/login">Start Reserving</a>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-green-600">
                <a href="/sessions#calendar">View Full Schedule</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-16 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why Choose <BusinessBranding variant="default" textClassName="inline text-white" inline={true} />?</h2>
            <p className="text-xl text-zinc-400">Professional training with flexible booking</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-futsal-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-futsal-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flexible Scheduling</h3>
              <p className="text-gray-600">Book sessions that fit your schedule. New spots released daily at 8 AM.</p>
            </div>
            <div className="text-center">
              <div className="bg-brand-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-brand-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Small Groups</h3>
              <p className="text-gray-600">Limited capacity ensures personalized attention for every young athlete.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Payments</h3>
              <p className="text-gray-600">Secure payment processing with instant confirmation. $10 per session.</p>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-16 bg-[#18181b]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4 text-[#ffffff]">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of families who trust <BusinessBranding variant="default" textClassName="inline text-gray-600" inline={true} /> for their children's development.
          </p>
          <Button asChild size="lg" className="bg-futsal-600 hover:bg-futsal-700">
            <a href="/login">Create {term} Account</a>
          </Button>
        </div>
      </section>
      {/* Footer */}
      <footer className="text-white bg-[#18181b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="text-2xl font-bold text-futsal-400 mb-4">
                <BusinessBranding variant="default" textClassName="text-futsal-400" />
              </div>
              <p className="text-gray-300 mb-4">
                Elite futsal training for young athletes. Professional coaching with flexible scheduling.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/sessions" className="text-gray-300 hover:text-white">Browse Sessions</Link></li>
                <li><Link href="/help" className="text-gray-300 hover:text-white">Help Center</Link></li>
                <li><a href="/login" className="text-gray-300 hover:text-white">{term} Login</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Refund Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 <BusinessBranding variant="small" textClassName="inline text-gray-400" inline={true} />. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
