import { Building2, BookOpen, Store, Church, Hospital } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const tips = [
  {
    icon: BookOpen,
    title: "Libraries & Bookstores",
    description: "NYC Public Libraries, Barnes & Noble, and Strand often have clean, accessible facilities open to all.",
  },
  {
    icon: Store,
    title: "Retail & Markets",
    description: "Apple Stores, Chelsea Market, and major department stores like Bloomingdale's and TJ Maxx welcome public restroom use.",
  },
  {
    icon: Building2,
    title: "Transit Hubs",
    description: "Grand Central, Penn Station, and Port Authority have accessible bathrooms with step-free entry.",
  },
  {
    icon: Church,
    title: "Community Spaces",
    description: "Many churches and community centers open their facilities to the public during operating hours.",
  },
  {
    icon: Hospital,
    title: "Healthcare Facilities",
    description: "Hospital lobbies often have accessible public restrooms available in emergencies.",
  },
];

const TipsSection = () => {
  return (
    <section className="py-16 px-4 bg-card">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-3xl font-bold text-card-foreground">Quick Tips & Trusted Spots</h2>
          <p className="text-muted-foreground">Know where to look when you need a bathroom in a pinch</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <Card key={index} className="border-border hover:border-primary/50 transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{tip.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{tip.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 p-6 rounded-lg bg-info/10 border border-info/20">
          <p className="text-center text-foreground">
            <strong className="text-info">Pro tip:</strong> Type your location into bathroom finder apps for instant results. 
            Nearly every NYC borough has ADA-accessible restrooms with high ratings.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TipsSection;
