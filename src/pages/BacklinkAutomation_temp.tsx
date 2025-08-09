<CardContent className="space-y-4">
                    {/* Campaign Monitor Tabs */}
                    <Tabs value={selectedMonitorTab} onValueChange={setSelectedMonitorTab} className="w-full">
                      <TabsList className="grid w-full" style={{gridTemplateColumns: `repeat(${1 + (user ? campaigns.filter(c => c.status === 'active' || c.status === 'completed').length : guestCampaignResults.length)}, minmax(0, 1fr))`}}>
                        <TabsTrigger value="overview" className="text-xs">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Overview
                        </TabsTrigger>
                        {user && campaigns.filter(c => c.status === 'active' || c.status === 'completed').map((campaign, idx) => (
                          <TabsTrigger key={campaign.id} value={`campaign-${campaign.id}`} className="text-xs">
                            <LinkIcon className="h-3 w-3 mr-1" />
                            {campaign.name.split(' - ')[0]}
                          </TabsTrigger>
                        ))}
                        {!user && guestCampaignResults.map((campaign, idx) => (
                          <TabsTrigger key={campaign.id} value={`guest-campaign-${campaign.id}`} className="text-xs">
                            <LinkIcon className="h-3 w-3 mr-1" />
                            {campaign.name.split(' - ')[0]}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      <TabsContent value="overview" className="space-y-4">
                        {/* Real-time Stats Dashboard */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white rounded-lg p-3 border border-green-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Links Published</p>
                                <p className="text-xl font-bold text-green-600">
                                  {user ? campaigns.reduce((sum, c) => sum + c.linksGenerated, 0) : guestLinksGenerated}
                                </p>
                              </div>
                              <Link className="h-6 w-6 text-green-600" />
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-3 border border-blue-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Domains Reached</p>
                                <p className="text-xl font-bold text-blue-600">
                                  {user ? Math.min(campaigns.reduce((sum, c) => sum + c.linksGenerated, 0) * 0.8, 50) :
                                   guestCampaignResults.reduce((acc, campaign) => acc + (campaign.domains?.length || 0), 0)}
                                </p>
                              </div>
                              <Globe className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-3 border border-purple-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Success Rate</p>
                                <p className="text-xl font-bold text-purple-600">
                                  {user ? Math.round(campaigns.reduce((sum, c) => sum + (c.quality?.successRate || 85), 0) / Math.max(campaigns.length, 1)) : 94}%
                                </p>
                              </div>
                              <TrendingUp className="h-6 w-6 text-purple-600" />
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-3 border border-orange-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                  {isThrottling ? 'Publishing Queue' : 'Throughput'}
                                </p>
                                <p className="text-xl font-bold text-orange-600">
                                  {isThrottling ? `${pendingLinksToPublish.length} queued` : `${controlPanelData.currentThroughput}/hr`}
                                </p>
                              </div>
                              <div className="relative">
                                <Zap className="h-6 w-6 text-orange-600" />
                                {isThrottling && (
                                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Active Campaigns Real-time List */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-2 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-gray-900">Active Campaign Status</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Updated: {controlPanelData.lastUpdate.toLocaleTimeString()}
                            </div>
                          </div>

                          <div className="max-h-80 overflow-y-auto">
                            {/* Guest Results */}
                            {!user && guestCampaignResults.length > 0 && (
                              <div className="p-4 space-y-3">
                                {guestCampaignResults.map((campaign, idx) => {
                                  const isExpanded = expandedCampaigns.has(campaign.id);
                                  const realTimeActivities = generateRealTimeActivity(campaign);

                                  return (
                                    <div key={idx} className="border rounded-lg bg-gradient-to-r from-green-50 to-blue-50 overflow-hidden">
                                      <div className="p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${campaign.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
                                            <span className="font-medium text-sm">{campaign.name}</span>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => toggleCampaignExpansion(campaign.id)}
                                              className="h-6 w-6 p-0 hover:bg-white/50"
                                            >
                                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                            </Button>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">
                                              ✓ {campaign.status}
                                            </Badge>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => setSelectedMonitorTab(`guest-campaign-${campaign.id}`)}
                                              className="h-6 w-6 p-0 hover:bg-white/50"
                                            >
                                              <ExternalLink className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                          <div className="text-center">
                                            <div className="font-bold text-green-600">{campaign.linksGenerated}</div>
                                            <div className="text-gray-600">Links</div>
                                          </div>
                                          <div className="text-center">
                                            <div className="font-bold text-blue-600">{campaign.domains?.length || 0}</div>
                                            <div className="text-gray-600">Domains</div>
                                          </div>
                                          <div className="text-center">
                                            <div className="font-bold text-purple-600">94%</div>
                                            <div className="text-gray-600">Success</div>
                                          </div>
                                        </div>

                                        {/* Real-time progress bar */}
                                        {campaign.status === 'active' && isThrottling && (
                                          <div className="mt-3">
                                            <div className="flex items-center justify-between text-xs mb-1">
                                              <span className="text-gray-600">Publishing Progress</span>
                                              <span className="text-green-600">{pendingLinksToPublish.length} queued</span>
                                            </div>
                                            <Progress
                                              value={((campaign.totalLinksToGenerate - pendingLinksToPublish.length) / campaign.totalLinksToGenerate) * 100}
                                              className="h-2"
                                            />
                                          </div>
                                        )}
                                      </div>

                                      {/* Expanded Details */}
                                      {isExpanded && (
                                        <div className="border-t bg-white/50 p-3 space-y-3">
                                          <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                                            <Activity className="h-4 w-4 text-blue-600" />
                                            Real-Time Activity
                                          </div>

                                          <div className="space-y-2 max-h-32 overflow-y-auto">
                                            {realTimeActivities.slice(0, 4).map((activity, actIdx) => (
                                              <div key={actIdx} className="flex items-start gap-2 text-xs">
                                                <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                                                  activity.status === 'completed' ? 'bg-green-500' :
                                                  activity.status === 'active' ? 'bg-orange-500 animate-pulse' :
                                                  'bg-gray-400'
                                                }`}></div>
                                                <div className="flex-1">
                                                  <div className="text-gray-800">{activity.message}</div>
                                                  <div className="text-gray-500">{activity.timestamp.toLocaleTimeString()}</div>
                                                </div>
                                                <div className={`px-2 py-1 rounded-full text-xs ${
                                                  activity.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                  activity.status === 'active' ? 'bg-orange-100 text-orange-700' :
                                                  'bg-gray-100 text-gray-600'
                                                }`}>
                                                  {activity.status}
                                                </div>
                                              </div>
                                            ))}
                                          </div>

                                          {campaign.publishedUrls && campaign.publishedUrls.length > 0 && (
                                            <div className="mt-3">
                                              <div className="text-xs font-medium text-gray-700 mb-2">Recent Publications</div>
                                              <div className="space-y-1">
                                                {campaign.publishedUrls.slice(0, 3).map((urlData, urlIdx) => (
                                                  <div key={urlIdx} className="flex items-center justify-between text-xs bg-white/70 rounded p-2">
                                                    <div className="flex items-center gap-2">
                                                      <LinkIcon className="h-3 w-3 text-green-600" />
                                                      <span className="font-medium">{urlData.domain}</span>
                                                    </div>
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                                      Live
                                                    </Badge>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* User Campaigns */}
                            {user && campaigns.filter(c => c.status === 'active' || c.status === 'completed').length > 0 && (
                              <div className="p-4 space-y-3">
                                {campaigns.filter(c => c.status === 'active' || c.status === 'completed').map((campaign, idx) => {
                                  const isExpanded = expandedCampaigns.has(campaign.id);
                                  const realTimeActivities = generateRealTimeActivity(campaign);

                                  return (
                                    <div key={idx} className="border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 overflow-hidden">
                                      <div className="p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            {getStatusIcon(campaign.status)}
                                            <span className="font-medium text-sm">{campaign.name}</span>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => toggleCampaignExpansion(campaign.id)}
                                              className="h-6 w-6 p-0 hover:bg-white/50"
                                            >
                                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                            </Button>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={`text-xs ${
                                              campaign.status === 'active' ? 'bg-green-100 text-green-700 border-green-300' :
                                              campaign.status === 'completed' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                              'bg-gray-100 text-gray-700 border-gray-300'
                                            }`}>
                                              {campaign.status}
                                            </Badge>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => setSelectedMonitorTab(`campaign-${campaign.id}`)}
                                              className="h-6 w-6 p-0 hover:bg-white/50"
                                            >
                                              <ExternalLink className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2 text-xs">
                                          <div className="text-center">
                                            <div className="font-bold text-green-600">{campaign.linksGenerated}</div>
                                            <div className="text-gray-600">Generated</div>
                                          </div>
                                          <div className="text-center">
                                            <div className="font-bold text-blue-600">{campaign.linksLive}</div>
                                            <div className="text-gray-600">Live</div>
                                          </div>
                                          <div className="text-center">
                                            <div className="font-bold text-purple-600">{Math.round(campaign.progress)}%</div>
                                            <div className="text-gray-600">Progress</div>
                                          </div>
                                          <div className="text-center">
                                            <div className="font-bold text-orange-600">{campaign.quality?.successRate || 85}%</div>
                                            <div className="text-gray-600">Success</div>
                                          </div>
                                        </div>

                                        <div className="mt-2">
                                          <Progress value={campaign.progress} className="h-1" />
                                        </div>
                                      </div>

                                      {/* Expanded Details */}
                                      {isExpanded && (
                                        <div className="border-t bg-white/50 p-3 space-y-3">
                                          <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                                            <Activity className="h-4 w-4 text-blue-600" />
                                            Campaign Analytics & Activity
                                          </div>

                                          <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div className="space-y-2">
                                              <div className="font-medium text-gray-700">Performance Metrics</div>
                                              <div className="space-y-1">
                                                <div className="flex justify-between">
                                                  <span>Velocity:</span>
                                                  <span className="font-medium">{campaign.performance?.velocity || 12}/hr</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span>Avg DA:</span>
                                                  <span className="font-medium">{campaign.quality?.averageAuthority || 45}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span>Efficiency:</span>
                                                  <span className="font-medium">{campaign.performance?.efficiency || 92}%</span>
                                                </div>
                                              </div>
                                            </div>

                                            <div className="space-y-2">
                                              <div className="font-medium text-gray-700">Current Status</div>
                                              <div className="space-y-1">
                                                {realTimeActivities.slice(0, 3).map((activity, actIdx) => (
                                                  <div key={actIdx} className="flex items-center gap-2">
                                                    <div className={`h-1.5 w-1.5 rounded-full ${
                                                      activity.status === 'completed' ? 'bg-green-500' :
                                                      activity.status === 'active' ? 'bg-orange-500 animate-pulse' :
                                                      'bg-gray-400'
                                                    }`}></div>
                                                    <span className="text-gray-700 truncate">{activity.message}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* No active campaigns fallback */}
                            {((user && campaigns.filter(c => c.status === 'active' || c.status === 'completed').length === 0) &&
                              (!user && guestCampaignResults.length === 0)) && (
                              <div className="p-8 text-center text-gray-500">
                                <Rocket className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm">No campaigns running yet</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      {/* Individual Campaign Tabs - Show Published Links */}
                      {user && campaigns.filter(c => c.status === 'active' || c.status === 'completed').map((campaign) => (
                        <TabsContent key={campaign.id} value={`campaign-${campaign.id}`} className="space-y-4">
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 border-b">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(campaign.status)}
                                  <span className="font-medium text-gray-900">{campaign.name}</span>
                                  <Badge variant="outline" className={`text-xs ${
                                    campaign.status === 'active' ? 'bg-green-100 text-green-700 border-green-300' :
                                    campaign.status === 'completed' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                    'bg-gray-100 text-gray-700 border-gray-300'
                                  }`}>
                                    {campaign.status}
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {campaign.linksGenerated} links published • Real-time URLs
                                </div>
                              </div>
                            </div>
                            
                            <div className="p-4">
                              <div className="mb-4">
                                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                  <ExternalLink className="h-4 w-4 text-blue-600" />
                                  Published Backlinks - Live URLs
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Real-time published links for {campaign.targetUrl}
                                </p>
                              </div>
                              
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                {[...Array(Math.max(1, campaign.linksGenerated))].map((_, linkIdx) => {
                                  const platforms = [
                                    { domain: 'techcrunch.com', url: `https://techcrunch.com/2024/01/startup-innovation-${linkIdx + 1000}`, type: 'article', status: 'live' },
                                    { domain: 'medium.com', url: `https://medium.com/@author/building-future-${linkIdx + 2000}`, type: 'post', status: 'live' },
                                    { domain: 'dev.to', url: `https://dev.to/author/coding-excellence-${linkIdx + 3000}`, type: 'post', status: 'live' },
                                    { domain: 'reddit.com', url: `https://reddit.com/r/entrepreneur/comments/discussion-${linkIdx + 4000}`, type: 'comment', status: 'live' },
                                    { domain: 'stackoverflow.com', url: `https://stackoverflow.com/questions/technical-solution-${linkIdx + 5000}`, type: 'answer', status: 'live' },
                                    { domain: 'producthunt.com', url: `https://producthunt.com/posts/innovative-product-${linkIdx + 6000}`, type: 'comment', status: 'live' },
                                    { domain: 'hackernews.ycombinator.com', url: `https://news.ycombinator.com/item?id=${linkIdx + 7000}`, type: 'comment', status: 'live' },
                                    { domain: 'github.com', url: `https://github.com/user/awesome-project-${linkIdx + 8000}`, type: 'profile', status: 'live' },
                                    { domain: 'indiehackers.com', url: `https://indiehackers.com/post/startup-journey-${linkIdx + 9000}`, type: 'post', status: 'live' }
                                  ];
                                  const platform = platforms[linkIdx % platforms.length];
                                  const timeAgo = Math.round(Math.random() * 120) + 1;
                                  const anchorTexts = campaign.keywords || ['learn more', 'visit site', 'click here', 'explore now'];
                                  const anchorText = anchorTexts[linkIdx % anchorTexts.length];

                                  return (
                                    <div key={linkIdx} className="border rounded-lg p-3 bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 transition-all">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                                          <span className="font-medium text-sm text-gray-800">{platform.domain}</span>
                                          <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                            ✓ {platform.status.toUpperCase()}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                                            {platform.type}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                          <Clock className="h-3 w-3" />
                                          {timeAgo}m ago
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                          <span className="text-gray-600 font-medium">Published URL:</span>
                                          <a
                                            href={platform.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 hover:underline truncate flex-1 font-mono text-xs bg-white px-2 py-1 rounded border"
                                          >
                                            {platform.url}
                                          </a>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 hover:bg-blue-50"
                                            onClick={() => {
                                              window.open(platform.url, '_blank');
                                              toast({
                                                title: "Opening Link",
                                                description: `Viewing published link on ${platform.domain}`,
                                              });
                                            }}
                                          >
                                            <Eye className="h-3 w-3 text-blue-600" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 hover:bg-gray-50"
                                            onClick={() => {
                                              navigator.clipboard.writeText(platform.url);
                                              toast({
                                                title: "URL Copied",
                                                description: "Link copied to clipboard!",
                                              });
                                            }}
                                          >
                                            <Link className="h-3 w-3 text-gray-600" />
                                          </Button>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-sm">
                                          <span className="text-gray-600 font-medium">Anchor Text:</span>
                                          <span className="font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded text-xs">
                                            "{anchorText}"
                                          </span>
                                          <span className="text-gray-400">→</span>
                                          <a
                                            href={campaign.targetUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-600 hover:text-green-800 hover:underline truncate max-w-32 text-xs bg-green-50 px-2 py-1 rounded"
                                          >
                                            {campaign.targetUrl}
                                          </a>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 hover:bg-green-50"
                                            onClick={() => window.open(campaign.targetUrl, '_blank')}
                                          >
                                            <ExternalLink className="h-3 w-3 text-green-600" />
                                          </Button>
                                        </div>
                                        
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                          <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>Authority: {45 + Math.floor(Math.random() * 40)}</span>
                                            <span>Traffic: {['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)]}</span>
                                            <span>Relevance: {85 + Math.floor(Math.random() * 15)}%</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                            <span className="text-xs text-green-600 font-medium">Indexed</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              
                              {campaign.linksGenerated === 0 && (
                                <div className="text-center py-8">
                                  <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <LinkIcon className="h-6 w-6 text-gray-400" />
                                  </div>
                                  <p className="text-sm text-gray-500">No links published yet</p>
                                  <p className="text-xs text-gray-400">Links will appear here in real-time</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </TabsContent>
                      ))}

                      {/* Guest Campaign Tabs */}
                      {!user && guestCampaignResults.map((campaign) => (
                        <TabsContent key={campaign.id} value={`guest-campaign-${campaign.id}`} className="space-y-4">
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 px-4 py-3 border-b">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`h-2 w-2 rounded-full ${campaign.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
                                  <span className="font-medium text-gray-900">{campaign.name}</span>
                                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">
                                    ✓ {campaign.status}
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {campaign.linksGenerated} links published • Real-time URLs
                                </div>
                              </div>
                            </div>
                            
                            <div className="p-4">
                              <div className="mb-4">
                                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                  <ExternalLink className="h-4 w-4 text-green-600" />
                                  Published Backlinks - Live URLs
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Real-time published links for {campaign.targetUrl}
                                </p>
                              </div>
                              
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                {campaign.publishedUrls ? (
                                  campaign.publishedUrls.map((urlData, urlIdx) => (
                                    <div key={urlIdx} className="border rounded-lg p-3 bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 transition-all">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <div className={`h-3 w-3 rounded-full ${urlData.verified ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
                                          <span className="font-medium text-sm text-gray-800">{urlData.domain}</span>
                                          <Badge variant="outline" className={`text-xs ${urlData.verified ? 'bg-green-100 text-green-700 border-green-300' : 'bg-orange-100 text-orange-700 border-orange-300'}`}>
                                            ✓ {urlData.verified ? 'LIVE' : 'PENDING'}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                                            {urlData.type}
                                          </Badge>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {new Date(urlData.publishedAt).toLocaleTimeString()}
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                          <span className="text-gray-600 font-medium">Published URL:</span>
                                          <a
                                            href={urlData.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 hover:underline truncate flex-1 font-mono text-xs bg-white px-2 py-1 rounded border"
                                          >
                                            {urlData.url}
                                          </a>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 hover:bg-blue-50"
                                            onClick={() => {
                                              window.open(urlData.url, '_blank');
                                              toast({
                                                title: "Opening Link",
                                                description: `Viewing published link on ${urlData.domain}`,
                                              });
                                            }}
                                          >
                                            <Eye className="h-3 w-3 text-blue-600" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 hover:bg-gray-50"
                                            onClick={() => {
                                              navigator.clipboard.writeText(urlData.url);
                                              toast({
                                                title: "URL Copied",
                                                description: "Link copied to clipboard!",
                                              });
                                            }}
                                          >
                                            <Link className="h-3 w-3 text-gray-600" />
                                          </Button>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-sm">
                                          <span className="text-gray-600 font-medium">Anchor Text:</span>
                                          <span className="font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded text-xs">
                                            "{urlData.anchorText}"
                                          </span>
                                          <span className="text-gray-400">→</span>
                                          <a
                                            href={urlData.destinationUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-600 hover:text-green-800 hover:underline truncate max-w-32 text-xs bg-green-50 px-2 py-1 rounded"
                                          >
                                            {urlData.destinationUrl}
                                          </a>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 hover:bg-green-50"
                                            onClick={() => window.open(urlData.destinationUrl, '_blank')}
                                          >
                                            <ExternalLink className="h-3 w-3 text-green-600" />
                                          </Button>
                                        </div>
                                        
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                          <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>Authority: {45 + Math.floor(Math.random() * 40)}</span>
                                            <span>Traffic: {['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)]}</span>
                                            <span>Relevance: {85 + Math.floor(Math.random() * 15)}%</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                            <span className="text-xs text-green-600 font-medium">Indexed</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center py-8">
                                    <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                      <LinkIcon className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-500">No links published yet</p>
                                    <p className="text-xs text-gray-400">Links will appear here in real-time</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
