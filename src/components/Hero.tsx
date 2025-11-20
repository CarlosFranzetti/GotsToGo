import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  const scrollToSearch = () => {
    document.getElementById("search-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            <span className="text-primary">Gots to Go</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Find accessible bathrooms in New York City. Search stress-free for clean, accessible restrooms across all five boroughs with real-time info and honest reviews.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              onClick={scrollToSearch}
              className="text-lg px-8"
            >
              <Search className="mr-2 h-5 w-5" />
              Find a Bathroom Now
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => document.getElementById("apps-section")?.scrollIntoView({ behavior: "smooth" })}
              className="text-lg px-8"
            >
              View Apps & Resources
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
