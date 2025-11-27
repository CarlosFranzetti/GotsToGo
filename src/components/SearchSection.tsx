import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Locate } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import BathroomResults from "./BathroomResults";

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

const SearchSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [bathrooms, setBathrooms] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  const searchRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`
        );
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    setSearchQuery(suggestion.display_name);
    setSearchLocation({ lat: parseFloat(suggestion.lat), lon: parseFloat(suggestion.lon) });
    setShowSuggestions(false);
    toast({
      title: "Location selected",
      description: suggestion.display_name,
    });
  };

  const handleUseMyLocation = () => {
    setIsLoadingLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          console.log('Location found:', { latitude, longitude });
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          
          if (!response.ok) {
            throw new Error('Failed to fetch address');
          }
          
          const data = await response.json();
          console.log('Address data:', data);
          
          setSearchQuery(data.display_name);
          setSearchLocation({ lat: latitude, lon: longitude });
          toast({
            title: "Location found",
            description: "Using your current location",
          });
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          toast({
            title: "Error",
            description: "Could not get address from location",
            variant: "destructive",
          });
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let description = "Please enable location access in your browser settings.";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            description = "Location access was denied. Please check your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            description = "Location information is unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            description = "Location request timed out. Please try again.";
            break;
        }
        
        toast({
          title: "Location access failed",
          description,
          variant: "destructive",
        });
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter a location",
        description: "Please enter an address or use your current location",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      // Build the query
      let query = supabase
        .from('bathrooms')
        .select('*');

      // Apply filters
      selectedFilters.forEach(filterId => {
        if (filterId === 'wheelchair') {
          query = query.eq('wheelchair_accessible', true);
        } else if (filterId === 'changing') {
          query = query.eq('changing_table', true);
        } else if (filterId === 'stepfree') {
          query = query.eq('step_free_entry', true);
        } else if (filterId === 'gender') {
          query = query.eq('gender_neutral', true);
        }
      });

      const { data, error } = await query;

      if (error) throw error;

      // Calculate distances and sort by distance if we have search location
      let results = data || [];
      if (searchLocation) {
        results = results.map(bathroom => ({
          ...bathroom,
          distance: calculateDistance(
            searchLocation.lat,
            searchLocation.lon,
            Number(bathroom.latitude),
            Number(bathroom.longitude)
          )
        })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      setBathrooms(results);
      
      toast({
        title: "Search complete",
        description: `Found ${results.length} bathroom${results.length !== 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "There was an error searching for bathrooms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <section id="search-section" className="py-6 px-4 bg-card">
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-card-foreground">Search for Accessible Bathrooms</h2>
            <p className="text-muted-foreground">Enter your location or neighborhood to find nearby facilities</p>
          </div>

          <div className="flex gap-2">
            <div ref={searchRef} className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
              <Input
                type="text"
                placeholder="Enter address, neighborhood, or landmark..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-10 h-12 text-base"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 hover:bg-muted cursor-pointer transition-colors border-b border-border last:border-b-0"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <p className="text-sm text-foreground">{suggestion.display_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-12 px-4"
              onClick={handleUseMyLocation}
              disabled={isLoadingLocation}
            >
              <Locate className={`h-5 w-5 ${isLoadingLocation ? 'animate-pulse' : ''}`} />
            </Button>
            <Button size="lg" className="h-12 px-6" onClick={handleSearch} disabled={isSearching}>
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

          {hasSearched && (
            <div className="mt-8">
              <BathroomResults bathrooms={bathrooms} isLoading={isSearching} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SearchSection;
