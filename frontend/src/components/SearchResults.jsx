import ResourceCard from "./ResourceCard";
import { Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const filterTypes = ["All", "Articles", "Videos", "GitHub"];

const SearchResults = ({ query, results }) => {
  const [activeFilter, setActiveFilter] = useState("All");

  // ✅ Ensure array
  const safeResults = Array.isArray(results) ? results : [];

  // ✅ NORMALIZE DATA (IMPORTANT FIX)
  const normalizedResults = safeResults.map((item, index) => ({
    id: item.id || item._id || index, // FIX ID
    title: item.title || "No Title",
    url: item.url || "#",
    type:
      item.type ||
      item.source || // fallback
      "blog", // default
    ...item,
  }));

  // ✅ FILTER LOGIC
  const filteredResults = normalizedResults.filter((resource) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Articles") return resource.type === "blog";
    if (activeFilter === "Videos") return resource.type === "video";
    if (activeFilter === "GitHub") return resource.type === "github";
    return true;
  });

  return (
    <section className="pb-20">
      <div className="container mx-auto px-4">
        
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Results for <span className="text-primary">"{query}"</span>
            </h2>
            <p className="text-muted-foreground">
              Found {filteredResults.length} resources
            </p>
          </div>

          {/* FILTERS */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
              {filterTypes.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    activeFilter === filter
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:text-black"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* RESULTS GRID */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredResults.map((resource) => (
            <div key={resource.id}>
              <ResourceCard resource={resource} />
            </div>
          ))}
        </div>

        {/* EMPTY STATE */}
        {filteredResults.length === 0 && (
          <div className="py-20 text-center">
            <Filter className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-lg font-medium">No resources found</p>
            <p className="text-muted-foreground">
              Try another search or check backend response
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default SearchResults;
