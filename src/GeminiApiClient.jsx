import React, { useState, useCallback, useEffect } from 'react';

// Environment variables are defined globally in this context
const API_KEY = ""; // Key is handled by the environment
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";

const exponentialBackoffFetch = async (url, options, maxRetries = 5) => {
    let lastError = null;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status === 429) {
                // Too Many Requests - force a retry
                throw new Error("Rate limit exceeded (429)");
            }
            if (!response.ok) {
                // Non-rate limit HTTP error
                const errorText = await response.text();
                throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
            }
            return response;
        } catch (error) {
            lastError = error;
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            if (i < maxRetries - 1) {
                // console.log(`Retrying after ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw new Error(`Failed after ${maxRetries} retries: ${lastError?.message}`);
};

/**
 * Main application component for the Grounded Financial Analyst Client.
 * This component handles user input, calls the Gemini API with Google Search grounding,
 * and displays the response along with citations.
 */
const App = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [sources, setSources] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const systemPrompt = "Act as a world-class financial analyst. Provide a concise, single-paragraph summary of the key findings. Do not include introductory phrases like 'Here is the summary' or 'Based on the search results'.";

    const handleAnalyze = useCallback(async () => {
        if (!prompt.trim()) {
            setError("Please enter a financial query to analyze.");
            return;
        }

        setIsLoading(true);
        setResponse('');
        setSources([]);
        setError(null);

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            // Enable Google Search grounding for real-time information
            tools: [{ "google_search": {} }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };

        try {
            const fetchOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            };

            const response = await exponentialBackoffFetch(`${API_URL}?key=${API_KEY}`, fetchOptions);
            const result = await response.json();

            const candidate = result.candidates?.[0];

            if (candidate && candidate.content?.parts?.[0]?.text) {
                const text = candidate.content.parts[0].text;
                setResponse(text);

                // Extract grounding sources
                let extractedSources = [];
                const groundingMetadata = candidate.groundingMetadata;
                if (groundingMetadata && groundingMetadata.groundingAttributions) {
                    extractedSources = groundingMetadata.groundingAttributions
                        .map(attribution => ({
                            uri: attribution.web?.uri,
                            title: attribution.web?.title,
                        }))
                        .filter(source => source.uri && source.title);
                }
                setSources(extractedSources);
            } else if (result.error) {
                 setError(`API Error: ${result.error.message}`);
            } else {
                 setError('Could not get a valid response from the API.');
            }

        } catch (err) {
            console.error('Analysis error:', err);
            setError(`Failed to perform analysis. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, systemPrompt]);

    // Simple effect to reset error message when prompt changes
    useEffect(() => {
        if (error && prompt.trim()) {
            setError(null);
        }
    }, [prompt]);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans antialiased">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-blue-900 sm:text-4xl">
                        Gemini Analyst Client
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Ask a financial or current events query. Grounded with Google Search.
                    </p>
                </header>

                {/* Input Area */}
                <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200">
                    <label htmlFor="prompt-input" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Query:
                    </label>
                    <textarea
                        id="prompt-input"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
                        rows="4"
                        placeholder="e.g., Summarize the Q3 earnings report for Tesla (TSLA)."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading}
                    />
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleAnalyze}
                            disabled={isLoading}
                            className={`px-6 py-3 text-lg font-semibold rounded-full shadow-md transition-all duration-200
                                ${isLoading
                                    ? 'bg-blue-300 text-white cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/50 hover:shadow-lg'
                                }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Analyzing...
                                </span>
                            ) : (
                                'Run Analysis'
                            )}
                        </button>
                    </div>
                </div>

                {/* Output Area */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.27a.9.9 0 00-.236-.328C19.782 5.252 16.742 4 12 4s-7.782 1.252-8.382 3.402a.9.9 0 00-.236.328 10 10 0 1011.236-1.572 10.01 10.01 0 00-2.85-.353z" />
                        </svg>
                        Analyst Report
                    </h2>

                    {error && (
                        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
                            <span className="font-semibold">Error:</span> {error}
                        </div>
                    )}

                    {response ? (
                        <>
                            <div className="prose max-w-none text-gray-800 leading-relaxed mb-6 whitespace-pre-wrap">
                                {response}
                            </div>
                            
                            {sources.length > 0 && (
                                <div className="mt-6 border-t pt-4">
                                    <h3 className="text-md font-semibold text-gray-700 mb-3">
                                        Sources Used (Grounded Search)
                                    </h3>
                                    <ul className="space-y-2 text-sm text-gray-600 list-disc pl-5">
                                        {sources.map((source, index) => (
                                            <li key={index}>
                                                <a 
                                                    href={source.uri} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="text-blue-500 hover:text-blue-700 underline transition-colors"
                                                    title={source.uri}
                                                >
                                                    {source.title}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-gray-500 italic">
                            The generated report will appear here after analysis.
                        </p>
                    )}
                </div>
            </div>
            <style jsx global>{`
                /* Ensure Tailwind is loaded and base styles are applied */
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
                .font-sans { font-family: 'Inter', sans-serif; }
            `}</style>
        </div>
    );
};

export default App;