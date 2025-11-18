import { Smartphone, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const apps = [
  {
    name: "Got2GoNYC",
    description: "Official NYC Parks bathroom finder with real-time availability and directions",
    features: ["Real-time info", "Walking directions", "Changing tables"],
  },
  {
    name: "Bano.nyc",
    description: "Community-driven bathroom finder with honest reviews and accessibility ratings",
    features: ["User reviews", "Accessibility ratings", "Photo uploads"],
  },
  {
    name: "Toodle Loo",
    description: "Comprehensive restroom finder with detailed accessibility information",
    features: ["Step-free entry info", "ADA compliance", "Indoor/outdoor tags"],
  },
];

const AppsSection = () => {
  return (
    <section id="apps-section" className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-2 mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Smartphone className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Bathroom Finder Apps</h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Download these trusted apps to find accessible restrooms with real-time information and community reviews
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {apps.map((app, index) => (
            <Card key={index} className="border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {app.name}
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription className="text-base">{app.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {app.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-success" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AppsSection;
