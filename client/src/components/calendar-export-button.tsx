import { Calendar, Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SiGoogle, SiApple } from "react-icons/si";

export function CalendarExportButton() {
  const icsUrl = "/api/coach/calendar/ics";
  
  const getWebcalUrl = () => {
    const baseUrl = window.location.origin;
    return `webcal://${baseUrl.replace(/^https?:\/\//, "")}${icsUrl}`;
  };

  const getGoogleCalendarUrl = () => {
    const baseUrl = window.location.origin;
    const fullIcsUrl = `${baseUrl}${icsUrl}`;
    return `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(fullIcsUrl)}`;
  };

  const handleDownloadICS = () => {
    window.location.href = icsUrl;
  };

  const handleAddToGoogle = () => {
    window.open(getGoogleCalendarUrl(), "_blank");
  };

  const handleAddToApple = () => {
    window.location.href = getWebcalUrl();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          data-testid="calendar-export-button"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Export Calendar
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={handleDownloadICS}
          data-testid="download-ics-option"
        >
          <Download className="w-4 h-4 mr-2" />
          Download ICS File
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleAddToGoogle}
          data-testid="add-to-google-option"
        >
          <SiGoogle className="w-4 h-4 mr-2" />
          Add to Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleAddToApple}
          data-testid="add-to-apple-option"
        >
          <SiApple className="w-4 h-4 mr-2" />
          Add to Apple Calendar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
