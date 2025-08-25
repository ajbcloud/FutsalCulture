import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  description: string;
  lastChecked: string;
}

export default function Status() {
  // Mock data - in a real app, you'd fetch this from an API
  const services: ServiceStatus[] = [
    {
      name: "PlayHQ Platform",
      status: "operational",
      description: "All systems operational",
      lastChecked: new Date().toISOString()
    },
    {
      name: "User Authentication",
      status: "operational", 
      description: "Login and registration working normally",
      lastChecked: new Date().toISOString()
    },
    {
      name: "Payment Processing",
      status: "operational",
      description: "Stripe integration functioning normally",
      lastChecked: new Date().toISOString()
    },
    {
      name: "Email Notifications",
      status: "operational",
      description: "Email delivery working normally",
      lastChecked: new Date().toISOString()
    },
    {
      name: "SMS Notifications",
      status: "operational", 
      description: "SMS delivery working normally",
      lastChecked: new Date().toISOString()
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge variant="default" className="bg-green-100 text-green-800">Operational</Badge>;
      case 'degraded':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'down':
        return <Badge variant="destructive">Down</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">PlayHQ Status</h1>
          <p className="text-xl text-gray-600">
            Current status and uptime for all PlayHQ services
          </p>
        </div>

        {/* Overall Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              All Systems Operational
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              All PlayHQ services are running smoothly. No incidents reported.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {new Date().toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Service Status List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Service Status</h2>
          
          {services.map((service, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(service.status)}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {service.name}
                      </h3>
                      <p className="text-gray-600">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(service.status)}
                    <p className="text-sm text-gray-500">
                      {new Date(service.lastChecked).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Having issues? Contact our support team at{" "}
            <a href="mailto:support@playhq.app" className="text-blue-600 hover:text-blue-800">
              support@playhq.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}