import { MapPin, Check, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const locations = [
  {
    name: "New York Public Library - Main Branch",
    address: "476 5th Ave, Manhattan",
    rating: 4.8,
    features: ["Wheelchair Accessible", "Changing Table", "Step-Free Entry"],
    type: "Library",
  },
  {
    name: "Bryant Park Public Restrooms",
    address: "Bryant Park, Manhattan",
    rating: 4.6,
    features: ["Wheelchair Accessible", "Step-Free Entry", "Gender Neutral"],
    type: "Park",
  },
  {
    name: "Chelsea Market",
    address: "75 9th Ave, Manhattan",
    rating: 4.7,
    features: ["Wheelchair Accessible", "Changing Table", "Step-Free Entry"],
    type: "Market",
  },
  {
    name: "Grand Central Terminal",
    address: "89 E 42nd St, Manhattan",
    rating: 4.5,
    features: ["Wheelchair Accessible", "Changing Table", "Step-Free Entry"],
    type: "Transit Hub",
  },
];

const FeaturedLocations = () => {
  return (
    <section className="py-16 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-3xl font-bold text-foreground">Featured Accessible Locations</h2>
          <p className="text-muted-foreground">Trusted public spots with clean, accessible facilities</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {locations.map((location, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{location.name}</CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{location.address}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {location.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-accent text-accent" />
                  <span className="font-semibold">{location.rating}</span>
                  <span className="text-muted-foreground text-sm">/5.0</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {location.features.map((feature, idx) => (
                    <Badge key={idx} variant="outline" className="gap-1">
                      <Check className="h-3 w-3 text-success" />
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedLocations;
