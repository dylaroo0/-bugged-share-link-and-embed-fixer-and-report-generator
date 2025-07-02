import React, { useState, useCallback, useEffect } from 'react';
import { YoutubeIcon, SpotifyIcon, EmbedIcon, LinkIcon, ClipboardIcon, CheckIcon, LightbulbIcon, FlagIcon } from './components/icons/Icons';

type EmbedDetails = {
  platform: 'YouTube' | 'Spotify';
  embedUrl: string;
  embedCode: string;
  Icon: React.FC<{ className?: string }>;
  previewHeight?: string;
};

const PLATFORMS = [
  {
    name: 'YouTube' as const,
    icon: YoutubeIcon,
    // Regex updated to support music.youtube.com links
    regex: /(?:(?:www\.)?(?:music\.)?youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    idGroup: 1,
    generate: (match: RegExpMatchArray): EmbedDetails => {
      const id = match[1];
      const embedUrl = `https://www.youtube.com/embed/${id}`;
      return {
        platform: 'YouTube',
        embedUrl,
        embedCode: `<iframe width="560" height="315" src="${embedUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`,
        Icon: YoutubeIcon,
      };
    },
  },
  {
    name: 'Spotify' as const,
    icon: SpotifyIcon,
    // Regex updated to support episodes and shows
    regex: /(?:open\.spotify\.com)\/(track|album|playlist|artist|episode|show)\/([a-zA-Z0-9]{22})/,
    idGroup: 2,
    generate: (match: RegExpMatchArray): EmbedDetails => {
      const type = match[1] as 'track' | 'album' | 'playlist' | 'artist' | 'episode' | 'show';
      const id = match[2];
      const embedUrl = `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`;
      
      const isShort = type === 'episode' || type === 'show';
      const height = isShort ? '232' : '352';

      return {
        platform: 'Spotify',
        embedUrl,
        embedCode: `<iframe style="border-radius:12px" src="${embedUrl}" width="100%" height="${height}" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`,
        Icon: SpotifyIcon,
        previewHeight: `${height}px`,
      };
    },
  },
];


const App: React.FC = () => {
  const [url, setUrl] = useState<string>('https://www.youtube.com/watch?v=E3ilo1KDB7E');
  const [embedDetails, setEmbedDetails] = useState<EmbedDetails | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isReportCopied, setIsReportCopied] = useState<boolean>(false);
  const [identifiedId, setIdentifiedId] = useState<string | null>(null);
  const [fixExplanation, setFixExplanation] = useState<string | null>(null);
  const [reportText, setReportText] = useState<string | null>(null);

  const generateCode = useCallback((urlToProcess: string) => {
    setError(null);
    setEmbedDetails(null);
    setProcessedUrl(null);
    setIsCopied(false);
    setIsReportCopied(false);
    setIdentifiedId(null);
    setFixExplanation(null);
    setReportText(null);

    if (!urlToProcess.trim()) {
      setError('Please paste a URL.');
      return;
    }

    for (const platform of PLATFORMS) {
      const match = urlToProcess.match(platform.regex);
      if (match) {
        const details = platform.generate(match);
        setEmbedDetails(details);
        setProcessedUrl(urlToProcess);
        
        const id = match[platform.idGroup];
        setIdentifiedId(id);

        let explanation = "We've cleaned it up and generated a stable embed code that will always work correctly.";
        if (urlToProcess.includes('?si=')) {
            explanation = "We removed extra sharing parameters (like `?si=...`) and generated a stable embed code that will always work."
        } else if (urlToProcess.includes('youtu.be')) {
            explanation = "We converted the short `youtu.be` sharing link into a proper embed format for reliability."
        }
        setFixExplanation(explanation);

        return;
      }
    }

    setError('Could not recognize a supported URL. Please check the link and try again.');
  }, []);

  const handleGenerateReport = useCallback(() => {
    if (!embedDetails || !processedUrl || !identifiedId) return;

    const report = `
Subject: Bug Report: Incorrect Share Link Behavior for ${embedDetails.platform}

Platform: ${embedDetails.platform}
Original URL: ${processedUrl}
Extracted Content ID: ${identifiedId}

Description:
The share URL provided above does not consistently generate a stable embeddable link. It appears to contain non-standard formatting or extraneous tracking parameters (e.g., '?si=...') that can cause issues when embedding the content on other websites.

This tool was able to parse the correct content ID ("${identifiedId}") and generate a working embed code. Please consider reviewing the link generation logic to ensure it produces clean, reliable URLs for embedding purposes. Thank you.
`.trim();
    
    setReportText(report);
  }, [embedDetails, processedUrl, identifiedId]);

  const handleCopyReport = useCallback(() => {
    if (reportText) {
      navigator.clipboard.writeText(reportText);
      setIsReportCopied(true);
      setTimeout(() => setIsReportCopied(false), 2000);
    }
  }, [reportText]);


  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    generateCode(url);
  };
  
  const handleCopy = useCallback(() => {
    if (embedDetails?.embedCode) {
      navigator.clipboard.writeText(embedDetails.embedCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    }
  }, [embedDetails]);

  useEffect(() => {
    if (url) {
      generateCode(url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <EmbedIcon className="w-12 h-12 text-sky-500" />
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-sky-500 to-cyan-400 text-transparent bg-clip-text">
              Universal Embed Fixer
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Get the correct embed code from YouTube, Spotify, and more.
          </p>
        </header>

        <main>
          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste URL from YouTube, Spotify, etc..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 placeholder-slate-500"
                />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto flex-shrink-0 px-6 py-3 font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:bg-slate-700 disabled:text-slate-400 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500"
            >
              Generate
            </button>
          </form>

          <div className="mt-8">
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center animate-fade-in">
                <p>{error}</p>
              </div>
            )}
            
            {embedDetails && (
              <div className="space-y-8 animate-fade-in">
                {processedUrl && identifiedId && fixExplanation && (
                   <div>
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">What We Fixed</h3>
                    <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg space-y-3">
                        <p className="text-sm text-slate-400">
                            Your original link:
                        </p>
                        <div className="p-3 bg-slate-900 rounded-md text-slate-400 font-mono text-xs break-all shadow-inner">
                            {processedUrl}
                        </div>

                        <p className="text-sm text-slate-400">
                            We extracted the unique content ID:
                        </p>
                        <div className="p-3 bg-sky-900/50 border border-sky-800 rounded-md text-sky-300 font-mono text-xs break-all shadow-inner">
                            {identifiedId}
                        </div>

                        <p className="text-sm text-slate-400 pt-1">
                            {fixExplanation}
                        </p>
                    </div>
                  </div>
                )}
              
                 <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-slate-300">Preview</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                      <embedDetails.Icon className={`w-5 h-5 ${embedDetails.platform === 'YouTube' ? 'text-red-500' : 'text-green-500'}`} />
                      <span>{embedDetails.platform} Detected</span>
                    </div>
                  </div>
                  <div 
                    className={`w-full bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700 ${embedDetails.platform === 'YouTube' ? 'aspect-video' : ''}`} 
                    style={{ height: embedDetails.previewHeight }}
                  >
                    <iframe
                      key={embedDetails.embedUrl}
                      className="w-full h-full"
                      src={embedDetails.embedUrl}
                      title={`${embedDetails.platform} Player`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-slate-300">Embed Code</h3>
                    <button 
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50"
                    >
                      {isCopied ? (
                        <>
                          <CheckIcon className="w-4 h-4 text-green-400" />
                          <span className="text-green-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <ClipboardIcon className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={embedDetails.embedCode}
                    className="w-full h-40 p-4 bg-slate-800 border-2 border-slate-700 rounded-lg font-mono text-sm text-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none"
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <LightbulbIcon className="w-6 h-6 text-amber-400" />
                    <h3 className="text-lg font-semibold text-slate-300">How to Use This Code</h3>
                  </div>
                  <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg space-y-3 text-slate-400">
                      <p>This is a web tool to help you generate correct embed codes for your own website, blog, or any platform that supports HTML.</p>
                      <ol className="list-decimal list-inside space-y-2 pl-2">
                          <li>Click the <span className="font-semibold text-slate-300">Copy</span> button above to copy the embed code.</li>
                          <li>Go to your website editor or the platform where you want to share the content.</li>
                          <li>Paste the code into the HTML view or a custom HTML block.</li>
                      </ol>
                      <p>The player will now appear correctly on your page!</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <FlagIcon className="w-6 h-6 text-red-400" />
                    <h3 className="text-lg font-semibold text-slate-300">Help Fix the Root Problem</h3>
                  </div>
                   <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg space-y-4 text-slate-400">
                      <p>Help platforms like {embedDetails.platform} fix these issues by sending them a bug report.</p>
                      {!reportText && (
                        <button
                          onClick={handleGenerateReport}
                          className="w-full px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500"
                        >
                          Generate Report
                        </button>
                      )}
                      {reportText && (
                        <div className="space-y-2 animate-fade-in">
                          <p className="text-sm">Copy this pre-formatted report and paste it into the platform's official support or feedback form.</p>
                          <textarea
                            readOnly
                            value={reportText}
                            className="w-full h-52 p-4 bg-slate-900 border-2 border-slate-700 rounded-lg font-mono text-xs text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                          />
                           <button 
                              onClick={handleCopyReport}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-md bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50"
                            >
                              {isReportCopied ? (
                                <>
                                  <CheckIcon className="w-4 h-4 text-green-400" />
                                  <span className="text-green-400">Report Copied!</span>
                                </>
                              ) : (
                                <>
                                  <ClipboardIcon className="w-4 h-4" />
                                  <span>Copy Report to Clipboard</span>
                                </>
                              )}
                            </button>
                        </div>
                      )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </main>
        
        <footer className="text-center mt-12 text-slate-500 text-sm">
            <p>Built to solve a very specific, very annoying problem.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;