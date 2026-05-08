import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-md mx-4 bg-card/50 backdrop-blur-sm border-primary/10">
        <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight">404 - Page Not Found</h1>
          
          <p className="text-sm text-muted-foreground">
            The page you are looking for doesn't exist or has been moved.
          </p>

          <Link href="/">
            <Button className="mt-4">Return to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
