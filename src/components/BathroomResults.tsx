import { MapPin, Clock, Star, Check, Key } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Bathroom {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  wheelchair_accessible: boolean;
  changing_table: boolean;
  step_free_entry: boolean;
  gender_neutral: boolean;
  is_24_7: boolean;
  opening_hours: Record<string, string> | null;
  description: string | null;
  requires_key: boolean;
  verified: boolean;
  rating: number | null;
  distance?: number;
}

interface BathroomResultsProps {
  bathrooms: Bathroom[];
  isLoading: boolean;
}

const BathroomResults = ({ bathrooms, isLoading }: BathroomResultsProps) => {
  const getDayOfWeek = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };

  const getCurrentDayHours = (bathroom: Bathroom) => {
    if (bathroom.is_24_7) {
      return "Open 24/7";
    }
    
    if (!bathroom.opening_hours) {
      return "Hours not available";
    }

    const today = getDayOfWeek();
    const hours = bathroom.opening_hours[today];
    
    return hours ? `Open today: ${hours}` : "Closed today";
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Searching for bathrooms...</p>
      </div>
    );
  }

  if (bathrooms.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No bathrooms found. Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">
        Found {bathrooms.length} bathroom{bathrooms.length !== 1 ? 's' : ''}
      </h3>
      
      <div className="grid gap-4">
        {bathrooms.map((bathroom) => (
          <Card key={bathroom.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        {bathroom.name}
                        {bathroom.verified && (
                          <Check className="h-4 w-4 text-success" />
                        )}
                      </h4>
                      {bathroom.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-4 w-4 fill-accent text-accent" />
                          <span className="text-sm font-medium text-foreground">
                            {bathroom.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    {bathroom.distance && (
                      <Badge variant="secondary" className="shrink-0">
                        {bathroom.distance.toFixed(1)} mi
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{bathroom.address}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className={bathroom.is_24_7 ? "text-success" : ""}>
                      {getCurrentDayHours(bathroom)}
                    </span>
                  </div>

                  {bathroom.description && (
                    <p className="text-sm text-muted-foreground">{bathroom.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {bathroom.wheelchair_accessible && (
                      <Badge variant="outline">Wheelchair Accessible</Badge>
                    )}
                    {bathroom.changing_table && (
                      <Badge variant="outline">Changing Table</Badge>
                    )}
                    {bathroom.step_free_entry && (
                      <Badge variant="outline">Step-Free Entry</Badge>
                    )}
                    {bathroom.gender_neutral && (
                      <Badge variant="outline">Gender Neutral</Badge>
                    )}
                    {bathroom.requires_key && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Key className="h-3 w-3" />
                        Key Required
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BathroomResults;
