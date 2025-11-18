import Hero from "@/components/Hero";
import SearchSection from "@/components/SearchSection";
import FeaturedLocations from "@/components/FeaturedLocations";
import AppsSection from "@/components/AppsSection";
import TipsSection from "@/components/TipsSection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <SearchSection />
      <FeaturedLocations />
      <AppsSection />
      <TipsSection />
    </div>
  );
};

export default Index;
