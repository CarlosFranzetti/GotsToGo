import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SearchSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const filters = [
    { id: "wheelchair", label: "Wheelchair Accessible" },
    { id: "changing", label: "Changing Table" },
    { id: "stepfree", label: "Step-Free Entry" },
    { id: "gender", label: "Gender Neutral" },
  ];

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  return (
    <section id="search-section" className="py-16 px-4 bg-card">
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-card-foreground">Search for Accessible Bathrooms</h2>
            <p className="text-muted-foreground">Enter your location or neighborhood to find nearby facilities</p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter address, neighborhood, or landmark..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button size="lg" className="h-12 px-6">
              <Search className="mr-2 h-5 w-5" />
              Search
            </Button>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Filter by accessibility features:</p>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Badge
                  key={filter.id}
                  variant={selectedFilters.includes(filter.id) ? "default" : "outline"}
                  className="cursor-pointer px-4 py-2 text-sm hover:bg-primary/90 transition-colors"
                  onClick={() => toggleFilter(filter.id)}
                >
                  {filter.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchSection;
