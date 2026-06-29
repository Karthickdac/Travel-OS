import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm leading-none">SMT</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-base font-extrabold tracking-tight">Madurai SMT Travels</span>
                <span className="text-[10px] text-muted-foreground font-medium">Safe • Comfortable • Reliable</span>
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex gap-6">
            <Link href="/"><span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Home</span></Link>
            <Link href="/packages"><span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Packages</span></Link>
            <Link href="/enquiry"><span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Contact</span></Link>
          </nav>

          <div className="flex items-center gap-3">
            <a href="tel:8110806339" className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              <Phone className="h-3.5 w-3.5" /> 8110806339
            </a>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm font-medium">Admin</Button>
            </Link>
            <a href="tel:8110806339">
              <Button size="sm" className="text-sm font-medium gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Book Now
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border py-12 md:py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs leading-none">SMT</span>
              </div>
              <span className="text-base font-extrabold tracking-tight">Madurai SMT Travels</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs mb-3">
              Safe • Comfortable • Reliable Travel Service across Tamil Nadu, Kerala and beyond.
            </p>
            <a href="tel:8110806339" className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              <Phone className="h-4 w-4" /> 8110806339
            </a>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Destinations</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Madurai", "Rameshwaram", "Kanyakumari", "Kovalam Beach", "Trivandrum", "Dhanushkodi"].map(d => (
                <li key={d}><span className="hover:text-primary cursor-pointer transition-colors">{d}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Family Tours", "Pilgrimage Trips", "Tourist Packages", "Airport Pickup & Drop", "Outstation Cab", "24/7 Support"].map(s => (
                <li key={s}><span className="hover:text-primary cursor-pointer transition-colors">{s}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/"><span className="hover:text-primary cursor-pointer transition-colors">Home</span></Link></li>
              <li><Link href="/packages"><span className="hover:text-primary cursor-pointer transition-colors">Tour Packages</span></Link></li>
              <li><Link href="/enquiry"><span className="hover:text-primary cursor-pointer transition-colors">Contact Us</span></Link></li>
              <li><Link href="/login"><span className="hover:text-primary cursor-pointer transition-colors">Admin Login</span></Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-10 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Madurai SMT Travels. All rights reserved.</span>
          <span className="italic font-medium">"Your Journey, Our Responsibility"</span>
        </div>
      </footer>
    </div>
  );
}
