import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSearch from "@/components/HeroSearch";
import SearchResults from "@/components/SearchResults";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";
import { searchApi } from "@/lib/api"; // ✅ FIXED IMPORT

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (query) => {
  setSearchQuery(query);
  setHasSearched(true);
  setIsLoading(true);
  setError(null);

  try {
    const data = await searchApi.search(query);

    console.log("FINAL API DATA:", data); // IMPORTANT

    // ✅ FINAL FIX
    const finalResults = Array.isArray(data)
      ? data
      : data.results || [];

    setResults(finalResults);
  } catch (err) {
    console.error("Search error:", err);
    setError("Failed to load results. Please try again.");
    setResults([]);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <HeroSearch onSearch={handleSearch} />

        {/* ✅ LOADING STATE */}
        {isLoading && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* ✅ ERROR STATE */}
        {error && (
          <div className="text-center py-10 text-red-500">
            {error}
          </div>
        )}

        {/* ✅ RESULTS */}
        {!isLoading && hasSearched && !error && (
          <SearchResults
            query={searchQuery}
            results={results}
          />
        )}

        {/* ✅ DEFAULT PAGE */}
        {!hasSearched && <Features />}
      </main>

      <Footer />
    </div>
  );
};

export default Index;