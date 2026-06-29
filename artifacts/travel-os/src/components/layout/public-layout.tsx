import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg leading-none">T</span>
              </div>
              <span className="text-xl font-bold tracking-tight">TravelOS</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <Link href="/"><span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Home</span></Link>
            <Link href="/packages"><span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Packages</span></Link>
            <Link href="/enquiry"><span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Contact</span></Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-sm font-medium">Log in</Button>
            </Link>
            <Button className="hidden md:inline-flex text-sm font-medium">Book Now</Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="border-t border-border py-12 md:py-16">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm leading-none">T</span>
              </div>
              <span className="text-lg font-bold tracking-tight">TravelOS</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              The complete operating system for modern travel and fleet management companies.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/packages"><span className="hover:text-primary cursor-pointer">Tour Packages</span></Link></li>
              <li><Link href="/destinations"><span className="hover:text-primary cursor-pointer">Destinations</span></Link></li>
              <li><Link href="/fleet"><span className="hover:text-primary cursor-pointer">Our Fleet</span></Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="hover:text-primary cursor-pointer">About Us</span></li>
              <li><Link href="/enquiry"><span className="hover:text-primary cursor-pointer">Contact</span></Link></li>
              <li><span className="hover:text-primary cursor-pointer">Careers</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="hover:text-primary cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-primary cursor-pointer">Terms of Service</span></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} TravelOS. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
