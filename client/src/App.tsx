
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { 
  User, 
  PostWithFeedback, 
  FeedbackWithUserInfo,
  SignupInput, 
  LoginInput, 
  CreatePostInput, 
  CreateFeedbackInput 
} from '../../server/src/schema';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<PostWithFeedback[]>([]);
  const [userPosts, setUserPosts] = useState<PostWithFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState<{
    show: boolean;
    feedback: FeedbackWithUserInfo | null;
    postId: number | null;
  }>({ show: false, feedback: null, postId: null });

  // Auth form states
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState<SignupInput>({
    username: '',
    email: '',
    password: '',
    role: 'athlete'
  });

  // Post creation form
  const [postForm, setPostForm] = useState<CreatePostInput>({
    athleteId: 0,
    videoUrl: '',
    description: ''
  });

  // Feedback form
  const [feedbackForm, setFeedbackForm] = useState<CreateFeedbackInput>({
    postId: 0,
    coachId: 0,
    comment: '',
    priceCoins: 0
  });

  const [activeFeedbackPost, setActiveFeedbackPost] = useState<number | null>(null);

  // Load posts based on user role
  const loadPosts = useCallback(async () => {
    if (!user) return;
    
    try {
      if (user.role === 'coach') {
        const allPosts = await trpc.getAllPosts.query();
        setPosts(allPosts);
      } else {
        const athletePosts = await trpc.getPostsByAthlete.query({ athleteId: user.id });
        setUserPosts(athletePosts);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  }, [user]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (authMode === 'signup') {
        const newUser = await trpc.signup.mutate(authForm);
        setUser(newUser);
      } else {
        const loginData: LoginInput = {
          email: authForm.email,
          password: authForm.password
        };
        const loggedInUser = await trpc.login.mutate(loginData);
        setUser(loggedInUser);
      }
      
      // Reset form
      setAuthForm({
        username: '',
        email: '',
        password: '',
        role: 'athlete'
      });
    } catch (error) {
      console.error('Authentication failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'athlete') return;
    
    setIsLoading(true);
    try {
      const postData = { ...postForm, athleteId: user.id };
      const newPost = await trpc.createPost.mutate(postData);
      
      // Transform Post to PostWithFeedback by adding empty feedback array
      const postWithFeedback: PostWithFeedback = {
        ...newPost,
        feedback: []
      };
      
      setUserPosts((prev: PostWithFeedback[]) => [...prev, postWithFeedback]);
      
      // Reset form
      setPostForm({
        athleteId: user.id,
        videoUrl: '',
        description: ''
      });
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'coach') return;
    
    setIsLoading(true);
    try {
      await trpc.createFeedback.mutate(feedbackForm);
      
      // Refresh posts to show new feedback
      await loadPosts();
      
      // Reset form and close feedback section
      setFeedbackForm({
        postId: 0,
        coachId: user.id,
        comment: '',
        priceCoins: 0
      });
      setActiveFeedbackPost(null);
    } catch (error) {
      console.error('Failed to create feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptFeedback = async () => {
    if (!showAcceptDialog.feedback || !user || !showAcceptDialog.postId) return;
    
    setIsLoading(true);
    try {
      await trpc.acceptFeedback.mutate({
        feedbackId: showAcceptDialog.feedback.id,
        athleteId: user.id
      });
      
      // Update user's coin balance
      const updatedUser = await trpc.getUserById.query({ userId: user.id });
      if (updatedUser) {
        setUser(updatedUser);
      }
      
      // Refresh posts
      await loadPosts();
      
      setShowAcceptDialog({ show: false, feedback: null, postId: null });
    } catch (error) {
      console.error('Failed to accept feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startFeedback = (postId: number) => {
    if (!user) return;
    setFeedbackForm((prev: CreateFeedbackInput) => ({
      ...prev,
      postId,
      coachId: user.id
    }));
    setActiveFeedbackPost(postId);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  // Authentication screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              🏋️ FormCheck Pro
            </CardTitle>
            <CardDescription>
              Connect athletes with coaches for expert feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={authMode} onValueChange={(value: string) => setAuthMode(value as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleAuth} className="space-y-4 mt-4">
                {authMode === 'signup' && (
                  <>
                    <Input
                      placeholder="Username"
                      value={authForm.username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setAuthForm((prev: SignupInput) => ({ ...prev, username: e.target.value }))
                      }
                      required
                    />
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Role</label>
                      <Tabs 
                        value={authForm.role} 
                        onValueChange={(value: string) => 
                          setAuthForm((prev: SignupInput) => ({ ...prev, role: value as 'athlete' | 'coach' }))
                        }
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="athlete">🏃 Athlete</TabsTrigger>
                          <TabsTrigger value="coach">👨‍🏫 Coach</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </>
                )}
                
                <Input
                  type="email"
                  placeholder="Email"
                  value={authForm.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAuthForm((prev: SignupInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
                
                <Input
                  type="password"
                  placeholder="Password"
                  value={authForm.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAuthForm((prev: SignupInput) => ({ ...prev, password: e.target.value }))
                  }
                  required
                />
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Sign Up'}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main application dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-800">🏋️ FormCheck Pro</h1>
              <Badge variant="outline" className="capitalize">
                {user.role === 'athlete' ? '🏃' : '👨‍🏫'} {user.role}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">💰 Coins:</span>
                <Badge variant="secondary" className="text-lg">
                  {user.coins}
                </Badge>
              </div>
              <span className="text-sm text-gray-600">Welcome, {user.username}!</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setUser(null)}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {user.role === 'athlete' ? (
          /* Athlete Dashboard */
          <div className="space-y-8">
            {/* Create Post Section */}
            <Card>
              <CardHeader>
                <CardTitle>📹 Share Your Training Video</CardTitle>
                <CardDescription>
                  Upload your exercise video and get expert feedback from coaches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <Input
                    placeholder="Video URL (YouTube, Vimeo, etc.)"
                    value={postForm.videoUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPostForm((prev: CreatePostInput) => ({ ...prev, videoUrl: e.target.value }))
                    }
                    required
                  />
                  <Textarea
                    placeholder="Describe your exercise and what feedback you're looking for..."
                    value={postForm.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setPostForm((prev: CreatePostInput) => ({ ...prev, description: e.target.value }))
                    }
                    required
                  />
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Posting...' : '📤 Post Video'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* My Posts Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">📋 My Posts & Feedback</h2>
              {userPosts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">No posts yet. Share your first training video above! 🎬</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {userPosts.map((post: PostWithFeedback) => (
                    <Card key={post.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">📹 Training Video</CardTitle>
                            <CardDescription>
                              Posted {post.createdAt.toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <Badge variant="outline">
                            {post.feedback.length} feedback{post.feedback.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-2">Description:</p>
                          <p className="text-gray-600">{post.description}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium mb-2">Video:</p>
                          <a 
                            href={post.videoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            🔗 View Video
                          </a>
                        </div>

                        {post.feedback.length > 0 && (
                          <div>
                            <Separator className="my-4" />
                            <h4 className="font-medium mb-3">💬 Feedback Received:</h4>
                            <div className="space-y-3">
                              {post.feedback.map((feedback) => (
                                <div key={feedback.id} className="border rounded-lg p-4 bg-gray-50">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <Badge variant={getStatusBadgeVariant(feedback.status)}>
                                        {feedback.status}
                                      </Badge>
                                      <span className="text-sm font-medium">💰 {feedback.priceCoins} coins</span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {feedback.createdAt.toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 mb-2">{feedback.comment}</p>
                                  {feedback.status === 'pending' && (
                                    <Button
                                      size="sm"
                                      onClick={() => setShowAcceptDialog({
                                        show: true,
                                        feedback: feedback as FeedbackWithUserInfo,
                                        postId: post.id
                                      })}
                                      disabled={user.coins < feedback.priceCoins}
                                    >
                                      {user.coins < feedback.priceCoins 
                                        ? '💰 Insufficient coins' 
                                        : `✅ Accept (${feedback.priceCoins} coins)`
                                      }
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Coach Dashboard */
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">🎯 Athletes Looking for Feedback</h2>
              {posts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">No posts available for feedback at the moment. 🕒</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {posts.map((post: PostWithFeedback) => (
                    <Card key={post.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">📹 Training Video</CardTitle>
                            <CardDescription>
                              Posted {post.createdAt.toLocaleDateString()} • Athlete ID: {post.athleteId}
                            </CardDescription>
                          </div>
                          <Badge variant="outline">
                            {post.feedback.length} feedback{post.feedback.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-2">What they're asking:</p>
                          <p className="text-gray-600">{post.description}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium mb-2">Video:</p>
                          <a 
                            href={post.videoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            🔗 View Training Video
                          </a>
                        </div>

                        {post.feedback.length > 0 && (
                          <div>
                            <Separator className="my-4" />
                            <h4 className="font-medium mb-3">💬 Existing Feedback:</h4>
                            <div className="space-y-2">
                              {post.feedback.map((feedback) => (
                                <div key={feedback.id} className="text-sm text-gray-600 border-l-4 border-gray-200 pl-3">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Badge variant={getStatusBadgeVariant(feedback.status)} className="text-xs">
                                      {feedback.status}
                                    </Badge>
                                    <span>💰 {feedback.priceCoins} coins</span>
                                  </div>
                                  <p>{feedback.comment}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <Separator />
                        
                        {activeFeedbackPost === post.id ? (
                          <form onSubmit={handleCreateFeedback} className="space-y-4">
                            <Textarea
                              placeholder="Provide detailed feedback on their form, technique, and areas for improvement..."
                              value={feedbackForm.comment}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                setFeedbackForm((prev: CreateFeedbackInput) => ({ ...prev, comment: e.target.value }))
                              }
                              required
                            />
                            <div className="flex items-center space-x-4">
                              <div className="flex-1">
                                <label className="text-sm font-medium mb-2 block">💰 Price (coins):</label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={feedbackForm.priceCoins}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setFeedbackForm((prev: CreateFeedbackInput) => ({ 
                                      ...prev, 
                                      priceCoins: parseInt(e.target.value) || 0 
                                    }))
                                  }
                                  required
                                />
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Submitting...' : '📤 Submit Feedback'}
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => setActiveFeedbackPost(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <Button onClick={() => startFeedback(post.id)}>
                            💬 Provide Feedback
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Accept Feedback Dialog */}
      <AlertDialog open={showAcceptDialog.show} onOpenChange={(open: boolean) => 
        setShowAcceptDialog({ show: open, feedback: null, postId: null })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>💰 Accept Feedback</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to accept this feedback for {showAcceptDialog.feedback?.priceCoins} coins?
              This will deduct the coins from your balance and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {showAcceptDialog.feedback && (
            <div className="my-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Feedback Preview:</p>
              <p className="text-gray-700">{showAcceptDialog.feedback.comment}</p>
            </div>
          )}
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAcceptDialog({ show: false, feedback: null, postId: null })}
            >
              Cancel
            </Button>
            <AlertDialogAction onClick={handleAcceptFeedback} disabled={isLoading}>
              {isLoading ? 'Processing...' : '✅ Accept & Pay'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;
