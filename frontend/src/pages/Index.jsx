import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSearch from "@/components/HeroSearch";
import SearchResults from "@/components/SearchResults";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
// Mock search results data
const mockResults = [
    {
        id: "1",
        title: "Amazon SDE Interview Experience - Complete Guide 2024",
        description: "A comprehensive walkthrough of the Amazon SDE interview process including coding rounds, LLD, HLD, and behavioral questions.",
        url: "https://geeksforgeeks.org",
        source: "GeeksforGeeks",
        type: "blog",
    },
    {
        id: "2",
        title: "Amazon Leadership Principles Cheat Sheet PDF",
        description: "Complete breakdown of all 16 Amazon Leadership Principles with STAR format examples for each principle.",
        url: "https://example.com",
        source: "InterviewBit",
        type: "pdf",
    },
    {
        id: "3",
        title: "System Design: Design Amazon's Order Processing System",
        description: "Step-by-step video tutorial on designing a scalable order processing system used by Amazon.",
        url: "https://youtube.com",
        source: "YouTube",
        type: "video",
    },
    {
        id: "4",
        title: "amazon-sde-sheet: 150 Most Asked DSA Questions",
        description: "Curated list of 150 most frequently asked Data Structures and Algorithms questions in Amazon interviews.",
        url: "https://github.com",
        source: "GitHub",
        type: "github",
    },
    {
        id: "5",
        title: "How I Cracked Amazon SDE-2 After 3 Rejections",
        description: "Personal interview experience sharing the journey, preparation strategy, and lessons learned from multiple attempts.",
        url: "https://medium.com",
        source: "Medium",
        type: "blog",
    },
    {
        id: "6",
        title: "Amazon Behavioral Interview Questions - Top 50",
        description: "Most common behavioral questions asked in Amazon interviews with sample answers following STAR method.",
        url: "https://leetcode.com",
        source: "LeetCode Discuss",
        type: "blog",
    },
];
const Index = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [hasSearched, setHasSearched] = useState(false);
    const handleSearch = (query) => {
        setSearchQuery(query);
        setHasSearched(true);
        // In production, this would call the Google Custom Search API
    };
    return (<div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        <HeroSearch onSearch={handleSearch}/>
        
        {hasSearched && (<SearchResults query={searchQuery} results={mockResults}/>)}
        
        {!hasSearched && <Features />}
        
      </main>
      
      <Footer />
    </div>);
};
export default Index;
